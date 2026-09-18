/**
 * dsh-plugin-job-panel — browser-side API helpers.
 *
 * Thin fetch wrappers over the host half's exact routes on the shared
 * authenticated /api channel (same-origin, cookie auth is automatic). Every
 * helper accepts an AbortSignal so tab lifetime and poll cycles can cancel
 * in-flight requests.
 */

/** Exact route paths — must match lib/routes.js. */
export const OUTPUT_PATH = "/api/job-panel/output";
export const FULL_PATH = "/api/job-panel/full";
export const STOP_PATH = "/api/job-panel/stop";

/**
 * Shape of one output poll response's per-stream projection.
 * @typedef {object} StreamRead
 * @property {string} text - delta text since the requested byte offset.
 * @property {number} nextOffset - whole-stream byte offset to resume from.
 * @property {boolean} lossy - the requested offset slid out of the retained window.
 * @property {string | undefined} spillPath - host spill file when one exists.
 */

/**
 * Shape of the output poll response.
 * @typedef {object} OutputResponse
 * @property {boolean} tapped - whether this plugin observed the job start.
 * @property {object | undefined} meta - kind/label/ownerSession/startedAt/spawn facts.
 * @property {object | null} snapshot - registry snapshot (id/kind/label/status/detail/startedAt/finishedAt).
 * @property {StreamRead | null} stdout
 * @property {StreamRead | null} stderr
 */

/**
 * GET one job's incremental output by byte offsets.
 * @param {{ jobId: string, sessionId?: string, stdoutOffset?: number, stderrOffset?: number, signal?: AbortSignal }} args
 * @returns {Promise<OutputResponse>}
 */
export async function fetchOutput({ jobId, sessionId, stdoutOffset = 0, stderrOffset = 0, signal }) {
	const params = new URLSearchParams({ jobId, stdoutOffset: String(stdoutOffset), stderrOffset: String(stderrOffset) });
	if (sessionId !== undefined) params.set("sessionId", sessionId);
	const response = await fetch(`${OUTPUT_PATH}?${params.toString()}`, { signal, cache: "no-store" });
	if (!response.ok) throw new Error(`job-panel: output request failed with ${response.status}`);
	return response.json();
}

/**
 * GET one job's full history (spill head + retained tail per stream).
 * @typedef {object} FullResponse
 * @property {boolean} tapped
 * @property {object | undefined} meta
 * @property {object | null} snapshot
 * @property {{ spill: { path: string, size: number, truncated: boolean, text: string } | null, tail: StreamRead | null } | null} stdout
 * @property {{ spill: { path: string, size: number, truncated: boolean, text: string } | null, tail: StreamRead | null } | null} stderr
 * @param {{ jobId: string, sessionId?: string, maxBytes?: number, signal?: AbortSignal }} args
 * @returns {Promise<FullResponse>}
 */
export async function fetchFull({ jobId, sessionId, maxBytes, signal }) {
	const params = new URLSearchParams({ jobId });
	if (sessionId !== undefined) params.set("sessionId", sessionId);
	if (maxBytes !== undefined) params.set("maxBytes", String(maxBytes));
	const response = await fetch(`${FULL_PATH}?${params.toString()}`, { signal, cache: "no-store" });
	if (!response.ok) throw new Error(`job-panel: full request failed with ${response.status}`);
	return response.json();
}

/**
 * POST a stop request for one job.
 * @param {{ jobId: string, sessionId?: string, reason?: string, signal?: AbortSignal }} args
 * @returns {Promise<{ ok: boolean, result: 'requested' | 'already-finished' }>}
 */
export async function postStop({ jobId, sessionId, reason, signal }) {
	const response = await fetch(STOP_PATH, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ jobId, sessionId, reason }),
		signal
	});
	const payload = await response.json().catch(() => undefined);
	if (!response.ok) throw new Error(payload?.error ?? `job-panel: stop request failed with ${response.status}`);
	return payload;
}
