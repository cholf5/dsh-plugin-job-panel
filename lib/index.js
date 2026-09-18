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
 */

import { JobTap } from "./tap.js";

/** Loader-visible plugin name. */
const name = "job-panel";

/**
 * Services this plugin needs resolved before `apply` runs:
 * - `jobs` — the background-job registry (dsh-jobs-local in standard deployments).
 * - `subprocess` — the process provider whose handles carry the collected readers.
 */
const inject = ["jobs", "subprocess"];

/**
 * Host plugin body: install the observation wraps inside one effect so a
 * plugin unload restores the wrapped services.
 * @param {object} ctx - host cordis context carrying jobs and subprocess.
 * @returns {Promise<void>}
 */
export async function apply(ctx) {
	const tap = new JobTap();
	tap.attach({ jobs: ctx.jobs, subprocess: ctx.subprocess });
	ctx.effect(
		() => () => tap.dispose(),
		"job-panel: observation wraps",
	);
}

export { inject, name };
