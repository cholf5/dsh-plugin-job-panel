/**
 * dsh-plugin-job-panel — embedded terminal factory.
 *
 * The output view is an embedded xterm.js terminal (@xterm/xterm, the
 * OpenJS-hosted xterm.js): captured deltas are fed to it raw and it renders
 * everything a real terminal would — SGR colors incl. 256/truecolor, OSC,
 * C1 two-byte escapes, carriage-return progress redraws — with the state
 * carried across lines exactly like a terminal. The captured stream is never
 * transformed: shaping happens at presentation time only.
 *
 * Two presentation-only injections exist, applied per COMPLETE line and only
 * when the line carries no escape sequences of its own (so injected SGR can
 * never fight the stream's own):
 *
 *   1. Semantic levels (the console-logger convention, see ./log-line.js) —
 *      error red / warn amber / debug dim, wrapped in SGR so the terminal's
 *      theme-mapped ANSI palette renders them.
 *   2. stderr lines render dimmed so the two streams stay legible without
 *      promising exact interleaving.
 *
 * The theme maps dsh tokens onto the terminal's ITheme (surface background,
 * label foreground, error/warn palette entries) and re-resolves when the
 * document element's attributes change (best-effort dark/light following).
 */

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import xtermCss from "@xterm/xterm/css/xterm.css";
import { classifyLine } from "./log-line.js";

/** Live scrollback cap (lines) — the iterm2-style bounded history. */
export const MAX_SCROLLBACK = 2000;

/** The xterm stylesheet, plus the overrides for embedding inside the panel. */
export const XTERM_CSS = `${xtermCss}
/* The panel paints its own token surface; xterm's default black viewport
   would otherwise cover it (overscroll and scrollbar gutters included). */
.xterm .xterm-viewport { background-color: transparent; }
`;

/** The ESC control byte, spelled out because it is not typeable in source. */
const ESC = String.fromCharCode(27);
/** The BEL control byte, the classic OSC terminator. */
const BEL = String.fromCharCode(7);

/**
 * Escape-sequence detection, transcribed from ansi-regex v6.3.0 (MIT,
 * https://github.com/sindresorhus/ansi-regex — the grammar chalk and friends
 * use): OSC with the three ST terminators (BEL, ESC\\, C1 ST) and
 * payload-stop protection, plus CSI with intermediates, `;`/`:` params and
 * the full final-byte class. Used ONLY as a test ("does this line style
 * itself?") so injection stays out of the stream's own way.
 */
const ST = `(?:${BEL}|${ESC}\\\\|\u009C)`;
const OSC = `(?:${ESC}\\][^${BEL}${ESC}\u009C]*${ST})`;
const CSI = `(?:${ESC}|\u009B)[[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]`;
const CARRIES_ESCAPE = new RegExp(`${OSC}|${CSI}`);

/** Semantic class → the SGR pair (on, off) the terminal palette renders. */
const SGR_WRAPS = {
	"jp-log-error": ["31", "39"],
	"jp-log-warn": ["33", "39"],
	"jp-log-dim": ["2", "22"]
};

/**
 * Read one dsh token's live value, with a fallback for compositions that
 * fail to define it.
 * @param {string} name - CSS custom property name.
 * @param {string} fallback - value used when the token is absent.
 * @returns {string}
 */
function token(name, fallback) {
	try {
		const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
		return raw.length > 0 ? raw : fallback;
	} catch {
		return fallback;
	}
}

/**
 * Resolve the product's mono font stack through a probe element (a var()
 * reference cannot be read back directly).
 * @returns {string} computed font-family value.
 */
function monoFontFamily() {
	try {
		const probe = document.createElement("span");
		probe.style.fontFamily = "var(--dsw-font-mono, monospace)";
		probe.style.position = "absolute";
		probe.style.visibility = "hidden";
		document.body.appendChild(probe);
		const family = getComputedStyle(probe).fontFamily;
		probe.remove();
		return family.length > 0 ? family : "monospace";
	} catch {
		return "monospace";
	}
}

/**
 * Build the ITheme from live dsh tokens. The 16-color palette reuses the
 * mid-brightness set the panel vetted for both light and dark surfaces;
 * error/warn come from tokens so semantic lines follow the product palette.
 * @returns {object} ITheme-shaped object.
 */
function buildTheme() {
	return {
		background: token("--dsw-alias-markdown-code-block", "#0d1117"),
		foreground: token("--dsw-alias-label-primary", "#8b949e"),
		cursor: token("--dsw-alias-label-tertiary", "#8b949e"),
		cursorAccent: token("--dsw-alias-markdown-code-block", "#0d1117"),
		selectionBackground: "rgba(83, 155, 245, 0.30)",
		black: "#6e7681",
		red: token("--dsw-alias-state-error-primary", "#f25a5a"),
		green: "#3fb950",
		yellow: token("--dsw-alias-state-warn-primary", "#d29922"),
		blue: "#539bf5",
		magenta: "#b083f0",
		cyan: "#39c5cf",
		white: "#d4d4d4",
		brightBlack: "#8b949e",
		brightRed: "#ff7b72",
		brightGreen: "#7ee787",
		brightYellow: "#e3b341",
		brightBlue: "#79c0ff",
		brightMagenta: "#d2a8ff",
		brightCyan: "#76e3ea",
		brightWhite: "#f0f6fc"
	};
}

