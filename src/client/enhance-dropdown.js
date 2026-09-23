/**
 * dsh-plugin-job-panel — background-jobs popover row enhancement.
 *
 * The official popover (dsh-client-ui-jobs) renders read-only `<li>` rows and
 * offers no row-level extension seat, so this module makes the rows clickable
 * with a DOM enhancement — the documented fallback when a target component
 * leaves no slot. The enhancement never injects React-managed child elements;
 * it only sets a data attribute (React does not reconcile foreign attributes),
 * adds one event listener per row, and contributes CSS through the plugin's
 * style tag.
 *
 * Detection contract (re-verified against dsh@0.1.7-alpha.2, JobListAction):
 *   - The popover is a `<ul>` whose aria-label is the official `list.aria`
 *     copy: "后台任务" (zh) or "Background jobs" (en).
 *   - The job id lives on the row's React fiber. dsh-client-ui-jobs rebuilt
 *     its rows in 0.1.7: the key moved from the `<li>` (0.1.5:
 *     `jsx("li", …, job.id)`) onto the wrapping `JobItem` component element
 *     (`jsx(JobItem, { job, … }, String(job.id))`), so the identity is now
 *     read as `props.job.id` off the nearest ancestor fiber that carries the
 *     job object. The keyed-`<li>` shape stays supported as a fallback for
 *     older/newer layouts where the key sits on the row element itself.
 *   - Rows carry native buttons since 0.1.7: the expand toggle (the row body,
 *     `aria-expanded`) and the kill control (no `aria-expanded`). A press on
 *     the kill control stays native — it must stop the job, not navigate.
 *
 * All facts are version-sensitive and re-checked on the checklist after any
 * dsh upgrade; a mismatch degrades to inert rows (no clicks, no breakage).
 */

/**
 * aria-labels the official popover carries (zh is the key-set source of
 * truth, en the key-identical mirror — both shipped by dsh-client-ui-jobs).
 */
const POPOVER_LABELS = new Set(["后台任务", "Background jobs"]);

/**
 * Shape the jobs registry mints for ids (`${kind}-${count}`, e.g. "bash-16").
 * Guards the keyed-row fallback so an unrelated ancestor key (a session id, a
 * menu item) is never taken for a job id; `props.job.id` identities are
 * accepted verbatim — they are the registry's own value.
 */
const JOB_ID_SHAPE = /^[A-Za-z][\w.-]*-\d+$/;

/**
 * Attribute stamped on enhanced rows (also the CSS hook). `setAttribute`
 * stores the name verbatim — no camelCase → kebab-case conversion — so the
 * kebab-case form is used here AND in styles.js (`li[data-job-panel-id]`).
 */
const DATA_ATTRIBUTE = "data-job-panel-id";

/**
 * Read the job id a rendered row carries in React.
 *
 * Walks the DOM node's fiber a bounded number of hops up: the first fiber
 * holding a `props.job.id` (the 0.1.7 `JobItem` wrapper — one hop above the
 * `<li>`) wins; a row element keyed with a registry-shaped id directly (the
 * 0.1.5 shape) is honored at hop 0. Anything else yields no identity, and the
 * row stays inert.
 *
 * @param {HTMLElement} element - a list item rendered by React.
 * @returns {string | undefined} the job id, when the row carries one.
 */
export function jobIdentityOf(element) {
	for (const key of Object.keys(element)) {
		if (!key.startsWith("__reactFiber$")) continue;
		let fiber = /** @type {any} */ (element)[key];
		for (let hop = 0; fiber !== null && fiber !== undefined && hop < 6; hop += 1, fiber = fiber.return) {
			const job = fiber.memoizedProps?.job;
			if (job !== null && typeof job === "object" && typeof job.id === "string" && job.id.length > 0) return job.id;
			if (hop === 0 && typeof fiber.key === "string" && JOB_ID_SHAPE.test(fiber.key)) return fiber.key;
		}
	}
	return undefined;
}

/**
 * Find the job list popover(s) currently in the document.
 * @param {Document} doc - the document to scan.
 * @returns {HTMLUListElement[]} matching popovers.
 */
function findPopovers(doc) {
	const found = [];
	for (const list of doc.querySelectorAll("ul[aria-label]")) {
		if (POPOVER_LABELS.has(list.getAttribute("aria-label") ?? "")) found.push(/** @type {HTMLUListElement} */ (list));
	}
	return found;
}

/**
 * Install the enhancement.
 * @param {{ openTab: (kind: string, options?: object) => void }} deps
 *   openTab: the right-sidebar navigation call (ctx.sidebarRight.openTab).
 * @returns {() => void} disposer removing observers, listeners it can reach,
 *   and the stamped attributes.
 */
export function createDropdownEnhancement({ openTab }) {
	if (typeof document === "undefined") return () => {};

	/** Rows already stamped, so their listener can be removed on dispose. */
	const stamped = new Map();

	const openJobPanel = (event) => {
		// Rows carry native buttons since dsh 0.1.7: the expand toggle (the row
		// body itself, marked `aria-expanded`) and the kill control (no
		// `aria-expanded`). A press on the kill control is the official stop
		// affordance — it must stop the job, not navigate. Every other press
		// opens the panel, which is this enhancement's purpose.
		const button = event.target instanceof Element ? event.target.closest("button") : null;
		if (button !== null && !button.hasAttribute("aria-expanded")) return;
		const row = event.currentTarget;
		const jobId = row?.getAttribute?.(DATA_ATTRIBUTE);
		if (typeof jobId !== "string" || jobId.length === 0) return;
		try {
			openTab("job-output", { params: { jobId } });
		} catch {
			// A navigation failure (e.g. no mounted surface) must not break the popover.
			return;
		}
		// Close the popover: its root handles a bubbled Escape keydown.
		row.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
	};

	/** Stamp and wire every unstamped row inside the given popovers. */
	const enhance = (popovers) => {
		for (const list of popovers) {
			for (const row of list.querySelectorAll("li")) {
				if (row.hasAttribute(DATA_ATTRIBUTE)) continue;
				const jobId = jobIdentityOf(row);
				if (jobId === undefined) continue;
				row.setAttribute(DATA_ATTRIBUTE, jobId);
				row.addEventListener("click", openJobPanel);
				stamped.set(row, openJobPanel);
			}
		}
	};

	/** rAF-throttled rescan; the popover re-renders rows every second while live. */
	let scanScheduled = false;
	const scheduleScan = () => {
		if (scanScheduled) return;
		scanScheduled = true;
		requestAnimationFrame(() => {
			scanScheduled = false;
			try {
				enhance(findPopovers(document));
			} catch {
				// never let the observer callback break the page
			}
		});
	};

	const observer = new MutationObserver(scheduleScan);
	observer.observe(document.body, { childList: true, subtree: true });
	scheduleScan();

	return function dispose() {
		observer.disconnect();
		for (const [row, handler] of stamped) {
			row.removeEventListener("click", handler);
			row.removeAttribute(DATA_ATTRIBUTE);
		}
		stamped.clear();
	};
}
