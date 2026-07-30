# 🛠️ Antigravity Context Window Monitor — Technical Implementation /

This document explains how the Antigravity Context Window Monitor plugin works. The plugin consists of the following core modules: `discovery.ts` (server discovery), `tracker.ts` (token calculation), `extension.ts` (polling scheduler), `statusbar.ts` (UI display), `webview-panel.ts` (WebView panel orchestrator), `activity-tracker.ts` (model activity tracking), `activity-panel.ts` (GM Data UI), `pricing-panel.ts` (Cost and Models UI), `quota-tracker.ts` (quota tracking), `rpc-client.ts` (RPC communication layer), `models.ts` (model config & display names), `constants.ts` (constants), and `i18n.ts` (internationalization system). WebView panel split into: `activity-panel.ts`, `pricing-panel.ts`, `webview-chat-history-tab.ts`, `webview-models-tab.ts`, `webview-profile-tab.ts`, `webview-settings-tab.ts`, `webview-calendar-tab.ts`, `webview-about-tab.ts`, `webview-script.ts`, `webview-styles.ts`, `webview-helpers.ts`, `webview-icons.ts`.

 Antigravity Context Window Monitor 。：`discovery.ts`（）、`tracker.ts`（Token ）、`extension.ts`（）、`statusbar.ts`（）、`webview-panel.ts`（WebView ）、`activity-tracker.ts`（）、`activity-panel.ts`（GM Data UI）、`pricing-panel.ts`（Cost  Models UI）、`quota-tracker.ts`（）、`rpc-client.ts`（RPC ）、`models.ts`（）、`constants.ts`（）、`i18n.ts`（）。WebView ：`activity-panel.ts`、`pricing-panel.ts`、`webview-chat-history-tab.ts`、`webview-models-tab.ts`、`webview-profile-tab.ts`、`webview-settings-tab.ts`、`webview-calendar-tab.ts`、`webview-about-tab.ts`、`webview-script.ts`、`webview-styles.ts`、`webview-helpers.ts`、`webview-icons.ts`。

---

## 🧭 1. Language Server Discovery /

> Source: [`discovery.ts`](../src/discovery.ts)

Each Antigravity workspace has a background Language Server process handling AI conversation requests. The plugin needs to locate the correct one for the current workspace and connect to it.

 Antigravity （Language Server） AI 。。

* **Process Scanning / **: Uses platform-specific commands (via async `execFile`, non-blocking to IDE UI thread) to find the Language Server process, matching the current workspace via the `--workspace_id` argument. macOS uses `ps`, Linux uses `ps` with `lsof`/`ss` fallback, Windows uses `wmic`/PowerShell, and WSL (v1.12.0+) uses Windows-side tools via interop (`WMIC.exe`, `powershell.exe`, `netstat.exe`). Uses `execFile` instead of shell string concatenation to prevent command injection. Accepts optional `AbortSignal` for cancellation on extension deactivate. Core parsing logic extracted into exported functions (`buildExpectedWorkspaceId`, `extractPid`, `extractCsrfToken`, `selectMatchingProcessLine`, etc.) that can be directly unit-tested. Since v1.15.0, `selectMatchingProcessLine()` uses a **prefer-new-style, fallback-to-match** priority: (1) processes WITHOUT `--workspace_id` (Antigravity 1.22.2+ shared LS architecture) are preferred; (2) if none exist, falls back to exact `workspace_id` match (legacy per-workspace LS); (3) last resort: first discovered process. This fixes a critical bug where Antigravity 1.22.2+ changed its LS from per-workspace to single shared process — old zombie LS processes (with workspace_id) remained alive and the previous prefer-match logic always connected to them instead of the new active LS. The polling loop also includes periodic PID revalidation (~30s) to detect silent LS restarts, and a staleness heuristic (4+ consecutive all-IDLE polls with `stalenessConfirmedIdle` guard) as a secondary defense against zombie LS connections. (Previously v1.14.4 used prefer-match-fallback-to-first, and v1.13.3 used fail-closed.) `buildExpectedWorkspaceId()` now includes `decodeURIComponent` defense for percent-encoded workspace URIs (e.g., `file:///c%3A/...`). WSL detection uses `isWSL()` which reads `/proc/version` for Microsoft/WSL signatures (cached). Since v1.12.1, `extensionKind: ["ui", "workspace"]` ensures the extension prefers running on the local (UI) side where the LS process lives. Since v1.13.0, when connected via Remote-WSL (`vscode-remote://wsl+<distro>/...`), the extension discovers the `language_server_linux_x64` process running inside the WSL distro via `wsl -d <distro> -- ps aux`, finds its ports via `ss -tlnp`, and probes them from Windows through WSL2 port forwarding. Since v1.16.13, the native Windows branch also invokes `wmic` / `powershell.exe` / `netstat` by absolute `%SystemRoot%` path (via exported `buildWindowsExePath()`, e.g. `System32\wbem\WMIC.exe`) instead of by bare name — mirroring the WSL branch — so a truncated Extension Host `PATH` (e.g. Win11 24H2+/25H2 removed WMIC as a Feature-on-Demand, dropping `System32\wbem`) no longer breaks discovery with a silent `ENOENT` "LS not found". `extractWindowsPid()` handles both the `wmic` (last-column) and PowerShell (first-column) CSV layouts, `netstatLineMatchesPid()` matches the trailing PID exactly, and a one-shot `PATH check: hasWbem=… hasWindowsPowerShell=… SystemRoot=…` line plus per-step null-return messages are logged to the "Antigravity Context Monitor" Output channel for field diagnosis.
  （ `execFile` ， IDE UI ）， `--workspace_id` 。macOS  `ps`，Linux  `ps`  `lsof`/`ss` ，Windows  `wmic`/PowerShell，WSL（v1.12.0+） Windows 。 `execFile`  shell ，。 v1.15.0 ，`selectMatchingProcessLine()` **、**：(1)  `--workspace_id` （Antigravity 1.22.2+  LS ）；(2) ， `workspace_id` （ LS）；(3) ：。 Antigravity 1.22.2+  LS  Bug—— LS （ workspace_id）， LS。 PID （ 30 ） LS ，（ 4+  IDLE  `stalenessConfirmedIdle` ）。（ v1.14.4 ，v1.13.3 。）`buildExpectedWorkspaceId()`  `decodeURIComponent` ， URI。WSL  `isWSL()`  `/proc/version`  Microsoft/WSL （）。 v1.12.1 ，`extensionKind: ["ui", "workspace"]` （UI ）。 v1.13.0 ， Remote-WSL （`vscode-remote://wsl+<distro>/...`）， `wsl -d <distro> -- ps aux`  WSL  `language_server_linux_x64` ， `ss -tlnp` ， Windows  WSL2 。 v1.16.13 ， Windows  `%SystemRoot%` （ `buildWindowsExePath()`， `System32\wbem\WMIC.exe`） `wmic` / `powershell.exe` / `netstat`—— WSL —— Extension Host  `PATH` （ Win11 24H2+/25H2  WMIC 、 `System32\wbem`） `ENOENT`  "LS not found"。`extractWindowsPid()`  `wmic`（） PowerShell（） CSV ，`netstatLineMatchesPid()`  PID， “Antigravity Context Monitor” Output  `PATH check: hasWbem=… hasWindowsPowerShell=… SystemRoot=…`  null ，。

