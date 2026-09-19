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
 * Semantic level classes, checked in priority order.
 *
 * Patterns match anywhere in the line, so incidental prose ("0 errors") also
 * colors — accepted here for the same reason console formatters err colorful:
 * the vocabulary in real build/log output overwhelmingly appears AS a level
 * when it appears at all. (Tightening is tracked as its own change.)
 */
const LEVEL_PATTERNS = [
	["jp-log-error", /\b(errors?|failed?|failures?|fatal|exception|unhandled|panic|aborted)\b/i],
	["jp-log-warn", /\b(warnings?|warn|deprecated)\b/i],
	["jp-log-dim", /\b(debug|trace|verbose)\b/i]
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
