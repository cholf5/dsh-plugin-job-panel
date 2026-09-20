/**
 * Tests for the semantic log-line classifier (src/client/log-line.js).
 * Plain node --test — the module has no browser dependencies.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { classifyLine } from "../src/client/log-line.js";

test("error vocabulary colors red", () => {
	const lines = [
		"ERROR: cannot connect",
		"[ERROR] boot failed",
		"error: EACCES",
		"error EACCES permission denied",
		"2024-09-19 12:34:56 ERROR oops",
		"2024-09-19T12:34:56Z ERROR oops",
		"12:34:56.789 ERROR fractional seconds",
		"build failed",
		"build fails",
		"build fail",
		"Unhandled exception: x",
		"FATAL: out of memory",
		"panic: runtime error",
		"aborted: user interrupt",
		"exceptions: TypeError",
		"exceptions thrown during build",
		"everything failed",
		"✖ failed to compile",
		"> error: command exited 1"
	];
	for (const line of lines) {
		assert.equal(classifyLine(line), "jp-log-error", JSON.stringify(line));
	}
});

test("warn vocabulary colors amber", () => {
	const lines = [
		"warning: 3 deprecated apis used",
		"[WARN] disk almost full",
		"warn: something",
		"warnings detected in config"
	];
	for (const line of lines) {
		assert.equal(classifyLine(line), "jp-log-warn", JSON.stringify(line));
	}
});

test("debug/trace/verbose colors dim", () => {
	const lines = [
		"debug: entering loop",
		"[TRACE] done",
		"trace: x=1",
		"verbose output follows"
	];
	for (const line of lines) {
		assert.equal(classifyLine(line), "jp-log-dim", JSON.stringify(line));
	}
});

test("prose that reports ON level words stays plain (the false positives)", () => {
	const lines = [
		"no errors found, all good",
		"the errors are gone",
		"these errors were expected",
		"those errors are fixed",
		"some errors were suppressed",
		"any errors should be reported",
		"without errors the build is green",
		"zero errors detected",
		"0 errors, 0 warnings",
		"the build failed",
		"Task completed with 1 failure"
	];
	for (const line of lines) {
		assert.equal(classifyLine(line), undefined, JSON.stringify(line));
	}
});

test("structured log formats stay plain (deliberate scope)", () => {
	const lines = [
		'level=error msg=boom',
		'{"level":"error","msg":"boom"}',
		"2 exceptions raised"
	];
	for (const line of lines) {
		assert.equal(classifyLine(line), undefined, JSON.stringify(line));
	}
});

test("level words buried deeper than the leading region stay plain", () => {
	const lines = [
		"the build failed to start the daemon",
		"checking whether the deploy failed or not"
	];
	for (const line of lines) {
		assert.equal(classifyLine(line), undefined, JSON.stringify(line));
	}
});

test("error outranks warn when both appear in the leading region", () => {
	// Priority order is error → warn → dim; a warn word at the anchor wins
	// over a deeper error word only when the error pattern cannot anchor.
	assert.equal(classifyLine("error: warning"), "jp-log-error");
	assert.equal(classifyLine("warning: error upstream"), "jp-log-warn");
});

test("empty and whitespace lines stay plain", () => {
	assert.equal(classifyLine(""), undefined);
	assert.equal(classifyLine("   "), undefined);
});