/**
 * One stream's presentation pipe: assembles complete lines across write
 * calls (a delta ending mid-line stays pending), then hands each line to the
 * terminal — raw when it styles itself, SGR-wrapped for semantic/stderr
 * when it does not. Carriage-return redraws pass through untouched inside
 * their line, so progress bars animate natively.
 * Exported for the bundling-based tests only.
 */
export class StreamPiper {
	/** @type {string} partial trailing line carried between writes */
	#tail = "";
	/** @type {Terminal} */
	#term;
	/** @type {boolean} whether this pipe serves the stderr stream */
	#stderr;

	/**
	 * @param {Terminal} term - target terminal.
	 * @param {boolean} stderr - stderr lines dim when no semantic class hits.
	 */
	constructor(term, stderr) {
		this.#term = term;
		this.#stderr = stderr;
	}

	/**
	 * Ingest one raw delta. Text is written as-is — never transformed.
	 * @param {string} text - delta text (may be "").
	 * @returns {void}
	 */
	write(text) {
		if (text.length === 0) return;
		const parts = (this.#tail + text).split("\n");
		this.#tail = parts.pop() ?? "";
		for (const line of parts) this.#writeLine(`${line}\r\n`);
	}

	/**
	 * Emit the pending partial line (settle, full-history chunk boundary).
	 * @returns {void}
	 */
	flush() {
		if (this.#tail.length === 0) return;
		this.#writeLine(this.#tail);
		this.#tail = "";
	}

	/** Drop the pending tail (lossy restart, reset). */
	reset() {
		this.#tail = "";
	}

	/**
	 * Write one complete line. Escape-carrying lines go through untouched;
	 * plain lines get the semantic or stderr wrap — presentation only.
	 * @param {string} line - complete line text (including its newline).
	 * @returns {void}
	 */
	#writeLine(line) {
		const body = line.endsWith("\r\n") ? line.slice(0, -2) : line;
		if (CARRIES_ESCAPE.test(body)) {
			this.#term.write(line);
			return;
		}
		const cls = classifyLine(body);
		if (cls !== undefined) {
			const [on, off] = SGR_WRAPS[cls];
			this.#term.write(`${ESC}[${on}m${body}${ESC}[${off}m\r\n`);
			return;
		}
		if (this.#stderr && body.length > 0) {
			this.#term.write(`${ESC}[2m${body}${ESC}[22m\r\n`);
			return;
		}
		this.#term.write(line);
	}
}

/**
 * Create the terminal instance inside a host element and return the
 * imperative surface the panel drives. The host must be attached; the caller
 * owns resizing (the fit helper is exposed) and disposal.
 * @param {HTMLElement} host - element the terminal opens into.
 * @returns {{ term: Terminal, fit: () => void, writeStream: (stream: "stdout" | "stderr", text: string) => void,
 *   flushStream: (stream: "stdout" | "stderr") => void, flushAll: () => void, resetStream: (stream: "stdout" | "stderr") => void,
 *   writeMarker: (text: string) => void, reset: () => void, setScrollback: (lines: number) => void,
 *   viewportElements: () => HTMLElement[], dispose: () => void }}
 */
export function createJobTerminal(host) {
	const term = new Terminal({
		scrollback: MAX_SCROLLBACK,
		fontFamily: monoFontFamily(),
		fontSize: 12,
		lineHeight: 1.4,
		convertEol: false,
		cursorBlink: false,
		cursorStyle: "bar",
		theme: buildTheme()
	});
	const fitAddon = new FitAddon();
	term.loadAddon(fitAddon);
	term.open(host);

	const stdout = new StreamPiper(term, false);
	const stderr = new StreamPiper(term, true);

	// Best-effort dark/light following: re-resolve the tokens whenever the
	// document element's theme-bearing attributes change.
	const themeObserver = new MutationObserver(() => {
		term.options.theme = buildTheme();
	});
	if (typeof document !== "undefined") {
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
	}

	return {
		term,
		fit() {
			try {
				fitAddon.fit();
			} catch {
				// fit before layout settles can throw — the next resize retries
			}
		},
		writeStream(stream, text) {
			(stream === "stderr" ? stderr : stdout).write(text);
		},
		flushStream(stream) {
			(stream === "stderr" ? stderr : stdout).flush();
		},
		flushAll() {
			stdout.flush();
			stderr.flush();
		},
		resetStream(stream) {
			(stream === "stderr" ? stderr : stdout).reset();
		},
		/** One dim marker line (gap notices), presentation-only styling. */
		writeMarker(text) {
			term.write(`${ESC}[2m${text}${ESC}[22m\r\n`);
		},
		reset() {
			stdout.reset();
			stderr.reset();
			term.options.scrollback = MAX_SCROLLBACK;
			term.reset();
		},
		setScrollback(lines) {
			term.options.scrollback = Math.max(MAX_SCROLLBACK, lines);
		},
		/** The elements whose scroll position expresses "user scrolled up". */
		viewportElements() {
			const root = term.element;
			if (root === null) return [];
			const found = root.querySelectorAll(".xterm-viewport, .xterm-scrollable-element");
			return [...found];
		},
		dispose() {
			themeObserver.disconnect();
			term.dispose();
		}
	};
}
