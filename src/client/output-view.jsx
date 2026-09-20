/**
 * dsh-plugin-job-panel — output view.
 *
 * An embedded xterm.js terminal (see ./terminal.js): raw stream deltas are
 * fed to it and it renders everything a real terminal would — SGR colors
 * incl. 256/truecolor, OSC, C1 escapes, carriage-return progress redraws —
 * inside the panel's token-painted surface. Auto-follow sticks to the bottom
 * while new deltas land; scrolling up disengages it (a floating "jump to
 * bottom" affordance appears). The bounded history is the terminal's own
 * scrollback, so old lines fall off exactly like an iterm2 scrollport.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createJobTerminal } from "./terminal.js";

/**
 * @param {object} props
 * @param {(key: string, params?: object) => string} props.t - namespace translator.
 * @param {boolean} props.hasOutput - whether any stream text reached the terminal.
 * @param {(surface: object | undefined) => void} props.onReady - called with the
 *   terminal surface on mount and undefined on unmount; the buffer binds its
 *   sink to this lifecycle (binding must not poll the ref from the poll loop —
 *   an interval-timed ref read sees the previous view's dying handle or React's
 *   post-unmount null, which either loses deltas or poisons the buffer).
 * @param {object} props.ref - imperative surface: writeStream / flushStream / flushAll /
 *   resetStream / writeMarker / reset / setScrollback.
 */
export const OutputView = forwardRef(function OutputView({ t, hasOutput, onReady }, ref) {
	const hostRef = useRef(null);
	const terminalRef = useRef(null);
	const followRef = useRef(true);
	const [atBottom, setAtBottom] = useState(true);

	useImperativeHandle(ref, () => ({
		writeStream: (stream, text) => {
			terminalRef.current?.writeStream(stream, text);
			followIfEngaged();
		},
		flushStream: (stream) => terminalRef.current?.flushStream(stream),
		flushAll: () => {
			terminalRef.current?.flushAll();
			followIfEngaged();
		},
		resetStream: (stream) => terminalRef.current?.resetStream(stream),
		writeMarker: (text) => {
			terminalRef.current?.writeMarker(text);
			followIfEngaged();
		},
		reset: () => {
			terminalRef.current?.reset();
			followRef.current = true;
			setAtBottom(true);
		},
		setScrollback: (lines) => terminalRef.current?.setScrollback(lines)
	}), []);

	const followIfEngaged = () => {
		const terminal = terminalRef.current;
		if (terminal === null || !followRef.current) return;
		terminal.term.scrollToBottom();
	};

	useEffect(() => {
		const host = hostRef.current;
		if (host === null) return undefined;
		const terminal = createJobTerminal(host);
		terminalRef.current = terminal;
		// Bind the buffer's sink here, at mount — the only moment the surface
		// is known to be live. Queued deltas (a poll can land before this
		// view mounts) drain on bind, so nothing is lost.
		onReady(terminal);

		const observer = new ResizeObserver(() => terminal.fit());
		observer.observe(host);
		terminal.fit();

		// Follow tracking: whichever element xterm uses as its scrollport
		// (viewport or the version's scrollable element — cover both).
		const onScroll = () => {
			let bottom = true;
			for (const element of terminal.viewportElements()) {
				bottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 8;
				if (!bottom) break;
			}
			followRef.current = bottom;
			setAtBottom(bottom);
		};
		const scrollElements = terminal.viewportElements();
		for (const element of scrollElements) element.addEventListener("scroll", onScroll);

		return () => {
			for (const element of scrollElements) element.removeEventListener("scroll", onScroll);
			observer.disconnect();
			onReady(undefined);
			terminalRef.current = null;
			terminal.dispose();
		};
	}, []);

	const jumpToBottom = () => {
		const terminal = terminalRef.current;
		followRef.current = true;
		setAtBottom(true);
		terminal?.term.scrollToBottom();
	};

	return (
		<div className="jp-outputScroll">
			<div className="jp-termHost" ref={hostRef} />
			{hasOutput ? null : <div className="jp-termEmpty">{t("output.empty")}</div>}
			{atBottom ? null : (
				<button type="button" className="jp-floatingFollow" onClick={jumpToBottom}>{t("output.followBottom")}</button>
			)}
		</div>
	);
});
