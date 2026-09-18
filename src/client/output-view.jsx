/**
 * dsh-plugin-job-panel — output view.
 *
 * Renders the output buffer's snapshot inside one scrollport with iterm2-style
 * behavior: auto-follow sticks to the bottom while new deltas land, scrolling
 * up disengages it (a floating "jump to bottom" affordance appears), and the
 * buffer's cap notice renders as a head divider. stderr lines are styled so
 * the two streams stay legible without promising exact interleaving.
 */

import { useEffect, useRef, useState } from "react";

/**
 * @param {object} props
 * @param {import("./output-buffer.js").OutputBufferSnapshot} props.snapshot - buffer snapshot.
 * @param {(key: string, params?: object) => string} props.t - namespace translator.
 * @param {boolean} props.hasStreams - whether the job exposed collected streams at all.
 * @param {boolean} props.hasLines - whether any output line is visible.
 * @returns {object} React element.
 */
export function OutputView({ snapshot, t, hasStreams, hasLines }) {
	const scrollRef = useRef(null);
	const followRef = useRef(true);
	const [atBottom, setAtBottom] = useState(true);

	const onScroll = () => {
		const element = scrollRef.current;
		if (element === null) return;
		const bottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 8;
		followRef.current = bottom;
		setAtBottom(bottom);
	};

	// After every buffer update, follow the bottom while disengaged-follow is off.
	useEffect(() => {
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

	return (
		<div className="jp-outputScroll" onScroll={onScroll}>
			<div className="jp-outputInner">
				{snapshot.omitted > 0 || snapshot.hasGap ? (
					<div className="jp-divider">{snapshot.omitted > 0 ? t("output.omittedPrefix", { count: snapshot.omitted }) : t("output.full.gap")}</div>
				) : null}
				{hasStreams && !hasLines ? <div className="jp-divider">{t("output.empty")}</div> : null}
				<pre className="jp-outputText">
					{snapshot.lines.map((line, index) => (
						<span key={index} className={line.stderr ? "jp-stderrText" : undefined}>{`${line.text}\n`}</span>
					))}
				</pre>
			</div>
			{!atBottom ? (
				<button type="button" className="jp-floatingFollow" onClick={jumpToBottom}>{t("output.followBottom")}</button>
			) : null}
		</div>
	);
}
