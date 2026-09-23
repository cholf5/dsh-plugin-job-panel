/**
 * Host-half smoke test (the node --test pattern from the dsh plugin field
 * notes): apply() with a stub cordis ctx must register the three exact
 * routes through the connection service, and the route handlers must reject
 * invalid input at the fence-adjacent validation layer.
 *
 * $DSH_HOME is pointed at a temp directory so the diagnostics store writes
 * land nowhere real (resolveDshHome reads the env at call time).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { apply } from "../lib/index.js";

/**
 * $DSH_HOME is pinned for the whole test process, at module scope: the host
 * half's diagnostics updates are fire-and-forget, so a write scheduled inside
 * a test can land after the test's own cleanup — an env var deleted in
 * `t.after` would make that late write resolve to the real `~/.dsh` and merge
 * test noise into the live diagnostics record.
 */
const testHome = await mkdtemp(join(tmpdir(), "dsh-job-panel-test-"));
process.env.DSH_HOME = testHome;
test.after(async () => {
	await rm(testHome, { recursive: true, force: true });
});

/** A stub cordis ctx: effect runs immediately; connection captures routes. */
function stubCtx() {
	const registered = [];
	const ctx = {
		jobs: undefined,
		subprocess: undefined,
		effect: (fn) => fn(),
		connection: {
			fetch: {
				register(route) {
					registered.push(route);
				}
			}
		}
	};
	return { ctx, registered };
}

test("apply registers the three /api routes through connection", async () => {
	const { ctx, registered } = stubCtx();
	await apply(ctx);

	const paths = registered.map((route) => route.path).sort();
	assert.deepEqual(paths, ["/api/job-panel/full", "/api/job-panel/output", "/api/job-panel/stop"]);
	for (const route of registered) {
		assert.ok(Array.isArray(route.methods) && route.methods.length > 0, "methods declared");
		assert.equal(typeof route.fetch, "function", "handler present");
	}
});

test("the output route validates its query before touching the registry", async () => {
	const { ctx, registered } = stubCtx();
	await apply(ctx);
	const output = registered.find((route) => route.path === "/api/job-panel/output");

	// Missing jobId → validation rejection (4xx), never a registry touch.
	const response = await output.fetch(new Request("https://dsh.local/api/job-panel/output", { method: "GET" }));
	assert.ok(response.status >= 400 && response.status < 500, `expected a 4xx validation response, got ${response.status}`);
});