* **Extracting Connection Info / **: Extracts PID and `csrf_token` from process arguments (used for RPC request authentication).
   PID  `csrf_token`（ RPC ）。

* **Port Discovery / **: Uses `lsof` (macOS/Linux), `ss` fallback (Linux), `netstat -ano` (Windows), or `netstat.exe` via interop (WSL) to find the local port the language server is listening on.
   `lsof`（macOS/Linux）、`ss` （Linux）、`netstat -ano`（Windows） `netstat.exe`（WSL）。

* **Connection Probing / **: Sends a lightweight RPC request (`GetUnleashData`) to test connectivity, verifying HTTP status code is 2xx. Tries HTTPS first (the LS typically uses self-signed certs), falls back to HTTP. Response stream now has `res.on('error')` handler to prevent Promise hang on TCP RST or similar issues.
   RPC （`GetUnleashData`）， HTTP  2xx。 HTTPS， HTTP。 `res.on('error')` 。

## ♾️ 2. Conversation Tracking /

> Source: [`tracker.ts`](../src/tracker.ts) — `getAllTrajectories()`, [`extension.ts`](../src/extension.ts) — polling logic

Once connected, the plugin periodically fetches conversation data and tracks changes.

，。

* **Fetching Sessions / **: Calls the `GetAllCascadeTrajectories` RPC endpoint to get all conversations (called Trajectories), including cascadeId, stepCount, status, and model used.
   `GetAllCascadeTrajectories` RPC （ Trajectory）， cascadeId、stepCount、、。

* **Workspace Isolation / **: When a workspace folder is open, filters trajectories by comparing their `workspaceUris` against the current window's workspace URI (normalized via `normalizeUri`), so current-workspace conversations stay first. Since v1.14.4, when no folder is open (no workspace), all trajectories are shown without filtering. Since v1.16.5, if Antigravity keeps reporting a stale workspace URI after a project switch and no current-workspace trajectory is RUNNING, the selector can follow a RUNNING trajectory from the shared LS as a fallback. That fallback is covered by `selectRunningTrajectoryCandidate()` tests, and the selected cross-workspace trajectory is included in the recent usage scope so the panel and persisted monitor snapshot stay consistent.
  ， trajectory  `workspaceUris`  workspace URI（ `normalizeUri` ），。 v1.14.4 ，（） trajectory 。 v1.16.5 ， Antigravity  workspace URI， RUNNING ， LS  RUNNING 。 fallback  `selectRunningTrajectoryCandidate()` ， trajectory  recent usage scope，。

