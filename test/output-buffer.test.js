/**
 * Tests for the output buffer (src/client/output-buffer.js).
 * The buffer only needs a sink with the imperative surface methods, so a
 * recording mock stands in for the terminal. Covers the lifecycle races the
 * 58b8671 fix removed and the replaceFull stitching/cap math.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createOutputBuffer } from "../src/client/output-buffer.js";

/** A recording sink: the imperative terminal surface the buffer drives. */
function mockSink() {
	const sink = {
		writes: [],
		markers: [],
		flushAllCount: 0,
		resetStreamCount: 0,
		resetCount: 0,
		scrollback: undefined,
		writeStream(stream, text) {
			sink.writes.push({ stream, text });
		},
		flushStream() {},
		flushAll() {
			sink.flushAllCount += 1;
		},
		resetStream() {
			sink.resetStreamCount += 1;
		},
		writeMarker(text) {
			sink.markers.push(text);
		},
		reset() {
			sink.resetCount += 1;
			sink.writes.length = 0;
			sink.markers.length = 0;
		},
		setScrollback(lines) {
			sink.scrollback = lines;
		}
	};
	return sink;
}

/** Shorthand for one poll read. */
function read(text, nextOffset, extra = {}) {
	return { text, nextOffset, lossy: false, ...extra };
}

test("queues writes until a sink binds, then drains in order", () => {
	const buffer = createOutputBuffer({ fullLineCap: 100 });
	// First poll lands before the terminal view mounts — nothing may be lost.
	buffer.append("stdout", read("early\n", 6));
	const snapshot = buffer.snapshot();
	assert.equal(snapshot.stdoutOffset, 6, "offsets advance even while queued");
	assert.equal(snapshot.hasOutput, true);

	const sink = mockSink();
	buffer.bindSink(sink);
	assert.deepEqual(sink.writes, [{ stream: "stdout", text: "early\n" }], "queued delta drains on bind");
});

test("a nullish handle unbinds instead of poisoning the buffer", () => {
	const buffer = createOutputBuffer({ fullLineCap: 100 });
	const first = mockSink();
	buffer.bindSink(first);
	// React nulls a forwarded ref on unmount; treating that as a sink would
	// make every later append throw (58b8671).
	buffer.bindSink(null);
	assert.doesNotThrow(() => buffer.append("stdout", read("x\n", 2)));
	assert.deepEqual(first.writes, [], "writes after unbind do not reach the dead sink");

	const second = mockSink();
	buffer.bindSink(second);
	assert.deepEqual(second.writes, [{ stream: "stdout", text: "x\n" }], "rebind drains what queued");
});

test("rebinding the same surface is a no-op and never double-writes", () => {
	const buffer = createOutputBuffer({ fullLineCap: 100 });
	const sink = mockSink();
	buffer.bindSink(sink);
	buffer.bindSink(sink);
	buffer.append("stdout", read("once\n", 5));
	assert.deepEqual(sink.writes, [{ stream: "stdout", text: "once\n" }]);
});

test("offsets, spill paths and lossy flags track each stream", () => {
	const buffer = createOutputBuffer({ fullLineCap: 100 });
	buffer.append("stdout", read("out\n", 4, { spillPath: "/spill/out" }));
	buffer.append("stderr", read("err\n", 4, { spillPath: "/spill/err" }));
	const snapshot = buffer.snapshot();
	assert.equal(snapshot.stdoutOffset, 4);
	assert.equal(snapshot.stderrOffset, 4);
	assert.equal(snapshot.stdoutSpillPath, "/spill/out");
	assert.equal(snapshot.stderrSpillPath, "/spill/err");
	assert.equal(snapshot.hasGap, false);
});

test("a lossy read restarts behind a gap marker and resets the stream pipe", () => {
	const buffer = createOutputBuffer({ fullLineCap: 100 });
	const sink = mockSink();
	buffer.bindSink(sink);
	buffer.append("stderr", read("fresh tail\n", 900, { lossy: true, spillPath: "/spill/err" }));
	assert.equal(sink.resetStreamCount, 1, "the stale partial tail dies with the gap");
	assert.deepEqual(sink.markers, ["……"]);
	const snapshot = buffer.snapshot();
	assert.equal(snapshot.hasGap, true);
	assert.equal(snapshot.stderrOffset, 900);
	assert.equal(snapshot.stderrLossy, true);
});

