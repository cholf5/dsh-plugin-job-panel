/**
 * dsh-plugin-job-panel — exact Fetch routes on the shared authenticated /api
 * channel.
 *
 * Three routes, each registered once (the fetch registry is keyed by path, so
 * method dispatch happens inside each handler):
 *
 *   GET  /api/job-panel/output?jobId=&stdoutOffset=&stderrOffset=&sessionId=
 *        Incremental cursor-free reads of one job's collected stdout/stderr by
 *        whole-stream byte offset, plus the job's registry snapshot and the
 *        spawn facts captured at start time. The offsets belong to the caller
 *        (the browser half); reads never touch the model-facing job registry
 *        read cursor.
 *
 *   GET  /api/job-panel/full?jobId=&sessionId=&maxBytes=
 *        Full output history per stream: the spill file's head (capped) plus
 *        the retained in-memory tail, with the byte facts a client needs to
 *        detect any gap between them.
 *
 *   POST /api/job-panel/stop  { jobId, sessionId?, reason? }
 *        Cancellation request through ctx.jobs.kill. The registry fences owned
 *        jobs by comparing the caller's id with the owner's session id; this
 *        plugin passes the owner session it recorded at start time (falling
 *        back to the browser-supplied sessionId for jobs it did not observe).
 *        Note: kill marks the terminal delivery reported, so the model's
 *        completion notice is suppressed — the model discovers the stop on its
 *        next job_output/job_list/job_wait call. This follows the official
 *        seam as it exists in 0.1.5-rc.2.
 *
 * Every handler returns JSON, never throws across the route boundary.
 */

import { promises as fs } from "node:fs";

/** Exact route: incremental cursor-free output reads. */
export const OUTPUT_PATH = "/api/job-panel/output";

/** Exact route: full history (spill head + retained tail). */
export const FULL_PATH = "/api/job-panel/full";

/** Exact route: stop (cancel) a background job. */
export const STOP_PATH = "/api/job-panel/stop";

/** Upper bound for one spill file read per stream (the `maxBytes` default). */
const DEFAULT_MAX_SPILL_READ_BYTES = 2 * 1024 * 1024;

/** Hard ceiling for the `maxBytes` query parameter. */
const MAX_SPILL_READ_BYTES_LIMIT = 8 * 1024 * 1024;

/** Upper bound for one job id string (registry ids are `<kind>-N`). */
const MAX_JOB_ID_LENGTH = 128;

/** Upper bound for one session id string used as a fallback caller id. */
const MAX_SESSION_ID_LENGTH = 200;

/** Upper bound for one stop reason string. */
const MAX_REASON_LENGTH = 300;

/** TextDecoder reused across spill reads (stateless across separate calls). */
const textDecoder = new TextDecoder("utf-8", { fatal: false });

/**
 * True when the value is a plain string within a sane length.
 * @param {unknown} value - candidate value.
 * @param {number} maxLength - inclusive upper bound.
 * @returns {boolean}
 */
