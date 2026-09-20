/**
 * Client-half bundle smoke test (the node --test pattern from the dsh plugin
 * field notes): run lib/client.js in a vm with a stubbed
 * window.__ModuleLoader__ and platform-module stubs, then execute the
 * factory — catching registration-shape and missing-external errors without
 * a browser. The full factory body runs, so a require("…") that is neither
 * a platform module nor listed in dsh.client.inject fails loudly here.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));

/**
 * A require stub for the bundle's externals (react, react/jsx-runtime and
 * the @deepseek-ai client modules). Module top level binds values and calls
 * component factories (forwardRef(…) etc.) but never renders, so every
 * property access may return another inert callable.
 */
function stubModule() {
	return new Proxy(function stub() {}, {
		get(target, prop) {
			if (prop === "then") return undefined;            // never a thenable
			if (prop === "__esModule") return false;
			if (prop === Symbol.toPrimitive) return () => "stub";
			return stubModule();
		}
	});
}

test("the bundle registers under the package id with a callable apply", () => {
	const registered = [];
	const sandbox = {
		window: {
			__ModuleLoader__: {
				load(definition) {
					registered.push(definition);
				}
			}
		},
		// xterm's module scope probes the browser environment unconditionally
		// (clipboard support, touch, platform strings, …); inert stubs keep
		// the vm honest about what the factory needs without simulating a
		// browser. The timer/encoding globals exist in every real target
		// (browser and Node) but not inside a bare vm context.
		document: stubModule(),
		navigator: { userAgent: "smoke-test", platform: "smoke-platform", language: "en", maxTouchPoints: 0, clipboard: {} },
		setTimeout,
		clearTimeout,
		queueMicrotask,
		TextEncoder,
		TextDecoder,
		URL,
		require: () => stubModule(),
		console: { log() {}, warn() {}, error() {} }
	};
	vm.createContext(sandbox);
	vm.runInContext(readFileSync(join(here, "..", "lib", "client.js"), "utf8"), sandbox, {
		filename: "lib/client.js"
	});

	assert.equal(registered.length, 1, "exactly one ModuleLoader.load call");
	const bundle = registered[0];
	assert.equal(bundle.id, pkg.name, "bundle id must equal the package name");

	const mod = bundle.factory(sandbox.require);
	assert.equal(typeof mod.apply, "function", "client half exports apply");
	assert.ok(Array.isArray(mod.inject), "client half declares its inject list");
});