test("flush reaches the sink once per call", () => {
	const buffer = createOutputBuffer({ fullLineCap: 100 });
	const sink = mockSink();
	buffer.bindSink(sink);
	buffer.flush();
	buffer.flush();
	assert.equal(sink.flushAllCount, 2);
});

test("replaceFull stitches spill head + tail with no gap when bytes meet", () => {
	const buffer = createOutputBuffer({ fullLineCap: 100 });
	const sink = mockSink();
	buffer.bindSink(sink);
	const spillText = "head-0\nhead-1\n";
	const tailText = "tail-0\ntail-1\n";
	const payload = {
		stdout: {
			spill: { text: spillText, size: Buffer.byteLength(spillText), truncated: false },
			tail: { text: tailText, nextOffset: 100 }
		}
	};
	const result = buffer.replaceFull(payload, (count) => `omit ${count}`, "GAP");
	assert.deepEqual(sink.writes, [
		{ stream: "stdout", text: spillText },
		{ stream: "stdout", text: tailText }
	]);
	assert.deepEqual(sink.markers, [], "contiguous byte ranges produce no gap marker");
	assert.equal(result.spillNoticeCount, 0);
	assert.equal(buffer.snapshot().stdoutOffset, 100, "polling resumes at the tail's offset");
	assert.equal(buffer.snapshot().hasOutput, true);
});

test("replaceFull writes a gap marker when head and tail bytes do not meet", () => {
	const buffer = createOutputBuffer({ fullLineCap: 100 });
	const sink = mockSink();
	buffer.bindSink(sink);
	const spillText = "head\n";
	const payload = {
		stdout: {
			spill: { text: spillText, size: Buffer.byteLength(spillText), truncated: false },
			tail: { text: "tail\n", nextOffset: 5000 }
		}
	};
	buffer.replaceFull(payload, (count) => `omit ${count}`, "GAP");
	assert.deepEqual(sink.markers, ["GAP"]);
});

test("replaceFull caps the stitched view head-first and counts shown spill lines", () => {
	const buffer = createOutputBuffer({ fullLineCap: 20 });
	const sink = mockSink();
	buffer.bindSink(sink);
	const spillText = Array.from({ length: 30 }, (_, i) => `head-${i}`).join("\n") + "\n";
	const tailText = Array.from({ length: 5 }, (_, i) => `tail-${i}`).join("\n") + "\n";
	const payload = {
		stdout: {
			spill: { text: spillText, size: Buffer.byteLength(spillText), truncated: true },
			tail: { text: tailText, nextOffset: 9999 }
		}
	};
	const result = buffer.replaceFull(payload, (count) => `omitted ${count}`, "GAP");
	// 35 total lines, cap 20 → 15 head lines drop; the notice counts what is
	// actually shown from the truncated head (15), not its original size (30).
	assert.equal(result.spillNoticeCount, 15);
	assert.ok(sink.markers.includes("omitted 15"));
	const stdoutText = sink.writes.map(({ text }) => text).join("");
	const shownHead = stdoutText.split("\n").filter((line) => line.startsWith("head-")).length;
	assert.equal(shownHead, 15, "notice matches the head lines actually rendered");
	assert.ok(stdoutText.includes("tail-4"), "the tail renders in full");
});

test("replaceFull no-ops without a bound sink", () => {
	const buffer = createOutputBuffer({ fullLineCap: 100 });
	const result = buffer.replaceFull({ stdout: { tail: { text: "x\n", nextOffset: 2 } } }, () => "", "GAP");
	assert.deepEqual(result, { spillNoticeCount: 0 });
	assert.equal(buffer.snapshot().stdoutOffset, 0, "offsets stay untouched so polling still resumes correctly");
});

test("replaceFull raises the scrollback to hold the stitched view", () => {
	const buffer = createOutputBuffer({ fullLineCap: 20000 });
	const sink = mockSink();
	buffer.bindSink(sink);
	const text = Array.from({ length: 5000 }, (_, i) => `l${i}`).join("\n") + "\n";
	buffer.replaceFull({ stdout: { tail: { text, nextOffset: 10 } } }, () => "", "GAP");
	assert.equal(sink.scrollback, 5000 + 512);
});
