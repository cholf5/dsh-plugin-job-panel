/**
 * dsh-plugin-job-panel — client half entry.
 *
 * Contributes, all inside per-feature effects so an HMR unload removes exactly
 * what this plugin registered:
 *
 *   1. The `jobPanel` locale dictionaries (zh source of truth, key-identical en).
 *   2. A right-sidebar page tab type (`kind: "job-output"`) with a guide entry,
 *      registered through the official two-stage path (sidebarRightTabs).
 *   3. The panel body under the keyed `sidebar.right.pane.tab` seat. The seat
 *      injects the framework-bound useTabInfo hook and the namespace `t`;
 *      the inject factory contributes the owning session id.
 *
 * The manifest's `dsh.client.inject` lists the package rows this half needs
 * loaded before it: locale, primitives (require-able externals), and
 * sidebar-right (the sidebarRight/sidebarRightTabs service providers).
 */

import { NS, en, zh } from "./locale.js";
import { JobPanel } from "./panel.jsx";
import { PANEL_CSS, ensureStyles } from "./styles.js";

/** The tab type identity — the package name, the natural value per the seat contract. */
const TAB_TYPE_ID = "dsh-plugin-job-panel";

/** Page kind other code opens with ctx.sidebarRight.openTab(kind, { params }). */
export const JOB_TAB_KIND = "job-output";

/** Guide entry ordering: after the shipped entries, before anything ad-hoc. */
const GUIDE_ORDER = 90;

/**
 * Required client services: the slot registry, locale, and the right sidebar's
 * tab registry + navigation controller.
 */
const inject = ["slots", "locale", "sidebarRight", "sidebarRightTabs"];

/**
 * Client plugin body.
 * @param {object} ctx - client root context.
 */
function apply(ctx) {
	ctx.effect(
		() => ensureStyles(PANEL_CSS),
		"job-panel: styles",
	);
	ctx.effect(
		() => ctx.locale.register(NS, { zh, en }),
		"job-panel: dictionaries",
	);

	// The namespace-bound translator, stable per namespace — safe to capture in
	// thunks the tab registry reads on every use (titles re-read at call time,
	// so language switches apply without re-registration).
	const t = ctx.locale.bind(NS);

	ctx.effect(
		() => ctx.sidebarRightTabs.register({
			id: TAB_TYPE_ID,
			kind: JOB_TAB_KIND,
			// A page type: no patterns, opened by kind, recorded at an address
			// this package composes. Page tabs dedupe within their pane, so
			// opening another job navigates the same tab to the new job id.
			title: () => t("tab.title"),
			guide: [{
				order: GUIDE_ORDER,
				title: () => t("guide.title"),
				description: () => t("guide.description")
			}]
		}),
		"job-panel: sidebar tab type",
	);

	ctx.effect(
		() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
			name: "sidebar.right.pane.tab",
			key: TAB_TYPE_ID,
			locale: NS,
			inject: (sessionId) => ({ sessionId })
		}, JobPanel)),
		"job-panel: sidebar tab body",
	);
}

export { apply, inject };
