/**
 * dsh-plugin-job-panel — client bundle builder.
 *
 * Produces `lib/client.js` in the exact shape the dsh browser module system
 * expects: the whole file is one `window.__ModuleLoader__.load({ id, factory })`
 * call whose factory receives `require` and returns `module.exports`. esbuild
 * bundles `src/client/index.jsx` (ESM + JSX) as CommonJS with the browser's
 * platform modules kept external; the banner/footer wrap provides the
 * `module`/`exports` bindings the CJS output writes to.
 *
 * Externals: everything listed in `dsh.client.inject` in package.json resolves
 * through the loader's module table (package name → client half), plus the
 * platform seed modules (react, react/jsx-runtime, ...). Nothing may be
 * bundled that is not resolvable there — the runtime throws "missed the
 * module table" for unknown module requests.
 *
 * Run: npm run build   (esbuild is a devDependency; lib/client.js is committed
 * so a `link:`-installed profile picks changes up without an install step).
 */

import { build } from "esbuild";
import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
const bundleId = pkg.name;

/** Platform seed modules that must stay external (resolved by the loader). */
const platformExternals = ["react", "react/jsx-runtime", "react-dom", "react-dom/client"];

/** Package halves the manifest declares in dsh.client.inject — same set here. */
const injectExternals = pkg.dsh.client.inject.filter((entry) => entry.startsWith("@deepseek-ai/"));

await build({
	entryPoints: ["src/client/index.jsx"],
	bundle: true,
	format: "cjs",
	platform: "browser",
	target: "es2022",
	jsx: "automatic",
	// Bundled CSS (the embedded terminal's stylesheet) is inlined as a text
	// module and injected through the plugin's own style tag at runtime.
	loader: { ".css": "text" },
	outfile: "lib/client.js",
	banner: {
		js: [
			`window.__ModuleLoader__.load({ id: ${JSON.stringify(bundleId)}, factory: (require) => {`,
			"var module = { exports: {} };",
			"var exports = module.exports;"
		].join("\n")
	},
	footer: {
		js: ["return module.exports;", "}\n});"].join("\n")
	},
	external: [...platformExternals, ...injectExternals],
	logLevel: "info"
});
