/**
 * Tests for the presentation pipe (src/client/stream-piper.js).
 * The class only needs `term.write`, so a mock recorder stands in for the
 * xterm Terminal — no browser, no bundling.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { StreamPiper, ESC } from "../src/client/stream-piper.js";

/** A terminal mock recording every write call separately. */
function mockTerm() {
	const chunks = [];
	return {
		chunks,
		write(text) {
			chunks.push(text);
		},
		text() {
			return chunks.join("");
		}
	};
}

test("assembles complete lines across writes and holds the pending tail", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, false);
	pipe.write("hel");
	assert.deepEqual(term.chunks, [], "partial line must not render");
	pipe.write("lo\nnext\n");
	assert.deepEqual(term.chunks, ["hello\r\n", "next\r\n"]);
});

test("flush emits the pending tail exactly once", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, false);
	pipe.write("partial");
	pipe.flush();
	pipe.flush();
	assert.deepEqual(term.chunks, ["partial"]);
});

test("plain stdout lines pass through untouched", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, false);
	pipe.write("plain line\n");
	assert.deepEqual(term.chunks, ["plain line\r\n"]);
});

test("stderr lines render dimmed", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, true);
	pipe.write("boom\n");
	assert.deepEqual(term.chunks, [`${ESC}[2mboom${ESC}[22m\r\n`]);
});

test("semantic levels wrap in their SGR pair", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, false);
	pipe.write("ERROR: x\nwarn: y\ndebug: z\n");
	assert.deepEqual(term.chunks, [
		`${ESC}[31mERROR: x${ESC}[39m\r\n`,
		`${ESC}[33mwarn: y${ESC}[39m\r\n`,
		`${ESC}[2mdebug: z${ESC}[22m\r\n`
	]);
});

test("escape-carrying lines go through untouched (no injection)", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, true);
	const line = "\x1b[31mbold-red\x1b[0m";
	pipe.write(`${line}\n`);
	assert.deepEqual(term.chunks, [`${line}\r\n`]);
	// Even stderr never double-wraps an escape-carrying line.
	assert.ok(!term.text().includes(`${ESC}[2m${ESC}`));
});

test("bare carriage-return frames pass through immediately", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, false);
	// wget-style progress: one \r per frame, no newline until the end.
	for (let percent = 0; percent <= 100; percent += 10) {
		pipe.write(`downloading ${percent}%\r`);
	}
	assert.equal(term.chunks.length, 11, "every frame must reach the terminal as it arrives");
	assert.equal(term.chunks[0], "downloading 0%\r");
	// The final newline then renders as its own line.
	pipe.write("done\n");
	assert.equal(term.chunks[11], "done\r\n");
});

test("a newline-less tail without carriage returns stays pending", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, false);
	pipe.write("spinner...");
	assert.deepEqual(term.chunks, [], "plain partial output waits for flush");
	pipe.flush();
	assert.deepEqual(term.chunks, ["spinner..."]);
});

test("empty writes are no-ops", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, false);
	pipe.write("");
	assert.deepEqual(term.chunks, []);
});

test("reset drops the pending tail", () => {
	const term = mockTerm();
	const pipe = new StreamPiper(term, false);
	pipe.write("stale partial");
	pipe.reset();
	pipe.flush();
	assert.deepEqual(term.chunks, []);
});
