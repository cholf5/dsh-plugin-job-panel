/**
 * dsh-plugin-job-panel — one stream's presentation pipe.
 *
 * Owns the two presentation-only injections the panel applies to captured
 * output, per COMPLETE line and only when the line carries no escape
 * sequences of its own (so injected SGR can never fight the stream's own):
 *
 *   1. Semantic levels (the console-logger convention, see ./log-line.js) —
 *      error red / warn amber / debug dim, wrapped in SGR so the terminal's
 *      theme-mapped ANSI palette renders them.
 *   2. stderr lines render dimmed so the two streams stay legible without
 *      promising exact interleaving.
 *
 * Lives in its own module (extracted from ./terminal.js) because it depends
 * only on `term.write` — plain-Node tests (node --test) drive it against a
 * mock terminal without pulling in @xterm/xterm.
 */

import { classifyLine } from "./log-line.js";

/** The ESC control byte, spelled out because it is not typeable in source. */
export const ESC = String.fromCharCode(27);
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
 * One stream's presentation pipe: assembles complete lines across write
 * calls (a delta ending mid-line stays pending), then hands each line to the
 * terminal — raw when it styles itself, SGR-wrapped for semantic/stderr
 * when it does not. Bare-carriage-return partial output (progress redraws
 * that never print a newline) passes through raw as it arrives, so the
 * terminal redraws it in place like a real one.
 */
export class StreamPiper {
	/** @type {string} partial trailing line carried between writes */
	#tail = "";
	/** @type {object} the terminal (anything with write(text)) */
	#term;
	/** @type {boolean} whether this pipe serves the stderr stream */
	#stderr;

	/**
	 * @param {object} term - target terminal (only `write` is required).
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
		// A tail holding a carriage return is a progress redraw in flight
		// (wget/curl/docker-style bars print bare \r, no newline per frame):
		// pass it through raw the moment it arrives so the terminal redraws
		// in place — holding it would buffer the whole bar until the next
		// newline (nothing visible until settle) and grow the tail without
		// bound. The presentation wrap is skipped for these frames; they
		// redraw over themselves anyway.
		if (this.#tail.includes("\r")) {
			this.#term.write(this.#tail);
			this.#tail = "";
		}
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
