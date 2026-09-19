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
  "meta.fetchFailed": "\u65E0\u6CD5\u8FDE\u63A5\u5BBF\u4E3B\u8DEF\u7531\uFF08{status}\uFF09",
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
  "meta.fetchFailed": "Host route unreachable ({status})",
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

// src/client/enhance-dropdown.js
var POPOVER_LABELS = /* @__PURE__ */ new Set(["\u540E\u53F0\u4EFB\u52A1", "Background jobs"]);
var DATA_ATTRIBUTE = "data-job-panel-id";
function fiberKeyOf(element) {
  for (const key of Object.keys(element)) {
    if (!key.startsWith("__reactFiber$")) continue;
    const fiber = (
      /** @type {any} */
      element[key]
    );
    const fiberKey = fiber?.key;
    if (typeof fiberKey === "string" && fiberKey.length > 0) return fiberKey;
  }
  return void 0;
}
function findPopovers(doc) {
  const found = [];
  for (const list of doc.querySelectorAll("ul[aria-label]")) {
    if (POPOVER_LABELS.has(list.getAttribute("aria-label") ?? "")) found.push(
      /** @type {HTMLUListElement} */
      list
    );
  }
  return found;
}
function createDropdownEnhancement({ openTab }) {
  if (typeof document === "undefined") return () => {
  };
  const stamped = /* @__PURE__ */ new Map();
  const openJobPanel = (event) => {
    const row = event.currentTarget;
    const jobId = row?.getAttribute?.(DATA_ATTRIBUTE);
    if (typeof jobId !== "string" || jobId.length === 0) return;
    try {
      openTab("job-output", { params: { jobId } });
    } catch {
      return;
    }
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  };
  const enhance = (popovers) => {
    for (const list of popovers) {
      for (const row of list.querySelectorAll("li")) {
        if (row.hasAttribute(DATA_ATTRIBUTE)) continue;
        const jobId = fiberKeyOf(row);
        if (jobId === void 0) continue;
        row.setAttribute(DATA_ATTRIBUTE, jobId);
        row.addEventListener("click", openJobPanel);
        stamped.set(row, openJobPanel);
      }
    }
  };
  let scanScheduled = false;
  const scheduleScan = () => {
    if (scanScheduled) return;
    scanScheduled = true;
    requestAnimationFrame(() => {
      scanScheduled = false;
      try {
        enhance(findPopovers(document));
      } catch {
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

// src/client/panel.jsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/api.js
var OUTPUT_PATH = "/api/job-panel/output";
var FULL_PATH = "/api/job-panel/full";
var STOP_PATH = "/api/job-panel/stop";
async function fetchOutput({ jobId, sessionId, stdoutOffset = 0, stderrOffset = 0, signal }) {
  const params = new URLSearchParams({ jobId, stdoutOffset: String(stdoutOffset), stderrOffset: String(stderrOffset) });
  if (sessionId !== void 0) params.set("sessionId", sessionId);
  const response = await fetch(`${OUTPUT_PATH}?${params.toString()}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`job-panel: output request failed with ${response.status}`);
  return response.json();
}
async function fetchFull({ jobId, sessionId, maxBytes, signal }) {
  const params = new URLSearchParams({ jobId });
  if (sessionId !== void 0) params.set("sessionId", sessionId);
  if (maxBytes !== void 0) params.set("maxBytes", String(maxBytes));
  const response = await fetch(`${FULL_PATH}?${params.toString()}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`job-panel: full request failed with ${response.status}`);
  return response.json();
}
async function postStop({ jobId, sessionId, reason, signal }) {
  const response = await fetch(STOP_PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId, sessionId, reason }),
    signal
  });
  const payload = await response.json().catch(() => void 0);
  if (!response.ok) throw new Error(payload?.error ?? `job-panel: stop request failed with ${response.status}`);
  return payload;
}

// src/client/output-buffer.js
var GAP_LINE = { text: "\u2026\u2026", stderr: false };
function createOutputBuffer({ maxLines }) {
  let lines = [];
  let omitted = 0;
  let stdoutOffset = 0;
  let stderrOffset = 0;
  let stdoutLossy = false;
  let stderrLossy = false;
  let stdoutSpillPath;
  let stderrSpillPath;
  let hasGap = false;
  let cap = maxLines;
  function pushLine(text, stderr) {
    if (text.length === 0) return;
    const parts = text.split("\n");
    for (let index = 0; index < parts.length; index += 1) {
      const piece = parts[index];
      const last = index === parts.length - 1;
      if (last && piece.length === 0) break;
      lines.push({ text: piece, stderr });
    }
  }
  function enforceCap() {
    if (lines.length <= cap) return;
    const drop = lines.length - cap;
    lines = lines.slice(drop);
    omitted += drop;
    hasGap = true;
  }
  return {
    /**
     * Append one poll's stream read.
     * @param {'stdout' | 'stderr'} stream - which collected stream.
     * @param {{ text: string, nextOffset: number, lossy: boolean, spillPath?: string } | null} read - server projection.
     * @returns {void}
     */
    append(stream, read) {
      if (read === null || read === void 0) return;
      const stderr = stream === "stderr";
      if (read.lossy) {
        lines = [];
        pushLine(GAP_LINE.text, false);
        hasGap = true;
        if (stderr) {
          stderrOffset = read.nextOffset;
          stderrLossy = true;
          stderrSpillPath = read.spillPath;
        } else {
          stdoutOffset = read.nextOffset;
          stdoutLossy = true;
          stdoutSpillPath = read.spillPath;
        }
        pushLine(read.text, stderr);
        enforceCap();
        return;
      }
      pushLine(read.text, stderr);
      if (stderr) {
        stderrOffset = read.nextOffset;
        if (read.spillPath !== void 0) stderrSpillPath = read.spillPath;
      } else {
        stdoutOffset = read.nextOffset;
        if (read.spillPath !== void 0) stdoutSpillPath = read.spillPath;
      }
      enforceCap();
    },
    /**
     * Replace the whole buffer with pre-built lines (full-history load).
     * The cap lifts to hold the replacement (plus growth headroom), so
     * subsequent poll appends do not re-trim the explicitly loaded view.
     * @param {OutputLine[]} next - lines to show.
     * @param {{ stdout: number, stderr: number }} offsets - resume offsets.
     * @param {number} omittedCount - head lines the view already knows it dropped.
     * @returns {void}
     */
    replace(next, offsets, omittedCount) {
      lines = next;
      omitted = omittedCount;
      stdoutOffset = offsets.stdout;
      stderrOffset = offsets.stderr;
      cap = Math.max(cap, next.length + 512);
    },
    /** @returns {OutputBufferSnapshot} */
    snapshot() {
      return {
        lines: lines.slice(),
        omitted,
        stdoutOffset,
        stderrOffset,
        stdoutLossy,
        stderrLossy,
        stdoutSpillPath,
        stderrSpillPath,
        hasGap
      };
    },
    /** Byte length of a text (for gap math), exposed for the full-history view. */
    byteLength(text) {
      return new TextEncoder().encode(text).length;
    }
  };
}
function textToLines(text, stderr) {
  if (text.length === 0) return [];
  const parts = text.split("\n");
  const lines = [];
  for (let index = 0; index < parts.length; index += 1) {
    const piece = parts[index];
    const last = index === parts.length - 1;
    if (last && piece.length === 0) break;
    lines.push({ text: piece, stderr });
  }
  return lines;
}

// src/client/output-view.jsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function OutputView({ snapshot, t, hasStreams, hasLines }) {
  const scrollRef = (0, import_react.useRef)(null);
  const followRef = (0, import_react.useRef)(true);
  const [atBottom, setAtBottom] = (0, import_react.useState)(true);
  const onScroll = () => {
    const element = scrollRef.current;
    if (element === null) return;
    const bottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 8;
    followRef.current = bottom;
    setAtBottom(bottom);
  };
  (0, import_react.useEffect)(() => {
    const element = scrollRef.current;
    if (element === null || !followRef.current) return;
    element.scrollTop = element.scrollHeight;
  }, [snapshot]);
  const jumpToBottom = () => {
    const element = scrollRef.current;
    if (element === null) return;
    followRef.current = true;
    setAtBottom(true);
    element.scrollTop = element.scrollHeight;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "jp-outputScroll", onScroll, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "jp-outputInner", children: [
      snapshot.omitted > 0 || snapshot.hasGap ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "jp-divider", children: snapshot.omitted > 0 ? t("output.omittedPrefix", { count: snapshot.omitted }) : t("output.full.gap") }) : null,
      hasStreams && !hasLines ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "jp-divider", children: t("output.empty") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: "jp-outputText", children: snapshot.lines.map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: line.stderr ? "jp-stderrText" : void 0, children: `${line.text}
` }, index)) })
    ] }),
    !atBottom ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "jp-floatingFollow", onClick: jumpToBottom, children: t("output.followBottom") }) : null
  ] });
}

