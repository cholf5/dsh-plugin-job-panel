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

// src/client/index.jsx
var inject = ["slots", "locale"];
function apply(ctx) {
  ctx.effect(
    () => ctx.locale.register(NS, { zh, en }),
    "job-panel: dictionaries"
  );
}
return module.exports;
}
});
