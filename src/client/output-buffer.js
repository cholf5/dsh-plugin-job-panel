/**
 * dsh-plugin-job-panel — output buffer.
 *
 * Client-side accumulation of the two collected streams with an iterm2-style
 * bounded scrollback: the DOM keeps at most `maxLines` lines, dropping the
 * head and counting it into an "earlier lines omitted" notice. Offsets are
 * whole-stream byte coordinates owned by this buffer (the server's readers
 * are cursor-free), so the panel and the model's own reads never interfere.
 *
 * Stream interleaving is arrival-approximate: within one poll the stdout delta
 * is appended before the stderr delta, each line tagged with its stream so the
 * view can style stderr lines. This mirrors what the model sees (stderr in a
 * marked section) rather than promising exact interleaving, which two separate
 * byte-accumulating readers cannot reconstruct.
 */

/**
 * One rendered output line.
 * @typedef {{ text: string, stderr: boolean }} OutputLine
 */

/**
 * @typedef {object} OutputBufferSnapshot
 * @property {OutputLine[]} lines - current lines (at most maxLines).
 * @property {number} omitted - number of head lines dropped by the cap.
 * @property {number} stdoutOffset - next byte offset for stdout.
 * @property {number} stderrOffset - next byte offset for stderr.
 * @property {boolean} stdoutLossy - last stdout read was lossy.
 * @property {boolean} stderrLossy - last stderr read was lossy.
 * @property {string | undefined} stdoutSpillPath
 * @property {string | undefined} stderrSpillPath
 * @property {boolean} hasGap - a lossy reset happened; the head is not contiguous.
 */

/** Marker line inserted when a stream read was lossy (head not recoverable here). */
const GAP_LINE = { text: "……", stderr: false };

/**
 * Create one output buffer.
 * @param {{ maxLines: number }} options
 * @returns {object} buffer with append(stream, read) / snapshot() / appendText().
 */
export function createOutputBuffer({ maxLines }) {
	/** @type {OutputLine[]} */
	let lines = [];
	let omitted = 0;
	let stdoutOffset = 0;
	let stderrOffset = 0;
	let stdoutLossy = false;
	let stderrLossy = false;
	let stdoutSpillPath;
	let stderrSpillPath;
	let hasGap = false;

	function pushLine(text, stderr) {
		if (text.length === 0) return;
		const parts = text.split("\n");
		for (let index = 0; index < parts.length; index += 1) {
			const piece = parts[index];
			const last = index === parts.length - 1;
			if (last && piece.length === 0) break; // trailing newline: no empty final line
			lines.push({ text: piece, stderr });
		}
	}

	function enforceCap() {
		if (lines.length <= maxLines) return;
		const drop = lines.length - maxLines;
		lines = lines.slice(drop);
		omitted += drop;
		hasGap = true;
	}

	return {
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
				// The requested offset slid out of the retained window: the server
				// returned the whole retained tail, so restart the buffer from it
				// and mark the discontinuity. The dropped head cannot be counted
				// precisely, so the omitted counter is left as it was.
				lines = [];
				pushLine(GAP_LINE.text, false);
				hasGap = true;
				if (stderr) {
					stderrOffset = read.nextOffset;
					stderrLossy = true;
					stderrSpillPath = read.spillPath;
				} else {
					stdoutOffset = read.nextOffset;
					stdoutLossy = true;
					stdoutSpillPath = read.spillPath;
				}
				pushLine(read.text, stderr);
				enforceCap();
				return;
			}
			pushLine(read.text, stderr);
			if (stderr) {
				stderrOffset = read.nextOffset;
				if (read.spillPath !== undefined) stderrSpillPath = read.spillPath;
			} else {
				stdoutOffset = read.nextOffset;
				if (read.spillPath !== undefined) stdoutSpillPath = read.spillPath;
			}
			enforceCap();
		},
		/**
		 * Replace the whole buffer with pre-built lines (full-history load).
		 * @param {OutputLine[]} next - lines to show.
		 * @param {{ stdout: number, stderr: number }} offsets - resume offsets.
		 * @param {number} omittedCount - head lines the view already knows it dropped.
		 * @returns {void}
		 */
		replace(next, offsets, omittedCount) {
			lines = next;
			omitted = omittedCount;
			stdoutOffset = offsets.stdout;
			stderrOffset = offsets.stderr;
		},
		/** @returns {OutputBufferSnapshot} */
		snapshot() {
			return {
				lines: lines.slice(),
				omitted,
				stdoutOffset,
				stderrOffset,
				stdoutLossy,
				stderrLossy,
				stdoutSpillPath,
				stderrSpillPath,
				hasGap
			};
		},
		/** Byte length of a text (for gap math), exposed for the full-history view. */
		byteLength(text) {
			return new TextEncoder().encode(text).length;
		}
	};
}

/**
 * Split pre-formatted stream text into lines tagged by stream (used by the
 * full-history view for spill/tail text).
 * @param {string} text - accumulated stream text.
 * @param {boolean} stderr - whether this text belongs to the stderr stream.
 * @returns {OutputLine[]}
 */
export function textToLines(text, stderr) {
	if (text.length === 0) return [];
	const parts = text.split("\n");
	const lines = [];
	for (let index = 0; index < parts.length; index += 1) {
		const piece = parts[index];
		const last = index === parts.length - 1;
		if (last && piece.length === 0) break;
		lines.push({ text: piece, stderr });
	}
	return lines;
}