// src/client/panel.jsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var MAX_LINES = 2e3;
var POLL_INTERVAL_MS = 500;
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
  const visible = tab?.visible !== false;
  const [data, setData] = (0, import_react2.useState)(void 0);
  const [bufferState, setBufferState] = (0, import_react2.useState)(() => createOutputBuffer({ maxLines: MAX_LINES }).snapshot());
  const bufferRef = (0, import_react2.useRef)(createOutputBuffer({ maxLines: MAX_LINES }));
  const [loadFailed, setLoadFailed] = (0, import_react2.useState)(void 0);
  const [fullState, setFullState] = (0, import_react2.useState)("idle");
  const [spillNoticeLines, setSpillNoticeLines] = (0, import_react2.useState)(0);
  const [stopState, setStopState] = (0, import_react2.useState)("idle");
  const disarmTimerRef = (0, import_react2.useRef)(void 0);
  const [now, setNow] = (0, import_react2.useState)(() => Date.now());
  const [copied, setCopied] = (0, import_react2.useState)(false);
  const snapshot = data?.snapshot ?? void 0;
  const meta = data?.meta ?? void 0;
  const status = snapshot?.status;
  const live = status !== void 0 && isLive(status);
  const tapped = data?.tapped === true;
  (0, import_react2.useEffect)(() => {
    bufferRef.current = createOutputBuffer({ maxLines: MAX_LINES });
    setData(void 0);
    setBufferState(bufferRef.current.snapshot());
    setLoadFailed(void 0);
    setFullState("idle");
    setStopState("idle");
    if (disarmTimerRef.current !== void 0) clearTimeout(disarmTimerRef.current);
    disarmTimerRef.current = void 0;
  }, [jobId]);
  (0, import_react2.useEffect)(() => () => {
    if (disarmTimerRef.current !== void 0) clearTimeout(disarmTimerRef.current);
  }, []);
  (0, import_react2.useEffect)(() => {
    if (jobId === void 0 || !visible) return;
    let cancelled = false;
    let settled = false;
    let flushPending = false;
    let inFlight = false;
    const controller = new AbortController();
    const buffer = bufferRef.current;
    const tick = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const offsets = buffer.snapshot();
        const payload = await fetchOutput({
          jobId,
          sessionId,
          stdoutOffset: offsets.stdoutOffset,
          stderrOffset: offsets.stderrOffset,
          signal: controller.signal
        });
        if (cancelled) return;
        buffer.append("stdout", payload.stdout);
        buffer.append("stderr", payload.stderr);
        setData(payload);
        setBufferState(buffer.snapshot());
        setLoadFailed(void 0);
        const nextStatus = payload.snapshot?.status;
        if (nextStatus !== void 0 && !isLive(nextStatus)) {
          if (flushPending) settled = true;
          else flushPending = true;
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const match = /with (\d+)$/.exec(String(error?.message ?? ""));
        setLoadFailed(match !== null ? Number(match[1]) : "network");
      } finally {
        inFlight = false;
      }
    };
    const timer = setInterval(() => {
      if (settled) clearInterval(timer);
      else void tick();
    }, POLL_INTERVAL_MS);
    void tick();
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [jobId, sessionId, visible]);
  (0, import_react2.useEffect)(() => {
    if (!live) return;
    const timer = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, [live]);
  const elapsed = (0, import_react2.useMemo)(() => {
    if (status === void 0) return void 0;
    if (live) return formatDuration(now - (snapshot?.startedAt ?? now));
    if (typeof snapshot?.finishedAt === "number") return formatDuration(snapshot.finishedAt - (snapshot.startedAt ?? snapshot.finishedAt));
    return void 0;
  }, [status, live, now, snapshot?.startedAt, snapshot?.finishedAt]);
  const command = meta?.label ?? snapshot?.label;
  const cwd = meta?.spawn?.cwd;
  const hasStreams = tapped && (data?.stdout !== null || data?.stderr !== null);
  const hasLines = bufferState.lines.length > 0;
  const copyCommand = async () => {
    if (command === void 0) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };
  const loadFullHistory = async () => {
    if (fullState === "loading" || jobId === void 0) return;
    setFullState("loading");
    try {
      const payload = await fetchFull({ jobId, sessionId });
      const buffer = bufferRef.current;
      const lines = [];
      let omittedCount = 0;
      let spillNoticeCount = 0;
      const offsets = { stdout: 0, stderr: 0 };
      for (const stream of ["stdout", "stderr"]) {
        const project = payload?.[stream];
        if (project === null || project === void 0) continue;
        const stderr = stream === "stderr";
        const tail = project.tail;
        if (tail === null || tail === void 0) continue;
        const spill = project.spill;
        if (spill !== null && spill !== void 0) {
          const spillLines = textToLines(spill.text, stderr);
          lines.push(...spillLines);
          if (spill.truncated) spillNoticeCount += spillLines.length;
          const covered = spill.size + buffer.byteLength(tail.text);
          if (covered < tail.nextOffset - 1024) lines.push({ text: t("output.full.gap"), stderr: false });
        }
        lines.push(...textToLines(tail.text, stderr));
        offsets[stream] = tail.nextOffset;
      }
      buffer.replace(lines, offsets, omittedCount);
      setBufferState(buffer.snapshot());
      setSpillNoticeLines(spillNoticeCount);
      setFullState(spillNoticeCount > 0 ? "truncated" : "done");
    } catch {
      setFullState("failed");
    }
  };
  const onStopClick = async () => {
    if (!live || jobId === void 0) return;
    if (stopState !== "armed") {
      setStopState("armed");
      if (disarmTimerRef.current !== void 0) clearTimeout(disarmTimerRef.current);
      disarmTimerRef.current = setTimeout(() => {
        disarmTimerRef.current = void 0;
        setStopState((current) => current === "armed" ? "idle" : current);
      }, 3e3);
      return;
    }
    if (disarmTimerRef.current !== void 0) {
      clearTimeout(disarmTimerRef.current);
      disarmTimerRef.current = void 0;
    }
    setStopState("requested");
    try {
      const result = await postStop({ jobId, sessionId });
      setStopState(result?.result === "already-finished" ? "finished" : "requested");
    } catch {
      setStopState("failed");
      setTimeout(() => setStopState((current) => current === "failed" ? "idle" : current), 3e3);
    }
  };
  const stopLabel = stopState === "armed" ? t("stop.confirm") : stopState === "requested" ? t("stop.requested") : stopState === "finished" ? t("stop.alreadyFinished") : stopState === "failed" ? t("stop.failed") : t("stop.idle");
  if (jobId === void 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "jp-root", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "jp-notice", children: t("job.missing") }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "jp-root", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "jp-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "jp-titleRow", children: [
        status !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.StateDot, { state: DOT_STATES[status] ?? "done", className: "jp-metaDot" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "jp-kind", children: meta?.kind ?? snapshot?.kind ?? t("meta.kind.unknown") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "jp-label", title: snapshot?.label ?? command, children: snapshot?.label ?? command ?? jobId }),
        status !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: statusLabel(status, t) }) : null,
        elapsed !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "jp-duration", children: elapsed }) : null,
        live ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: `jp-stopButton${stopState === "armed" ? " jp-stopArmed" : ""}`,
            onClick: onStopClick,
            disabled: stopState === "requested",
            children: stopLabel
          }
        ) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "jp-meta", children: [
        snapshot?.startedAt !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
          t("meta.startedAt"),
          " ",
          formatTime(snapshot.startedAt)
        ] }) : null,
        snapshot?.finishedAt !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
          t("meta.finishedAt"),
          " ",
          formatTime(snapshot.finishedAt)
        ] }) : null,
        snapshot?.detail !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { title: snapshot.detail, children: snapshot.detail }) : null
      ] }),
      command !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "jp-commandRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { className: "jp-commandBlock", children: command }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "jp-copyButton", onClick: copyCommand, children: copied ? t("command.copied") : t("command.copy") })
      ] }) : null,
      cwd !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "jp-meta", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: cwd }) }) : null,
      loadFailed !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "jp-notice", children: t("meta.fetchFailed", { status: String(loadFailed) }) }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "jp-body", children: [
      !tapped ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "jp-notice", children: t("meta.untapped.note") }) : null,
      tapped && !hasStreams ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "jp-notice", children: t("meta.noStream") }) : null,
      tapped && hasStreams ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "jp-outputToolbar", children: [
          fullState === "truncated" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("output.full.spillTruncated", { count: spillNoticeLines }) }) : null,
          fullState === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("output.full.failed") }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { flex: 1 } }),
          (fullState === "idle" || fullState === "failed") && (bufferState.stdoutSpillPath !== void 0 || bufferState.stderrSpillPath !== void 0) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "jp-ghostButton", onClick: loadFullHistory, disabled: fullState === "loading", children: fullState === "loading" ? t("output.full.loading") : t("output.full.load") }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(OutputView, { snapshot: bufferState, t, hasStreams, hasLines })
      ] }) : null
    ] })
  ] });
}

// src/client/styles.js
var DROPDOWN_CSS = `
ul li[data-job-panel-id] {
  cursor: pointer;
}
ul li[data-job-panel-id]:hover {
  background: var(--dsw-alias-fill-l2);
}
ul li[data-job-panel-id]::after {
  content: '\\203A';
  flex: none;
  margin-left: auto;
  padding-left: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 14px;
}
`;
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
  margin-left: auto;
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
    () => ensureStyles(`${PANEL_CSS}
${DROPDOWN_CSS}`),
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
  ctx.effect(
    () => createDropdownEnhancement({
      openTab: (kind, options) => {
        const sidebarRight = (
          /** @type {any} */
          ctx.sidebarRight
        );
        if (sidebarRight === void 0 || sidebarRight === null) return;
        sidebarRight.openTab(kind, options);
      }
    }),
    "job-panel: popover row enhancement"
  );
}
return module.exports;
}
});
