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
 *   2. ANSI SGR parsing (added in a later commit) for output that carries
 *      real escape sequences, e.g. when a command forces color via
 *      FORCE_COLOR=1 and the detector honors it over NO_COLOR.
 *
 * The builder also assembles lines across poll chunks: a delta that ends
 * mid-line stays pending until its remainder (or a flush) arrives, instead
 * of splitting one logical line into two.
 */

/**
 * A shaped output line.
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

/**
 * Create one per-stream line builder.
 * @param {boolean} stderr - whether this builder shapes the stderr stream.
 * @returns {{ feed: (text: string) => OutputLine[], flush: () => OutputLine[], reset: () => void }}
 */
export function createLineBuilder(stderr) {
	/** Partial trailing line carried between chunks. */
	let pending = "";

	const push = (lines, text) => {
		// An empty complete line is a real blank line in the output.
		lines.push({ text, stderr, kind: classifyLine(text) });
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
		/** Drop the pending tail (lossy reset). */
		reset() {
			pending = "";
		}
	};
}
