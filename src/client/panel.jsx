/**
 * dsh-plugin-job-panel — right-sidebar panel body.
 *
 * Registered under the keyed `sidebar.right.pane.tab` seat; the seat injects
 * the framework-bound `useTabInfo` hook and the namespace translator `t` as
 * props, and the slot registration's inject factory contributes `sessionId`.
 *
 * This commit renders the shell: kind chip, live status, ticking duration,
 * start/finish facts, and the command block (the producer label — for bash
 * jobs the command itself — plus the spawn cwd when captured). The output
 * stream view and the stop control arrive in their own commits.
 */

import { useEffect, useMemo, useState } from "react";
import { StateDot } from "@deepseek-ai/dsh-client-ui-primitives";
import { fetchOutput } from "./api.js";

/** Wire status → official dot states (matches dsh-client-ui-jobs semantics). */
const DOT_STATES = {
	running: "ongoing",
	stopping: "warning",
	completed: "done",
	killed: "warning",
	failed: "error"
};

/** True while the registry still holds the job open. */
function isLive(status) {
	return status === "running" || status === "stopping";
}

/**
 * Human status word per wire status.
 * @param {string} status - wire status.
 * @param {(key: string, params?: object) => string} t - namespace translator.
 */
function statusLabel(status, t) {
	const known = ["running", "stopping", "completed", "killed", "failed"];
	return known.includes(status) ? t(`meta.status.${status}`) : status;
}

/**
 * Elapsed time in at most two adjacent units — the official duration shape
 * (seconds → minutes+seconds → hours+minutes).
 * @param {number} elapsedMs - non-negative elapsed milliseconds.
 */
function formatDuration(elapsedMs) {
	const total = Math.max(0, Math.floor(elapsedMs / 1e3));
	const seconds = total % 60;
	const minutes = Math.floor(total / 60) % 60;
	const hours = Math.floor(total / 3600);
	if (hours > 0) return `${hours}h ${minutes}m`;
	if (minutes > 0) return `${minutes}m ${seconds}s`;
	return `${seconds}s`;
}

/** Locale time for started/finished stamps. */
function formatTime(epochMs) {
	if (typeof epochMs !== "number" || !Number.isFinite(epochMs)) return undefined;
	return new Date(epochMs).toLocaleTimeString();
}

/**
 * The panel body for one job.
 * @param {object} props - seat-injected currency plus the inject-factory face.
 * @param {() => { sidebar: unknown, panel: unknown, tab: object }} props.useTabInfo
 * @param {(key: string, params?: object) => string} props.t
 * @param {string | undefined} props.sessionId - the session this surface belongs to.
 * @returns {object} React element.
 */
export function JobPanel({ useTabInfo, t, sessionId }) {
	const { tab } = useTabInfo();
	const params = tab?.navigation?.params;
	const jobId = typeof params?.jobId === "string" && params.jobId.length > 0 ? params.jobId : undefined;

	/** One output response (meta + snapshot); refreshed by the poll loop. */
	const [data, setData] = useState(undefined);
	const [loadFailed, setLoadFailed] = useState(false);
	/** Ticking clock for the live duration. */
	const [now, setNow] = useState(() => Date.now());
	/** Copy feedback latch. */
	const [copied, setCopied] = useState(false);

	const snapshot = data?.snapshot ?? undefined;
	const meta = data?.meta ?? undefined;
	const status = snapshot?.status;
	const live = status !== undefined && isLive(status);

	useEffect(() => {
		setData(undefined);
		setLoadFailed(false);
	}, [jobId]);

	// One-shot load of the job's facts for this shell commit.
	useEffect(() => {
		if (jobId === undefined) return;
		const controller = new AbortController();
		fetchOutput({ jobId, sessionId, stdoutOffset: 0, stderrOffset: 0, signal: controller.signal })
			.then((payload) => {
				setData(payload);
				setLoadFailed(false);
			})
			.catch(() => {
				if (!controller.signal.aborted) setLoadFailed(true);
			});
		return () => controller.abort();
	}, [jobId, sessionId]);

	useEffect(() => {
		if (!live) return;
		const timer = setInterval(() => setNow(Date.now()), 1e3);
		return () => clearInterval(timer);
	}, [live]);

	const elapsed = useMemo(() => {
		if (status === undefined) return undefined;
		if (live) return formatDuration(now - (snapshot?.startedAt ?? now));
		if (typeof snapshot?.finishedAt === "number") return formatDuration(snapshot.finishedAt - (snapshot.startedAt ?? snapshot.finishedAt));
		return undefined;
	}, [status, live, now, snapshot?.startedAt, snapshot?.finishedAt]);

	const command = meta?.label ?? snapshot?.label;
	const cwd = meta?.spawn?.cwd;

	const copyCommand = async () => {
		if (command === undefined) return;
		try {
			await navigator.clipboard.writeText(command);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// clipboard unavailable — silently ignore, the text is selectable
		}
	};

	if (jobId === undefined) {
		return (
			<div className="jp-root">
				<p className="jp-notice">{t("job.missing")}</p>
			</div>
		);
	}

	return (
		<div className="jp-root">
			<div className="jp-header">
				<div className="jp-titleRow">
					{status !== undefined ? <StateDot state={DOT_STATES[status] ?? "done"} className="jp-metaDot" /> : null}
					<span className="jp-kind">{meta?.kind ?? snapshot?.kind ?? t("meta.kind.unknown")}</span>
					<span className="jp-label" title={snapshot?.label ?? command}>{snapshot?.label ?? command ?? jobId}</span>
					{status !== undefined ? <span>{statusLabel(status, t)}</span> : null}
					{elapsed !== undefined ? <span className="jp-duration">{elapsed}</span> : null}
				</div>
				<div className="jp-meta">
					{snapshot?.startedAt !== undefined ? <span>{t("meta.startedAt")} {formatTime(snapshot.startedAt)}</span> : null}
					{snapshot?.finishedAt !== undefined ? <span>{t("meta.finishedAt")} {formatTime(snapshot.finishedAt)}</span> : null}
					{snapshot?.detail !== undefined ? <span title={snapshot.detail}>{snapshot.detail}</span> : null}
				</div>
				{command !== undefined ? (
					<div className="jp-commandRow">
						<pre className="jp-commandBlock">{command}</pre>
						<button type="button" className="jp-copyButton" onClick={copyCommand}>{copied ? t("command.copied") : t("command.copy")}</button>
					</div>
				) : null}
				{cwd !== undefined ? <div className="jp-meta"><span>{cwd}</span></div> : null}
				{loadFailed ? <div className="jp-notice">{t("job.missing")}</div> : null}
			</div>
			<div className="jp-body" />
		</div>
	);
}
