window.__ModuleLoader__.load({ id: "dsh-plugin-job-panel", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  JOB_TAB_KIND: () => JOB_TAB_KIND,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/locale.js
var NS = "jobPanel";
var zh = {
  "tab.title": "\u4EFB\u52A1\u8F93\u51FA",
  "guide.title": "\u4EFB\u52A1\u8F93\u51FA",
  "guide.description": "\u67E5\u770B\u540E\u53F0\u4EFB\u52A1\u7684\u547D\u4EE4\u4E0E\u7EC8\u7AEF\u8F93\u51FA",
  "meta.kind.unknown": "\u4EFB\u52A1",
  "meta.status.running": "\u8FD0\u884C\u4E2D",
  "meta.status.stopping": "\u6B63\u5728\u505C\u6B62",
  "meta.status.completed": "\u5DF2\u5B8C\u6210",
  "meta.status.killed": "\u5DF2\u53D6\u6D88",
  "meta.status.failed": "\u5DF2\u5931\u8D25",
  "meta.startedAt": "\u5F00\u59CB\u4E8E",
  "meta.finishedAt": "\u7ED3\u675F\u4E8E",
  "meta.untapped.note": "\u672C\u4EFB\u52A1\u5728\u63D2\u4EF6\u52A0\u8F7D\u524D\u542F\u52A8\uFF0C\u65E0\u6CD5\u63D0\u4F9B\u8F93\u51FA\u6D41",
  "meta.noStream": "\u8BE5\u4EFB\u52A1\u7C7B\u578B\u6682\u65E0\u8F93\u51FA\u6D41",
  "command.copy": "\u590D\u5236\u547D\u4EE4",
  "command.copied": "\u5DF2\u590D\u5236",
  "output.empty": "\u6682\u65E0\u8F93\u51FA",
  "output.omittedPrefix": "\u5DF2\u7701\u7565\u524D {count} \u884C",
  "output.stderr.mark": "stderr",
  "output.followBottom": "\u56DE\u5230\u5E95\u90E8",
  "output.full.load": "\u52A0\u8F7D\u5B8C\u6574\u5386\u53F2",
  "output.full.loading": "\u52A0\u8F7D\u4E2D\u2026",
  "output.full.failed": "\u52A0\u8F7D\u5B8C\u6574\u5386\u53F2\u5931\u8D25",
  "output.full.spillTruncated": "\u5B8C\u6574\u5386\u53F2\u8D85\u8FC7\u4E0A\u9650\uFF0C\u4EC5\u663E\u793A\u6700\u65E9 {count} \u884C",
  "output.full.gap": "\u2026\u2026 \u4E2D\u95F4\u8F93\u51FA\u8FC7\u957F\uFF0C\u5DF2\u7701\u7565 \u2026\u2026",
  "stop.idle": "\u505C\u6B62",
  "stop.confirm": "\u786E\u8BA4\u505C\u6B62\uFF1F",
  "stop.requested": "\u6B63\u5728\u505C\u6B62\u2026",
  "stop.alreadyFinished": "\u4EFB\u52A1\u5DF2\u7ED3\u675F",
  "stop.failed": "\u505C\u6B62\u5931\u8D25",
  "job.missing": "\u4EFB\u52A1\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u6E05\u7406"
};
var en = {
  "tab.title": "Job output",
  "guide.title": "Job output",
  "guide.description": "Inspect a background job's command and terminal output",
  "meta.kind.unknown": "job",
  "meta.status.running": "running",
  "meta.status.stopping": "stopping",
  "meta.status.completed": "completed",
  "meta.status.killed": "cancelled",
  "meta.status.failed": "failed",
  "meta.startedAt": "started",
  "meta.finishedAt": "finished",
  "meta.untapped.note": "This job started before the plugin loaded; no output stream is available",
  "meta.noStream": "No output stream for this job kind",
  "command.copy": "Copy command",
  "command.copied": "Copied",
  "output.empty": "No output yet",
  "output.omittedPrefix": "{count} earlier lines omitted",
  "output.stderr.mark": "stderr",
  "output.followBottom": "Jump to bottom",
  "output.full.load": "Load full history",
  "output.full.loading": "Loading\u2026",
  "output.full.failed": "Failed to load full history",
  "output.full.spillTruncated": "Full history exceeds the cap; showing the earliest {count} lines",
  "output.full.gap": "\u2026\u2026 long middle output omitted \u2026\u2026",
  "stop.idle": "Stop",
  "stop.confirm": "Confirm stop?",
  "stop.requested": "Stopping\u2026",
  "stop.alreadyFinished": "Job already finished",
  "stop.failed": "Stop failed",
  "job.missing": "Job is gone or was cleaned up"
};

// src/client/panel.jsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/api.js
var OUTPUT_PATH = "/api/job-panel/output";
async function fetchOutput({ jobId, sessionId, stdoutOffset = 0, stderrOffset = 0, signal }) {
  const params = new URLSearchParams({ jobId, stdoutOffset: String(stdoutOffset), stderrOffset: String(stderrOffset) });
  if (sessionId !== void 0) params.set("sessionId", sessionId);
  const response = await fetch(`${OUTPUT_PATH}?${params.toString()}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`job-panel: output request failed with ${response.status}`);
  return response.json();
}

// src/client/panel.jsx
var import_jsx_runtime = require("react/jsx-runtime");
var DOT_STATES = {
  running: "ongoing",
  stopping: "warning",
  completed: "done",
  killed: "warning",
  failed: "error"
};
function isLive(status) {
  return status === "running" || status === "stopping";
}
function statusLabel(status, t) {
  const known = ["running", "stopping", "completed", "killed", "failed"];
  return known.includes(status) ? t(`meta.status.${status}`) : status;
}
function formatDuration(elapsedMs) {
  const total = Math.max(0, Math.floor(elapsedMs / 1e3));
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
function formatTime(epochMs) {
  if (typeof epochMs !== "number" || !Number.isFinite(epochMs)) return void 0;
  return new Date(epochMs).toLocaleTimeString();
}
function JobPanel({ useTabInfo, t, sessionId }) {
  const { tab } = useTabInfo();
  const params = tab?.navigation?.params;
  const jobId = typeof params?.jobId === "string" && params.jobId.length > 0 ? params.jobId : void 0;
  const [data, setData] = (0, import_react.useState)(void 0);
  const [loadFailed, setLoadFailed] = (0, import_react.useState)(false);
  const [now, setNow] = (0, import_react.useState)(() => Date.now());
  const [copied, setCopied] = (0, import_react.useState)(false);
  const snapshot = data?.snapshot ?? void 0;
  const meta = data?.meta ?? void 0;
  const status = snapshot?.status;
  const live = status !== void 0 && isLive(status);
  (0, import_react.useEffect)(() => {
    setData(void 0);
    setLoadFailed(false);
  }, [jobId]);
  (0, import_react.useEffect)(() => {
    if (jobId === void 0) return;
    const controller = new AbortController();
    fetchOutput({ jobId, sessionId, stdoutOffset: 0, stderrOffset: 0, signal: controller.signal }).then((payload) => {
      setData(payload);
      setLoadFailed(false);
    }).catch(() => {
      if (!controller.signal.aborted) setLoadFailed(true);
    });
    return () => controller.abort();
  }, [jobId, sessionId]);
  (0, import_react.useEffect)(() => {
    if (!live) return;
    const timer = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, [live]);
  const elapsed = (0, import_react.useMemo)(() => {
    if (status === void 0) return void 0;
    if (live) return formatDuration(now - (snapshot?.startedAt ?? now));
    if (typeof snapshot?.finishedAt === "number") return formatDuration(snapshot.finishedAt - (snapshot.startedAt ?? snapshot.finishedAt));
    return void 0;
  }, [status, live, now, snapshot?.startedAt, snapshot?.finishedAt]);
  const command = meta?.label ?? snapshot?.label;
  const cwd = meta?.spawn?.cwd;
  const copyCommand = async () => {
    if (command === void 0) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };
  if (jobId === void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "jp-root", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "jp-notice", children: t("job.missing") }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "jp-root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "jp-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "jp-titleRow", children: [
        status !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.StateDot, { state: DOT_STATES[status] ?? "done", className: "jp-metaDot" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "jp-kind", children: meta?.kind ?? snapshot?.kind ?? t("meta.kind.unknown") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "jp-label", title: snapshot?.label ?? command, children: snapshot?.label ?? command ?? jobId }),
        status !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: statusLabel(status, t) }) : null,
        elapsed !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "jp-duration", children: elapsed }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "jp-meta", children: [
        snapshot?.startedAt !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          t("meta.startedAt"),
          " ",
          formatTime(snapshot.startedAt)
        ] }) : null,
        snapshot?.finishedAt !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          t("meta.finishedAt"),
          " ",
          formatTime(snapshot.finishedAt)
        ] }) : null,
        snapshot?.detail !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: snapshot.detail, children: snapshot.detail }) : null
      ] }),
      command !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "jp-commandRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: "jp-commandBlock", children: command }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "jp-copyButton", onClick: copyCommand, children: copied ? t("command.copied") : t("command.copy") })
      ] }) : null,
      cwd !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "jp-meta", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cwd }) }) : null,
      loadFailed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "jp-notice", children: t("job.missing") }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "jp-body" })
  ] });
}

// src/client/styles.js
var STYLE_TAG_ID = "dsh-plugin-job-panel/styles";
var PANEL_CSS = `
.jp-root {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  font-size: 13px;
  line-height: 18px;
  color: var(--dsw-alias-label-primary);
}
.jp-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.jp-titleRow {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.jp-kind {
  flex: none;
  background: var(--dsw-alias-fill-l2);
  color: var(--dsw-alias-label-secondary);
  border-radius: 5px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 18px;
}
.jp-label {
  min-width: 0;
  font-family: var(--dsw-font-mono);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  flex: 1;
}
.jp-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.jp-metaDot { flex: none; }
.jp-commandBlock {
  margin: 0;
  padding: 8px 10px;
  background: var(--dsw-alias-fill-l1);
  border-radius: 8px;
  font-family: var(--dsw-font-mono);
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-all;
}
.jp-commandRow {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.jp-commandRow > .jp-commandBlock { flex: 1; }
.jp-copyButton {
  flex: none;
  border: 0;
  background: 0 0;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  border-radius: 6px;
  padding: 4px 6px;
  font-size: 11px;
  line-height: 18px;
}
.jp-copyButton:hover { color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-fill-l2); }
.jp-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.jp-notice {
  padding: 10px 14px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.jp-outputScroll {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--dsw-alias-fill-l1);
  margin: 0 14px 14px;
  border-radius: 8px;
}
.jp-outputInner { padding: 8px 10px; }
.jp-outputText {
  margin: 0;
  font-family: var(--dsw-font-mono);
  font-size: 12px;
  line-height: 17px;
  white-space: pre-wrap;
  word-break: break-all;
}
.jp-stderrText {
  color: var(--dsw-alias-label-secondary);
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);
}
.jp-divider {
  margin: 4px 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  user-select: none;
}
.jp-outputToolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.jp-ghostButton {
  border: 0;
  background: var(--dsw-alias-fill-l2);
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 11px;
  line-height: 18px;
}
.jp-ghostButton:hover { background: var(--dsw-alias-fill-l3, var(--dsw-alias-fill-l2)); color: var(--dsw-alias-label-primary); }
.jp-ghostButton:disabled { opacity: 0.5; cursor: default; }
.jp-stopButton {
  flex: none;
  border: 0;
  cursor: pointer;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  line-height: 18px;
  background: var(--dsw-alias-fill-l2);
  color: var(--dsw-alias-label-primary);
}
.jp-stopButton:hover { background: var(--dsw-alias-fill-l3, var(--dsw-alias-fill-l2)); }
.jp-stopButton.jp-stopArmed {
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-specific-menu, #fff);
}
.jp-stopButton:disabled { opacity: 0.5; cursor: default; }
.jp-floatingFollow {
  position: absolute;
  right: 12px;
  bottom: 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-specific-menu);
  color: var(--dsw-alias-label-secondary);
  border-radius: 999px;
  padding: 3px 12px;
  font-size: 11px;
  cursor: pointer;
  box-shadow: var(--dsw-elevation-prominent);
}
.jp-floatingFollow:hover { color: var(--dsw-alias-label-primary); }
.jp-duration { font-variant-numeric: tabular-nums; }
`;
function ensureStyles(css) {
  if (typeof document === "undefined") return () => {
  };
  const existing = document.querySelector(`style[data-plugin-css="${STYLE_TAG_ID}"]`);
  if (existing !== null) return () => {
  };
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-plugin-job-panel";
  tag.dataset.pluginCss = STYLE_TAG_ID;
  tag.textContent = css;
  document.head.appendChild(tag);
  return () => tag.remove();
}

// src/client/index.jsx
var TAB_TYPE_ID = "dsh-plugin-job-panel";
var JOB_TAB_KIND = "job-output";
var GUIDE_ORDER = 90;
var inject = ["slots", "locale", "sidebarRight", "sidebarRightTabs"];
function apply(ctx) {
  ctx.effect(
    () => ensureStyles(PANEL_CSS),
    "job-panel: styles"
  );
  ctx.effect(
    () => ctx.locale.register(NS, { zh, en }),
    "job-panel: dictionaries"
  );
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
    "job-panel: sidebar tab type"
  );
  ctx.effect(
    () => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
      name: "sidebar.right.pane.tab",
      key: TAB_TYPE_ID,
      locale: NS,
      inject: (sessionId) => ({ sessionId })
    }, JobPanel)),
    "job-panel: sidebar tab body"
  );
}
return module.exports;
}
});
