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
 * Detection contract (verified against dsh@0.1.5-rc.2, JobListAction):
 *   - The popover is a `<ul>` whose aria-label is the official `list.aria`
 *     copy: "后台任务" (zh) or "Background jobs" (en).
 *   - Each row is a `<li>` keyed by the job id in React: reading the DOM
 *     node's `__reactFiber$*` fiber and returning `fiber.key` yields the job id.
 *
 * Both facts are version-sensitive and re-checked on the checklist after any
 * dsh upgrade; a mismatch degrades to inert rows (no clicks, no breakage).
 */

/**
 * aria-labels the official popover carries (zh is the key-set source of
 * truth, en the key-identical mirror — both shipped by dsh-client-ui-jobs).
 */
const POPOVER_LABELS = new Set(["后台任务", "Background jobs"]);

/**
 * Attribute stamped on enhanced rows (also the CSS hook). `setAttribute`
 * stores the name verbatim — no camelCase → kebab-case conversion — so the
 * kebab-case form is used here AND in styles.js (`li[data-job-panel-id]`).
 */
const DATA_ATTRIBUTE = "data-job-panel-id";

/**
 * Read the React fiber of a DOM node and return its key.
 * @param {HTMLElement} element - a keyed list item rendered by React.
 * @returns {string | undefined} the fiber key, when present.
 */
function fiberKeyOf(element) {
	for (const key of Object.keys(element)) {
		if (!key.startsWith("__reactFiber$")) continue;
		const fiber = /** @type {any} */ (element)[key];
		const fiberKey = fiber?.key;
		if (typeof fiberKey === "string" && fiberKey.length > 0) return fiberKey;
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
				const jobId = fiberKeyOf(row);
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
