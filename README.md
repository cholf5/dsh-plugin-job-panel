# dsh-plugin-job-panel

A right-sidebar job panel for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web GUI: click a row in the session header's background-jobs popover to inspect the job — its command, its live terminal output with iterm2-style bounded scrollback, its full spill-backed history — and stop it.

Dual-face plugin: a Node half (observation tap + exact `/api` routes) and a browser half (panel body + popover row enhancement).

Verified against `@deepseek-ai/dsh@0.1.5-rc.2`. MIT licensed.

## Install

```sh
dsh plugin --profile web add link:/abs/path/to/dsh-plugin-job-panel -w
# then restart `dsh web` once — the bundle layer does not hot-reload on install
```

Development loop after the one restart:

| Change | Takes effect |
|---|---|
| `lib/client.js` (run `npm run build`) | hot-swapped by dsh-client-hmr, no restart |
| `lib/*.js` host half | restart `dsh web` |
| `cordis.patch.yml` | hot-reloaded |

`npm run build` regenerates `lib/client.js` from `src/client/` (esbuild, devDependency). `lib/` is committed so a `link:`-installed profile picks changes up without an install step.

## What it does

1. **Clickable popover rows.** The official background-jobs popover (`dsh-client-ui-jobs`) renders read-only rows and offers no row-level extension seat, so the rows are enhanced the documented no-seat way: a MutationObserver stamps each row with `data-job-panel-id` (read from the row's React fiber key — the job id), one click listener opens (or re-navigates) the panel tab, and CSS adds the pointer/hover/chevron affordances. Nothing is ever injected into React-managed children.
2. **The panel.** A page tab type (`kind: job-output`, guide entry included) registered through the official two-stage `sidebarRightTabs` path; the body renders kind chip, live status dot, ticking duration, start/finish/detail facts, the command block (producer label — for bash jobs the command itself) with copy button and the captured spawn cwd, the streaming output view, and the stop control. Page tabs dedupe within their pane, so clicking another job re-navigates the same tab; split panes / float / fullscreen come from the docking kit for free.
3. **Output.** While the tab is visible the panel polls every 500 ms with its own byte offsets and forwards the raw deltas into an **embedded xterm.js terminal** (`@xterm/xterm`, the OpenJS-hosted xterm.js) — a real terminal engine, so SGR colors (16/256/truecolor), OSC, C1 two-byte escapes, bold/dim/italic/underline and carriage-return progress redraws all render natively, with the style state carried across lines exactly like a terminal. The bounded history is the terminal's own scrollback (2000 lines, iterm2-style); auto-follow sticks to the bottom until the user scrolls up (floating jump-back button); lossy reads restart from the retained tail behind a gap marker. When a stream overflowed its in-memory window (64 KB/stream by default) the host keeps a spill file, and a "load full history" button resets the view and stitches spill head + retained tail with byte-count gap detection.
4. **Stop.** First click arms the button for 3 s, the second confirms. The host calls `ctx.jobs.kill(id, { id: ownerSession })` — the registry duck-types the caller by session id, and the owner session is the one recorded at start time, so the browser never declares authority.

## How the output works (the interesting part)

The job registry contract exposes stream output through **one consuming cursor per job** (`ctx.jobs.read()`), owned by the model's `job_output` tool; the official README lists "independent observers need a cursor or snapshot API" as a known limitation. Reading through the registry would steal the model's deltas and suppress its completion notices.

So this plugin observes one layer below:

- `ctx.jobs.start` is wrapped (behavior-preserving) to record kind / label / owner session and hold an entry open while the producer's synchronous `run()` executes;
- `ctx.subprocess.spawn` is wrapped to attribute the first spawned collect-mode handle of an in-flight start to that entry — the handle's `collected.stdout` / `collected.stderr` are `SubprocessOutputReader`s documented as *cursor-free* ("independent readers cannot consume one another's output"), reading from arbitrary whole-stream byte offsets, still readable after exit.

The three exact routes on the shared authenticated `/api` channel serve that data: `GET /api/job-panel/output` (incremental reads + snapshot), `GET /api/job-panel/full` (spill head + retained tail), `POST /api/job-panel/stop` (kill). Requests pass the connection package's trust fence and cookie authentication before dispatch.

## Terminal colors

Captured streams are plain text **by design**: the harness runs every command with `NO_COLOR=1`, `TERM=dumb`, and no TTY so the model sees clean text — and the panel never touches that stream. Colors are rebuilt at presentation time only, in two layers:

1. **Semantic levels (always on).** Plain log lines — the overwhelming default — render by their level vocabulary: `error/failed/fatal/exception/panic` red, `warn/deprecated` amber, `debug/trace/verbose` dimmed, the console-logger convention (.NET, serilog, log4j, …). The classifier only decides; the terminal applies the decision as a presentation-time SGR wrap on lines that carry no escapes of their own.
2. **The real thing (when present).** If a command's output carries actual escape sequences, the embedded terminal renders them as a terminal would — 16/256-color, truecolor, attributes, cursor-addressed progress redraws — no mapping layer in between.

To see true terminal colors for a specific job, force them in the command itself — the common detectors honor `FORCE_COLOR` over `NO_COLOR`:

```sh
FORCE_COLOR=1 dotnet run            # .NET / chalk / most Node tools
CLICOLOR_FORCE=1 ./mytool           # GNU-style tools
tool --color=always …               # tools with explicit flags
```

The model's own `job_output` reads the same captured stream — forcing color on a job whose output the model will read puts escape sequences in front of the model too. That tradeoff belongs to the command author; the panel deliberately does not strip or rewrite the stream to change it.

The terminal's theme follows the product: the surface background, foreground, and error/warn palette entries resolve from dsh tokens at mount and re-resolve on theme switches; the rest of the 16-color palette uses mid-brightness values that read on both light and dark surfaces.

## Known limitations

- **Non-bash jobs** (one-shot background subagents, …) are in-process producers with no subprocess handle to observe: their panel shows metadata and stop, with a "no output stream" note.
- **Jobs started before the plugin loads** (including after a host-half reload) are not tapped: no output; stop falls back to the browser-supplied session id of the session that shows the row.
- **Human kills suppress the model's completion notice** — `kill()` marks terminal delivery reported, an accepted official seam gap in 0.1.5-rc.2; the model discovers the stop on its next `job_output`/`job_list`/`job_wait` call and does not hang.
- **`dsh web` restarts empty the job registry** (in-memory by design); panels for gone jobs say so.
- **A running job's output beyond the spill cap (64 MB/stream)** cannot be fully recovered; the spill head is additionally capped in the full-history view (2 MB/stream by default).

## Version-sensitive seams (re-check on dsh upgrades)

| Seam | Fact assumed | Where |
|---|---|---|
| `jobs-local.start()` | calls `spec.run()` synchronously | `lib/tap.js` correlation |
| `SubprocessHandle.collected` | offset-based readers, `readFrom(byteOffset)` | `lib/routes.js` |
| `ctx.jobs.kill/get` | caller duck-typed by `caller.id` vs owner id | `lib/routes.js` |
| Popover DOM | `<ul aria-label="后台任务"/"Background jobs">`, row fiber key = job id | `src/client/enhance-dropdown.js` |
| Sidebar seat | `sidebar.right.pane.tab` keyed seat, `useTabInfo` hook prop | `src/client/index.jsx` |
| `/api` fence | unauthenticated probes answer 401 (route-independent in this version — the old "404 = absent" heuristic does not hold) | — |

## Development

```sh
npm install          # esbuild
npm test             # node --test over output-buffer / log-line / stream-piper (no framework)
npm run build        # src/client/* -> lib/client.js
node --check lib/index.js
```

Host half is plain ESM JavaScript with no build step; the client half is built by `build.js`, which wraps the esbuild CJS output into the `window.__ModuleLoader__.load({ id, factory })` shape the browser module system expects. Platform seed modules (`react`, `react/jsx-runtime`, `@deepseek-ai/dsh-client-ui-primitives`) stay external, resolved through the loader's module table; the embedded terminal (`@xterm/xterm`, `@xterm/addon-fit` — both MIT, by the xterm.js authors) and its stylesheet are bundled in.

## License

[MIT](./LICENSE)
