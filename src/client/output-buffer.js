/**
 * dsh-plugin-job-panel — output buffer.
 *
 * Byte-offset bookkeeping for the two collected streams plus the facts the
 * panel chrome needs (lossy restarts, spill paths, whether anything was
 * written). Rendering lives in the embedded terminal (./terminal.js): this
 * module forwards raw stream text to it — the captured stream is never
 * transformed — and queues writes while the terminal view is not mounted yet
 * (the first poll can land before the view mounts) so no delta is lost.
 *
 * Offsets are whole-stream byte coordinates owned by this buffer (the
 * server's readers are cursor-free), so the panel and the model's own reads
 * never interfere. Stream interleaving is arrival-approximate: within one
 * poll the stdout delta is forwarded before the stderr delta, which mirrors
 * what the model sees (stderr in a marked section) rather than promising
 * exact interleaving, which two separate byte-accumulating readers cannot
 * reconstruct.
 */

/** Marker written into the terminal when a stream read was lossy. */
const GAP_TEXT = "……";

/**
 * @typedef {object} OutputBufferSnapshot
 * @property {number} stdoutOffset - next byte offset for stdout.
 * @property {number} stderrOffset - next byte offset for stderr.
 * @property {boolean} stdoutLossy - last stdout read was lossy.
 * @property {boolean} stderrLossy - last stderr read was lossy.
 * @property {string | undefined} stdoutSpillPath
 * @property {string | undefined} stderrSpillPath
 * @property {boolean} hasGap - a lossy restart happened; the head is not contiguous.
 * @property {boolean} hasOutput - whether any stream text was forwarded.
 */

/** Count the lines one raw chunk will occupy in the terminal. */
function countLines(text) {
	if (text.length === 0) return 0;
	const parts = text.split("\n");
	if (parts[parts.length - 1] === "") parts.pop();
	return parts.length;
}

/** Drop the first `drop` lines of one raw chunk. */
function dropHeadLines(text, drop) {
	if (drop <= 0) return text;
	const hadTrailingNewline = text.endsWith("\n");
	const parts = text.split("\n");
	if (hadTrailingNewline) parts.pop();
	const kept = parts.slice(drop);
	if (kept.length === 0) return "";
	return kept.join("\n") + (hadTrailingNewline ? "\n" : "");
}

/**
 * Create one output buffer.
 * @param {{ fullLineCap: number }} options - full-history hard render cap.
 * @returns {object} buffer with bindSink / append / flush / replaceFull / snapshot / byteLength.
 */
