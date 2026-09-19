/**
 * dsh-plugin-job-panel — client dictionaries.
 *
 * Follows the official client packages' pattern (see dsh-client-ui-jobs):
 * the Simplified Chinese dictionary is the key-set source of truth and the
 * English dictionary is key-identical. Registered under the `jobPanel`
 * namespace; the slot registration passes `locale: NS` so seat-rendered
 * components receive `t` for this namespace.
 */

/** Namespace used for every string this plugin renders. */
export const NS = "jobPanel";

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
	"tab.title": "任务输出",
	"guide.title": "任务输出",
	"guide.description": "查看后台任务的命令与终端输出",
	"meta.kind.unknown": "任务",
	"meta.status.running": "运行中",
	"meta.status.stopping": "正在停止",
	"meta.status.completed": "已完成",
	"meta.status.killed": "已取消",
	"meta.status.failed": "已失败",
	"meta.startedAt": "开始于",
	"meta.finishedAt": "结束于",
	"meta.untapped.note": "本任务在插件加载前启动，无法提供输出流",
	"meta.fetchFailed": "无法连接宿主路由（{status}）",
	"meta.noStream": "该任务类型暂无输出流",
	"command.copy": "复制命令",
	"command.copied": "已复制",
	"output.empty": "暂无输出",
	"output.loading": "正在获取任务信息…",
	"output.omittedPrefix": "已省略前 {count} 行",
	"output.stderr.mark": "stderr",
	"output.followBottom": "回到底部",
	"output.full.load": "加载完整历史",
	"output.full.loading": "加载中…",
	"output.full.failed": "加载完整历史失败",
	"output.full.spillTruncated": "完整历史超过上限，仅显示最早 {count} 行",
	"output.full.gap": "…… 中间输出过长，已省略 ……",
	"stop.idle": "停止",
	"stop.confirm": "确认停止？",
	"stop.requested": "正在停止…",
	"stop.alreadyFinished": "任务已结束",
	"stop.failed": "停止失败",
	"job.missing": "任务不存在或已被清理"
};

/** English dictionary, key-identical to the Chinese source of truth. */
export const en = {
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
	"output.loading": "Fetching job info…",
	"output.omittedPrefix": "{count} earlier lines omitted",
	"output.stderr.mark": "stderr",
	"output.followBottom": "Jump to bottom",
	"output.full.load": "Load full history",
	"output.full.loading": "Loading…",
	"output.full.failed": "Failed to load full history",
	"output.full.spillTruncated": "Full history exceeds the cap; showing the earliest {count} lines",
	"output.full.gap": "…… long middle output omitted ……",
	"stop.idle": "Stop",
	"stop.confirm": "Confirm stop?",
	"stop.requested": "Stopping…",
	"stop.alreadyFinished": "Job already finished",
	"stop.failed": "Stop failed",
	"job.missing": "Job is gone or was cleaned up"
};
