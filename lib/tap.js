/**
 * dsh-plugin-job-panel — background-job tap.
 *
 * The job registry contract (@deepseek-ai/dsh-jobs) exposes stream output
 * through ONE consuming cursor per job (`read()`, forwarded to the producer's
 * `readOutput()`); the model's `job_output` tool owns that cursor. A human-facing
 * panel therefore must not read through the registry — the official README lists
 * "independent observers need a cursor or snapshot API" as a known limitation.
 *
 * The seam used here sits one layer below: background bash jobs are spawned via
 * `ctx.subprocess.spawn(...)`, whose SubprocessHandle carries
 * `collected.stdout` / `collected.stderr` — SubprocessOutputReaders documented
 * as "Cursor-free incremental access ... independent readers cannot consume
 * one another's output" (caller-owned byte offsets, `readFrom(fromByte)`).
 * Reading through those readers never touches the model's cursor and keeps
 * working after the process settles.
 *
 * This module wraps two service instances without changing their behavior:
 *
 *   - `ctx.jobs.start`     — records kind / label / ownerSession, and holds the
 *                            entry open while the producer's synchronous
 *                            `run()` executes (jobs-local calls `spec.run()`
 *                            inline), so the spawn that happens inside it can
 *                            be attributed to the returned job id.
 *   - `ctx.subprocess.spawn` — while a start is in flight, the first spawned
 *                            handle with collect-mode readers is attached to
 *                            that entry, together with argv/cwd facts.
 *
 * Both wraps are behavior-preserving observation: the original return value is
 * passed through untouched, and a tap bug can never break job starting (every
 * recording path is try/catch-isolated). Restoring the originals happens via
 * the disposer returned by `dispose()`, wired to the plugin's own effect so a
 * plugin unload removes the wraps.
 *
 * UNOFFICIAL SEAM: instance-level method wrapping of dsh services. Verified
 * against @deepseek-ai/dsh@0.1.5-rc.2 (jobs-local start calls spec.run()
 * synchronously; SubprocessHandle.collected exposes the offset readers).
 * Re-verify both facts after any dsh upgrade.
 */

/**
 * Upper bound on tracked jobs. Job records hold a SubprocessHandle whose
 * collected readers keep the process's retained output readable after exit —
 * exactly what the panel serves — so the map is capped LRU-style. The default
 * per-owner live-job admission is 10; 100 covers a long backlog of settled
 * jobs before the oldest, least interesting ones fall off.
 */
const MAX_TRACKED_JOBS = 100;

/** Upper bound for one job id string (registry ids are `<kind>-N`). */
const MAX_JOB_ID_LENGTH = 128;

/** Upper bound for one session id string used as a fallback caller id. */
const MAX_SESSION_ID_LENGTH = 200;

/** Upper bound for one argv entry kept as spawn facts (labels can be huge). */
const MAX_ARGV_ENTRY_LENGTH = 4096;

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
 * Clip a string to a bounded prefix, for spawn facts recorded for display.
 * @param {unknown} value - candidate string.
 * @param {number} maxLength - inclusive upper bound.
 * @returns {string | undefined} the string, or undefined when not a string.
 */
function clippedString(value, maxLength) {
	if (typeof value !== "string") return undefined;
	return value.length > maxLength ? value.slice(0, maxLength) : value;
}

/**
 * One tracked background job: registry facts captured at start time plus the
 * subprocess handle attributed to it (when the producer spawned one while the
 * start was in flight).
 * @typedef {object} TrackedJob
 * @property {string | undefined} kind - producer kind from the start spec.
 * @property {string | undefined} label - producer label (for bash: the command).
 * @property {string | undefined} ownerSession - owner agent id (session id); absent for unowned jobs.
 * @property {number} startedAt - epoch ms captured when start() was entered.
 * @property {object | undefined} handle - SubprocessHandle with collected readers.
 * @property {{ argv: string[] | undefined, cwd: string | undefined } | undefined} spawn - spawn facts.
 */
export class JobTap {
	/** @type {Map<string, TrackedJob>} jobId -> entry */
	#jobs = new Map();
	/** @type {string[]} insertion order for LRU eviction */
	#order = [];
	/** @type {TrackedJob | undefined} entry whose producer run() is on the stack */
	#current;
	/** @type {Array<() => void>} restore callbacks for applied wraps */
	#unwraps = [];
	/** @type {boolean} set once dispose() ran */
	#disposed = false;
	/** @type {undefined | ((summary: { jobId: string, kind: string | undefined, hasHandle: boolean, cwd: string | undefined }) => void)} optional track observer (diagnostics) */
	#onTrack;

	/**
	 * @param {{ onTrack?: (summary: { jobId: string, kind: string | undefined, hasHandle: boolean, cwd: string | undefined }) => void }} [options]
	 *   onTrack fires after a job is successfully tracked, with the facts that
	 *   decide whether the panel can serve output for it (hasHandle = whether
	 *   the producer's spawn was attributed). Never throws into the caller.
	 */
	constructor(options = {}) {
		this.#onTrack = typeof options.onTrack === "function" ? options.onTrack : undefined;
	}

