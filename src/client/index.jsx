/**
 * dsh-plugin-job-panel — client half entry.
 *
 * Registers the plugin's dictionaries under the `jobPanel` namespace. Later
 * additions (tab type + panel body, popover-row enhancement) build on this
 * apply body; every registration lives inside its own `ctx.effect` so a hot
 * reload unregisters exactly what this plugin contributed.
 *
 * Injected client services (client cordis): slots, locale, sidebarRight,
 * sidebarRightTabs — resolved before apply runs via `exports.inject` below;
 * the module-level providers arrive through the package rows declared in
 * `dsh.client.inject` in package.json.
 */

import { NS, en, zh } from "./locale.js";

/**
 * Required client services: the slot registry and the locale service.
 */
const inject = ["slots", "locale"];

/**
 * Client plugin body.
 * @param {object} ctx - client root context carrying the locale service.
 */
function apply(ctx) {
	ctx.effect(
		() => ctx.locale.register(NS, { zh, en }),
		"job-panel: dictionaries",
	);
}

export { apply, inject };
