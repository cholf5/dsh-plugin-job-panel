/**
 * dsh-plugin-job-panel — popover row identity detection tests.
 *
 * The enhancement reads the job id a rendered popover row carries in React.
 * dsh-client-ui-jobs changed where that identity lives between releases:
 *
 *   - 0.1.5-rc.2: the `<li>` itself is keyed — `jsx("li", props, job.id)`.
 *   - 0.1.7-alpha.2: the `<li>` is unkeyed and sits one hop under the keyed
 *     `JobItem` component element — `jsx(JobItem, { job }, String(job.id))`.
 *
 * The fibers are modeled as the plain objects React exposes through the
 * `__reactFiber$*` DOM property (`key`, `memoizedProps`, `return`), so these
 * tests need no DOM and no React.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { jobIdentityOf } from "../src/client/enhance-dropdown.js";

/** Wrap a fiber the way React attaches it to a DOM node. */
function elementWith(fiber) {
	return /** @type {any} */ ({ "__reactFiber$test": fiber });
}

test("0.1.7 shape: id read from the JobItem fiber's props.job one hop above the unkeyed li", () => {
	const li = elementWith({
		key: null,
		memoizedProps: { className: "item", children: [] },
		return: {
			key: "bash-16",
			memoizedProps: { job: { id: "bash-16", kind: "bash", label: "npm test" } },
			return: { key: null, memoizedProps: {} }
		}
	});
	assert.equal(jobIdentityOf(li), "bash-16");
});

test("0.1.5 shape: id read from the keyed li's own fiber key", () => {
	const li = elementWith({
		key: "bash-3",
		memoizedProps: { className: "row", children: [] },
		return: { key: null, memoizedProps: {} }
	});
	assert.equal(jobIdentityOf(li), "bash-3");
});

test("props.job.id wins over a differently-shaped ancestor key", () => {
	const li = elementWith({
		key: null,
		memoizedProps: {},
		return: {
			key: "bash-16",
			memoizedProps: { job: { id: "bash-16" } },
			return: { key: "not-a-job-id", memoizedProps: {} }
		}
	});
	assert.equal(jobIdentityOf(li), "bash-16");
});

test("section header li (no job anywhere in reach) stays unidentified", () => {
	const header = elementWith({
		key: null,
		memoizedProps: { className: "sectionHeader", "aria-hidden": "true" },
		return: { key: null, memoizedProps: { expanded: true } }
	});
	assert.equal(jobIdentityOf(header), undefined);
});

test("an unrelated ancestor key is not taken for a job id", () => {
	const li = elementWith({
		key: null,
		memoizedProps: {},
		// six unkeyed, job-less hops, then a session-id-looking key far above
		return: { key: null, memoizedProps: {}, return: { key: null, memoizedProps: {}, return: { key: null, memoizedProps: {}, return: { key: null, memoizedProps: {}, return: { key: null, memoizedProps: {}, return: { key: null, memoizedProps: {}, return: { key: "s-1234", memoizedProps: {} } } } } } } }
	});
	assert.equal(jobIdentityOf(li), undefined);
});

test("no React fiber on the element yields no identity", () => {
	assert.equal(jobIdentityOf(/** @type {any} */ ({ className: "plain" })), undefined);
});

test("a job object with an empty or non-string id is ignored", () => {
	const li = elementWith({
		key: null,
		memoizedProps: { job: { id: "" } },
		return: { key: null, memoizedProps: { job: 42 } }
	});
	assert.equal(jobIdentityOf(li), undefined);
});
