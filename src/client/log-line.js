/**
 * dsh-plugin-job-panel — log-line shaping.
 *
 * The captured output streams are plain text by design (the harness runs
 * everything with NO_COLOR/TERM=dumb and no TTY, so the model sees clean
 * text), so terminal-like coloring is rebuilt here, client-side, in two
 * layers:
 *
 *   1. Semantic level classes for plain log lines (error → red, warn →
 *      amber, debug/trace → dimmed) — the console-logger convention.
 *   2. ANSI SGR parsing for output that carries real escape sequences, e.g.
 *      when a command forces color via FORCE_COLOR=1 (widely honored over
 *      NO_COLOR) or prints escapes unconditionally.
 *
 * The builder also assembles lines across poll chunks: a delta that ends
 * mid-line stays pending until its remainder (or a flush) arrives, instead
 * of splitting one logical line into two.
 */

/**
 * A shaped output line. `spans` is present only when the line carried ANSI
 * styling; plain lines carry a semantic `kind` class instead.
 * @typedef {{ text: string, stderr: boolean, kind?: string, spans?: Array<{ text: string, cls?: string }> }} OutputLine
 */

/** Semantic level classes, checked in priority order. */
const LEVEL_PATTERNS = [
	["jp-log-error", /\b(errors?|failed?|failures?|fatal|exception|unhandled|panic|aborted)\b/i],
	["jp-log-warn", /\b(warnings?|warn|deprecated)\b/i],
	["jp-log-dim", /\b(debug|trace|verbose)\b/i]
];

/**
 * Classify one plain log line by its level vocabulary.
 * @param {string} text - complete line text (no trailing newline).
 * @returns {string | undefined} the semantic class, or undefined.
 */
export function classifyLine(text) {
	for (const [cls, pattern] of LEVEL_PATTERNS) {
		if (pattern.test(text)) return cls;
	}
	return undefined;
}


/** The ESC control byte (\x1b), spelled out because it is not typeable in source. */
const ESC = String.fromCharCode(27);
/** The BEL control byte (\x07), the classic OSC terminator. */
const BEL = String.fromCharCode(7);
/**
 * Any escape sequence, with groups: 1 = CSI params, 2 = CSI final byte,
 * 3 = OSC body, 4 = two-byte C1 escape. Built through the RegExp constructor
 * because the control bytes themselves are not typeable in source.
 */
const ESCAPE_SEQUENCE = new RegExp(
	`${ESC}(?:\\[([0-9;:?<=>!]*)([A-Za-z@\`])|\\]([^${BEL}${ESC}]*)(?:${BEL}|${ESC}\\\\)?|([@-Z\\\\-_]))`,
	"g",
);

/** SGR parameter names → the modifier class they toggle on/off. */
const MODIFIER_CLASSES = { 1: "jp-a-b", 2: "jp-a-dim", 3: "jp-a-i", 4: "jp-a-u" };
const MODIFIER_OFFS = { 22: ["jp-a-b", "jp-a-dim"], 23: ["jp-a-i"], 24: ["jp-a-u"] };

/**
 * One parsed span.
 * @typedef {{ text: string, cls?: string }} AnsiSpan
 */

/**
 * Parse one line's text against a carried SGR state, returning styled spans
 * and the state to carry into the next line (terminals keep style across
 * newlines until a reset).
 * @param {string} text - complete line text, escapes included.
 * @param {{ fg?: string, bg?: string, mods: Set<string> }} state - carried SGR state (mutated).
 * @returns {{ spans: AnsiSpan[] }} spans with composed classes.
 */
