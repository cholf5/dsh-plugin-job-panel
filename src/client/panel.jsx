/**
 * dsh-plugin-job-panel — right-sidebar panel body.
 *
 * Registered under the keyed `sidebar.right.pane.tab` seat; the seat injects
 * the framework-bound `useTabInfo` hook and the namespace translator `t` as
 * props, and the slot registration's inject factory contributes `sessionId`.
 *
 * Data flow: while the tab is visible the panel polls the host's output route
 * every 500ms with the buffer's own byte offsets (cursor-free reads — the
 * model's job registry read cursor is never touched). Each poll appends the
 * stdout/stderr deltas into a bounded iterm2-style buffer and refreshes the
 * registry snapshot that drives the header. Polling pauses while the tab is
 * hidden and stops one flush cycle after the job settles.
 *
 * The stop control arrives in its own commit; this commit owns the output
 * stream view.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { StateDot } from "@deepseek-ai/dsh-client-ui-primitives";
import { fetchFull, fetchOutput, postStop } from "./api.js";
import { createOutputBuffer, textToLines } from "./output-buffer.js";
import { OutputView } from "./output-view.jsx";

/** DOM scrollback cap: at most this many lines stay rendered (iterm2-style). */
const MAX_LINES = 2000;

/** Poll cadence while the tab is visible and the job is live. */
const POLL_INTERVAL_MS = 500;

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
	const visible = tab?.visible !== false;

	/** Latest output response (meta + snapshot). */
	const [data, setData] = useState(undefined);
	/** Latest output buffer snapshot (lines, offsets, lossy/spill facts). */
	const [bufferState, setBufferState] = useState(() => createOutputBuffer({ maxLines: MAX_LINES }).snapshot());
	/**
	 * The live buffer, kept outside the poll effect so hiding the panel (or a
	 * transient unmount) does not lose the accumulated scrollback; recreated
	 * only when the tab navigates to another job.
	 */
	const bufferRef = useRef(createOutputBuffer({ maxLines: MAX_LINES }));
	/**
	 * Last poll failure: undefined while healthy, otherwise the failing status
	 * code (or the string "network") — surfaced in the notice so a 404 (host
	 * half absent) is distinguishable from a 5xx (route-internal error).
	 */
	const [loadFailed, setLoadFailed] = useState(undefined);
	/** Full-history load lifecycle: idle → loading → done/failed/truncated. */
	const [fullState, setFullState] = useState("idle");
	/** Earliest-line count shown when the spill head itself exceeded the cap. */
	const [spillNoticeLines, setSpillNoticeLines] = useState(0);
	/**
	 * Stop control lifecycle: idle → armed (second click confirms) → requested
	 * (kill accepted, waiting for the registry to settle) → finished/failed.
	 */
	const [stopState, setStopState] = useState("idle");
	const disarmTimerRef = useRef(undefined);
	/** Ticking clock for the live duration. */
	const [now, setNow] = useState(() => Date.now());
	/** Copy feedback latch. */
	const [copied, setCopied] = useState(false);

	const snapshot = data?.snapshot ?? undefined;
	const meta = data?.meta ?? undefined;
	const status = snapshot?.status;
	const live = status !== undefined && isLive(status);
	const tapped = data?.tapped === true;

	// Reset everything when the tab navigates to another job.
	useEffect(() => {
		bufferRef.current = createOutputBuffer({ maxLines: MAX_LINES });
		setData(undefined);
		setBufferState(bufferRef.current.snapshot());
		setLoadFailed(undefined);
		setFullState("idle");
		setStopState("idle");
		if (disarmTimerRef.current !== undefined) clearTimeout(disarmTimerRef.current);
		disarmTimerRef.current = undefined;
	}, [jobId]);

	// Clear the armed-stop timer on unmount.
	useEffect(() => () => {
		if (disarmTimerRef.current !== undefined) clearTimeout(disarmTimerRef.current);
	}, []);

	// The poll loop: offsets belong to this component's buffer (kept across
	// hide/show); aborts on unmount, job switch, or hide. One extra flush
	// cycle runs after the job settles so the final delta is not missed.
	useEffect(() => {
		if (jobId === undefined || !visible) return;
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
				setLoadFailed(undefined);
				const nextStatus = payload.snapshot?.status;
				if (nextStatus !== undefined && !isLive(nextStatus)) {
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
	const hasStreams = tapped && (data?.stdout !== null || data?.stderr !== null);
	const hasLines = bufferState.lines.length > 0;

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

	/**
	 * Load the spill-backed full history and splice it in front of the live
	 * tail. Per stream the server returns the spill head (capped) plus the
	 * whole retained tail with its byte facts; the gap between head and tail
	 * is detected from those byte counts and rendered as a divider. Polling
	 * resumes from the tail's offsets, so nothing after this point is lost.
	 */
	const loadFullHistory = async () => {
		if (fullState === "loading" || jobId === undefined) return;
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
				if (project === null || project === undefined) continue;
				const stderr = stream === "stderr";
				const tail = project.tail;
				if (tail === null || tail === undefined) continue;
				const spill = project.spill;
				if (spill !== null && spill !== undefined) {
					const spillLines = textToLines(spill.text, stderr);
					lines.push(...spillLines);
					if (spill.truncated) spillNoticeCount += spillLines.length;
					// Head covered [0, spill.size); tail covers the retained tail.
					// A gap exists when the two byte ranges do not meet.
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

	/**
	 * Stop control: first click arms the button for 3 seconds, the second
	 * click confirms and POSTs the stop. The host resolves the owner session
	 * it recorded at start time (the browser sessionId is only a fallback for
	 * jobs this plugin did not observe). After an accepted request the status
	 * flips through the poll loop; the registry suppresses the model's
	 * completion notice for human kills — an accepted official seam gap.
	 */
	const onStopClick = async () => {
		if (!live || jobId === undefined) return;
		if (stopState !== "armed") {
			setStopState("armed");
			if (disarmTimerRef.current !== undefined) clearTimeout(disarmTimerRef.current);
			disarmTimerRef.current = setTimeout(() => {
				disarmTimerRef.current = undefined;
				setStopState((current) => (current === "armed" ? "idle" : current));
			}, 3000);
			return;
		}
		if (disarmTimerRef.current !== undefined) {
			clearTimeout(disarmTimerRef.current);
			disarmTimerRef.current = undefined;
		}
		setStopState("requested");
		try {
			const result = await postStop({ jobId, sessionId });
			setStopState(result?.result === "already-finished" ? "finished" : "requested");
		} catch {
			setStopState("failed");
			setTimeout(() => setStopState((current) => (current === "failed" ? "idle" : current)), 3000);
		}
	};

	/** The stop button's label per lifecycle state. */
	const stopLabel = stopState === "armed" ? t("stop.confirm")
		: stopState === "requested" ? t("stop.requested")
		: stopState === "finished" ? t("stop.alreadyFinished")
		: stopState === "failed" ? t("stop.failed")
		: t("stop.idle");

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
					{live ? (
						<button
							type="button"
							className={`jp-stopButton${stopState === "armed" ? " jp-stopArmed" : ""}`}
							onClick={onStopClick}
							disabled={stopState === "requested"}
						>
							{stopLabel}
						</button>
					) : null}
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
				{loadFailed !== undefined ? <div className="jp-notice">{t("meta.fetchFailed", { status: String(loadFailed) })}</div> : null}
			</div>
			<div className="jp-body">
				{data !== undefined && data.tapped === false ? <p className="jp-notice">{t("meta.untapped.note")}</p> : null}
				{data === undefined && loadFailed === undefined ? <p className="jp-notice">{t("output.loading")}</p> : null}
				{tapped && !hasStreams ? <p className="jp-notice">{t("meta.noStream")}</p> : null}
				{tapped && hasStreams ? (
					<>
						<div className="jp-outputToolbar">
							{fullState === "truncated" ? <span>{t("output.full.spillTruncated", { count: spillNoticeLines })}</span> : null}
							{fullState === "failed" ? <span>{t("output.full.failed")}</span> : null}
							<span style={{ flex: 1 }} />
							{(fullState === "idle" || fullState === "failed") && (bufferState.stdoutSpillPath !== undefined || bufferState.stderrSpillPath !== undefined) ? (
								<button type="button" className="jp-ghostButton" onClick={loadFullHistory} disabled={fullState === "loading"}>
									{fullState === "loading" ? t("output.full.loading") : t("output.full.load")}
								</button>
							) : null}
						</div>
						<OutputView snapshot={bufferState} t={t} hasStreams={hasStreams} hasLines={hasLines} />
					</>
				) : null}
			</div>
		</div>
	);
}
