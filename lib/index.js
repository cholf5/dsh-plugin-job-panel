/**
 * dsh-plugin-job-panel — host half.
 *
 * A human-facing panel for background jobs started through `ctx.jobs` (the
 * `run_in_background` bash flow, one-shot subagents, ...). This half owns the
 * observation seam: it wraps the job registry's `start` and the subprocess
 * provider's `spawn` (see ./tap.js) so every job can be correlated with its
 * SubprocessHandle's cursor-free collected readers, without ever advancing the
 * model-facing read cursor that the job registry hands to the `job_output`
 * tool. Exact Fetch routes serving the readers to the browser half follow in
 * ./routes.js.
 *
 * The browser half (`dsh.client` in package.json) renders the right-sidebar
 * panel and makes the background-jobs popover rows clickable; nothing here
 * touches prompts, tools, or model-facing surfaces.
 *
 * Activation is traced into `$DSH_HOME/storages/job-panel.json` (see
 * ./diagnostics.js): if this row ever fails to activate, the file shows which
 * step last ran — services resolved, wraps attached, routes registered — plus
 * the first fatal error, without needing the process terminal.
 */

import { JobTap } from "./tap.js";
import { registerRoutes } from "./routes.js";
import { createDiagnostics } from "./diagnostics.js";

/** Loader-visible plugin name. */
const name = "job-panel";

/**
 * Services this plugin needs resolved before `apply` runs:
 * - `jobs` — the background-job registry (dsh-jobs-local in standard deployments).
 * - `subprocess` — the process provider whose handles carry the collected readers.
 * - `connection` — the shared authenticated /api channel for the exact routes.
 */
const inject = ["jobs", "subprocess", "connection"];

/**
 * Host plugin body: install the observation wraps, then register the exact
 * Fetch routes. Every registration happens inside its own effect so a plugin
 * unload restores the wrapped services and removes the routes.
 * @param {object} ctx - host cordis context carrying jobs, subprocess, and connection.
 * @returns {Promise<void>}
 */
export async function apply(ctx) {
	const logger = typeof ctx.logger?.warn === "function" ? (message) => ctx.logger.warn(message) : (message) => console.warn(`[job-panel] ${message}`);
	const diagnostics = createDiagnostics({ logger });

	const services = {
		jobs: ctx.jobs !== undefined && ctx.jobs !== null,
		subprocess: ctx.subprocess !== undefined && ctx.subprocess !== null,
		connection: ctx.connection !== undefined && ctx.connection !== null
	};
	await diagnostics.update({ event: "apply-entered", services });

	try {
		const tap = new JobTap({
			onTrack: (summary) => diagnostics.update({
				lastJobTrackedAt: new Date().toISOString(),
				lastTrackedJob: summary
			})
		});
		tap.attach({ jobs: ctx.jobs, subprocess: ctx.subprocess });
		await diagnostics.update({
			event: "wraps-attached",
			wraps: {
				jobs: ctx.jobs !== undefined && /** @type {any} */ (ctx.jobs.start)?.__jobPanelWrapped === true,
				subprocess: ctx.subprocess !== undefined && /** @type {any} */ (ctx.subprocess.spawn)?.__jobPanelWrapped === true
			}
		});
		ctx.effect(
			() => () => {
				diagnostics.dispose();
				tap.dispose();
			},
			"job-panel: observation wraps",
		);

		const connection = ctx.connection;
		if (connection === undefined || connection === null || typeof connection.fetch?.register !== "function") {
			throw new Error("job-panel: the connection service with fetch.register is required but was not resolved");
		}

		const paths = [];
		for (const route of registerRoutes({
			tap,
			jobs: ctx.jobs,
			logger,
			onQuery: (record) => diagnostics.update({
				lastRouteHitAt: new Date().toISOString(),
				lastRouteHit: record
			})
		})) {
			paths.push(route.path);
			ctx.effect(
				() => connection.fetch.register(route),
				`job-panel: route ${route.path}`,
			);
		}
		await diagnostics.update({ event: "routes-registered", routes: paths });
	} catch (error) {
		diagnostics.update({ event: "apply-failed", fatal: String(error) });
		throw error;
	}
}

export { inject, name };