* **Active Session Selection / **: Selects which session to display, by priority:
  ：
  1. Current-workspace trajectory with RUNNING status, then RUNNING fallback from shared LS /  RUNNING ， LS  RUNNING
  2. Trajectory with stepCount change (increase = new message, decrease = undo) / `stepCount`
  3. Newly appeared trajectory /

* **Step Analysis / **: For the selected conversation, calls `GetCascadeTrajectorySteps` with all batches (50 steps each) fetched in groups of up to 5 concurrent batches via `Promise.allSettled`, then passes the collected steps array to the pure function `processSteps()` for computation. `endIndex` is capped at `stepCount` to prevent the LS API's wrap-around behavior. Failed batches are flagged as `hasGaps` without blocking others. `processSteps()` is a side-effect-free pure function extracted from `getTrajectoryTokenUsage`, directly unit-testable with constructed step data. Since v1.16.4, `CHECKPOINT` steps still provide token baselines but no longer overwrite the user-visible display model. Their internal generator/modelUsage model is carried separately as `checkpointModel` for tooltip transparency.
   `GetCascadeTrajectorySteps`， `Promise.allSettled` ， `processSteps()` 。 v1.16.4 ，`CHECKPOINT`  token ，； generator/modelUsage  `checkpointModel`  tooltip。

## 🧮 3. Token Calculation / Token

> Source: [`tracker.ts`](../src/tracker.ts) — `processSteps()` (pure computation), `getTrajectoryTokenUsage()` (RPC fetch + calls processSteps)

* **（Checkpoint）/ Precise Values**:  `CORTEX_STEP_TYPE_CHECKPOINT`  `modelUsage` ， `inputTokens`  `outputTokens`。 checkpoint 。
  The language server provides `modelUsage` data in `CORTEX_STEP_TYPE_CHECKPOINT` steps, containing the model's actual `inputTokens` and `outputTokens`. The plugin always uses the last checkpoint as the baseline.

* **（v1.4.0 ）/ Real-Time Estimation (v1.4.0 Content-Based)**:  checkpoint ， Token ： `userInput.userResponse`， `plannerResponse.response` + `plannerResponse.thinking` + `plannerResponse.toolCalls[].argumentsJson`。 ASCII  ÷ 4、 ASCII  ÷ 1.5。（）， fallback （ 500、 800）， ≈0 tokens。 10000 tokens（`SYSTEM_PROMPT_OVERHEAD`，），。
   Between checkpoints, the plugin estimates token delta from actual step text content: user input from `userInput.userResponse`, model response from `plannerResponse.response` + `plannerResponse.thinking` + `plannerResponse.toolCalls[].argumentsJson`. Estimation: ASCII chars ÷ 4, non-ASCII ÷ 1.5. Fixed constants (500 per user input, 800 per response) are only used as fallback when the parent object is entirely missing (structural data absence); empty text correctly estimates to ≈0 tokens. System prompt overhead ~10,000 tokens (`SYSTEM_PROMPT_OVERHEAD`, measured from real sessions) is always counted once.

* ** = inputTokens + outputTokens +  / Context = inputTokens + outputTokens + delta**:  checkpoint  input + output  checkpoint 。
  Total context usage is checkpoint input + output plus estimated delta since the last checkpoint.

* ** Token  / Image Gen Token Tracking**: ：step type  `IMAGE`  `GENERATE`， generator model  `nano`、`banana`、`image`。 Set ，。
  Detects image generation steps two ways: step type containing `IMAGE` or `GENERATE`, or generator model name containing `nano`, `banana`, or `image`. Uses a Set to deduplicate per step index.

* ** Token  / Retry Token Observation**: Checkpoint  `metadata.retryInfos[].usage`  token。（）， `modelUsage` 。
  Checkpoint `metadata.retryInfos[].usage` contains retry token usage. Currently logged for analysis (observation mode), pending verification of overlap with `modelUsage` before counting.

* ** / Dynamic Model Names**:  LS ， `GetUserStatus` API ， `MODEL_DISPLAY_NAMES`。 fallback 。
  On LS connection, fetches model configs from the `GetUserStatus` API to dynamically update `MODEL_DISPLAY_NAMES`. Hardcoded values remain as fallback.

## 🖥️ 4. Status Bar & Polling /

> Source: [`statusbar.ts`](../src/statusbar.ts), [`extension.ts`](../src/extension.ts)