function isValidString(value, maxLength) {
	return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

/**
 * True when the value is a non-negative safe integer (a byte offset).
 * @param {unknown} value - candidate offset.
 * @returns {boolean}
 */
function isSafeOffset(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** @returns {Response} 200 JSON response with no-store caching. */
function jsonResponse(payload, status = 200) {
	return Response.json(payload, { status, headers: { "cache-control": "no-store" } });
}

/**
 * Validate the `jobId` query/body field.
 * @returns {string | undefined} error message, or undefined when valid.
 */
function validateJobId(value) {
	if (!isValidString(value, MAX_JOB_ID_LENGTH)) return `jobId must be a non-empty string of at most ${MAX_JOB_ID_LENGTH} characters`;
	return undefined;
}

/**
 * Validate an optional `sessionId` fallback field.
 * @returns {string | undefined} error message, or undefined when valid or absent.
 */
function validateOptionalSessionId(value) {
	if (value === undefined || value === null) return undefined;
	if (!isValidString(value, MAX_SESSION_ID_LENGTH)) return `sessionId must be a non-empty string of at most ${MAX_SESSION_ID_LENGTH} characters`;
	return undefined;
}

/**
 * Resolve the registry caller id for one job: the owner session recorded at
 * start time wins; the browser-supplied sessionId is only a fallback for jobs
 * this plugin did not observe being started. Both spell the same thing (the
 * registry's fence compares caller.id with the owner agent's id).
 * @param {import("./tap.js").JobTap} tap - the observation tap.
 * @param {string} jobId - registry job id.
 * @param {string | undefined} fallbackSessionId - browser-supplied session id.
 * @returns {string | undefined} caller id, or undefined for unowned/unknown jobs.
 */
function resolveCallerId(tap, jobId, fallbackSessionId) {
	const entry = tap.entry(jobId);
	if (entry !== undefined && entry.ownerSession !== undefined) return entry.ownerSession;
	if (isValidString(fallbackSessionId, MAX_SESSION_ID_LENGTH)) return fallbackSessionId;
	return undefined;
}

/**
 * Read one job's registry snapshot with a synthetic caller. The registry
 * duck-types the caller by its `id`, so a plain object is enough; owned jobs
 * with an unknown owner throw, which this helper folds into `null`.
 * @param {object | undefined} jobs - the job registry service instance.
 * @param {string} jobId - registry job id.
 * @param {string | undefined} callerId - synthetic caller session id.
 * @returns {object | null} fresh JobSnapshot, or null when unknown/foreign.
 */
function readSnapshot(jobs, jobId, callerId) {
	if (jobs === undefined || jobs === null || typeof jobs.get !== "function") return null;
	try {
		return jobs.get(jobId, callerId === undefined ? undefined : { id: callerId });
	} catch {
		return null;
	}
}

/**
 * Project one collected stream reader for a route response.
 * @param {object | undefined} reader - SubprocessOutputReader (readFrom).
 * @param {number} fromByte - caller-owned byte offset.
 * @returns {object | null} { text, nextOffset, lossy, spillPath } projection.
 */
function readStream(reader, fromByte) {
	if (reader === undefined || reader === null || typeof reader.readFrom !== "function") return null;
	const read = reader.readFrom(fromByte);
	return {
		text: typeof read.text === "string" ? read.text : "",
		nextOffset: isSafeOffset(read.nextOffset) ? read.nextOffset : fromByte,
		lossy: read.lossy === true,
		spillPath: isValidString(read.spillPath, 4096) ? read.spillPath : undefined
	};
}

/**
 * Spawn facts captured at start time, projected for display.
 * @param {import("./tap.js").JobTap} tap - the observation tap.
 * @param {string} jobId - registry job id.
 * @returns {object | undefined}
 */
function metaOf(tap, jobId) {
	const entry = tap.entry(jobId);
	if (entry === undefined) return undefined;
	return {
		kind: entry.kind,
		label: entry.label,
		ownerSession: entry.ownerSession,
		startedAt: entry.startedAt,
		spawn: entry.spawn ?? undefined
	};
}

/**
 * Build the three route registrations.
 * @param {{ tap: import("./tap.js").JobTap, jobs: object | undefined, logger: (message: string) => void }} deps
 * @returns {Array<{ path: string, methods: string[], requestBody?: string, fetch: (request: Request) => Promise<Response> }>}
 *   route descriptors, ready for connection.fetch.register + ctx.effect.
 */
export function registerRoutes({ tap, jobs, logger }) {
	const outputHandler = async (request) => {
		if (request.method === "HEAD") return new Response(null, { status: 200, headers: { "cache-control": "no-store" } });
		const url = new URL(request.url);
		const jobId = url.searchParams.get("jobId") ?? undefined;
		const jobIdError = validateJobId(jobId);
		if (jobIdError !== undefined) return jsonResponse({ error: jobIdError }, 400);
		const sessionId = url.searchParams.get("sessionId") ?? undefined;
		const sessionIdError = validateOptionalSessionId(sessionId);
		if (sessionIdError !== undefined) return jsonResponse({ error: sessionIdError }, 400);

		const offsets = {};
		for (const name of ["stdoutOffset", "stderrOffset"]) {
			const raw = url.searchParams.get(name);
			if (raw === null) continue;
			const value = Number(raw);
			if (!isSafeOffset(value)) return jsonResponse({ error: `${name} must be a non-negative safe integer` }, 400);
			offsets[name] = value;
		}

		const entry = tap.entry(jobId);
		const callerId = resolveCallerId(tap, jobId, sessionId);
		const snapshot = readSnapshot(jobs, jobId, callerId);
		const handle = entry?.handle;
		if (entry === undefined || handle === undefined || handle.collected === undefined) {
			return jsonResponse({ tapped: false, meta: undefined, snapshot, stdout: null, stderr: null });
		}
		return jsonResponse({
			tapped: true,
			meta: metaOf(tap, jobId),
			snapshot,
			stdout: readStream(handle.collected.stdout, offsets.stdoutOffset ?? 0),
			stderr: readStream(handle.collected.stderr, offsets.stderrOffset ?? 0)
		});
	};

	const fullHandler = async (request) => {
		if (request.method === "HEAD") return new Response(null, { status: 200, headers: { "cache-control": "no-store" } });
		const url = new URL(request.url);
		const jobId = url.searchParams.get("jobId") ?? undefined;
		const jobIdError = validateJobId(jobId);
		if (jobIdError !== undefined) return jsonResponse({ error: jobIdError }, 400);
		const sessionId = url.searchParams.get("sessionId") ?? undefined;
		const sessionIdError = validateOptionalSessionId(sessionId);
		if (sessionIdError !== undefined) return jsonResponse({ error: sessionIdError }, 400);

		let maxBytes = DEFAULT_MAX_SPILL_READ_BYTES;
		const rawMaxBytes = url.searchParams.get("maxBytes");
		if (rawMaxBytes !== null) {
			const value = Number(rawMaxBytes);
			if (!(Number.isSafeInteger(value) && value > 0 && value <= MAX_SPILL_READ_BYTES_LIMIT)) {
				return jsonResponse({ error: `maxBytes must be a positive integer of at most ${MAX_SPILL_READ_BYTES_LIMIT}` }, 400);
			}
			maxBytes = value;
		}

		const entry = tap.entry(jobId);
		const callerId = resolveCallerId(tap, jobId, sessionId);
		const snapshot = readSnapshot(jobs, jobId, callerId);
		const handle = entry?.handle;
		if (entry === undefined || handle === undefined || handle.collected === undefined) {
			return jsonResponse({ tapped: false, snapshot, stdout: null, stderr: null });
		}

		const projectFull = async (reader) => {
			if (reader === undefined || reader === null || typeof reader.readFrom !== "function") return null;
			const tail = readStream(reader, 0);
			if (tail === null) return null;
			if (tail.spillPath === undefined) {
				return { spill: null, tail };
			}
			try {
				const stat = await fs.stat(tail.spillPath);
				if (!stat.isFile()) return { spill: null, tail };
				const size = stat.size;
				const readLength = Math.min(size, maxBytes);
				const fileHandle = await fs.open(tail.spillPath, "r");
				try {
					const buffer = Buffer.allocUnsafe(readLength);
					await fileHandle.read(buffer, 0, readLength, 0);
					return {
						spill: { path: tail.spillPath, size, truncated: size > readLength, text: textDecoder.decode(buffer) },
						tail
					};
				} finally {
					await fileHandle.close();
				}
			} catch (error) {
				logger(`job-panel: spill read failed for job ${jobId}: ${String(error)}`);
				return { spill: null, tail };
			}
		};

		const stdout = await projectFull(handle.collected.stdout);
		const stderr = await projectFull(handle.collected.stderr);
		return jsonResponse({ tapped: true, meta: metaOf(tap, jobId), snapshot, stdout, stderr });
	};

	const stopHandler = async (request) => {
		let body;
		try {
			body = await request.json();
		} catch {
			return jsonResponse({ error: "body must be JSON" }, 400);
		}
		const jobIdError = validateJobId(body?.jobId);
		if (jobIdError !== undefined) return jsonResponse({ error: jobIdError }, 400);
		const sessionIdError = validateOptionalSessionId(body?.sessionId);
		if (sessionIdError !== undefined) return jsonResponse({ error: sessionIdError }, 400);
		if (body?.reason !== undefined && body.reason !== null && !isValidString(body.reason, MAX_REASON_LENGTH)) {
			return jsonResponse({ error: `reason must be a non-empty string of at most ${MAX_REASON_LENGTH} characters` }, 400);
		}

		if (jobs === undefined || jobs === null || typeof jobs.kill !== "function") {
			return jsonResponse({ error: "background jobs are unavailable on this host" }, 503);
		}
		const callerId = resolveCallerId(tap, body.jobId, body?.sessionId ?? undefined);
		const reason = isValidString(body?.reason, MAX_REASON_LENGTH) ? body.reason : "job-panel: stopped from the job panel";
		try {
			const result = jobs.kill(body.jobId, callerId === undefined ? undefined : { id: callerId }, reason);
			return jsonResponse({ ok: true, result });
		} catch (error) {
			const message = String(error);
			if (message.includes("unknown job")) return jsonResponse({ error: message }, 404);
			if (message.includes("belongs to another session")) return jsonResponse({ error: message }, 403);
			return jsonResponse({ error: message }, 500);
		}
	};

	return [
		{ path: OUTPUT_PATH, methods: ["GET", "HEAD"], fetch: outputHandler },
		{ path: FULL_PATH, methods: ["GET", "HEAD"], fetch: fullHandler },
		{ path: STOP_PATH, methods: ["POST"], requestBody: "buffered", fetch: stopHandler }
	];
}
