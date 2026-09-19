/**
 * dsh-plugin-job-panel — semantic log-line classification.
 *
 * One layer of the panel's color story: plain log lines (the default — the
 * harness runs every command with NO_COLOR/TERM=dumb so captured streams are
 * unstyled text) render by their level vocabulary — the console-logger
 * convention (.NET, serilog, log4j, …). The classifier only DECIDES; the
 * embedded terminal (./terminal.js) applies the decision as a presentation-
 * time SGR wrap on lines that carry no escape sequences of their own.
 */

/**
 * Anchor for a level token: the word must stand in the line's leading
 * region — after optional decoration characters, one bracket group, an
 * optional timestamp, and at most ONE leading word ("build failed" colors,
 * "the build failed" is prose). The single-word allowance deliberately keeps
 * two-word summaries colorable while killing the common false positives:
 * numeric counts ("0 errors, 0 warnings" — the digit cannot start the
 * leading word) and level words buried deeper in a sentence.
 */
const LEVEL_ANCHOR = "^\\s*[>*\\-·✖✔]*\\s*(?:\\[[^\\]]*]\\s*)?(?:\\d{4}[-/]\\d{2}[-/]\\d{2}[T ]\\S*|\\d{1,2}:\\d{2}(?::\\d{2})?)?\\s*(?:[A-Za-z][\\w'.-]{0,11}\\s+)?";

/** Semantic level classes, checked in priority order. The level word may
 * stand bare or inside square brackets ("[WARN] …"). */
const LEVEL_PATTERNS = [
	["jp-log-error", new RegExp(LEVEL_ANCHOR + "\\[?(?:errors?|failed?|failures?|fatal|exception|unhandled|panic|aborted)\\b\\]?", "i")],
	["jp-log-warn", new RegExp(LEVEL_ANCHOR + "\\[?(?:warnings?|warn|deprecated)\\b\\]?", "i")],
	["jp-log-dim", new RegExp(LEVEL_ANCHOR + "\\[?(?:debug|trace|verbose)\\b\\]?", "i")]
];

/**
 * Classify one plain log line by its level vocabulary.
 * @param {string} text - complete line text, no escapes, no trailing newline.
 * @returns {string | undefined} the semantic class key, or undefined.
 */
export function classifyLine(text) {
	for (const [cls, pattern] of LEVEL_PATTERNS) {
		if (pattern.test(text)) return cls;
	}
	return undefined;
}