export function parseAnsiLine(text, state) {
	const spans = [];
	let plain = "";
	const emit = () => {
		if (plain.length === 0) return;
		const cls = [state.fg, state.bg, ...state.mods].filter(Boolean).join(" ");
		spans.push(cls !== "" ? { text: plain, cls } : { text: plain });
		plain = "";
	};
	let cursor = 0;
	ESCAPE_SEQUENCE.lastIndex = 0;
	for (let match = ESCAPE_SEQUENCE.exec(text); match !== null; match = ESCAPE_SEQUENCE.exec(text)) {
		// Emit the unstyled run BEFORE applying this sequence's state change —
		// the sequence affects only the text that follows it.
		plain += text.slice(cursor, match.index);
		emit();
		cursor = match.index + match[0].length;
		const csiParams = match[1];
		const csiFinal = match[2];
		if (csiParams !== undefined && csiFinal === "m") {
			const params = (csiParams || "0").split(";").map((p) => (p === "" ? "0" : p));
			for (let index = 0; index < params.length; index += 1) {
				const code = Number(params[index]);
				if (code === 0) {
					state.fg = undefined;
					state.bg = undefined;
					state.mods.clear();
				} else if (MODIFIER_CLASSES[code] !== undefined) {
					state.mods.add(MODIFIER_CLASSES[code]);
				} else if (MODIFIER_OFFS[code] !== undefined) {
					for (const cls of MODIFIER_OFFS[code]) state.mods.delete(cls);
				} else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
					state.fg = `jp-a-fg${code}`;
				} else if (code === 39) {
					state.fg = undefined;
				} else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
					state.bg = `jp-a-bg${code}`;
				} else if (code === 49) {
					state.bg = undefined;
				} else if (code === 38 || code === 48) {
					// Extended color (256 / truecolor): consume its arguments,
					// render unmapped in v1. 38;5;n → 2 extra, 38;2;r;g;b → 4.
					const form = Number(params[index + 1]);
					const consumed = form === 5 ? 2 : form === 2 ? 4 : 0;
					index += consumed;
				}
				// every other code (underline styles, KAM, …): ignored
			}
		}
		// non-SGR escapes (cursor moves, OSC titles, …): dropped
	}
	plain += text.slice(cursor);
	return { spans: plain.length > 0 ? [...spans, { text: plain, cls: [state.fg, state.bg, ...state.mods].filter(Boolean).join(" ") || undefined }] : spans };
}

/**
 * Create one per-stream line builder.
 * @param {boolean} stderr - whether this builder shapes the stderr stream.
 * @returns {{ feed: (text: string) => OutputLine[], flush: () => OutputLine[], reset: () => void }}
 */
export function createLineBuilder(stderr) {
	/** Partial trailing line carried between chunks. */
	let pending = "";
	/** SGR state carried across lines, exactly like a terminal. */
	const state = { fg: undefined, bg: undefined, mods: new Set() };

	const shapeLine = (text) => {
		if (text.includes("")) {
			const { spans } = parseAnsiLine(text, state);
			const hasColor = spans.some((span) => span.cls !== undefined && /jp-a-(fg|bg)/.test(span.cls));
			return { text, stderr, spans, kind: hasColor ? undefined : classifyLine(text.replace(ESCAPE_SEQUENCE, "")) };
		}
		// No escapes in this piece — but a color may be carried over from the
		// previous line; only style it when the terminal state says so.
		if (state.fg !== undefined || state.bg !== undefined || state.mods.size > 0) {
			const { spans } = parseAnsiLine(text, state);
			return { text, stderr, spans, kind: undefined };
		}
		return { text, stderr, kind: classifyLine(text) };
	};

	const push = (lines, text) => {
		// An empty complete line is a real blank line in the output.
		lines.push(shapeLine(text));
	};

	return {
		/**
		 * Ingest one stream delta and return every COMPLETE line it closes.
		 * A delta without a trailing newline leaves its tail pending.
		 * @param {string} text - the delta text (may be "" ).
		 * @returns {OutputLine[]}
		 */
		feed(text) {
			if (text.length === 0) return [];
			const lines = [];
			const chunk = pending + text;
			const parts = chunk.split("\n");
			pending = parts.pop() ?? "";
			for (const part of parts) push(lines, part);
			return lines;
		},
		/**
		 * Emit the pending partial line, if any (settle, full-history end).
		 * @returns {OutputLine[]}
		 */
		flush() {
			if (pending.length === 0) return [];
			const lines = [];
			push(lines, pending);
			pending = "";
			return lines;
		},
		/** Drop the pending tail and the carried SGR state (lossy reset). */
		reset() {
			pending = "";
			state.fg = undefined;
			state.bg = undefined;
			state.mods.clear();
		}
	};
}