	/** Number of tracked jobs (diagnostics). */
	get size() {
		return this.#jobs.size;
	}

	/**
	 * The tracked entry for one job id, or undefined when unknown (job started
	 * before this plugin loaded, or evicted by the LRU cap).
	 * @param {string} jobId - registry job id.
	 * @returns {TrackedJob | undefined}
	 */
	entry(jobId) {
		return this.#jobs.get(jobId);
	}

	/**
	 * Wrap the job registry's start and the subprocess provider's spawn.
	 * Each service is wrapped at most once, and missing services degrade to a
	 * no-op so the plugin stays loadable in compositions without one of them.
	 * @param {{ jobs: object | undefined, subprocess: object | undefined }} services - resolved host services.
	 * @returns {void}
	 */
	attach({ jobs, subprocess }) {
		if (this.#disposed) throw new Error("job-panel: JobTap was already disposed");
		if (jobs !== undefined && jobs !== null && typeof jobs.start === "function") this.#wrapStart(jobs);
		if (subprocess !== undefined && subprocess !== null && typeof subprocess.spawn === "function") this.#wrapSpawn(subprocess);
	}

	/**
	 * Remove both wraps and forget tracked jobs. Safe to call twice.
	 * @returns {void}
	 */
	dispose() {
		if (this.#disposed) return;
		this.#disposed = true;
		for (const unwrap of this.#unwraps.reverse()) {
			try {
				unwrap();
			} catch {
				// a failed restore must not block the remaining unwraps
			}
		}
		this.#unwraps.length = 0;
		this.#jobs.clear();
		this.#order.length = 0;
		this.#current = undefined;
	}

	/**
	 * Wrap `registry.start`: open a tracking entry while the (synchronous)
	 * producer run() executes, then bind the entry to the returned job id.
	 * @param {object} registry - the JobRegistry service instance.
	 * @returns {void}
	 */
	#wrapStart(registry) {
		if (/** @type {any} */ (registry.start).__jobPanelWrapped === true) return;
		const original = registry.start;
		const tap = this;
		const patched = function patchedStart(spec) {
			if (tap.#disposed) return original.call(this, spec);
			const entry = {
				kind: clippedString(spec?.kind, 64),
				label: clippedString(spec?.label, MAX_ARGV_ENTRY_LENGTH),
				ownerSession: isValidString(spec?.owner?.id, MAX_SESSION_ID_LENGTH) ? spec.owner.id : undefined,
				startedAt: Date.now(),
				handle: undefined,
				spawn: undefined
			};
			tap.#current = entry;
			let jobId;
			try {
				jobId = original.call(this, spec);
			} finally {
				tap.#current = undefined;
			}
			try {
				if (isValidString(jobId, MAX_JOB_ID_LENGTH)) {
					tap.#track(jobId, entry);
					tap.#onTrack?.({
						jobId,
						kind: entry.kind,
						hasHandle: entry.handle !== undefined,
						cwd: entry.spawn?.cwd
					});
				}
			} catch {
				// tracking must never break job starting
			}
			return jobId;
		};
		/** @type {any} */ (patched).__jobPanelWrapped = true;
		registry.start = patched;
		this.#unwraps.push(() => {
			if (registry.start === patched) registry.start = original;
		});
	}

	/**
	 * Wrap `provider.spawn`: attribute the first spawned collect-mode handle of
	 * an in-flight start to the entry being started, recording argv/cwd facts.
	 * @param {object} provider - the subprocess provider service instance.
	 * @returns {void}
	 */
	#wrapSpawn(provider) {
		if (/** @type {any} */ (provider.spawn).__jobPanelWrapped === true) return;
		const original = provider.spawn;
		const tap = this;
		const patched = function patchedSpawn(spec) {
			const handle = original.apply(this, arguments);
			try {
				if (tap.#disposed) return handle;
				const current = tap.#current;
				if (current !== undefined && current.handle === undefined && handle !== undefined && handle.collected !== undefined) {
					current.handle = handle;
					current.spawn = {
						argv: Array.isArray(spec?.argv) ? spec.argv.map((item) => clippedString(item, MAX_ARGV_ENTRY_LENGTH) ?? "") : undefined,
						cwd: clippedString(spec?.cwd, 1024)
					};
				}
			} catch {
				// observation must never break spawning
			}
			return handle;
		};
		/** @type {any} */ (patched).__jobPanelWrapped = true;
		provider.spawn = patched;
		this.#unwraps.push(() => {
			if (provider.spawn === patched) provider.spawn = original;
		});
	}

	/**
	 * Insert or refresh one entry, evicting the oldest beyond the cap.
	 * @param {string} jobId - registry job id.
	 * @param {TrackedJob} entry - the entry recorded for this job.
	 * @returns {void}
	 */
	#track(jobId, entry) {
		if (this.#jobs.has(jobId)) this.#order = this.#order.filter((id) => id !== jobId);
		this.#jobs.set(jobId, entry);
		this.#order.push(jobId);
		while (this.#order.length > MAX_TRACKED_JOBS) {
			const evicted = this.#order.shift();
			this.#jobs.delete(evicted);
		}
	}
}