export function createOutputBuffer({ fullLineCap }) {
	let stdoutOffset = 0;
	let stderrOffset = 0;
	let stdoutLossy = false;
	let stderrLossy = false;
	let stdoutSpillPath;
	let stderrSpillPath;
	let hasGap = false;
	let hasOutput = false;
	/** @type {undefined | object} the terminal's imperative surface */
	let sink;
	/** @type {Array<{ stream: "stdout" | "stderr", text: string }>} writes taken before the terminal mounted */
	let pending = [];

	function forward(stream, text) {
		if (text.length === 0) return;
		hasOutput = true;
		if (sink === undefined) {
			pending.push({ stream, text });
			return;
		}
		sink.writeStream(stream, text);
	}

	function drain() {
		if (sink === undefined) return;
		const queued = pending;
		pending = [];
		for (const item of queued) sink.writeStream(item.stream, item.text);
	}

	return {
		/**
		 * Bind the terminal surface and drain anything queued before it
		 * existed. Idempotent; rebinding the same surface is a no-op. A
		 * nullish handle unbinds (view unmounted) — later writes re-queue.
		 * React nulls a forwarded ref on unmount, so a nullish handle is a
		 * normal lifecycle event, never a sink: binding it would poison the
		 * buffer (every append would throw on the null surface).
		 * @param {object | undefined} handle - imperative terminal surface.
		 * @returns {void}
		 */
		bindSink(handle) {
			if (handle === sink) return;
			if (handle === null || handle === undefined) {
				sink = undefined;
				return;
			}
			sink = handle;
			drain();
		},
		/**
		 * Append one poll's stream read.
		 * @param {'stdout' | 'stderr'} stream - which collected stream.
		 * @param {{ text: string, nextOffset: number, lossy: boolean, spillPath?: string } | null} read - server projection.
		 * @returns {void}
		 */
		append(stream, read) {
			if (read === null || read === undefined) return;
			const stderr = stream === "stderr";
			if (read.lossy) {
				// The requested offset slid out of the retained window: the
				// server returned the whole retained tail, so the view restarts
				// from it behind a gap marker. The stale partial line the
				// terminal's pipe holds for this stream dies with the gap.
				sink?.resetStream(stream);
				sink?.writeMarker(GAP_TEXT);
				hasGap = true;
				forward(stream, read.text);
				if (stderr) {
					stderrOffset = read.nextOffset;
					stderrLossy = true;
					stderrSpillPath = read.spillPath;
				} else {
					stdoutOffset = read.nextOffset;
					stdoutLossy = true;
					stdoutSpillPath = read.spillPath;
				}
				return;
			}
			forward(stream, read.text);
			if (stderr) {
				stderrOffset = read.nextOffset;
				if (read.spillPath !== undefined) stderrSpillPath = read.spillPath;
			} else {
				stdoutOffset = read.nextOffset;
				if (read.spillPath !== undefined) stdoutSpillPath = read.spillPath;
			}
		},
		/**
		 * Emit every stream's pending partial line (call once the job
		 * settles, so a final line without a trailing newline still shows).
		 * @returns {void}
		 */
		flush() {
			sink?.flushAll();
		},
		/**
		 * Replace the view with the spill-backed full history: the terminal
		 * resets, then each stream's spill head (byte-gap detected) and
		 * retained tail are forwarded raw, capped at `fullLineCap` lines
		 * across both streams (the head is trimmed first, matching the old
		 * line-array behavior). Polling resumes from the tail's offsets.
		 * @param {object} payload - the full-history route projection.
		 * @param {(count: number) => string} omittedText - marker text factory.
		 * @param {string} gapText - marker text for the spill↔tail byte gap.
		 * @returns {{ spillNoticeCount: number }} lines the truncated spill
		 *   head contributes to the final view (after the render cap).
		 */
		replaceFull(payload, omittedText, gapText) {
			if (sink === undefined) return { spillNoticeCount: 0 };
			sink.reset();
			/** @type {Array<{ stream: "stdout" | "stderr", text: string, gap?: boolean, spillNotice?: boolean }>} */
			const chunks = [];
			const offsets = { stdout: 0, stderr: 0 };
			for (const stream of ["stdout", "stderr"]) {
				const project = payload?.[stream];
				if (project === null || project === undefined) continue;
				const tail = project.tail;
				if (tail === null || tail === undefined) continue;
				const spill = project.spill;
				if (spill !== null && spill !== undefined) {
					// spillNotice: the server already truncated this head; the
					// toolbar reports the lines it contributes to the view —
					// counted AFTER the render cap below trims it, so the
					// number never exceeds what is actually shown.
					chunks.push({ stream, text: spill.text, spillNotice: spill.truncated === true });
					// Head covers [0, spill.size); tail covers the retained
					// tail. A gap exists when the byte ranges do not meet.
					const covered = spill.size + this.byteLength(tail.text);
					if (covered < tail.nextOffset - 1024) chunks.push({ stream, text: undefined, gap: true });
				}
				chunks.push({ stream, text: tail.text });
				offsets[stream] = tail.nextOffset;
			}
			// Hard render cap across the stitched view: trim the head first.
			const total = chunks.reduce((sum, chunk) => sum + (chunk.gap ? 0 : countLines(chunk.text)), 0);
			let excess = Math.max(0, total - fullLineCap);
			if (excess > 0) {
				sink.writeMarker(omittedText(total - fullLineCap));
				for (const chunk of chunks) {
					if (excess === 0) break;
					if (chunk.gap) continue;
					const count = countLines(chunk.text);
					const drop = Math.min(excess, count);
					const kept = dropHeadLines(chunk.text, drop);
					if (kept.length === 0 && drop === count) {
						chunk.text = "";
					} else {
						chunk.text = kept;
					}
					excess -= drop;
				}
			}
			for (const chunk of chunks) {
				if (chunk.gap) {
					sink.writeMarker(gapText);
					continue;
				}
				if (chunk.text.length === 0) continue;
				sink.writeStream(chunk.stream, chunk.text);
				sink.flushStream(chunk.stream);
				if (chunk.stream === "stderr") stderrOffset = offsets.stderr;
				else stdoutOffset = offsets.stdout;
			}
			// Count the truncated spill head's contribution to the FINAL view
			// (the cap above may have trimmed part of it away).
			const spillNoticeCount = chunks.reduce(
				(sum, chunk) => sum + (chunk.spillNotice && !chunk.gap ? countLines(chunk.text) : 0),
				0
			);
			hasOutput = hasOutput || chunks.some((chunk) => !chunk.gap && chunk.text.length > 0);
			// The explicitly loaded view should not re-trim below its size.
			const kept = total - (total - fullLineCap > 0 ? total - fullLineCap : 0);
			sink.setScrollback(kept + 512);
			stdoutLossy = false;
			stderrLossy = false;
			return { spillNoticeCount };
		},
		/** @returns {OutputBufferSnapshot} */
		snapshot() {
			return {
				stdoutOffset,
				stderrOffset,
				stdoutLossy,
				stderrLossy,
				stdoutSpillPath,
				stderrSpillPath,
				hasGap,
				hasOutput
			};
		},
		/** Byte length of a text (for gap math). */
		byteLength(text) {
			return new TextEncoder().encode(text).length;
		}
	};
}
