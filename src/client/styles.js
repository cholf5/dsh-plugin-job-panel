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
