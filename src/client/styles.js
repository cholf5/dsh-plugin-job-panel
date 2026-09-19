/**
 * dsh-plugin-job-panel — client styles.
 *
 * One style tag for the whole plugin, tagged with `data-plugin` so an HMR
 * unload removes exactly this contribution (the official packages' CSS-module
 * injection follows the same data attribute convention). Everything uses the
 * product's dsw tokens so dark/light themes apply unchanged.
 */

/**
 * Background-jobs popover row affordances. The rows are the official
 * dsh-client-ui-jobs popover's `<li>` elements, enhanced (see
 * ./enhance-dropdown.js) with a `data-job-panel-id` attribute — never with
 * injected child elements, so React re-rendering keeps working untouched.
 */
export const DROPDOWN_CSS = `
ul li[data-job-panel-id] {
  cursor: pointer;
}
ul li[data-job-panel-id]:hover {
  /* The design platform defines no fill-l* alias tokens, so any fill-l*
     var() is an invalid declaration and the hover painted nothing; use the
     shipped interactive hover alias (module-platform as the fallback). */
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-module-platform));
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

const STYLE_TAG_ID = "dsh-plugin-job-panel/styles";

/** Panel body styles, scoped under the plugin's root class. */
export const PANEL_CSS = `
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
  background: var(--dsw-alias-bg-module-platform);
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
  background: var(--dsw-alias-markdown-code-block);
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
.jp-copyButton:hover { color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-module-platform); }
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
  background: var(--dsw-alias-markdown-code-block);
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
/* Semantic level classes for plain log lines (console-logger convention).
   All three tokens are defined in the shipped design platform. */

/* ANSI SGR rendering classes. The 16-color palette picks mid-brightness
   values that read on both the light (neutral-50) and dark (bluish-900)
   output surfaces; background classes are translucent so the text keeps
   contrast. Extended colors (256/truecolor) are consumed but unmapped. */
.jp-a-fg30 { color: #6e7681; }
.jp-a-fg31 { color: #f25a5a; }
.jp-a-fg32 { color: #3fb950; }
.jp-a-fg33 { color: #d29922; }
.jp-a-fg34 { color: #539bf5; }
.jp-a-fg35 { color: #b083f0; }
.jp-a-fg36 { color: #39c5cf; }
.jp-a-fg37 { color: #d4d4d4; }
.jp-a-fg90 { color: #8b949e; }
.jp-a-fg91 { color: #ff7b72; }
.jp-a-fg92 { color: #7ee787; }
.jp-a-fg93 { color: #e3b341; }
.jp-a-fg94 { color: #79c0ff; }
.jp-a-fg95 { color: #d2a8ff; }
.jp-a-fg96 { color: #76e3ea; }
.jp-a-fg97 { color: #f0f6fc; }
.jp-a-bg30 { background: #6e768133; }
.jp-a-bg31 { background: #f25a5a33; }
.jp-a-bg32 { background: #3fb95033; }
.jp-a-bg33 { background: #d2992233; }
.jp-a-bg34 { background: #539bf533; }
.jp-a-bg35 { background: #b083f033; }
.jp-a-bg36 { background: #39c5cf33; }
.jp-a-bg37 { background: #d4d4d433; }
.jp-a-bg40 { background: #6e768133; }
.jp-a-bg41 { background: #f25a5a33; }
.jp-a-bg42 { background: #3fb95033; }
.jp-a-bg43 { background: #d2992233; }
.jp-a-bg44 { background: #539bf533; }
.jp-a-bg45 { background: #b083f033; }
.jp-a-bg46 { background: #39c5cf33; }
.jp-a-bg47 { background: #d4d4d433; }
.jp-a-bg90 { background: #8b949e33; }
.jp-a-bg91 { background: #ff7b7233; }
.jp-a-bg92 { background: #7ee78733; }
.jp-a-bg93 { background: #e3b34133; }
.jp-a-bg94 { background: #79c0ff33; }
.jp-a-bg95 { background: #d2a8ff33; }
.jp-a-bg96 { background: #76e3ea33; }
.jp-a-bg97 { background: #f0f6fc33; }
.jp-a-bg100 { background: #8b949e33; }
.jp-a-bg101 { background: #ff7b7233; }
.jp-a-bg102 { background: #7ee78733; }
.jp-a-bg103 { background: #e3b34133; }
.jp-a-bg104 { background: #79c0ff33; }
.jp-a-bg105 { background: #d2a8ff33; }
.jp-a-bg106 { background: #76e3ea33; }
.jp-a-bg107 { background: #f0f6fc33; }
.jp-a-b { font-weight: 600; }
.jp-a-dim { opacity: 0.65; }
.jp-a-i { font-style: italic; }
.jp-a-u { text-decoration: underline; }
.jp-log-error { color: var(--dsw-alias-state-error-primary); }
.jp-log-warn { color: var(--dsw-alias-state-warn-primary); }
.jp-log-dim { color: var(--dsw-alias-label-tertiary); }
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
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 11px;
  line-height: 18px;
}
.jp-ghostButton:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
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
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-primary);
}
.jp-stopButton:hover { background: var(--dsw-alias-interactive-bg-hover); }
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

/**
 * Insert the plugin's style tag once (no-op on re-runs, e.g. HMR remount
 * before the old tag was removed).
 * @param {string} css - stylesheet text.
 * @returns {() => void} disposer removing the tag this call created.
 */
export function ensureStyles(css) {
	if (typeof document === "undefined") return () => {};
	const existing = document.querySelector(`style[data-plugin-css="${STYLE_TAG_ID}"]`);
	if (existing !== null) return () => {};
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-plugin-job-panel";
	tag.dataset.pluginCss = STYLE_TAG_ID;
	tag.textContent = css;
	document.head.appendChild(tag);
	return () => tag.remove();
}
