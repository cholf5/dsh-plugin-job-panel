/**
 * dsh-plugin-job-panel — host activation diagnostics.
 *
 * Persists a small JSON record under `$DSH_HOME/storages/job-panel.json` so a
 * failed activation can be diagnosed without a terminal attached to the
 * `dsh web` process: apply steps, service resolution, wrap attachment, route
 * registration, the last tracked job, and any fatal error. Every update is a
 * read-merge-atomic-replace with writes serialized through a promise chain
 * (the same shape session-emoji uses for its user-data file).
 *
 * The file is a diagnostic aid only — nothing reads it at runtime; losing it
 * is harmless. If the storage area cannot be written the failure is reported
 * through the logger and diagnostics degrade to a no-op.
 */

import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/** Upper bound for serialized diagnostics payloads (hard safety valve). */
const MAX_PAYLOAD_BYTES = 16 * 1024;

/**
 * Resolve the dsh home directory the same way the harness does:
 * explicit `$DSH_HOME` wins, else `~/.dsh`. Blank env values are ignored.
 * @returns absolute home directory path.
 */
function resolveDshHome() {
	const env = process.env.DSH_HOME;
	if (env !== undefined && env.trim() !== "") return env.trim();
	return join(homedir(), ".dsh");
}

/** Absolute path of the diagnostics file. */
function diagnosticsFilePath() {
	return join(resolveDshHome(), "storages", "job-panel.json");
}

/**
 * Create the diagnostics recorder.
 * @param {{ logger?: (message: string) => void }} options - failure sink.
 * @returns {{ update: (patch: object) => void, dispose: () => void }} recorder.
 */
export function createDiagnostics({ logger } = {}) {
	/** @type {Record<string, unknown> | undefined} last known merged record */
	let current;
	/** Serializes read-merge-write cycles. */
	let tail = Promise.resolve();
	let disposed = false;

	const persist = async () => {
		const path = diagnosticsFilePath();
		const payload = JSON.stringify(current ?? {}, undefined, "\t");
		if (payload.length > MAX_PAYLOAD_BYTES) return;
		const temp = `${path}.${process.pid}.${Date.now()}.tmp`;
		await fs.mkdir(dirname(path), { recursive: true });
		await fs.writeFile(temp, payload, "utf8");
		await fs.rename(temp, path);
	};

	return {
		/**
		 * Merge one patch into the record and persist it (fire-and-forget).
		 * @param {object} patch - shallow merge into the current record.
		 * @returns {void}
		 */
		update(patch) {
			if (disposed) return;
			tail = tail.then(async () => {
				if (current === undefined) {
					try {
						current = JSON.parse(await fs.readFile(diagnosticsFilePath(), "utf8"));
					} catch {
						current = {};
					}
				}
				current = { ...current, ...patch, updatedAt: new Date().toISOString() };
				await persist();
			}).catch((error) => {
				logger?.(`job-panel: diagnostics write failed: ${String(error)}`);
			});
		},
		/** Stop accepting updates; the in-flight write still completes. */
		dispose() {
			disposed = true;
		}
	};
}