* ** / Polling**:  5  `pollContextUsage()`（ `setTimeout` ， RPC ，）。`schedulePoll()`  `pollGeneration`  `restartPolling()` （ `finally`  generation ）， `disposed` ，`catch`  `log()` 。`pollContextUsage()`  `cachedLsInfo`  `lsInfo`， refresh  await 。 `pollingInterval` 。 `isPolling` 。
  Calls `pollContextUsage()` every 5 seconds by default using a `setTimeout` chain (each poll is scheduled only after the previous completes). `schedulePoll()` uses a `pollGeneration` counter to prevent `restartPolling()` from creating orphan timer chains (the old chain's `finally` detects a stale generation and exits silently), a `disposed` flag to prevent timers after deactivation, and double-wrapped `log()`. `pollContextUsage()` captures `cachedLsInfo` into a local `lsInfo` snapshot at entry to prevent the refresh command from nullifying it during await gaps. Configurable via `pollingInterval` setting. An `isPolling` flag prevents concurrent reentrance.

* ** / Parallel Multi-Session Computation**: QuickPick  5  trajectory  `Promise.all` ，。 `getContextUsage()`  RPC ，。
  The 5 most recent trajectories shown in the QuickPick panel are computed in parallel via `Promise.all`, instead of sequentially awaiting each one. Each `getContextUsage()` is an independent read-only RPC query, making parallelization safe.

* ** / Exponential Backoff**: ， `baseInterval × 2^(failureCount-1)` 。 v1.14.4 ****：LS （） 15 （`MAX_DISCOVERY_BACKOFF_MS`），RPC  60 （`MAX_BACKOFF_INTERVAL_MS`）。：5s → 10s → 15s（）， LS  ~15 。。
    On LS connection failure, polling interval increases as `baseInterval × 2^(failureCount-1)`. Since v1.14.4, uses a **dual-cap strategy**: LS discovery failures (process not found) cap at 15 seconds (`MAX_DISCOVERY_BACKOFF_MS`), while RPC communication failures cap at 60 seconds (`MAX_BACKOFF_INTERVAL_MS`). Discovery backoff sequence: 5s → 10s → 15s (capped), ensuring a newly started LS is detected within ~15 seconds. Resets to base interval immediately on successful reconnection.

* **RPC  / RPC Cancellation**:  `AbortController`  in-flight RPC  LS 。Extension deactivate（） abort ，。`activate()`  `AbortController`，。 AbortController 。
    Uses `AbortController` to manage in-flight RPC requests and LS discovery. On extension deactivate (window close), all pending requests are automatically aborted. `AbortController` is rebuilt in `activate()` to support re-activation after deactivate. Each window has its own independent AbortController.

* **（v1.5.1 ）/ Compression Detection (v1.5.1 Two-Layer)**: ：`processSteps()`  checkpoint  `inputTokens`， 5000 tokens 。 Undo （ checkpoint ）。： `contextUsed` （  stepCount ）， 2  checkpoint 。 `🗜`  3 （ 15 ）。
    Primary layer: `processSteps()` compares consecutive checkpoint `inputTokens` — a drop exceeding 5000 tokens is flagged as compression. This is inherently immune to Undo false positives (existing checkpoint data is immutable). Fallback layer: cross-poll `contextUsed` comparison (only fires when primary layer did not detect AND stepCount did not decrease), covering conversations with < 2 checkpoints. The compression indicator `🗜` persists for 3 poll cycles (~15 seconds by default).

* ** / Status Bar Colors**: ——＜50% 、50-80% （`warningBackground`）、≥80% （`errorBackground`）。≥95%  `$(zap)`。
    Color-coded by usage: <50% normal, 50-80% warning (`warningBackground`), ≥80% error (`errorBackground`). At ≥95% the icon switches to `$(zap)`.

* ** / Plan-Tier Cache Clearing (v1.15.1)**:  hover  `StatusBarManager.setPlanName()` 。 v1.15.1 ， `userTierName`，，， hover 。
  The plan row in the status bar hover is cached through `StatusBarManager.setPlanName()`. Since v1.15.1, when a later poll omits `userTierName`, the cached secondary tier is explicitly cleared instead of preserving the old suffix, preventing stale labels from lingering in later hovers.

* **Checkpoint Shadow Model Row (v1.16.4) / Checkpoint **: `statusbar.ts` shortens internal checkpoint model IDs (for example `MODEL_PLACEHOLDER_M50` → `M50`) and shows them next to the latest checkpoint line. This is diagnostic context only; the main model row continues to reflect the user-selected model.
  `statusbar.ts`  checkpoint  ID （ `MODEL_PLACEHOLDER_M50` → `M50`） checkpoint 。，。

## 📊 5. WebView Monitor Panel / WebView

> Source: [`webview-panel.ts`](../src/webview-panel.ts)

 v1.10.1 ， WebView （ QuickPick ），。

Since v1.10.1, clicking the status bar opens a WebView side panel (replacing the previous QuickPick popup) showing a full user status dashboard.

* ** / Data Source**:  `GetUserStatus` RPC ， `fetchFullUserStatus()` （`FullUserStatus`）。。
  All data comes from the existing `GetUserStatus` RPC call via `fetchFullUserStatus()` which returns the full `FullUserStatus` object. Zero additional network requests.

* ** / Panel Content**: （planName、userTier）、Credits （Prompt Credits、Flow Credits）、（）、Feature Flags、（MCP Servers、Auto-Run ）、Google AI 。
  Displays account info (planName, userTier), credit balance (Prompt & Flow Credits), per-model quota percentages (color-coded), feature flags, team config (MCP Servers, Auto-Run, etc.), and Google AI credits.

* ** / Privacy Mask**: ， `vscode.getState()` 。
  Shield button masks name and email; state persists across panel refreshes via `vscode.getState()`.

* ** / Collapsible Sections**: （Plan Limits、Feature Flags、Team Config、Google AI Credits） `<details>` ，/。
  Secondary data (Plan Limits, Feature Flags, Team Config, Google AI Credits) hidden by default in `<details>` elements; open/close state persists.

* ** / Live Refresh**:  `updateMonitorPanel()` ，。 v1.14.5 ， `ContextUsage`（ `hasSameUsageInputs()`  `cascadeId`/`stepCount`/`lastModifiedTime`）， RPC 。GM 。
  The polling loop pushes latest data to the open panel via `updateMonitorPanel()`, keeping data in real-time sync. Since v1.14.5, polling reuses cached `ContextUsage` for unchanged conversations (compared via `hasSameUsageInputs()` on `cascadeId`/`stepCount`/`lastModifiedTime`), reducing redundant RPC calls. GM persistence also only writes when aggregated results change.

* **GM  / GM Restored Summary Hydration**:  `gmDetailedSummary`， quota-history ， `gmTracker.setDetailedSummary()`  GMTracker，、 `serialize()` 。`GMTracker.fetchAll()`  `cached.calls.length > 0`  idle ； `calls`  stub ， ``、``、``、`` 。
  When a file-backed `gmDetailedSummary` exists at startup, the extension first repairs quota-history contamination and then injects the repaired summary back into `GMTracker` via `gmTracker.setDetailedSummary()`, so the panel, timeline, and later `serialize()` calls all observe the same snapshot. `GMTracker.fetchAll()` now skips unchanged idle conversations only after `cached.calls.length > 0`; restored stubs with empty `calls` are force-refetched once, preventing Context Intelligence / Conversations / Context Growth / Error Details from disappearing after restart due to empty in-memory cache.

* **GM  / Detailed GM Change Detection**: `hasGMSummaryChanged()`  token， `modelBreakdown`、`contextGrowth`、`toolCallCounts`、`retryErrorCodes`、`toolCatalog`、`recentErrorEntries`、 conversation  latest call / checkpoint / systemContext 。， GM ，。
  `hasGMSummaryChanged()` no longer compares only total calls/tokens. It now builds a lightweight signature spanning `modelBreakdown`, `contextGrowth`, `toolCallCounts`, `retryErrorCodes`, `toolCatalog`, `recentErrorEntries`, and each conversation's latest call / checkpoint / systemContext details. This means detail-only GM updates still trigger panel refresh and persistence even when the topline counters remain unchanged.

* ** / Scrollbar Hiding (v1.14.5)**:  VS Code WebView ：①  CSS `html[data-hide-scrollbar="true"]` + `!important`；② `<html>`  `<body>`  `data-hide-scrollbar` ；③  JS  `<style id="ag-scrollbar-override">`  `<head>` 。，。
  Three-layer defense-in-depth scrollbar hiding for VS Code WebView: ① Static CSS `html[data-hide-scrollbar="true"]` with `!important`; ② dual `data-hide-scrollbar` attribute on both `<html>` and `<body>`; ③ Runtime JS injection of `<style id="ag-scrollbar-override">` appended to `<head>` tail. Hidden by default, toggleable in Settings.

* ** / End-of-Content Sentinel (v1.14.5, v1.14.7)**: 「—  —」，`IntersectionObserver` 。v1.14.7 ： HTML， pane  DOM ， sentinel ， `<details>` 。。
  Persistent "— End of content —" indicator at the bottom of all tab panes. `IntersectionObserver` controls fade-in animation. v1.14.7 fixes repeated fade-in on poll refresh: caches per-tab HTML, skips unchanged pane DOM swaps, preserves visible sentinel state, and adds idempotent listener guards for `<details>` blocks and session catalog filters. Independently toggleable in Settings.

* ** / Incremental Tab Refresh (v1.14.7)**: `updateTabs`  `postMessage` ， HTML  pane， `innerHTML` 。Settings ， DOM 。
  The `updateTabs` message pushes tab content via `postMessage`; the frontend compares cached HTML and skips unchanged panes, avoiding unnecessary `innerHTML` replacements. The Settings tab is explicitly excluded from incremental updates to prevent DOM replacement from destroying event listeners.

* **Sessions GM  / Sessions GM Snapshot Refresh**: `monitor-store.ts`  `GMConversationData`  latest call 、、， `calls.length`。 Sessions “， GM //”。
  Persisted `GMConversationData` snapshots in `monitor-store.ts` now compare latest call identity, latest model, credits, and timestamp instead of only `calls.length`. This keeps the Sessions tab current even when the number of calls is unchanged but the newest GM model/credits/execution record has changed.

* **Tab  / Tab Arrow Navigation (v1.14.7)**: Tab ，。 `opacity` + `pointer-events` ， Tab。
  Left/right scroll arrow buttons flank the tab bar, intelligently showing/hiding based on overflow state. Uses `opacity` + `pointer-events` fade transition to preserve layout space and prevent accidental tab clicks.

* **/ / Calendar Monthly/All-Time Toggle (v1.14.7)**: （ / ），。，。
  Calendar summary section now has segmented toggle buttons (Monthly / All-Time) for quick monthly vs all-time stats comparison. Default view is monthly; empty months show friendly guidance.

* ** / Light Theme Compatibility (v1.14.5, v1.14.6)**: GM （`#2563eb`、`#16a34a` ）， `body.vscode-dark` 。 `rgba(255,255,255,0.xx)`  `var(--color-surface)` / `var(--color-border)`。VS Code  `@media (prefers-color-scheme)`  `body.vscode-dark`。v1.14.6 （~50 ）， `webview-styles.ts`、`activity-panel.ts`、`webview-calendar-tab.ts`  `body.vscode-light` CSS ，、、、（）、、X-ray 。
  GM tag text colors now default to dark-saturated variants, with `body.vscode-dark` overrides restoring the original pastel palette. Replaced `rgba(255,255,255,0.xx)` with `var(--color-surface)` / `var(--color-border)`. VS Code theme detection changed from `@media (prefers-color-scheme)` to `body.vscode-dark`. v1.14.6 extends light theme coverage to all panel components (~50), adding comprehensive `body.vscode-light` CSS overrides in `webview-styles.ts`, `activity-panel.ts`, and `webview-calendar-tab.ts`, covering action buttons, stat cards, progress bar tracks, chat history cards (with gradient replacements), monitor mini panel, X-ray visualization, and more.

* **Cost Pricing Editor (v1.16.4) / Cost **: `pricing-panel.ts` renders called models first and appends built-in default pricing models that are not already covered by a called `responseModel`. Empty placeholder `responseModel` values are ignored for coverage and are not rendered as editable `data-model=""` rows. `webview-script.ts` saves only rows that were already custom or whose values changed, so untouched built-in prices do not become custom overrides.
  `pricing-panel.ts` ， `responseModel` 。 placeholder `responseModel` ， `data-model=""` 。`webview-script.ts` ，。

* **Tool Catalog Cleanup (v1.16.4) / **: GM Data renders the tool catalog as a collapsible chip grid with truncation-aware tooltips. The WebView clear button sends an internal `clearToolCatalog` message to `extension.ts`; `GMTracker.clearToolCatalog()` clears only the catalog, not tool ranking counts. The extension persists the cleared summary to both `gmTrackerState` and the file-backed `gmDetailedSummary`, preventing stale catalog entries from returning after reload.
  GM Data  chip grid， tooltip。WebView  `clearToolCatalog`  `extension.ts`；`GMTracker.clearToolCatalog()` ，。 `gmTrackerState`  `gmDetailedSummary`，。

## 🧠 6. Model Activity Monitor /

> Source: [`activity-tracker.ts`](../src/activity-tracker.ts), [`activity-panel.ts`](../src/activity-panel.ts), [`quota-tracker.ts`](../src/quota-tracker.ts)

 v1.11.2 ，（、、Token 、）， WebView  Activity 。

Since v1.11.2, the plugin tracks real-time activity data per model (reasoning calls, tool usage, tokens, timing) and displays it in the WebView panel's Activity tab.

* ** / Step Classification**: 20+  reasoning、tool、user、system 。（、、）。
  20+ step types are classified into reasoning, tool, user, and system categories. Detailed info is extracted from each step (filename, command, query, etc.) for timeline display.

* ** / Warm-up & Incremental**: （warm-up）。。 LS API （~500 ）， `stepCount` （`dominantModel`）。
  On first launch, processes all steps across all conversations (warm-up) for complete cycle stats. Subsequently only processes new steps incrementally. When the LS API can't return more steps (~500 step window), delta is attributed to each trajectory's dominant model (`dominantModel`).

* ** / Quota Tracking & Auto-Archive**: `QuotaTracker` ，：① `remainingFraction`  1.0；② `resetTime` （ > 30min）。`processUpdate()`  ID  `resetModels[]`， `onQuotaReset(resetModels)` 。`endTime`  API  `resetTime`（）。`ActivityTracker.archiveAndReset(modelIds)`  5 （） `triggeredBy` ， trajectory baselines 。 v1.14.5 ， idle→tracking ** resetTime **： API  `resetTime` （`resetTime <= now`）， idle  API  `resetTime`，。
  `QuotaTracker` monitors quota changes via two mechanisms: ① `remainingFraction` dropping then jumping back to 1.0; ② `resetTime` expiring or jumping forward (> 30min shift). `processUpdate()` collects all reset model IDs into `resetModels[]` after the loop, firing `onQuotaReset(resetModels)` once. Session `endTime` uses the official API `resetTime`. `ActivityTracker.archiveAndReset(modelIds)` includes 5-minute debounce (merge within short intervals) and `triggeredBy` source tracking, while preserving trajectory baselines. Since v1.14.5, both idle→tracking entry paths include a **stale-resetTime guard**: if the API-reported `resetTime` is already in the past (`resetTime <= now`), the model stays idle until the API provides a future `resetTime` for the new cycle, preventing ghost-session infinite loops.

* **（v1.11.4）/ Three-Layer Instant Usage Detection (v1.11.4)**:

  ** / How It Was Discovered**:  LS （`diag-snapshot.ts`） `GetUserStatus`  `quotaInfo.resetTime` ，（ Claude） `resetTime` （），（ Gemini Pro） `resetTime`  API 。 `persist()`  `globalState`  `lastResetTime`、`baselineResetTime`、`idleSince` ， drift 。
  Discovered via LS diagnostic scripts (`diag-snapshot.ts`) that analyzed `quotaInfo.resetTime` snapshots from `GetUserStatus`. Used models (e.g. Claude) had their `resetTime` locked (not refreshed between polls), while unused models (e.g. Gemini Pro) got fresh `resetTime` values each poll. Additionally found that `persist()` silently dropped `lastResetTime`, `baselineResetTime`, `idleSince` from serialized `ModelState`, causing drift calculations to fail completely after extension reload.

  ** / Root Cause**: 「 10  resetTime 」， 1 ， 10 。 persist ，，。
  The original design required "passively waiting 10 min to observe if resetTime stays locked", meaning even if a model had been used for 1 hour, the plugin needed to wait another 10 min from boot. Combined with persist dropping fields, all observation state was lost on reload.

  ** / Solution — **:
  - **Layer 1（ / Instant）**:  poll ， 100%  `timeToReset`， `maxTimeToResetMs`（≈ ）。 `elapsedInCycle = maxTimeToResetMs − thisTimeToReset`。 `elapsedInCycle ≥ 10min` →  poll ， session  `startTime`  `resetTime − maxTimeToResetMs`（）。
    On each poll, scans all 100% models' `timeToReset`, takes the max as `maxTimeToResetMs` (≈ cycle length). For each model: `elapsedInCycle = maxTimeToResetMs − thisTimeToReset`. If ≥ 10min → immediately enters tracking with `startTime` backdated to `resetTime − maxTimeToResetMs`.
  - **Layer 2（Drift ）**:  `resetTime`  10 （`drift < RESET_DRIFT_TOLERANCE_MS`）→ （API  resetTime = ）。。
    If `resetTime` unchanged for 10 min (`drift < RESET_DRIFT_TOLERANCE_MS`) → model is used (API not refreshing resetTime = locked). Fallback for edge cases.
  - **Layer 3（Fraction ）**: `fraction < 1.0` → ， `resetTime − maxTimeToResetMs`  `startTime`。
    `fraction < 1.0` → immediate tracking, also backdating `startTime` via `resetTime − maxTimeToResetMs`.

  ** / Verification**:  5 ：Claude （Sonnet/Opus/GPT-OSS） Layer 3 （fraction = 80%）→  09:23 → 14:22 （4h59m）✅；Flash  Layer 1 （`elapsedInCycle = 1h01m`）→  10:46 → 15:46 （4h59m）✅。
  Verified over a full 5-hour quota cycle: Claude group (Sonnet/Opus/GPT-OSS) detected via Layer 3 (fraction=80%) → backdated to 09:23 → archived at 14:22 (4h59m) ✅; Flash detected via Layer 1 (`elapsedInCycle=1h01m`) → backdated to 10:46 → archived at 15:46 (4h59m) ✅.

* ** / Persistence**:  `globalState` ，30 （ v1.14.5  `activityChanged`/`gmChanged`/`timelineChanged` ）。 warm-up 。
  Activity data persisted via `globalState` serialization, throttled to 30s writes (since v1.14.5, only triggered when `activityChanged`/`gmChanged`/`timelineChanged`). On restore, forces warm-up to recalibrate actual counts.

* **GM  / GM Data Persistence Cache**: `ActivityTracker`  `_gmTotals`（ inputTokens/outputTokens/cacheRead/credits/retries） `_gmModelBreakdown`（ GM ）， `injectGMData()` ，`getSummary()` 。 v1.13.6 ，Activity  `pollContextUsage()` ， trajectory ， RPC  GM 。`serialize()`/`restore()` 。
  `ActivityTracker` maintains internal `_gmTotals` (global aggregate inputTokens/outputTokens/cacheRead/credits/retries) and `_gmModelBreakdown` (per-model GM breakdown), written by `injectGMData()` and always returned by `getSummary()`. Since v1.13.6, activity processing is merged into the unified `pollContextUsage()` loop, reusing fetched trajectory cache and eliminating independent RPC calls and GM data flickering. Both fields are fully persisted via `serialize()`/`restore()`.

* ** / Low Quota Notification**: （ 20%），，。
  Warning notification when model quota drops below user-configured threshold (default 20%). Each model notifies only once per threshold crossing, re-arms when recovered.

---

## 📊 6.  / Activity Panel Enhancements

> ：[`activity-tracker.ts`](../src/activity-tracker.ts)（）、[`activity-panel.ts`](../src/activity-panel.ts)（UI ）

* ** / Context Growth Trend**: `CheckpointSnapshot`  CHECKPOINT  `inputTokens`、`outputTokens`  `compressed` 。 inputTokens  ≥30%（`inTok < prevCp.inputTokens * 0.7`）。UI  SVG `<polyline>` + `<polygon>` ， `<circle>` 。
  `CheckpointSnapshot` records each CHECKPOINT's `inputTokens`, `outputTokens`, and `compressed` flag. Compression detected when inputTokens drops ≥30%. UI renders SVG area chart with red circle markers for compression events.

* ** / Tool Ranking**: `globalToolStats` (Map) 。UI  Top 10  CSS ，10  CSS class `.act-rank-c0~c9` （ inline style  CSP ）。 `style="width:X%"` 。
  `globalToolStats` counts tool calls globally. UI renders top 10 as CSS horizontal bar chart with 10-color rainbow palette via CSS classes (avoiding CSP-blocked inline styles). Bar width set via inline `style="width:X%"`.

* ** / Conversation Breakdown**: `ConversationBreakdown`  token 。token ：** CHECKPOINT**  `inputTokens`/`outputTokens` （，）。：`step.type`（ `metadata.cortexStepType`）。
  Per-conversation stats taking the max `inputTokens`/`outputTokens` from the last CHECKPOINT (cumulative snapshot). Field path: `step.type` (not `metadata.cortexStepType`).

* **Summary Bar **: （`Date.now() - sessionStartTime`）、`totalToolReturnTokens`、`totalCheckpoints` 。 emoji  inline SVG。 flex  CSS Grid（`repeat(auto-fill, minmax(90px, 1fr))`）， hover 。
  Enhanced with session duration, toolReturnTokens, checkpoint count. All emojis replaced with inline SVGs. Layout changed from flex to CSS Grid cards with hover glow.

* ** / Migration Strategy**: `restore()`  nuclear reset + re-warm-up：
  1. `needsSubAgentMigration`:  checkpoints  subAgentTokens
  2. `needsHistoryMigration`:  checkpoints  checkpointHistory
  3. `cbAllZero`: conversationBreakdown  token  0（ bug ）

  Three migration triggers in `restore()` force nuclear reset + re-warm-up: missing subAgentTokens, empty checkpointHistory, or all-zero conversationBreakdown (bad data from old field path bug).

* ** / Model Platform Thresholds**: `models.ts`  `DEFAULT_CONTEXT_LIMITS`  Antigravity ，。v1.16.8  Gemini 3.1 Pro  128K，Gemini 3 Flash M133/M132/M84/M47  128K，GPT-OSS 120B  80K，Claude Thinking  160K。 1M、120K/160K/128K  override，。v1.16.14  Gemini 3.6 Flash  M264/M265/M266（ M196） 255K（ checkpointer 256K/140K，−1K ）， 3.5 Flash M84/M20/M187  127K  255K；M133/M132/M47 ，。placeholder ID （`guessContextLimitSpec`） M ， M264  `m26`  Claude 。
  `DEFAULT_CONTEXT_LIMITS` stores Antigravity platform truncation thresholds, not model-native windows. v1.16.8 sets Gemini 3.1 Pro to 128K, Gemini 3 Flash M133/M132/M84/M47 to 128K, GPT-OSS 120B to 80K, while Claude Thinking remains 160K. Startup migration clears stale explicit default overrides from older releases so the corrected built-in defaults can take effect. v1.16.14 adds live-probed Gemini 3.6 Flash tiers M264/M265/M266 (plus catalog-only M196) with 255K static fallbacks (live checkpointer 256K/140K; the −1K offset marks fallback vs live capture), corrects the stale 127K fallbacks of 3.5 Flash M84/M20/M187 to 255K, and retires M133/M132/M47 platform-side (kept for archived-data resolution only). Placeholder-ID family inference (`guessContextLimitSpec`) now matches exact M-numbers, eliminating the substring collision where M264 (containing `m26`) was misjudged as a Claude-series model.

* ** / Settings Restore Defaults**:  Restore Defaults  `getContextLimit()` ， `contextLimits` ；Save All 。，“”。
  The model-limit Restore Defaults button fills inputs from `getContextLimit()` defaults and sends an empty `contextLimits` object to clear explicit overrides; Save All stores only values that differ from defaults. Future default changes are therefore not masked by stale values created by a previous save or restore action.

---
 TypeScript ， Antigravity IDE。 203  vitest （`npm test`）， discovery 、/、、、quota pool 、contextLimits 、（M //） tooltip 。
Built with TypeScript for the Antigravity IDE. The repository currently contains 203 vitest unit tests (`npm test`) covering discovery parsing, pricing table rendering/save behavior, tool catalog clear persistence, model default restoration, quota pool grouping, contextLimits migration, model-registry guards (M-number collision / order / aliases), and status-bar tooltip density budgeting.
