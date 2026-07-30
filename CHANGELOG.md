#  / Changelog

## [1.16.14] - 2026-07-22

> Adds full support for the new **Gemini 3.6 Flash** family (High / Medium / Low) with registry data live-probed from the running IDE, and fixes the **issue #63** status-bar tooltip clipping under `window.zoomLevel`. Ships registry corrections found during probing: M84's takeover of the "Gemini 3.5 Flash (High)" identity, doubled Flash context limits (128K → 256K), and an M-number substring-collision fix in the context-limit heuristic. Verified with a two-round codex adversarial review, cross-checked probes against two live language-server instances, and a live IDE install test. tsc clean, 21 files / 203 vitest tests green.
>  **Gemini 3.6 Flash** （High / Medium / Low）（ IDE ）， **issue #63**  `window.zoomLevel`  tooltip 。：M84  "Gemini 3.5 Flash (High)" 、Flash （128K → 256K）、 M 。 codex 、 IDE 。tsc ，21  / 203  vitest 。
>
> Thanks **@damifan3** for the clear issue #63 report with screenshots (`window.zoomLevel: 0.5` + a clipped, unscrollable quota table) — it pinned the root cause immediately!
>  **@damifan3**  issue #63 （`window.zoomLevel: 0.5` + ），！

### ✨ Added /

- **Gemini 3.6 Flash (High / Medium / Low) support / Gemini 3.6 Flash（High / Medium / Low）**:
  Live-probed from the running IDE (two language-server instances cross-checked, picker + catalog): `MODEL_PLACEHOLDER_M264` / `M265` / `M266` (`gemini-3.6-flash-high` / `-medium` / `-low`), plus the catalog-only `M196` (`gemini-3.6-flash-tiered`). Registered across all six registry tables — `DEFAULT_CONTEXT_LIMITS` (255,000 fallback; live checkpointer 256,000 / threshold 140,000), `responseModelAliases`, `KNOWN_QUOTA_POOLS` (**gemini** pool, evidenced by provider + checkpointer profile + sort group; without this entry `getQuotaPoolKey()` would fall back to raw `resetTime` and split 3.6 into phantom pools), `STATIC_MODEL_NAME_FALLBACKS`, `activeModelSpecs` (native 1M context / 64K output), and the Models-tab order. 3.6 coexists with 3.5 — the platform now defaults to M264 (tagged "Fast" / "Limited time").
   IDE （，picker + catalog ）：`MODEL_PLACEHOLDER_M264` / `M265` / `M266`（`gemini-3.6-flash-high` / `-medium` / `-low`）， `M196`（`gemini-3.6-flash-tiered`）。——`DEFAULT_CONTEXT_LIMITS`（ 255,000； checkpointer  256,000 /  140,000）、`responseModelAliases`、`KNOWN_QUOTA_POOLS`（**gemini** ， provider + checkpointer  + ； `getQuotaPoolKey()`  `resetTime`， 3.6 ）、`STATIC_MODEL_NAME_FALLBACKS`、`activeModelSpecs`（ 1M  / 64K ） Models 。3.6  3.5 —— M264（ "Fast" / "Limited time"）。

- **Gemini 3.6 Flash pricing / Gemini 3.6 Flash **:
  New `gemini-3.6-flash` family key in `DEFAULT_PRICING`: **$1.50 input / $7.50 output per 1M tokens** (official Gemini API pricing, verified 2026-07-22 — output is cheaper than 3.5 Flash's $9.00). Without this key, 3.6 responseModels cannot fuzzy-match the 3.5 keys and every call would be silently costed at $0 — including costs written into daily archives, permanently under-reporting history.
  `DEFAULT_PRICING`  `gemini-3.6-flash` ：** 1M token  $1.50 /  $7.50**（Gemini API ，2026-07-22 —— 3.5 Flash  $9.00）。 3.6  responseModel  3.5 ， $0——，。

### 🐛 Fixed /

- **Status-bar tooltip clipped under `window.zoomLevel`, with no scrollbar /  tooltip  `window.zoomLevel` ** (issue #63, thanks **@damifan3**):
  VS Code's status-bar hover has a fixed max height and cannot scroll, and the quota table grew one row per model — so under zoom the tooltip bottom (quota rows, credits, CTA) was simply cut off. New setting `antigravityContextMonitor.statusBar.tooltipDensity` (`auto` | `compact` | `full`, default `auto`) plus content-side budgeting in the new pure module `tooltip-budget.ts`: the quota table is capped (compact 3 / normal 5 rows; current model pinned first, scarcest quota next) with an "… and N more models — click to view all" line, low-priority sections fold first (checkpoint block, per-line details), and the "click to view details" CTA always stays last. All three tooltip entry points (active / idle / no-conversation) share the same budget. `auto` compacts when `window.zoomLevel ≥ 0.5`, when quota rows overflow, or under bilingual display pressure; configuration changes hot-reload the tooltip and a one-shot `Tooltip density: …` diagnostic line is logged for field debugging. The full model list remains available in the details panel (click the status bar), which scrolls properly.
  VS Code  hover ，—— tooltip （、、CTA）。 `antigravityContextMonitor.statusBar.tooltipDensity`（`auto` | `compact` | `full`， `auto`）， `tooltip-budget.ts` ：（compact 3  / normal 5 ；、），"…  N ，"；（checkpoint 、）；"" CTA 。 tooltip （ /  / ）。`auto`  `window.zoomLevel ≥ 0.5`、； tooltip， `Tooltip density: …` 。（），。

- **Model registry drift: M84 identity takeover & doubled Flash limits / ：M84  Flash **:
  Live probing showed `gemini-3-flash-agent` now resolves to **M84**, which has taken over the "Gemini 3.5 Flash (High)" identity, while M133 / M132 / M47 have been fully retired platform-side (kept as archived-data fallbacks, marked `[Retired]`). The 3.5 Flash checkpointer limit doubled to 256,000 in 2026-07, so the stale 127,000 static fallbacks for M84 / M20 / M187 were corrected to 255,000 (the intentional −1K offset distinguishes a static fallback from a live capture).
   `gemini-3-flash-agent`  **M84**—— "Gemini 3.5 Flash (High)" ， M133 / M132 / M47 （， `[Retired]`）。3.5 Flash  checkpointer  2026-07  256,000， M84 / M20 / M187  127,000  255,000（ −1K ）。

- **Context-limit heuristic M-number substring collision /  M **:
  `guessContextLimitSpec()` matched placeholder IDs by substring, so `M264` / `M265` / `M266` (all containing `m26`) would have been misclassified as Claude 160K thinking models. Placeholder IDs now match by exact M-number; unknown placeholders defer to live telemetry (returning the "calculating threshold…" shimmer) instead of falling back to keyword guessing. Hardened further after adversarial review: the Flash keyword branch is now generation-aware (pre-3.5 names such as `gemini-2.5-flash` / `gemini-3.1-flash-lite` keep the 128K profile; 3.5+ and unversioned names get 256,000 / 140,000), raw catalog names resolve through registered placeholders first (so `gemini-3-flash` matches M18's limit instead of a keyword guess), display labels resolve to the active ID rather than a retired one (`Gemini 3.5 Flash (High)` → M84), and the `MODEL_UNSPECIFIED` spec was aligned to the doubled Flash profile.
  `guessContextLimitSpec()`  placeholder ID ——`M264` / `M265` / `M266`  `m26`， Claude 160K thinking 。 M ； placeholder ，（"…"）。：Flash （3.5  `gemini-2.5-flash` / `gemini-3.1-flash-lite`  128K ；3.5  256,000 / 140,000）； placeholder （`gemini-3-flash`  M18 ）； ID  ID（`Gemini 3.5 Flash (High)` → M84）；`MODEL_UNSPECIFIED`  Flash 。

- **Bilingual gaps / **:
  The initializing status-bar text and the About-page platform-chip `aria-label`s are now bilingual (previously English-only).
   About  `aria-label` （）。

### ✅ Tests /

- **+50 vs v1.16.13 (153 → 203, 21 files) /  v1.16.13  50 （153 → 203，21 ）**:
  New `tests/statusbar-tooltip.test.ts` (42 cases: quota-row selection, density-mode matrix incl. the zoom 0.5 boundary, CTA-last invariant, compact line budget, "… and N more" interpolation, protected quota-table budget regressions incl. a 45-line full-load scenario, emoji display width) and `tests/models-registry.test.ts` (12 cases: collision guard M264-266 vs M26/M35 incl. a hypothetical M350, Models-tab order, `gemini-3-flash-agent` → M84, 3.6 pricing lookup, plus 4 adversarial-review regression pins — label → active-ID resolution, raw-name/placeholder split closure, UNSPECIFIED spec alignment, generation-aware Flash fallback), plus extended pool-grouping (`KNOWN_QUOTA_POOLS` beats `resetTime` fallback), GM alias-capture, and display-name regression cases.
   `tests/statusbar-tooltip.test.ts`（42 ：、 zoom 0.5 、CTA 、、" N "、 45 、emoji ） `tests/models-registry.test.ts`（12 ： M264-266  M26/M35  M350、Models 、`gemini-3-flash-agent` → M84、3.6 ， 4 —— ID、/placeholder 、UNSPECIFIED 、Flash ），（`KNOWN_QUOTA_POOLS`  `resetTime` ）、GM 。

### 📊 Stats /

- **Files changed**: 13 code (10 modified + `src/tooltip-budget.ts`, `tests/statusbar-tooltip.test.ts`, `tests/models-registry.test.ts` new) + docs
- **TypeScript compile**: Zero errors · **vitest**: 21 files / 203 tests green
- **DailyLedger contract**: untouched (`serialize()` keys unchanged; `hasData` contract tests green) / DailyLedger （`serialize()` ，`hasData` ）

## [1.16.13] - 2026-07-02

> Fixes the Windows-only "LS not found" reported in **issue #62** (Windows 11 + Antigravity v2.1.1): the native discovery branch invoked `wmic` / `powershell.exe` / `netstat` by bare name, so a truncated Extension Host `PATH` silently broke language-server detection. Verified with a three-layer pass — Codex adversarial review (which caught and fixed a PID-range regression), an empty-`PATH` isolation probe, and a live IDE reload test (`PATH check: hasWbem=true` + `LS found pid=… port=…`, 0 errors). tsc clean, 19 files / 153 vitest tests green.
>  **issue #62**  Windows  "LS not found"（Windows 11 + Antigravity v2.1.1）： `wmic` / `powershell.exe` / `netstat`，Extension Host  `PATH` 。——Codex （ PID ）、-`PATH` 、 IDE  reload （`PATH check: hasWbem=true` + `LS found pid=… port=…`，0 ）。tsc ，19  / 153  vitest 。
>
> Reported by **@SecretLUL** with a clear, reproducible Windows 11 / Antigravity 2.1.1 write-up (including the Administrator `launch-failed` crash) that made the root cause easy to pin down — huge thanks!
>  **@SecretLUL** ， Windows 11 / Antigravity 2.1.1 （ `launch-failed` ），——！

### 🐛 Fixed /

- **Windows LS discovery no longer depends on the Extension Host `PATH` / Windows  Extension Host  `PATH`** (issue #62):
  The native Windows branch now invokes `wmic` / `powershell.exe` / `netstat` by absolute `%SystemRoot%` path (`System32\wbem\WMIC.exe`, `System32\WindowsPowerShell\v1.0\powershell.exe`, `System32\NETSTAT.EXE`) via a new exported `buildWindowsExePath()`, mirroring what the WSL branch already did. When Antigravity is launched from the GUI with a truncated `PATH` (e.g. Win11 24H2+/25H2 removed WMIC as a Feature-on-Demand, dropping `System32\wbem`; or a missing `System32\WindowsPowerShell\v1.0`), `execFile` no longer fails with `ENOENT` and silently returns "LS not found". It falls back to the bare name only when `%SystemRoot%`/`windir` is genuinely absent (WSL interop keeps its `/mnt/c/...` paths).
   Windows  `buildWindowsExePath()`  `%SystemRoot%`  `wmic` / `powershell.exe` / `netstat`（`System32\wbem\WMIC.exe`、`System32\WindowsPowerShell\v1.0\powershell.exe`、`System32\NETSTAT.EXE`）， WSL 。 Antigravity  GUI  `PATH` （ Win11 24H2+/25H2  WMIC 、 `System32\wbem`； `System32\WindowsPowerShell\v1.0`），`execFile`  `ENOENT`  "LS not found"。 `%SystemRoot%`/`windir` （WSL  `/mnt/c/...` ）。

- **Robust Windows PID / port parsing / Windows PID **:
  A new exported `extractWindowsPid()` parses both the `wmic` CSV layout (PID in the last column) and the PowerShell `ConvertTo-Csv` layout (quoted PID in the first column), and accepts the full 32-bit Windows PID range — fixing an over-tight `< 1_000_000` cap (caught by the adversarial review) that could have rejected large process IDs the old `wmic`-only path accepted. `netstatLineMatchesPid()` now matches the trailing PID exactly on `LISTENING` lines, fixing a prior `endsWith` bug where PID `123` also matched `1123`. Process matching is case-insensitive but returns the original line unchanged, preserving the exact-case `csrf_token`.
   `extractWindowsPid()`  `wmic` CSV （PID ） PowerShell `ConvertTo-Csv` （ PID ）， 32  Windows PID —— `< 1_000_000` （）， `wmic`  ID。`netstatLineMatchesPid()`  `LISTENING`  PID， `endsWith`  PID `123`  `1123` 。，， `csrf_token` 。

- **Defensive PowerShell fallback / PowerShell **:
  The PowerShell process-scan fallback is now wrapped in `try/catch` with an `existsSync` pre-probe, so an unexpected spawn failure degrades gracefully instead of throwing; `wmic` is only cached as "available" when its output actually contains a `language_server_windows` line.
  PowerShell  `try/catch`  `existsSync` ， spawn ； `wmic`  `language_server_windows` “”。

- **Discovery diagnostics in the Output channel / Output **:
  Discovery now logs a one-shot `PATH check: hasWbem=… hasWindowsPowerShell=… SystemRoot=…` line plus a distinct message at every "return null" exit, all threaded to **Output → "Antigravity Context Monitor"**, so a future "LS not found" report can be diagnosed to the exact failing step without a rebuild.
   `PATH check: hasWbem=… hasWindowsPowerShell=… SystemRoot=…`，“ null”， **Output → “Antigravity Context Monitor”**， "LS not found" 。

### 📝 Docs /

- **README / readme_CN**: added a Windows troubleshooting note — read the `PATH check:` line in the Output channel when the status bar is stuck on `LS not found`, and **do not run Antigravity as Administrator** (it does not help detection and can crash the IDE at launch with `The window terminated unexpectedly (reason: 'launch-failed', code: '18')`, an Electron/Chromium sandbox issue unrelated to this extension).
  **README / readme_CN**： Windows —— `LS not found`  Output  `PATH check:` ，** Antigravity**（， IDE  `The window terminated unexpectedly (reason: 'launch-failed', code: '18')`， Electron/Chromium ，）。

## [1.16.12] - 2026-06-11

> Contributed fix by **@NightMin2002** (PR #61), verified with a three-way independent review (codex adversarial + gemini cross + Claude corner-case) and 7 zero-mock probes against real persisted state — which caught a live specimen of this very bug (an empty ledger stuck at `2026-06-05` for 6 days). Maintainer runtime follow-up included below. Huge thanks to **@NightMin2002**!
>  **@NightMin2002** （PR #61），（codex  + gemini  + Claude ） 7 -mock —— bug （ `dateKey`  `2026-06-05`  6 ）。。 **@NightMin2002**！

### 🐛 Fixed /

- **Today's Ledger recovers from stale empty state / ** (PR #61 by **@NightMin2002**):
  DailyLedger restore now normalizes a previous-day empty ledger to today's date instead of preserving a stale `dateKey` with no data to archive. This prevents new calls from being extracted repeatedly but rejected with `added=0`, which kept the "Today's Ledger / " panel hidden after a no-usage previous day.
  DailyLedger “”， `dateKey`。， `added=0` ，“”。

- **Runtime midnight-crossover self-heal (maintainer follow-up) / （）**:
  The same wedge could still occur without a restart: when an empty ledger survived midnight in a running IDE, archival skipped it (`hasData=false`), its `dateKey` stayed on yesterday, every new call was rejected, and once `lastArchivalDateKey` advanced there was no trigger left to repair it. A new `DailyLedger.normalizeIfStaleEmpty()` single source of truth now normalizes stale/future **empty** ledgers at all three entry points — `restore()`, `performDailyArchival()` and `recordCalls()` — so recording self-heals even the already-persisted wedge form (verified against a live specimen: an empty ledger stuck at `2026-06-05` with `lastArchivalDateKey` already on today). Data-bearing stale ledgers keep the archival-first ordering (still rejected until archived). Also removed the `toLocalDateKey()` double-evaluation race in the restore guard, added one-line startup/polling logs whenever normalization fires, and locked the behavior with 8 new red-first regression tests (19 files / 127 tests green).
  ：IDE ， `hasData=false` 、`dateKey` 、， `lastArchivalDateKey` 。 `DailyLedger.normalizeIfStaleEmpty()` ，`restore()` / `performDailyArchival()` / `recordCalls()` “/”， wedge （： `2026-06-05`  `lastArchivalDateKey` ）；“”。 restore guard  `toLocalDateKey()` ，/， 8 （19  / 127 ）。

- **Normalization never persists an empty snapshot / **:
  A normalization-only (still empty) ledger is no longer written back to durable state at startup or before recording — flushing an empty full snapshot could overwrite another window's just-written data via the known multi-window last-writer-wins issue. Normalization is idempotent at every entry point, and the first `added>0` persist writes the corrected `dateKey`. The startup log now also requires `version === 1` so unrecognized legacy states are not misreported as "normalized". (Caught by the second-round codex adversarial review.)
  /——，。， `added>0`  `dateKey` 。 `version === 1` ，“”。（ codex 。）

## [1.16.11] - 2026-06-03

### 🛠️ Maintainer Review & Hardening /

> Post-merge follow-up after a multi-model review (codex backend + Antigravity frontend + Claude cross-verification) and zero-mock probe testing of PR #60. Huge thanks to **@NightMin2002** for the DailyLedger refactor that solves real archival data-loss pain.
> PR #60 （codex  + Antigravity  + Claude ）-mock 。 **@NightMin2002**  DailyLedger ，。

- **Timezone-independent daily-archival tests / **: `tests/daily-archival-time.test.ts` hard-coded `+08:00` timestamps and only passed under UTC+8 (2 failures elsewhere). Rebuilt them on the local-time `Date` constructor to match `toLocalDateKey()`; the suite now passes under UTC, America/New_York, Australia/Melbourne and Asia/Shanghai (19 files / 118 tests).
  `tests/daily-archival-time.test.ts`  `+08:00`， UTC+8 （ 2 ）。 `Date`  `toLocalDateKey()`； UTC /  /  /  （19  / 118 ）。

- **Quota-reset settlement is now cutoff-aware / **: `settleForQuotaReset()` gained a `cutoffTime` parameter and per-call retention, so a new-cycle call recorded before the proactive settle stays in the active bucket instead of being swept into the old cycle's settled entry.
  `settleForQuotaReset()`  `cutoffTime`  per-call ：、“”，“”。

- **Settled entries preserve thinking & cache-creation tokens /  Token**: `LedgerSettledEntry` now carries `totalThinkingTokens` and `totalCacheCreation`, propagated into midnight archival (no longer hard-coded to 0); per-model rounding remainder is allocated so per-model sums reconcile with the total.
  `LedgerSettledEntry`  `totalThinkingTokens`  `totalCacheCreation` （ 0）；，。

- **No daily-ledger data loss when archival is skipped / **: GMTracker now commits ledger read-positions only after the ledger accepts the calls, so calls rejected during a date-change window are retried instead of being permanently dropped if `performDailyArchival` is skipped or throws.
  GMTracker ； `performDailyArchival` ，。

- **Defensive clamps + safer legacy migration / **: all active-bucket subtractions are clamped with `Math.max(0, …)`; legacy migration now distinguishes `not_found / imported / empty / failed` and only marks itself done on a definitive outcome, so a transient DB-read failure no longer permanently skips recovery.
  “” `Math.max(0, …)` ； `not_found / imported / empty / failed`，，。

- **Ledger revert / restart resilience + settlement completeness / ·**: dedup keys now embed the call identity (`conv:index|exec:…`), so calls made after a conversation is reverted are recorded while unchanged calls that return are still de-duplicated; a conversation reverted below its recorded position lowers the tracker read-position and is reported so its stale ledger ids get cleared; submitted call identities and positions now persist through `serialize()/restore()`, so this protection survives an IDE restart (with legacy-position backfill for older snapshots). Quota-reset settlement additionally clears any restored legacy aggregate not backed by per-call records, and calls with missing/invalid `createdAt` are stamped at observed-time so they settle instead of getting stuck in "today".
  （`conv:index|exec:…`）：，；， tracker  id； `serialize()/restore()` ，IDE （）。 per-call ；/ `createdAt` ，“”。

- **Frontend hardening / **: escaped the model display name / id / placeholder / provider in the Models tab to remove an HTML-injection vector; added VS Code light-theme overrides for the Today's Ledger cards (previously white-on-light, invisible); removed dead code (`thresholdSaved` listener, orphaned `.qt-*` and `data-accent="debug"` CSS, an unused variable).
  ：Models  / ID /  / ， HTML ；“” VS Code （）；（`thresholdSaved` 、 `.qt-*`  `data-accent="debug"` 、）。

- **Docs sync / **: removed the deleted Quota Tracking tab (and its screenshot) from README/readme_CN and dropped `webview-history-tab.ts` from the module list in `docs/technical_implementation.md`.
  ： README / readme_CN （）， `docs/technical_implementation.md`  `webview-history-tab.ts`。

### ⚠️ Known Issues /

- **Multi-window ledger writes are last-writer-wins / **: when multiple IDE windows poll concurrently they each serialize the full `dailyLedgerState`, so one window can overwrite another's just-written ledger. Low probability in practice (writes only on new-call detection); a proper cross-window merge/lock is deferred to a follow-up.
   IDE  `dailyLedgerState`，。（）；/。

### 🐛 Fixed /

- **Quota-reset settlement no longer triggered by resetTime drift /  resetTime **:
  Added a stricter reset-time turnover gate: settlement now requires the previous reset time to have passed and the new reset time to jump forward by a meaningful cycle window. Small future drift or first-use resetTime correction no longer moves today's active ledger into the settled bucket. GM archival filtering now prefers exact archived call IDs when hydrated calls are available, and stale future account-model cutoffs are purged on restore/build/serialize so they cannot keep hiding later same-model calls.
   resetTime ： resetTime ， resetTime 。 resetTime ，“”“”。GM  call ID， account-model cutoff  restore/build/serialize ，。

- **Live GM panels no longer replay stale persisted snapshots / GM **:
  `getUiSummary()` and the UI full-summary path now wait for live GM hydration instead of returning restored `_lastSummary` as if it were current data. The GM Data model cards also require a live `gm.modelBreakdown` and no longer fall back to stale Activity summary fragments. This prevents Context Intelligence, Context Growth, Conversation Distribution, Error Details, and Model Stats from displaying old data as live state after startup or account/model switches.
  `getUiSummary()`  UI full-summary  GM ， `_lastSummary` 。GM Data  `gm.modelBreakdown`， Activity 。/，、、、。

- **Hardened GM model identity capture for M132/M133-style drift /  GM ， M132/M133 **:
  `chatModel.model` is now treated as the authoritative model identity. If GM metadata is missing the model or only resolved through a low-trust `responseModel` alias, the enriched trajectory path can fill it from `steps[].metadata.requestedModel`, `metadata.generatorModel`, or the user planner requested model. `responseModel` alias registration now rejects conflicting remaps and unspecified targets, and each GM call records an optional `modelSource` for diagnostics.
   `chatModel.model` 。 GM ， `responseModel` ， trajectory  `steps[].metadata.requestedModel`、`metadata.generatorModel`  planner requested model 。`responseModel`  unspecified ， GM  `modelSource` 。

- **GM Data containers disappearing after restart or idle restore /  GM **:
  Prevented `GMTracker.fetchAll()` from skipping restored idle conversation stubs whose `calls` array is still empty, and rehydrated file-backed `gmDetailedSummary` into `GMTracker` during startup. This fixes cases where `Context Intelligence`, `Conversations`, `Context Growth`, and `Error Details` vanished until the user re-activated the conversation manually.
   `GMTracker.fetchAll()`  `calls`  idle  stub， `gmDetailedSummary`  `GMTracker`。 ``、``、``、``  GM 、。

- **Missed refresh when only GM details changed /  GM **:
  Replaced the old coarse `hasGMSummaryChanged()` counters-only check with a lightweight signature over model DNA, context growth, tool/error distributions, tool catalog, recent error entries, and per-conversation latest call / checkpoint / system-context content. Panel refresh and persistence now trigger even when totals stay the same but GM detail fields have changed.
   token  `hasGMSummaryChanged()` ， DNA、、/、、， latest call / checkpoint / system-context 。， GM ，。

- **Stale Sessions GM snapshot when call count stayed flat /  Sessions  GM **:
  `monitor-store.ts` now compares latest GM call identity, latest model, credits, and timestamp instead of only `calls.length`, so the Sessions tab keeps up with GM detail changes that do not increase the number of calls.
  `monitor-store.ts`  latest GM call 、、， `calls.length`， Sessions “ GM ”。

- **Recent Activity warm-up no longer hard-capped at 30 and runtime timeline no longer truncates /  30 **:
  Removed the old warm-up tail cap that only injected the last 30 steps per conversation, and stopped trimming the live `recentSteps` runtime buffer. The timeline now keeps the full in-memory recent activity stream for the current session, while persistence still applies a safety cap to avoid uncontrolled state-file growth after restart.
   warm-up “ 30 ”， `recentSteps` 。，，。

- **Midnight archival no longer skipped by early-return poll branches / **:
  Moved the daily archival check to the front half of the polling cycle and refreshed the panel even when there is no current conversation. This fixes cases where crossing midnight with no active chat could leave the previous day unarchived until a later interaction.
  ，“”。， return 。

- **DailyLedger day-bucket boundary hardening / DailyLedger **:
  `DailyLedger.recordCalls()` now rejects calls that fall outside the bucket's local-day window on both sides, blocking not only historical backfill pollution but also future-day calls from being written into the current day's ledger during cross-midnight reload scenarios.
  `DailyLedger.recordCalls()` ，，“”。

- **Quota Tracking UI removed while retaining backend settlement logic /  UI，**:
  Removed the dedicated `Quota Tracking` tab, the related Settings toggle, the About navigation card, and the obsolete `webview-history-tab.ts` renderer. `QuotaTracker` remains in place as a backend-only component for quota-reset settlement, cached-account archival, and GM summary repair, but the panel no longer passes its instance through the webview payload.
   `Quota Tracking` 、、About ， `webview-history-tab.ts` 。`QuotaTracker` ，、 GM ， webview payload 。

- **Removed Settings debug/testing controls / **:
  Deleted the Settings tab's debug/testing card and its private simulate/restore/clear command chain, along with the temporary dev snapshot state. This leaves the production panel focused on user-facing configuration only.
  /，、、，。

### ✅ Tests /

- **Added regression coverage for quota reset filtering and model capture / **:
  Added `tests/reset-time-turnover.test.ts`, `tests/gm-quota-reset-filter.test.ts`, and `tests/gm-model-capture.test.ts` to cover resetTime drift suppression, exact-call quota archival, stale future cutoff cleanup, trajectory model fallback, responseModel alias conflict protection, and authoritative `chatModel.model` preservation.
   `tests/reset-time-turnover.test.ts`、`tests/gm-quota-reset-filter.test.ts`、`tests/gm-model-capture.test.ts`， resetTime 、、 cutoff 、trajectory 、responseModel ， `chatModel.model` 。

- **Added regression coverage for GM restore and detail-refresh paths /  GM **:
  Added `tests/gm-tracker-restore-fetch.test.ts`, `tests/gm-summary-change.test.ts`, and `tests/monitor-store-gm.test.ts` to cover restored idle stub re-fetching, detailed GM summary diffing, and Sessions GM snapshot refresh behavior.
   `tests/gm-tracker-restore-fetch.test.ts`、`tests/gm-summary-change.test.ts`、`tests/monitor-store-gm.test.ts`， idle stub 、GM ， Sessions  GM 。

- **Added time-simulation coverage for rollover and recent-activity behavior / **:
  Added `tests/activity-recent-steps.test.ts`, `tests/daily-ledger-date-filter.test.ts`, and `tests/daily-archival-time.test.ts` to cover full warm-up activity injection, local-day ledger boundary filtering, cross-midnight archival rollover, and stale-ledger startup recovery.
   `tests/activity-recent-steps.test.ts`、`tests/daily-ledger-date-filter.test.ts`、`tests/daily-archival-time.test.ts`， warm-up 、、 rollover， stale ledger 。

### ✨ Added & Refactored /

- **Double-ledger multi-path cost breakdown merging / **:
  Redesigned the "Pricing" tab rendering logic to pass both the settled ledger (`lastLedgerSettled`) and the daily active ledger (`lastTodayLedgerActive`) directly to `buildPricingTabContent()`. Merges active ledger's per-model token metrics (input, output, cache, and thinking) with settled ledger's proportional metrics under a unified dual-ledger merging routine. This resolves the empty pricing card warning ("Cost analysis will appear...") and retains the day's total telemetry (e.g. merging today's $11.64 active cost with $0.818 settled cost for a $12.458 grand total) even when switching to idle/no-conversation sessions.
  “（Pricing）”， `lastLedgerSettled`  `lastTodayLedgerActive`  `buildPricingTabContent()`。， Token ，。/“ GM ”，（ $11.64  $0.818  $12.458 ）。

- **Called custom pricing model highlighting / **:
  Extracted all active responseModel IDs directly from the dual-ledger merged rows to compile a dedicated `calledModelKeys` set, passing it directly to `buildEditablePricingTable()`. Features lookups via `calledModelKeys.has(entry.responseModel)`. This decouples the custom pricing card from the current conversation's volatile memory, ensuring that all models called today remain highlighted across any chat session restarts.
   `rows`  Token  `responseModel` ID  `calledModelKeys`， `buildEditablePricingTable()`。 Summary ，，。

- **Dead code removal for pendingArchives container /  pendingArchives **:
  Removed the deprecated baselined cycles `pendingArchives` and `_pendingArchives` storage, serialize/restore, and reset lifetime routines across `gm/tracker.ts`, `daily-archival.ts`, and `gm/types.ts`, since the new `DailyLedger` now manages both active and settled telemetry as a single source of truth.
   `gm/tracker.ts`、`daily-archival.ts`、`gm/types.ts`、`gm/index.ts`  `gm-tracker.ts`  `pendingArchives` 、、、， `DailyLedger` 。

### ⚙️ Refactored & Optimized /

- **Automatic legacy data migration for seamless upgrades / **:
  Introduced a self-contained `legacy-migration.ts` module to auto-detect pre-2.0 Antigravity settings and SQLite databases (`state.vscdb`) upon extension activation. Extracts historical calendar records and language preferences via a child process invoking `node --experimental-sqlite`. Automatically merges retrieved history into `DailyStore` without overwriting active data.
   `legacy-migration.ts` ， 2.0  Antigravity  SQLite （`state.vscdb`）。 `node --experimental-sqlite` ， `DailyStore`（，），。

- **DailyStore.mergeRecords() for incremental data merging / DailyStore.mergeRecords() **:
  Added a safe merge utility to prevent accidental database overwrites during cross-version data recovery and import tasks.
  ，，。

- **Comprehensive multi-account archival integration tests / **:
  Added `tests/multi-account-archival.test.ts` to ensure data isolation, serialization consistency, and robust multi-account baseline rollover.
   `tests/multi-account-archival.test.ts` ，、、，。

- **Unified Gemini Quota Pool mapping /  Gemini **:
  Merged `gemini-pro` and `gemini-flash` quota pools into a single unified `gemini` pool in `KNOWN_QUOTA_POOLS` (defined in `src/models.ts`), aligning with the mid-2026 platform-level shared quota policy for the Gemini 3.5 model family.
   `gemini-pro`  `gemini-flash`  `gemini` （ `src/models.ts`  `KNOWN_QUOTA_POOLS` ）， 2026  Gemini 3.5 ，。

### ⚙️ Refactored & Optimized /

- **Daily date filter for GMTracker and UI Cards / **:
  In `GMTracker._buildSummary()`, `getNewCallsSinceLastRecord()`, `baselineForQuotaReset()`, and `buildModelCards()`, calls are filtered by checking `Date.parse(createdAt) < dayStartMs`. This prevents historical calls from older or archived conversations from being counted in today's active metrics, while still allowing the "Recent Activity" timeline to render the full history.
   `GMTracker._buildSummary()`、`getNewCallsSinceLastRecord()`、`baselineForQuotaReset()`  `buildModelCards()` ，（`Date.parse(createdAt) < dayStartMs`）。，“”。

- **Skip redundant RPC requests for idle sessions / **:
  Optimized the `GMTracker.fetchAll()` loop by skipping RPC trajectory requests when a conversation is idle, not currently active, and its step count matches the cached state. This resolves the polling lag where concurrently checking dozen of dormant sessions could block initial loading for up to one minute.
   `GMTracker.fetchAll()` ，、， RPC 。 RPC  Language Server 。

- **Quota reset baseline with cutoff time tracking / **:
  Integrated quota reset tracking across both the background polling thread (`pollContextUsage`) and active account stat updates (`processAccountStats`). The tracking now passes the exact quota `resetTime` as a baseline cutoff parameter to `gmTracker.baselineForQuotaReset()`, cleanly separating the old cycle's calls from today's new calls. The legacy day-key check was removed to ensure that pending quota resets from prior days (e.g. after booting up from suspension) are fully settled without UI persistence issues or data confusion.
  （`pollContextUsage`）（`processAccountStats`）， `resetTime`  `gmTracker.baselineForQuotaReset()` 。。，， UI 。

- **Independent DailyLedger for GM call accounting /  DailyLedger **:
  The previous archival system relied on the Language Server's conversation cache, which is volatile — restarting the IDE or the LS dropping old conversations led to zero-data calendar entries. The new `DailyLedger` module records GM calls incrementally after every poll via `GMTracker.getNewCallsSinceLastRecord()`, with position-based tracking and `dedupKey` (cascadeId:arrayIndex) deduplication. Data is bucketed by date + account email and persisted to `globalState`, surviving IDE restarts.
   LS （）—— IDE  LS 。 `DailyLedger` ， GMTracker ， + `dedupKey`（cascadeId:）。+， `globalState`，。

- **Quota-reset settlement decoupled from LS lifecycle /  LS **:
  When a model's quota resets, `DailyLedger.settleForQuotaReset()` freezes the matching pool's accumulated stats into a separate "settled" bucket. This ensures pre-reset usage is preserved even if the LS subsequently drops the conversation data. At midnight, `rollover()` merges all active + settled data into the final daily snapshot for `DailyStore`.
  ，`settleForQuotaReset()` ""。 LS ，。 `rollover()`  + 。

- **daily-archival.ts dual-path data sourcing / daily-archival.ts **:
  `performDailyArchival()` now prioritizes `DailyLedger.rollover()` as the GM data source. Falls back to the legacy `getArchivalSummary()` + `pendingArchives` path when the ledger is empty (e.g., fresh install transition period).
  `performDailyArchival()`  `DailyLedger.rollover()`  GM 。ledger （） `getArchivalSummary()` + `pendingArchives` 。

- **Dynamic Checkpointer limit capture with offset indicator / **:
  The extension dynamically queries the language server via LSP RPC (`GetAvailableModels`) upon connection or reconnection to retrieve genuine model context limits and overrides internal limits. Active parsing resolves and maps both canonical Placeholder IDs and model IDs simultaneously, robustly handling string-formatted values via `parseInt` extraction. Static fallback limits in the codebase are offset by -1,000 (1K) tokens (e.g., Gemini 3.5 Flash fallback is `127,000` instead of `128,000`), serving as a simple status indicator: if you see clean integers (e.g., `128,000`), dynamic capture is active; if you see offset limits (e.g., `127,000`), it has fallen back to static values.
   LS ， LSP RPC ，。 ID  ID ， `parseInt`  String 。 1K (1,000) tokens（ Gemini 3.5 Flash  `127,000`  `128,000`）。 UI ； 1K ，。

- **Removed redundant limits & warning threshold settings and upgraded to percentage-based adaptive warnings / ，**:
  Deprecated and removed the static `contextLimits` settings, the Settings WebView's `Model Context Limits` card, the `compressionWarningThreshold` configuration, and all associated IPC synchronization handlers. Status bar and hover warnings are now directly determined by the model context usage percentage (50% yellow warning, 80% red critical warning). This guarantees optimal warning behaviors automatically scaled for all current and future model architectures.
   `contextLimits` 、`compressionWarningThreshold` 、Webview “”。（50% ，80% ），。

- **Rebuilt the Models Tab's Model Info grid with dynamic capture & exact parameters / “”“”**:
  Removed all hardcoded parameters from the codebase, initializing `activeModelSpecs` as an empty object `{}`. All specifications are dynamically captured via LSP RPC (`GetAvailableModels`) and injected at runtime. Display range is strictly mapped to active UI models (`configs`), filtering out backend command models. Precise numerical displays format lossless exact integers with thousands separators (e.g., `1,048,576 max tokens`) instead of fuzzy estimations (e.g. `1.0M`).
  （ `DEFAULT_MODEL_SPECS`）， `{}`， LS  RPC 。 UI ，。（ `1,048,576 max tokens`），。

- **Removed redundant checkpointer limit from Model Quota cards / **:
  Removed the redundant checkpointer limit display from the individual quota cards to keep the UI clean, lightweight, and focused on a single source of truth.
  “”，，。

### 🐛 Fixed /

- **Active conversation poll skip delay in Recent Activity / “”**:
  Exempted the current active conversation (`!isCurrentActive`) from the `fetchAll` idle skip condition. While the batch skip routine successfully blocks concurrent RPC congestion for dozens of background idle threads during startup, it was overly aggressive and caught the active thread as well. The active conversation now correctly fetches Generator Metadata on every poll, ensuring that async-delayed GM calls from the backend render in the timeline instantly instead of lagging until the next manual step.
   `fetchAll` （`!isCurrentActive`）。，， AI ，“”。 GM 。

- **Language selection persistence /  (thanks @Yeoman-Hamilton, #59)**:
  Originally planned to resolve the display language resetting to Bilingual across IDE sessions. However, developer @Yeoman-Hamilton addressed this in `v1.16.10` with a cohesive `setLanguage` double-write signature and a comprehensive suite of 9 real-file IO persistence tests. Recognizing their implementation is structurally cleaner and better tested, we have adopted their version into this branch and deprecated our draft adaptation.
   IDE 。 v1.16.10 ， @Yeoman-Hamilton  PR #59 。 `setLanguage` ， 9  IO 。，，。

- **Placeholder-data dedup collision causing undercounting / **:
  For RUNNING conversations, the lightweight GM metadata API returns calls with zero tokens and empty stepIndices. The original content-based callId generated identical keys for all calls in the same conversation, causing the ledger to reject valid new calls as duplicates. Fix: tracker now provides an externally-guaranteed unique `dedupKey` (cascadeId:arrayIndex) for each call.
  RUNNING ， GM  API  calls （token  0、stepIndices ）， callId ， ledger 。：tracker  call  `dedupKey`（cascadeId:）。

- **Conversation revert breaking ledger accumulation /  ledger **:
  When a user reverts to an earlier step, the calls array shrinks but `_ledgerPositions` retained the old (higher) value, preventing any subsequent calls from being captured. Additionally, new calls at reused array indices had colliding dedupKeys with previously recorded calls. Fix: (1) clamp position down when calls array shrinks, (2) clear stale dedup IDs for the reverted conversation via `clearRecordedIdsForConversation()`.
  ，calls  `_ledgerPositions` ， call 。， call  call  dedupKey 。：(1)  calls  position ；(2)  `clearRecordedIdsForConversation()`  dedup 。

- **Restore missing Checkpoint cards and resolve virtual step duplication /  Checkpoint **:
  Newer IDE versions deprecated the USER message injection inside `messagePrompts`, rendering the previous regex parser blank. When shadow steps lacked native `stepIdx` values, the key fell back to a shared key (`-1`), causing extractions to override each other. Fix: implemented `extractCheckpointsFromTrajectorySteps(steps)` to parse checkpoints directly from `trajectory.steps` returned by the LSP RPC. Resolved key duplication by allocating high-range virtual step indices (`100000 + i * 100 + checkpointNumber`), and filtered out the raw virtual step IDs (`>= 100000`) in WebView chips.
   IDE  USER  Checkpoint 。， `stepIdx`  Map  Key  `-1` 。： `extractCheckpointsFromTrajectorySteps(steps)`  `trajectory.steps`  checkpoints； `100000 + i * 100 + checkpointNumber`  ID ，， UI。

- **Fix Checkpointer synchronization lock, type parsing, and UI display /  Checkpointer 、**:
  The initial implementation set `hasSyncedCheckpointer = true` before the asynchronous LSP RPC request completed. If the RPC failed or timed out during the early discovery phase, subsequent polling cycles lacked a retry mechanism, silencing the feature. Physical model IDs from the official RPC response (e.g., `gemini-3-flash-agent`) were mismatching canonical Placeholder IDs, and the `max_token_limit` value was returned as a String, which was silently filtered out by strict `typeof` constraints. Fix: introduced `isSyncingCheckpointer` status lock to prevent concurrent reentrance, updated the handler to only mark `hasSyncedCheckpointer = true` upon a successful RPC response (enabling retries on failure), enhanced parsing to resolve physical IDs, introduced `parseInt` to support string-formatted metrics under strict type constraints, and exposed the resolved Checkpointer limit directly in the Monitor Panel's model cards.
   RPC  true， RPC ； ID  canonical ID ， `max_token_limit`  String 。： `isSyncingCheckpointer` ， RPC （）， ID， `parseInt`  String，。

- **Blank model quota on status bar and hover tooltip when idle / **:
  Status bar rendering (`showNoConversation()` and `showIdle()`) filtered out model quota indicators (`quotaSuffix`) and reset countdowns (`resetSuffix`) when there was no active trajectory. In addition, the no-conversation tooltip skipped the `buildQuotaLines()` call table. Fix: updated both methods to accept an optional `modelId` (passing `lastKnownModel`), enabling proper quota rendering under idle/no-conversation states, and restored the full quota table in the no-conversation tooltip.
  ，。，。： `modelId` ，/，。

- **Model quota reset baseline matching mismatch / **:
  On quota reset, display labels (e.g. `["Gemini 3.1 Pro (High)"]`) were passed to `gmTracker.baselineForQuotaReset()`. If the reverse lookup `resolveModelId` failed, it fell back to matching the display label with the raw model ID (e.g., `"MODEL_PLACEHOLDER_M16"`), resulting in 0 matched calls. Fix: introduced `modelIds` in `AccountSnapshot` and `ResetPool`, and updated all `isPoolArchived()`, `baselineForQuotaReset()`, and `archiveExpiredSessions()` handlers to match using stable, canonical Model IDs, while retaining display label fuzzy matching as a fallback for 100% matching coverage.
  ，， Model ID  0，。： `AccountSnapshot`  `ResetPool`  `modelIds` ， Model ID ， Label 。

- **GM data loss during daily calendar archival / **:
  Midnight archival wrote only `gmTracker.getArchivalSummary()` (active cache) to the `DailyStore` calendar snapshot. However, intra-day baselined GM calls in `_pendingArchives` were completely ignored and cleared on `gmTracker.reset()`, causing all calls consumed prior to a quota reset to vanish from the calendar. If the IDE was reloaded or restarted, `_cache.calls` was cleared during serialization, producing zero-data calendar summaries. Fix: updated `performDailyArchival` to explicitly fetch and merge all entries from `gmTracker.getPendingArchives()` (including call counts, tokens, credits, and cost breakdown proportions) into the daily summary before saving to `DailyStore`, ensuring complete daily telemetry even after IDE restarts.
   `DailyStore`。（`_pendingArchives`） `reset()` 。， IDE ，， 0。： `gmTracker.getPendingArchives()` ， IDE ，。

- **Stale quota-reset jump misjudgment in QuotaTracker /  QuotaTracker **:
  Removed the `Math.abs` absolute value check in `QuotaTracker.isCycleEnded` when evaluating resetTime drifts. Originally, any large drift (including timezone offsets or backward adjustments when switching conversations and initializing the language server) was mistakenly treated as a quota reset. Restricting the detection to positive forward jumps (`curMs - cycleMs > 30min`) prevents the "Today's Ledger" active counts from being prematurely settled into the "Settled" list, while still fully capturing genuine server-side resets even across IDE offline periods.
   `QuotaTracker.isCycleEnded`  `Math.abs` 。 LS 、“”。（`curMs - cycleMs > 30`），“”“”，。

- **Startup archival fallback with maximum call telemetry /  active cache **:
  Implemented a robust fallback during startup archival in `performDailyArchival`. If the active cache was cleared due to an IDE reload, it compares the call counts between `liveSummary` and `lastGMSummary` and selects the maximum value, preventing stats from zeroing out after IDE restarts.
   `performDailyArchival` 。 IDE ， `liveSummary`  `lastGMSummary` ，。

### 🎨 UI /

- **"Today's Ledger" and "Settled" panels in GM Data tab / GM """"**:
  Two new UI containers in the GM Data tab display real-time ledger data: a teal/cyan "Today's Ledger" panel showing active call accumulation per model, and an indigo/purple "Settled" panel showing data frozen by quota resets. Both panels clear at midnight after rollover.
  GM  UI ：teal/cyan ""，indigo/purple ""。。

### 📊 Stats /

- **Files changed**: 19 (`package.json`, `src/models.ts`, `src/extension.ts`, `src/statusbar.ts`, `src/webview-panel.ts`, `src/webview-settings-tab.ts`, `src/webview-script.ts`, `src/webview-profile-tab.ts`, `src/webview-icons.ts`, `src/activity-panel.ts`, `src/quota-tracker.ts`, `src/daily-archival.ts`, `src/gm/parser.ts`, `src/gm/tracker.ts`, `src/daily-ledger.ts` *(new)*, `src/legacy-migration.ts` *(new)*, `src/daily-store.ts`, `src/gm/types.ts`, `tests/multi-account-archival.test.ts` *(new)*)
- **TypeScript compile**: Zero errors
- **Tests**: 8 files / 80 tests passing (`npm test` / `npx vitest run`)
---

## [1.16.10] - 2026-05-30

### 🐛 Fixed /

- **Language selection now persists across sessions / ** (thanks @Yeoman-Hamilton, #59): The webview language toggle ( / English / Bilingual) only wrote VS Code `globalState`, but the extension reads its custom `DurableState` JSON file as the source of truth on startup — so a webview language change was silently reset to "Bilingual" on every restart (the command-palette path was unaffected). `setLanguage()` now also writes the durable state bucket when invoked from the webview, so the choice survives restarts.
  webview （ / English / ） VS Code `globalState`， `DurableState` JSON ， webview ""（）。 `setLanguage()`  webview ，。

### ✨ Improved /

- **Hardened webview language input validation /  webview **: Added an `isLanguage()` type guard; the webview `switchLanguage` handler now rejects invalid values instead of an unchecked `as Language` cast.
   `isLanguage()` ；webview `switchLanguage` ， `as Language` 。
- **Fixed latent DurableState cross-instance aliasing /  DurableState **: `DurableState._load()` now returns fresh nested objects instead of shallow-spreading the shared `DEFAULT_STATE` singleton, preventing state bleed between instances (no impact in single-instance production, but required for reliable persistence tests).
  `DurableState._load()` ， `DEFAULT_STATE` ，（，）。
- **Added persistence regression tests / **: New `tests/i18n-persistence.test.ts` (9 cases: round-trip, fallback double-write, webview path, corner cases, multi-instance isolation) using zero-mock real-file IO. Also fixed `.gitignore` erroneously ignoring the entire `tests/` directory, so test sources are now version-controlled.
   `tests/i18n-persistence.test.ts`（9 ：、fallback 、webview 、corner case、）， mock  IO。 `.gitignore`  `tests/` ，。

## [1.16.9] - 2026-05-20

### ✨ Improved /

- **Gemini 3.5 Flash model adaptation / Gemini 3.5 Flash **: Added M20 (Gemini 3.5 Flash Medium) to `DEFAULT_CONTEXT_LIMITS` (128K), `KNOWN_QUOTA_POOLS` (`gemini-flash`), and `package.json` defaults. Updated M132 comments to reflect its new identity as "Gemini 3.5 Flash (High)".
   M20（Gemini 3.5 Flash Medium）（128K）、（`gemini-flash`） `package.json` 。 M132  "Gemini 3.5 Flash (High)"。

- **Gemini 3.5 Flash pricing / Gemini 3.5 Flash **: Added `gemini-3.5-flash` and `gemini-3-flash-a` pricing entries ($1.50/$9.00 per 1M input/output, AI Studio standard tier). `PRICING_LAST_UPDATED` updated to 2026-05-20.
   `gemini-3.5-flash`  `gemini-3-flash-a` （$1.50/$9.00，AI Studio ）。 2026-05-20。

- **About tab platform scope notice / **: Added Antigravity product line chips (IDE / Desktop / SDK / CLI) to the About tab hero section. IDE is highlighted as the active target; Desktop is marked as a separate companion project; SDK and CLI are not supported. All chips include ARIA accessibility attributes and flex-wrap for narrow viewports.
  About  Hero  Antigravity （IDE /  / SDK / CLI）。IDE ；；SDK  CLI 。 chip  ARIA ，。

- **Error dedup normalization enhancement / **: Expanded `normalizeErrorMessage()` with ~15 new rules to merge semantically identical errors that only differ in file paths, TCP endpoints, model names, token limits, or URL subdomains. Real-world 61-kind error catalog reduced to ~29 kinds.
   `normalizeErrorMessage()`  15 ，、TCP 、、token  URL 。 61  29 。

### 🐛 Fixed /

- **M133 display name fallback / M133 **: M133 (checkpoint ghost, `gemini-3-flash-b`) was not in `clientModelConfigs`, so its display name relied on M132's API label. After M132 was renamed to "Gemini 3.5 Flash (High)", M133 fell back to raw placeholder ID. Fix: M133 retains "Gemini 3 Flash" in `STATIC_MODEL_NAME_FALLBACKS` (its correct legacy identity), while M132 is "Gemini 3.5 Flash" and new M20 is "Gemini 3.5 Flash (Medium)" — all three have unique names to prevent reverse-lookup ambiguity.
  M133  clientModelConfigs ， M132  API label。M132  M133  ID。：M133  "Gemini 3 Flash"（），M132  "Gemini 3.5 Flash"， M20  "Gemini 3.5 Flash (Medium)"——，。

- **Model DNA key resolution priority /  DNA key **: `getModelDNAKey()` now resolves `responseModel` alias first (e.g. `gemini-3-flash-b` → `MODEL_PLACEHOLDER_M133`) before falling back to display name resolution. This prevents stale persisted entries (keyed by old display name "Gemini 3 Flash") from creating ghost "cached" cards in the Models tab that could not be merged with the current M133 entry.
  `getModelDNAKey()`  responseModel  key，（ "Gemini 3 Flash"  key）。

- **Legacy model name reverse lookup / **: `resolveModelId()` now includes reverse lookup for `LEGACY_MODEL_NAMES` values, allowing old display names persisted in model DNA and daily store to resolve back to their canonical model IDs.
  `resolveModelId()`  `LEGACY_MODEL_NAMES` ， ID。

### 🛡️ Hardened /

- **ReDoS protection in error normalization /  ReDoS **: Added input length guard (2000 char cap) to `normalizeErrorMessage()` to prevent catastrophic regex backtracking on pathological input. 100K-char stress test: 16.6s → 9ms.
  `normalizeErrorMessage()` （2000 ），。100K ：16.6s → 9ms。

### 📊 Stats /

- **Files changed**: 6 (`src/models.ts`, `src/pricing-store.ts`, `src/model-dna-store.ts`, `src/webview-about-tab.ts`, `src/gm/summary.ts`, `package.json`)
- **TypeScript compile**: Zero errors
- **Contributors**: Thanks to [@NightMin2002](https://github.com/NightMin2002) for the initial PR with Gemini 3.5 Flash adaptation, pricing updates, and error dedup enhancements.

---



## [1.16.8] - 2026-05-19

### ✨ Improved /

- **Context limit corrections from API diagnostic data /  API **: Updated `DEFAULT_CONTEXT_LIMITS` in `models.ts` and `contextLimits` defaults in `package.json` based on real Checkpointer `max_token_limit` / `token_threshold` values extracted from `GetAvailableModels` RPC. Gemini 3.1 Pro: 120K -> 128K. Gemini 3 Flash (M133/M132/M84/M47): 160K -> 128K (matches observed compression trigger at ~128K). GPT-OSS 120B: 128K -> 80K (cp_limit=80000). Claude limits unchanged at 160K.
   `GetAvailableModels` RPC  Checkpointer （`max_token_limit` / `token_threshold`）， `models.ts`  `package.json` 。Gemini 3.1 Pro: 120K -> 128K。Gemini 3 Flash (M133/M132/M84/M47): 160K -> 128K（ 128K ）。GPT-OSS 120B: 128K -> 80K（cp_limit=80000）。Claude  160K。

- **Gemini 3 Flash M132/M133 model transition / Gemini 3 Flash M132/M133 **: Gemini 3 Flash physical model IDs now include M133 (`gemini-3-flash-b`) and M132 (`gemini-3-flash-agent`). Added both to `DEFAULT_CONTEXT_LIMITS` (128K), `KNOWN_QUOTA_POOLS` (`gemini-flash`), and `package.json` defaults. Added static display fallbacks for current and legacy model IDs so startup/archive views do not expose raw internal IDs.
  Gemini 3 Flash  ID  M133（`gemini-3-flash-b`） M132（`gemini-3-flash-agent`）。（128K）、（`gemini-flash`） `package.json` 。 ID ， ID。

- **Settings model limits "Restore Defaults" button / ""**: Added a "Restore Defaults" button next to "Save All" in the Settings model limits section. Clicking it resets all model limit inputs to their `getContextLimit()` defaults and clears the explicit `contextLimits` override, so future built-in default changes are not masked by stale saved values. "Save All" now persists only values that differ from defaults. Input elements now carry `data-default` attributes for client-side default tracking.
  ""。 `getContextLimit()` ， `contextLimits` ，。""。 `data-default` 。

### 🔧 Hardening /

- **Quota pool grouping / **: Account snapshots and low-quota notifications now use the same stable `getQuotaPoolKey()` grouping as `QuotaTracker`, preventing unrelated known pools with identical `resetTime` strings from being merged.
   `QuotaTracker`  `getQuotaPoolKey()` ， `resetTime` 。

- **Context limits migration v2 /  v2**: Startup migration clears stale explicit defaults saved by older versions (`120K` Gemini Pro, `160K` Flash, `128K` GPT-OSS) so corrected v1.16.8 defaults can take effect while preserving unrelated custom limits.
  （Gemini Pro `120K`、Flash `160K`、GPT-OSS `128K`）， v1.16.8 ，。

### 📚 Documentation /

- Updated `README.md`, `readme_CN.md`, `docs/technical_implementation.md`, and `docs/project_structure.md` to describe the v1.16.8 platform thresholds, restore-defaults behavior, and current test coverage.
   `README.md`、`readme_CN.md`、`docs/technical_implementation.md`  `docs/project_structure.md`， v1.16.8 、。

### 📊 Stats /

- **Files changed**: 13 (`src/models.ts`, `src/extension.ts`, `src/webview-script.ts`, `src/webview-settings-tab.ts`, `src/webview-about-tab.ts`, `tests/extension-selection.test.ts`, `tests/webview-script.test.ts`, `package.json`, `README.md`, `readme_CN.md`, `docs/technical_implementation.md`, `docs/project_structure.md`, `CHANGELOG.md`)
- **TypeScript compile**: Zero errors
- **Tests**: 5 files / 63 tests passing (`npm test`)

---

## [1.16.7] - 2026-05-14

### ✨ Added /

- **AI Credits status bar integration /  AI **: Status bar now shows real-time AI Credits balance (e.g. `⚡14,701`) as a new segment. Credits are fetched via `LanguageServerService/GetUserStatus` and displayed in full numeric format (no abbreviation). The segment is automatically hidden when credits are zero. Controlled by new `statusBar.showAiCredits` toggle in Settings (default: enabled).
   AI （ `⚡14,701`）， `GetUserStatus` ，。。 `statusBar.showAiCredits` （）。

- **Status bar `||` separator format /  `||` **: All status bar segments are now wrapped with `||` on both sides, e.g. `|| ⚠ 121.2k/160k || 🟡40% || ⏳4h6m || ⚡14,701 ||`. The icon is inside the first `||` pair for visual consistency.
   `||` ， `||` 。

- **Profile tab billing day setting / **: Moved the monthly billing day configuration from Settings to the Profile tab as an inline input with spinner buttons, save button, and descriptive explanation text. Users can set their subscription renewal date (1-31) directly in the Profile page. Setting to 0 disables the countdown. The "Expiry date not set" badge links to the input below via smooth scroll.
  ，、、。 0 。""。

- **Credits expiry countdown / **: Profile tab shows a dynamic badge next to credits: "Expires today / ", "Xd until expiry / X", or "Expiry date not set / ". Status bar tooltip also displays the countdown. External "Activity Dashboard / " link opens `antigravity.google/g1-activity`.
  （ / X / ）。 tooltip 。""。

- **Zero-credits UI state /  UI **: When credits are zero, status bar and tooltip hide the credits segment (no wasted space). Profile tab still shows "AI Credits: 0" with the expiry badge if billing day is configured, so users can track their cycle even without active credits.
   tooltip 。 "AI : 0" （），。

### ✨ Improved /

- **Num-spinner body delegation /  spinner **: Migrated all `.num-spinner-btn` click handlers from direct `addEventListener` binding to `document.body` click delegation. This ensures spinner buttons work reliably across all tabs (including Profile) regardless of DOM rebuilds during polling refreshes.
   spinner  body ， DOM 。

- **Profile billing day save via delegation / **: The billing day save button uses body-level click delegation (same pattern as other panel buttons), ensuring it survives innerHTML replacements from polling updates.
   body ，。

- **Per-account billing day / **: Each account now has its own billing day setting, stored as an `email → day` map. The account panel shows expiry countdown per-account (only if that account's billing day is configured).
  （→），。（）。

- **Durable billing day storage / **: Billing days are now stored in `durableFileGlobalState` (JSON file) instead of VS Code settings. Data survives extension uninstall/reinstall, consistent with how account snapshots are persisted.
   VS Code settings  durable state JSON ，，。

- **Instant billing day refresh on account switch / **: When the active account changes, the status bar billing day countdown updates immediately without waiting for the next polling cycle.
  ，。

- **Raw display for Context Intelligence / **: Removed the rudimentary Markdown rendering for all Context Intelligence items (MCP servers, checkpoints, system preambles, etc.) in favor of high-fidelity raw text blocks. Added a distinct dashed divider and "ORIGINAL USER PROMPT" label specifically to the "User Rules" section.
  “”（ MCP Server、Checkpoint、） Markdown ，（），。“” `ORIGINAL USER PROMPT / ` ，。

### 🔧 Hardening (post-PR multi-model review) / （）

- **DST-safe billing-day countdown / DST **: Extracted a shared helper `src/billing-day.ts` that computes the calendar-day delta using `Date.UTC(y,m,d)` instead of `Math.ceil(ms/86400000)`. Replaces three duplicated implementations in `statusbar.ts`, `webview-profile-tab.ts`, and `activity-panel.ts`. The previous logic added 1 extra day when the interval crossed a daylight-saving boundary (e.g. `TZ=Australia/Melbourne, 2026-03-31 → billingDay=30` returned 31 instead of 30).
   helper `src/billing-day.ts`， `Date.UTC` ， 3 ， 1  bug。
- **Instant status bar refresh on save / **: `setAccountBillingDay()` now calls `applyDisplayPrefs() + statusBar.update(currentUsage)` when the saved email is the current account, so users no longer have to wait for the next polling cycle.
  ，。
- **Input validation hardening / **: `setAccountBillingDay()` now rejects non-integer days, untrimmed emails, and unknown accounts; `restoreBillingDays()` validates every entry from durable state and drops malformed records to prevent webview HTML injection via corrupted JSON.
   / ；， webview。
- **A11y `prefers-reduced-motion` / **: The `refreshPulse` animation on `gai-refresh-today` now respects `prefers-reduced-motion: reduce`, matching the other animations in this codebase (`starTwinkle`, `heartbeat`, `pauseBlink`).
   `prefers-reduced-motion`，。
- **Light theme overrides / **: Added `body.vscode-light` overrides for `.billing-day-inline` and `.gai-refresh-badge*` so the new UI remains visible on light themes (the original `rgba(255,255,255,0.02)` background blended into white).
  ，。
- **a-tag scroll-jacking fix / **: `data-scroll-to` delegation now calls `e.preventDefault()` to stop the browser from running the `<a>` default action before smooth-scroll.
   `<a data-scroll-to>` ，。
- **Save feedback for invalid email / **: Profile billing-day save now shows a `!` feedback when the input lacks a `data-email`, instead of silently bailing out.
   UI ，。
- **Durable persistence visibility / **: `durableFileGlobalState.update()` now logs caught write errors instead of silently swallowing them; the in-memory mirror behavior is preserved.
   log，；mirror 。

### 📊 Stats /

- **Files changed**: 11 (`src/billing-day.ts` *(new)*, `src/statusbar.ts`, `src/extension.ts`, `src/activity-panel.ts`, `src/webview-panel.ts`, `src/webview-profile-tab.ts`, `src/webview-settings-tab.ts`, `src/webview-script.ts`, `src/webview-styles.ts`, `src/durable-state.ts`, `package.json`)
- **TypeScript compile**: Zero errors
- **Tests**: 6 files / 57 tests passing (1 new `tests/billing-day.test.ts` covering 31-on-short-month, leap year, year boundary, today-is-billing-day, and DST transitions)
- **Review pipeline**: codex (backend) + gemini (frontend) + claude (orchestration) + codex adversarial-review (fix)

---

## [1.16.6] - 2026-05-12

### ✨ Improved /

- **Gemini M16/M84 model ecosystem adaptation / Gemini M16/M84 **: Adapted to Gemini platform-level model remapping where M16 replaced M37 as Gemini 3.1 Pro (High) and M84 replaced M47 as Gemini 3 Flash. Added static context limits (M16: 120K, M84: 160K) and quota pool mappings to `models.ts`. Added `gemini-pro-default` pricing entry to `pricing-store.ts` to fix cost calculation for M16's responseModel.
   Gemini ：M16  M37  Gemini 3.1 Pro (High)，M84  M47  Gemini 3 Flash。 `models.ts` （M16: 120K，M84: 160K）。 `pricing-store.ts`  `gemini-pro-default` ， M16 。

- **responseModel reverse alias resolution / responseModel **: Added `responseModelAliases` registry and `registerResponseModelAlias()` in `models.ts`. When GM data reveals that `gemini-pro-default` maps to `MODEL_PLACEHOLDER_M16`, the alias is automatically registered so `normalizeModelDisplayName('gemini-pro-default')` correctly resolves to "Gemini 3.1 Pro (High)" instead of displaying the raw engine name. `resolveModelId()` now checks this alias map as an additional lookup layer. `gm/parser.ts` calls `registerResponseModelAlias()` during GM entry parsing to auto-learn mappings.
   `models.ts`  `responseModelAliases`  `registerResponseModelAlias()` 。 GM  `gemini-pro-default`  `MODEL_PLACEHOLDER_M16` ，， `normalizeModelDisplayName('gemini-pro-default')`  "Gemini 3.1 Pro (High)"，。`resolveModelId()` 。`gm/parser.ts`  GM  `registerResponseModelAlias()` 。

- **Diagnostic short ID suffix on model display names / **: `normalizeModelDisplayName()` now appends the model's internal short ID as a suffix, e.g. "Gemini 3.1 Pro (High) (M16)", "Claude Opus 4.6 (Thinking) (M26)". This makes platform-level model ID changes (such as M37->M16 remapping) immediately visible in the Cost tab, GM Data, Model cards, and Monitor dashboard, serving as an early-warning canary for model ecosystem shifts. `resolveModelId()` automatically strips the suffix for backward compatibility with persisted data. **Disabled by default** — controlled via the new `showModelInternalId` setting (see below).
  `normalizeModelDisplayName()` ， "Gemini 3.1 Pro (High) (M16)"、"Claude Opus 4.6 (Thinking) (M26)"。 ID （ M37->M16 ） UI 。`resolveModelId()` 。****—— `showModelInternalId` 。

- **Show Model Internal ID setting /  ID **: Added `antigravityContextMonitor.showModelInternalId` setting (default: `false`) with a toggle in the Settings tab under "Advanced Display". When enabled, all model display names append their internal short ID (e.g. `(M16)`, `(M26)`) and the status bar tooltip shows the shadow/checkpoint model identifier. Changes take effect immediately without reload.
   `antigravityContextMonitor.showModelInternalId` （ `false`），「」。（ `(M16)`、`(M26)`）， tooltip /。，。

- **Cost aggregation merges same-model rows / **: `calculateCosts()` in `pricing-store.ts` and `buildMonthlyCostSummary()` in `pricing-panel.ts` now merge cost rows by base model name (via new `getModelBaseName()`). Models sharing the same display name but different internal IDs (e.g. M37 and M16 both being "Gemini 3.1 Pro (High)") are combined into a single cost row with summed totals, instead of appearing as separate entries.
  `pricing-store.ts`  `calculateCosts()`  `pricing-panel.ts`  `buildMonthlyCostSummary()`  base （ `getModelBaseName()`）。 ID（ M37  M16  "Gemini 3.1 Pro (High)"），。

- **Legacy model name fallback / **: Added `LEGACY_MODEL_NAMES` static map in `models.ts` for retired model IDs (M37 -> "Gemini 3.1 Pro (High)", M47 -> "Gemini 3 Flash"). Historical calendar and cost data that references these retired IDs now displays proper model names instead of raw placeholder strings.
   `models.ts`  `LEGACY_MODEL_NAMES` ， ID（M37 -> "Gemini 3.1 Pro (High)"，M47 -> "Gemini 3 Flash"）。 ID 。

- **Account panel shows credits per account / **: `AccountSnapshot` now stores `credits` (from `availableCredits`). Each account card in the popover displays credit chips (e.g. "GOOGLE ONE AI **18,350**") below the email line, making it easy to compare balances across multi-account setups.
  `AccountSnapshot`  `credits`（ `availableCredits`）。（ "GOOGLE ONE AI **18,350**"），。

- **Account card layout overhaul / **: Identity section now shows 4 distinct rows: name + status, email, plan badge, and credits. Quota pool rows moved progress bar to far-right for consistent alignment. Removed popover-specific `flex-wrap: wrap` override that forced pools onto a separate line, eliminating the empty space at top-right.
  ：+、、、。。 popover  `flex-wrap: wrap` ，，。

### 📊 Stats /

- **Files changed**: 10 (`src/models.ts`, `src/tracker.ts`, `src/extension.ts`, `src/pricing-store.ts`, `src/pricing-panel.ts`, `src/webview-settings-tab.ts`, `src/webview-script.ts`, `src/statusbar.ts`, `src/activity-panel.ts`, `src/webview-styles.ts`, `src/webview-panel.ts`, `package.json`)
- **TypeScript compile**: Zero errors

---


## [1.16.5] - 2026-05-07

### 🐛 Fixed /

- **Workspace switch no longer leaves the monitor blank / **: When Antigravity keeps reporting a stale workspace URI after a project switch, the monitor now keeps current-workspace RUNNING conversations first, then falls back to a RUNNING conversation from the shared language server. This covers the real “new workspace is active but filtered out” failure without changing the normal priority order. The selected cross-workspace trajectory is also included in the recent usage scope so the WebView and persisted monitor snapshot stay consistent.
   Antigravity  workspace URI ， RUNNING ， RUNNING 。“ workspace ”，。 trajectory  recent usage scope， WebView 。

### 🧪 Tests /

- Added unit coverage for RUNNING trajectory selection: current-workspace RUNNING still wins, cross-workspace RUNNING fallback is explicit, the old no-workspace RUNNING path still works, and cross-workspace active usage is included in the recent usage list.
   RUNNING trajectory ： RUNNING 、 RUNNING 、 workspace RUNNING ， recent usage 。

### 📝 Docs /

- Updated README, Chinese README, technical implementation notes, and project structure notes for the v1.16.5 behavior. `CHANGELOG-v2.md` remains as an old-link compatibility pointer; new release notes still belong in `CHANGELOG.md` only. Thanks to @NightMin2002 for the original [PR 52](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/52).
   v1.16.5  README、 README、。`CHANGELOG-v2.md` ； `CHANGELOG.md`。 @NightMin2002  [PR 52](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/52)。

### ✅ Validation /

- `npm test`: 56 tests passed across 5 test files.
- `npm run compile`: passed.
- `npm run package`: produced `antigravity-context-monitor-1.16.5.vsix`.
- Antigravity CLI isolated install probe listed `agi-is-going-to-arrive.antigravity-context-monitor@1.16.5`.

---

## [1.16.4] - 2026-05-06

### ✨ Improved /

- **Cost tab visual hierarchy and safer pricing editor / Cost **: Refined the Cost tab with clearer sections, blue tab styling, structured notes, and row-based pricing editing. The pricing editor now shows called models plus built-in default pricing models, but only persists rows that are already custom or actually changed by the user.
   Cost 、、。，。

- **Models tab row layout / Models **: Reworked model info cards into full-width rows with compact stats on the left and expandable technical details on the right.
  ，，。

- **GM Data tool catalog UX / GM Data **: Tool catalog is now collapsible, uses smarter chip tooltips, and includes a clear action that removes stale catalog entries without resetting tool ranking counts.
  ，chip tooltip ，、。

### 🐛 Fixed /

- **CHECKPOINT shadow model display / CHECKPOINT **: CHECKPOINT steps no longer overwrite the user-visible model in the status bar. The internal checkpoint model is still shown as diagnostic context when available.
  CHECKPOINT ； checkpoint 。

- **Tool catalog clear persistence / **: Clearing the tool catalog now updates both normal tracker state and file-backed GM summary state, preventing old catalog entries from returning after reload.
   tracker  GM summary ，。

- **Empty `responseModel` pricing edge case /  `responseModel` **: Placeholder GM data with an empty `responseModel` no longer hides all built-in pricing rows or renders editable rows with an empty model key.
   `responseModel`  placeholder GM ， key 。

### 📝 Docs /

- Updated `README.md`, `readme_CN.md`, `CHANGELOG.md`, `docs/project_structure.md`, and `docs/technical_implementation.md` for the v1.16.4 code and validation state. `CHANGELOG.md` is now the canonical changelog; `CHANGELOG-v2.md` is kept only as an old-link compatibility pointer. Thanks to @NightMin2002 for the original [PR 51](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/51).
   v1.16.4  README、 README、、。`CHANGELOG.md` ，`CHANGELOG-v2.md` 。 @NightMin2002  [PR 51](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/51)。

### ✅ Validation /

- `npm test`: 49 tests passed.
- `npm run compile`: passed.
- `npm run package`: produced `antigravity-context-monitor-1.16.4.vsix`.
- Antigravity CLI isolated install probe listed `agi-is-going-to-arrive.antigravity-context-monitor@1.16.4`.

---

## [1.16.3] - 2026-04-30

### 🐛 Fixed /

- **🔥 Model quota showing 100% when actually exhausted (proto3 regression) /  100%（proto3  bug）**: The v1.16.1 fix (`?? 0` → `?? 1`) corrected untouched-quota display but introduced a regression: when quota is truly exhausted, proto3 JSON serialization omits `remainingFraction` (default `0.0` is elided), and `?? 1` incorrectly treated this as "full". Fix: replaced blind `?? 1` with `resolveRemainingFraction()` that uses `resetTime` as discriminator — epoch `1970-01-01T00:00:00Z` (or empty) means untouched → 1.0; real future date means exhausted (proto3 default omission) → 0.0; explicit value used as-is.
  v1.16.1 （`?? 0` → `?? 1`） 0% ，：，proto3 JSON  `remainingFraction`（ `0.0` ），`?? 1` ""。： `resolveRemainingFraction()`  `?? 1`， `resetTime` ——epoch （100%），（proto3  → 0%），。

### 📝 Docs /

- Updated version to 1.16.3 across `package.json`, `README.md`, `readme_CN.md`, and `CHANGELOG.md`.
   `package.json`、`README.md`、`readme_CN.md`  `CHANGELOG.md`  1.16.3。

---

## [1.16.2] - 2026-04-29

### 🧹 Refactor /

- **Simplify Settings storage stats — remove 7 redundant cards (#49)**: Reduced Settings tab's "Persistent Storage" section from 9 stat cards to 2 (File Size + Calendar Days). Removed 7 cards that duplicated stats already shown in GM Data, Cost, and Calendar tabs: GM Calls, Input Tokens, Output Tokens, Credits Used, Est. Total Cost, Archival Days (identical to Calendar Days), Calendar Cycles (equivalent to days). Cleaned up dead code: `formatTokenCount()`, `computeAllTimeCost()`, and 7 `StorageDiagnostics` interface fields.
   Settings 「」：9  2 （ + ）。 7  GM //。：`formatTokenCount()`、`computeAllTimeCost()`  7  `StorageDiagnostics` 。

### 📝 Docs /

- Updated version to 1.16.2 across `package.json`, `README.md`, `readme_CN.md`, and `CHANGELOG.md`.
   `package.json`、`README.md`、`readme_CN.md`  `CHANGELOG.md`  1.16.2。

---

## [1.16.1] - 2026-04-28

### 🐛 Fixed /

- **🔥 Model quota always showing 0% for full-quota users /  0%**: Fixed a critical bug where all model quotas displayed 0% even when the user had full credits (e.g., Pro plan with prompt=500, flow=100). Root cause: the Language Server omits the `remainingFraction` field from `quotaInfo` when quota is untouched (full), but the code incorrectly defaulted missing values to `0` (exhausted) instead of `1` (full). This caused false "Low quota" warnings and red indicators for every model. Fixed the default from `?? 0` to `?? 1` across 4 locations (`tracker.ts`, `quota-tracker.ts`, `extension.ts`), and corrected the `hasUsage` detection logic that also treated missing `remainingFraction` as "consumed".
   bug： 0%，。： `quotaInfo.remainingFraction` ， `0`（） `1`（）。。 4  `?? 0` → `?? 1` ， `hasUsage` 。

### 📝 Docs /

- Updated version to 1.16.1 across `package.json`, `README.md`, `readme_CN.md`, and `CHANGELOG.md`.
   `package.json`、`README.md`、`readme_CN.md`  `CHANGELOG.md`  1.16.1。

---

## [1.16.0] - 2026-04-26

### 🚀 Major /

- **Full-stack evolutionary improvements**: Merged 71 commits from contributor @NightMin2002 covering GM-only Timeline rewrite, full UI modernization, precise cost analysis, context intelligence, multi-account architecture, lossy persistence (~245MB → ~1MB state files), daily archival refactor, and code modularization (activity/ and gm/ modules).
  ： @NightMin2002  71 ， GM-only Timeline 、 UI 、、、、（~245MB → ~1MB ）、、（activity/  gm/ ）。

### 🐛 Fixed /

- **creditCallCount double-counting**: Fixed duplicate `creditCallCount` increment in `gm/summary.ts` that inflated credit-bearing call counts by 2x.
   `gm/summary.ts`  `creditCallCount`  2  bug。

- **recentErrors cap inconsistency**: Aligned hardcoded `30` in `gm/tracker.ts` to match `MAX_RECENT_ERRORS = 20` constant in `gm/summary.ts`.
   `gm/tracker.ts`  `30`  `gm/summary.ts`  `MAX_RECENT_ERRORS = 20`。

- **Undefined CSS variable**: Added missing `--color-warn-border` CSS custom property to `:root` in `webview-styles.ts`, fixing invisible border on `.cost-chip-total` in dark theme.
   `--color-warn-border` CSS ， `.cost-chip-total` 。

- **Dead import cleanup**: Removed unused `toLocalDateKey` import from `extension.ts`.
   `extension.ts`  `toLocalDateKey` 。

- **Redundant function call**: Removed duplicate `checkCachedAccountResets()` call inside try block (already called in finally block) in `extension.ts`.
   `extension.ts`  try  `checkCachedAccountResets()` （finally ）。

### 📝 Docs /

- Updated version to 1.16.0 across `package.json`, `readme.md`, `readme_CN.md`, and `changelog.md`.
   `package.json`、`readme.md`、`readme_CN.md`  `changelog.md`  1.16.0。

---

## [1.15.1] - 2026-04-14

### 🐛 Fixed /

- **Status Bar Plan Tier Cache / **: Fixed a stale hover-label bug where the status bar could keep showing an old secondary plan tier such as `Google AI Ultra` after Antigravity stopped returning the latest `userTierName`. `StatusBarManager.setPlanName()` now always overwrites the cached tier value, and an empty latest tier explicitly clears the old suffix.
  ： Antigravity  `userTierName` ，， `Google AI Ultra`。 `StatusBarManager.setPlanName()` ， tier 。

### 🧪 Tests /

- **Status Bar Hover Regression Test / **: Added a regression test covering the transition from `Pro · Google AI Ultra` to `Pro` when the newest tier field becomes empty.
  ， tier ， `Pro · Google AI Ultra`  `Pro` 。

- **Timezone-Safe Reset-Time Tests /  reset-time **: Updated `reset-time.test.ts` to derive expected absolute local time from the current runtime timezone instead of hardcoding a single timezone-specific clock value. This makes `npm test` pass consistently across environments.
   `reset-time.test.ts`，，， `npm test` 。

### 📝 Docs /

- Refreshed README, README_CN, and technical docs for the `v1.15.1` release. Thanks to contributor @NightMin2002 for surfacing the stale plan-tier behavior and helping narrow the safe merge scope.
   README、README_CN  `v1.15.1` 。 contributor @NightMin2002 ，。

---

## [1.15.0] - 2026-04-10

### 🐛 Fixed /

- **🔥 Stale LS Connection After Antigravity Update — workspace_id Architecture Change / Antigravity  LS — workspace_id **: Fixed a critical bug where the context monitor stopped tracking real-time data after Antigravity updated to v1.22.2+. Root cause: Antigravity 1.22.2 changed its Language Server (LS) architecture from per-workspace processes (with `--workspace_id` argument) to a single shared LS process (without `--workspace_id`). When the IDE updated, the old LS process (with workspace_id) remained alive alongside the new shared LS (without workspace_id). The plugin's `selectMatchingProcessLine()` prioritized exact workspace_id matches, so it **always connected to the old stale LS** — which responded to RPC calls but returned frozen data (wrong step counts, no RUNNING status, missing new conversations). Fix: reversed the selection priority in `selectMatchingProcessLine()` — processes WITHOUT `--workspace_id` (new shared LS architecture) are now preferred over those WITH workspace_id (legacy per-workspace LS). Falls back to workspace_id matching only when no new-style LS exists, maintaining backward compatibility.
   Bug：Antigravity  v1.22.2+ ，。：Antigravity 1.22.2 （LS）（ `--workspace_id` ） LS（ `--workspace_id`）。IDE ， LS （ workspace_id）， LS 。 `selectMatchingProcessLine()`  workspace_id，** LS**—— RPC ，（、 RUNNING 、）。： `selectMatchingProcessLine()` —— `--workspace_id` （ LS） workspace_id （ LS）。 LS  workspace_id ，。

- **Periodic LS PID Re-validation /  LS PID **: Added a periodic PID re-validation mechanism to the polling loop. Every ~30 seconds, the plugin re-runs `discoverLanguageServer()` and compares the current LS PID with the cached PID. If they differ (e.g., Antigravity spawned a new LS after a silent update), the plugin automatically reconnects without requiring a window reload.
   PID 。 30  LS  PID， PID （ Antigravity  LS），，。

- **Staleness Heuristic for Zombie LS Detection /  LS **: Added a secondary defense layer: if the plugin is tracking a conversation but the LS reports all conversations as IDLE for 4+ consecutive polls, the plugin assumes the LS is stale and forces a re-discovery attempt. This catches edge cases where the PID doesn't change but the LS data becomes outdated.
  ： LS  4+  IDLE ， LS 。 PID 。

- **New Conversation First-Poll Delay / **: Fixed a UX issue where starting a new conversation required two poll cycles before data appeared. Root cause: the new-trajectory detection priority (`Priority 3`) was gated by `!trackedCascadeId` — it only switched to new conversations when NO cascade was being tracked. Since the plugin always has a sticky tracked cascade, new conversations were silently ignored on their first appearance. Fix: removed the `!trackedCascadeId` guard so new trajectories immediately take priority over sticky tracking.
  。：（Priority 3） `!trackedCascadeId` ——。，。： `!trackedCascadeId` ，。

### ✨ Improved /

- **Staleness Idle Guard / **: Added `stalenessConfirmedIdle` flag to prevent the staleness heuristic from repeatedly calling `discoverLanguageServer()` on genuinely idle workspaces. After confirming the LS PID is unchanged (false alarm), the flag suppresses further staleness checks until activity resumes. Reduces idle-state discovery calls from ~15/min to ~2/min (PID revalidation only).
   `stalenessConfirmedIdle` ， `discoverLanguageServer()`。 LS PID （），。 15 / 2 /（ PID ）。

- **Cascade Switch State Reset / **: Reset `consecutiveIdlePolls` and `stalenessConfirmedIdle` when the tracked cascade changes. Prevents idle poll counts from one conversation carrying over to another, which could cause premature staleness detection for the newly tracked cascade.
   `consecutiveIdlePolls`  `stalenessConfirmedIdle`。，。

### 📊 Stats /

- **Files changed**: 3 (`discovery.ts`, `extension.ts`, `discovery.test.ts`)
- **TypeScript compile**: Zero errors
- **Tests**: 85 discovery + state-machine tests passing

---

## [1.14.9] - 2026-04-08

### ✨ Improved /

- **Panel Title Rename / **: Renamed the WebView panel from "Context Monitor / " to "Antigravity Monitor / Antigravity ". The panel now hosts 9 feature tabs well beyond basic context monitoring, and the new name better reflects its role as a comprehensive monitoring dashboard.
  「Context Monitor / 」「Antigravity Monitor / Antigravity 」。 9 ，，。

### ✨ Added /

- **Monthly Total Cost Summary / **: Added a new "Monthly Cost" summary section at the top of the Pricing tab. Features:
  - Displays the aggregated monthly total cost across all archived quota cycles **plus** the current active cycle's real-time cost, ensuring the total is always up-to-date.
  - Per-model cost breakdown with proportional bar visualization and token usage chips (input/output/thinking/calls).
  - Handles incomplete months: shows a note when data recording started mid-month.
  - "View History" button navigates directly to the Calendar tab for historical cost exploration via `data-switch-tab` delegation.
  - Architecture: new `DailyStore.getMonthCostBreakdown()` method aggregates per-model cost from `gmModelStats` in archived cycles; new `MonthModelCost` and `MonthCostBreakdown` exported types; `buildPricingTabContent()` signature extended with optional `monthBreakdown` and `currentCycleCost` parameters.
  「」。：
  -  + ，。
  - ， token （///）。
  - ：。
  - 「」 `data-switch-tab` 。
  - ：`DailyStore`  `getMonthCostBreakdown()`  `gmModelStats` ； `MonthModelCost`  `MonthCostBreakdown` ；`buildPricingTabContent()`  `monthBreakdown`  `currentCycleCost`。

### 🐛 Fixed /

- **Stale Data Flash on Panel Re-Show / **: Fixed a visual glitch where switching away from the WebView panel and returning would briefly display stale data before the next polling cycle refreshed it. Root cause: VS Code destroys the webview DOM when the panel is hidden (default `retainContextWhenHidden: false`), and restores from the last `webview.html` snapshot on re-show — which contains old data. Fix: added `panel.onDidChangeViewState` listener that immediately sends an `updateTabs` message with the latest cached data (`lastUsage`, `lastAllUsages`, `lastConfigs`, `lastUserInfo`, `lastQuotaTracker`) when the panel becomes visible again, eliminating the 5-second polling gap.
   WebView 。：VS Code  webview DOM（ `retainContextWhenHidden`）， `webview.html` ——。： `panel.onDidChangeViewState` ，（`lastUsage`、`lastAllUsages`、`lastConfigs`、`lastUserInfo`、`lastQuotaTracker`） `updateTabs` ， 5 。

- **Pause-Aware Visibility Refresh / **: The `onDidChangeViewState` handler now respects the pause state — when paused, re-showing the panel no longer forces a data refresh, preserving the frozen snapshot the user expects.
  `onDidChangeViewState` ——，。

- **Monthly Cost Call Count Accuracy / **: Improved call count attribution in the monthly cost summary when merging current cycle data with archived cycles.
  。

### 📊 Stats /

- **Files changed**: 6 (`daily-store.ts`, `pricing-panel.ts`, `webview-panel.ts`, `i18n.ts`, `CHANGELOG.md`, `project_structure.md`)
- **TypeScript compile**: Zero errors

---

## [1.14.8] - 2026-04-02

### 🐛 Fixed /

- **Light Theme — Session Panel Visibility /  — ** (PR #40 by @NightMin2002): Fixed multiple visibility issues in the session history panel when using a light VS Code theme. Includes: search input text and placeholder color now properly contrast against light backgrounds; all cyan/blue-leaning Tab color tokens overridden with darker variants for light mode; shortcut card count bubble uses proper teal contrast; filter button active and focus-visible states added for light theme; workspace/repo/current/running badge colors unified with the CSS variable token system (`--lt-teal`, `--lt-blue`, `--lt-green`, `--lt-amber`).
   VS Code 。：； Tab  token ； teal ； focus-visible ；workspace/repo/current/running badge  CSS  token 。

## [1.14.7] - 2026-04-02

### ✨ Added /

- **Calendar Monthly Summary Toggle / **: Added segmented toggle buttons (Monthly / All-Time) to the calendar summary section. Users can now instantly see current month's consumption breakdown alongside all-time stats. Default view is monthly. Empty-month states show friendly guidance. Toggle state survives poll refreshes via event delegation.
  （ / ），。。。。

- **Tab Arrow Navigation / Tab **: Added left/right scroll arrow buttons flanking the tab bar. Arrows intelligently show/hide based on overflow state: no overflow = both faded, scrolled to start = left faded, scrolled to end = right faded, middle = both visible. Uses `opacity` + `pointer-events` fade transition (0.25s) instead of `display: none` to **preserve layout space and prevent accidental tab clicks** when an arrow disappears at scroll endpoints. Click scrolls 150px with smooth behavior.
  Tab ，。 `opacity` + `pointer-events` （0.25s） `display: none`，** Tab**。 150px。

- **Quota Tracking Disabled State Feedback / **: When quota timeline tracking is disabled in Settings, the Quota Tracking tab now shows a clear “tracking is paused” message with a “Go to Settings” button that navigates directly to the Settings tab, instead of the misleading “No active quota consumption detected” empty state.
  ，「」，「」，「」。

### ✨ Improved /

- **Quota Tracking Toggle Migration / **: Moved the quota timeline tracking toggle from the Quota Tracking tab to the Settings tab. Root cause: the polling mechanism (`innerHTML` replacement) destroyed the toggle's event listeners on every refresh cycle. The Settings tab is not subject to incremental DOM updates, ensuring stable state persistence. Default changed to enabled (`true`) since performance overhead is negligible.
  。：（`innerHTML` ） toggle 。 DOM ，。（`true`），。

- **Session Card Visual Overhaul / **: Enhanced session history cards with modern aesthetics: `::before` pseudo-element top glow line for depth, 3px green left accent border for current sessions, enhanced multi-layer hover shadows (`4px+12px`), `translateY(-2px)` hover lift, spotlight card hover interactions, upgraded action buttons (`radius-md` + hover float + box-shadow), and comprehensive `body.vscode-light` theme overrides for all card components.
  ：、、 hover 、spotlight  hover 、 + ，。

### 🐛 Fixed /

- **Light Theme — Full Panel Visibility /  — **: Fixed ~50 UI components that remained invisible or near-invisible when VS Code was set to a light theme. Root cause: hardcoded `rgba(255,255,255,X)` backgrounds (white overlays on dark backgrounds) became white-on-white in light mode. Fix: added comprehensive `body.vscode-light` CSS overrides across all three style sources — `webview-styles.ts`, `activity-panel.ts`, and `webview-calendar-tab.ts`. Covers: action buttons, stat cards, progress bar tracks, quota bars, model cards, timeline cards, pool badges, feature/MIME tags, chat history cards (including gradient replacements), monitor mini panel, activity card headers, timeline legend, GM perf items, X-ray visualization, rank bars, and calendar navigation.
   50  UI  VS Code 。： `rgba(255,255,255,X)` 。： `body.vscode-light` CSS 。

- **Session Card Animation Re-Triggering / **: Removed the `historyRowSlideIn` staggered entry animation that re-triggered on every poll refresh. Root cause: CSS animations always fire on newly-inserted DOM elements, and the polling architecture replaces `innerHTML` entirely — creating new elements each cycle.
   `historyRowSlideIn` 。：CSS  DOM ， `innerHTML` 。

- **GM Prompt Snippet Falling Back to Internal IDs / GM  ID**: Fixed cases where GM prompt extraction preferred opaque internal identifiers such as `bot-*`, `toolu_*`, `req_vrtx_*`, or `session-*` over actual prompt text. The extractor now filters internal identifier fields and keeps structural timeline rows focused on tool and step metadata.
   GM prompt  `bot-*`、`toolu_*`、`req_vrtx_*`、`session-*` 。，。

- **Quota History Clear Button / **: Added a dedicated Clear button next to “Completed Sessions” in the Quota Tracking tab. The action is scoped to archived history only, while the existing “Active Tracking” clear button still clears runtime tracking state.
  「」。，。

- **End-of-Content Fade-In Repeating on Poll Refresh / 「」**: Fixed by caching per-tab HTML, skipping unchanged pane swaps, preserving visible sentinel state across refreshes, and adding idempotent listener guards for `<details>` blocks and session catalog filters.
   HTML、 pane  DOM 、 sentinel 、 `<details>` 。

### 🧪 Tests /

- **4 new regression tests**: GM prompt snippet filtering (prefers real text over internal IDs, drops bot-only snippets), activity tracker planner/gm_virtual structural integrity (no backfill of pseudo AI replies).
  ** 4 **：GM prompt （、 ID）、activity tracker planner/gm_virtual （ AI ）。

### 📊 Stats /

- **TypeScript compile**: Zero errors

---

## [1.14.5] - 2026-04-01


### 🐛 Fixed /

- **Multi-Window LS Discovery Failure / **: Fixed a critical bug where opening a second VS Code window with a different workspace caused permanent “LS not found” failure. Root cause: `selectMatchingProcessLine()` used a fail-closed strategy (v1.13.3), returning `null` when no exact `--workspace_id` match existed. Since Antigravity shares a single LS process across all windows, the second window's workspace_id never matched, making the context monitor completely unusable. Fix: `selectMatchingProcessLine()` now prefers an exact workspace_id match but **falls back to the first available LS** when no match exists, enabling all windows to connect to the shared LS.
   bug： VS Code （），”LS not found”。：`selectMatchingProcessLine()`（v1.13.3），`--workspace_id`  `null`。 Antigravity  LS ， workspace_id ，。：`selectMatchingProcessLine()`  workspace_id，** LS**， LS。

- **No-Workspace Window Always Shows 0k /  0k**: Fixed a bug where opening a window without any folder (no workspace) caused the context monitor to permanently show `0k/1M` even while conversations were active. Root cause: the trajectory filter used `t.workspaceUris.length === 0` for no-workspace windows, but Antigravity assigns workspace URIs to all conversations regardless, so every trajectory was filtered out. Fix: when no workspace is open, show **all trajectories** instead of filtering — since there is no folder to filter by.
  （） `0k/1M`  bug，。：trajectory  `t.workspaceUris.length === 0`， Antigravity  workspace URI， trajectory 。：** trajectory**，。

- **LS Re-Discovery After RPC Failure Also Used Aggressive Backoff / RPC  LS **: When an RPC call failed and the extension attempted to re-discover the LS, a failed re-discovery (`handleLsFailure('LS connection lost')`) incorrectly used the 60-second RPC backoff cap instead of the faster 15-second discovery cap. Now correctly applies the discovery backoff.
   RPC  LS ，`handleLsFailure('LS connection lost')`  60  RPC ， 15 。。

- **Light-Theme Visibility — Timeline Tags /  — **: Fixed near-invisible GM data tags, duration capsules, context labels, and credit indicators in light theme. Root cause: backgrounds used `rgba(255,255,255,0.xx)` (transparent white-on-white) and text colors used pastel hex values designed for dark backgrounds only. Fix: GM tag colors now default to dark-saturated variants (e.g., `#2563eb`, `#16a34a`, `#dc2626`), with `body.vscode-dark` overrides restoring the original pastel palette. Duration, tool-name, step-index, model, and context-marker backgrounds replaced with `var(--color-surface)` + `var(--color-border)`. Segment borders and checkpoint-model borders also updated.
   GM 、、。： `rgba(255,255,255,0.xx)`（）、 hex 。：GM ；`body.vscode-dark` 。、、、、 `var(--color-surface)` + `var(--color-border)`。

- **VS Code Theme Detection — `body.vscode-dark` vs `prefers-color-scheme` / VS Code **: Replaced incorrect `@media (prefers-color-scheme: dark)` with `body.vscode-dark` selectors for dark-theme overrides. VS Code WebViews signal theme via body class (`vscode-dark` / `vscode-light`), not the CSS media query, which is unreliable in embedded Chromium WebViews.
   `@media (prefers-color-scheme: dark)`  `body.vscode-dark` 。VS Code WebView  body class（`vscode-dark` / `vscode-light`）， CSS —— Chromium WebView 。

- **Quota Tracking Ghost-Session Loop / **: Fixed an infinite loop where quota tracking would repeatedly create and immediately archive 0-second ghost sessions after a quota reset. Root cause: the API continues reporting the OLD `resetTime` (already in the past) for several minutes after a reset. `QuotaTracker` entered tracking with a stale `cycleResetTime`, causing `isCycleEnded()` to fire on the very next poll → archive → idle → re-enter tracking → loop. Each iteration also triggered `onQuotaReset`, causing duplicate Activity/GM archives. Fix: added a **stale-resetTime guard** at both idle→tracking entry paths — if `resetTime <= now`, the model stays idle until the API provides a future `resetTime` for the new cycle.
   0 。：API  `resetTime`（）， `cycleResetTime`  tracking → `isCycleEnded()`  poll  →  → idle →  → 。 `onQuotaReset`， Activity/GM 。： idle→tracking ** resetTime **—— `resetTime <= now`  idle， API 。

### ✨ Added /

- **Scrollbar Hiding — Defense in Depth /  — **: Implemented a three-layer scrollbar hiding mechanism to reliably override VS Code WebView's injected UA stylesheets:
  1. **Layer 1 — Static CSS**: `html[data-hide-scrollbar=”true”]` selectors with `scrollbar-width: none !important` + `::-webkit-scrollbar { display: none; width: 0; height: 0 }`.
  2. **Layer 2 — HTML attributes**: `data-hide-scrollbar` set on both `<html>` and `<body>` elements for full selector reach.
  3. **Layer 3 — Runtime JS injection**: `applyScrollbarHide()` dynamically creates a `<style id=”ag-scrollbar-override”>` element appended to `<head>` tail for maximum specificity, bypassing VS Code's injected stylesheets.
  Default is **hidden** (`showScrollbar: false`); users can re-enable scrollbars in Settings.
  ， VS Code WebView  UA ：
  ①  CSS：`html[data-hide-scrollbar]`  + `!important` + `-ms-overflow-style: none`；
  ② HTML ：`<html>`  `<body>`  `data-hide-scrollbar=”true”`；
  ③  JS ：`applyScrollbarHide()`  `<style>`  `<head>` 。
  ****。→””。

- **End-of-Content Sentinel / **: Added persistent `—  —` indicator at the bottom of all tab panes. Sentinels are appended in `buildTabContents()` to survive `innerHTML` swaps during incremental updates. An `IntersectionObserver` shows/hides the sentinel with a fade-in animation, re-binding after every `updateTabs` poll refresh. Configurable via Settings (independent toggle for EOC indicator visibility).
  「」。 `buildTabContents()` ， `innerHTML` 。`IntersectionObserver` /， `updateTabs` 。/。

- **Scrollbar Appearance Settings Card / **: Added a “Scrollbar Appearance” card in the Settings tab with two independent toggles: scrollbar visibility and EOC indicator visibility. Preferences are persisted via `PanelHintPreferences` in `DurableState`.
  「」，：。 `DurableState` 。

### ✨ Improved /

- **Faster LS Discovery Backoff /  LS **: Introduced a separate `MAX_DISCOVERY_BACKOFF_MS` (15 seconds) for LS discovery failures, distinct from the `MAX_BACKOFF_INTERVAL_MS` (60 seconds) used for RPC communication failures. This ensures the extension detects a newly started or restarted LS within ~15 seconds instead of ~60 seconds. Backoff sequence: 5s → 10s → 15s (capped) vs. the previous 5s → 10s → 20s → 40s → 60s.
   `MAX_DISCOVERY_BACKOFF_MS`（15 ） LS ， RPC  `MAX_BACKOFF_INTERVAL_MS`（60 ）。 LS  ~15 ， ~60 。：5s → 10s → 15s（）vs  5s → 10s → 20s → 40s → 60s。

- **WebView Panel Lightweight Mode / WebView **: Removed `retainContextWhenHidden` from the WebView panel options. The panel now rebuilds its content when re-shown, reducing memory footprint and avoiding potential ServiceWorker scope conflicts in multi-window Electron environments.
   WebView  `retainContextWhenHidden` 。， Electron  ServiceWorker 。

- **Polling Overhead Reduction / **: The main polling loop now reuses cached `ContextUsage` for unchanged conversations instead of recomputing token usage every cycle. Recent-session background refresh also skips unchanged snapshots, reducing redundant `GetCascadeTrajectorySteps` RPC batches, repeated token estimation, and idle-time CPU spikes on long conversations.
   `ContextUsage`， token 。， `GetCascadeTrajectorySteps`  RPC、 token ， CPU 。

- **Fresh-Install GM Baseline /  GM **: New `GMTracker` instances now start in baseline mode, so existing historical GM calls are treated as pre-existing data on first install / first launch instead of being counted directly into the current cycle. This prevents the “first install immediately shows a huge amount of GM data” problem.
   `GMTracker`  baseline ， / ， GM ，。” GM ”。

- **GM Snapshot Persistence De-duplication / GM **: `gmDetailedSummary`, Monitor GM conversation snapshots, and related model-DNA persistence now only update when GM aggregates actually change. This cuts repeated deep clones, repeated JSON serialization, and unnecessary external-state writes during idle polling.
  `gmDetailedSummary`、Monitor GM  model DNA  GM ，、 JSON 。

- **Durable State Batched Writes / **: External `state-v1.json` persistence was changed from synchronous whole-file rewrites on every update to async debounced batch flushes with unchanged-content short-circuiting. This significantly lowers disk writes while preserving the same recovery model.
   `state-v1.json` ” update ”” + ”，。

### 🧪 Tests /

- **21 new discovery tests** (50 total, was 29): Multi-window fallback simulation (2nd/3rd window different workspace), exact match preference, edge cases (empty URI, undefined URI), Windows-specific tests (drive letter encoding, CJK paths `%E6%95%B0%E6%8D%AE`, cross-workspace CJK fallback), WSL/vscode-remote URI tests, and backoff constant validation (discovery caps at 15s, RPC caps at 60s, custom base intervals).
  ** 21 **（ 50 ， 29 ）：（/）、、（ URI、undefined URI）、Windows （、CJK 、 CJK ）、WSL/vscode-remote URI ，（ 15s、RPC  60s、）。

### 📊 Stats /

- **Files changed**: 15 (13 source + 2 tests)
- **TypeScript compile**: Zero errors
- **Vitest**: 12 files / 139 cases — 137 passing, 2 pre-existing timezone-related failures in `reset-time.test.ts`

---

## [1.14.3] - 2026-03-29

### ✨ Added /

- **Session Catalog Tab / **: New `Sessions / ` tab displaying all Cascade conversations grouped by workspace/repository. Features include: session count & total credits summary, quick-access shortcut cards (current workspace / current repo / running / recordable), search bar with text filtering, filter toolbar (All / Current Workspace / Current Repo / Running / Recordable), and per-session action buttons to reveal workspace folders, brain directories, or raw `.pb` files. New file `webview-chat-history-tab.ts` (484 lines).
  「」，/ Cascade 。： & 、（///）、、（////），（、Brain 、 `.pb` ）。 `webview-chat-history-tab.ts`（484 ）。

- **Tab Scroll Hint / **: When the tab bar overflows horizontally (9 tabs), a hint banner appears below suggesting Shift+Scroll navigation. Users can dismiss the hint, and the preference is persisted via `DurableState`. A "Show hint now" button in Settings allows re-enabling it.
  （9 ）， Shift+。， `DurableState` 。「」。

- **GM Credit Display in Activity Panel / GM **: Conversation distribution section now shows total credit consumption per session, and session list entries display short cascade IDs alongside credit usage.
  ， cascadeId 。

### ✨ Improved /

- **Sessions Tab UI Overhaul /  UI **: Consolidated 6 stat cards into 3 compact dual-metric cards (Conversations·Groups / Workspace·Running / Recordable). Shortcut cards switched from `grid auto-fit` to `flex` equal-width layout with hidden redundant "" kicker. Removed verbose toolbar note paragraph. Reduced per-session footer from 3 timestamps to 2 (dropped "Last Input"). Spotlight sub-panels switched from `grid` to compact `flex` layout with reduced padding and font-weight. Action buttons downsized from large `flex: 1 1 140px` to small `inline-flex` with separator border-top.
   6  3 （· / · / ）。 `grid auto-fit`  flex  kicker 。。 3  2 。 flex 。 border-top 。

- **Settings Button Upgrade / **: Global `.action-btn` upgraded from icon-only style (`padding: space-1`, transparent bg) to text+icon hybrid with proper `gap`, `font-size`, `font-weight`, gradient background, and hover shadow lift. Added `.stg-card .action-btn` override for increased padding and micro-gradient. Added `.danger-action` variant with red color scheme. `.storage-actions` children now respect `flex: 0 1 auto` sizing.
   `.action-btn` +， `gap`、`font-size`、 hover 。。 `.danger-action` 。

- **Persistent Storage Diagnostics Expanded / **: The Settings "Persistent Storage" card now displays the real external state file size and the current large-file open warning threshold. Users can see why the large-file guard triggers before attempting to open the JSON file, instead of guessing or blindly tuning values.
  「」，“”。 JSON ，。

- **State File Open Flow Hardened / **: WebView click handling now normalizes delegated targets and returns explicit success/failure feedback for "Open File" and "Reveal". The open path prefers command-level `vscode.open` and falls back to editor APIs only when needed, improving compatibility with non-standard VS Code-like hosts.
  WebView 「 / 」，/。 `vscode.open`， API， VS Code-like 。

- **Large State File Safety Guard / **: Opening the external state JSON now checks the real file size first. Files at or above `1 MB` trigger a warning dialog with three outcomes: open anyway, reveal in file manager instead, or cancel. This reduces the chance of users freezing the editor by opening a very large JSON blob directly.
   JSON 。 `1 MB` ，，「 /  / 」， JSON 。

### ⚡ Refactored /

- **`makePanelPayload()` Helper / **: Extracted a `makePanelPayload()` helper in `extension.ts` that constructs the full `PanelPayload` from cached state. Replaced 7 inline payload object literals across `showMonitorPanel` / `updateMonitorPanel` call sites, eliminating parameter duplication and ensuring consistent data delivery. Also added `lastTrajectories` caching to avoid redundant RPC calls.
   `extension.ts`  `makePanelPayload()` ， `PanelPayload`。 7  payload ，，。 `lastTrajectories`  RPC 。

- **`restoreDetailsState()` Extraction / `<details>` **: Extracted `<details>` open/closed state restoration into a reusable `restoreDetailsState()` function in `webview-script.ts`, called both on initial load and after each `updateTabs` incremental refresh. Eliminates the previous pattern of duplicating restoration logic in two places.
   `<details>` / `webview-script.ts`  `restoreDetailsState()`， `updateTabs` ，。

- **`formatFileSize()` Unified / **: Merged duplicate `formatFileSize()` (webview-panel.ts) and `formatStorageBytes()` (webview-settings-tab.ts) into a single canonical export in `webview-helpers.ts`. Both consumers now import from the shared module.
   `webview-panel.ts`  `formatFileSize()`  `webview-settings-tab.ts`  `formatStorageBytes()`  `webview-helpers.ts` ，。

- **`reportStateFileError()` Extraction / **: Extracted repeated 4-line catch-block pattern into a dedicated `reportStateFileError()` helper in `webview-panel.ts`. Replaced 3 duplicate catch blocks with single-line calls.
   4  catch  `webview-panel.ts`  `reportStateFileError()` ，3  catch 。

### 🐛 Fixed /

- **Tab Scroll Hint Disappearing After "Show Now" / 「」**: Fixed a race condition where clicking "Show hint now" in Settings triggered a `setPanelPref` message round-trip. The backend responded with `panelPrefUpdated`, which called `updateTabOverflowHint()` — this re-checked overflow width and hid the hint if tabs didn't overflow at that moment. Fix: introduced `data-force-show` attribute mechanism. When user manually shows the hint, the attribute is set on `#tabScrollHint`, and `updateTabOverflowHint()` skips auto-hide when it detects this attribute. The attribute is only removed when user explicitly clicks the dismiss button.
  ：「」 `setPanelPref` ， `panelPrefUpdated`  `updateTabOverflowHint()` ——。： `data-force-show` 。，`updateTabOverflowHint()` 。。

- **Settings Hint Badge Not Updating in Real-Time / **: Fixed the "Panel Tips" section in Settings where the enabled/disabled badge did not react to the `panelPrefUpdated` message when toggling the hint from the hint bar itself. The `configSaved` feedback path now correctly maps `panelShowTabScrollHint` to its feedback element.
  「」/ `panelPrefUpdated` 。`configSaved`  `panelShowTabScrollHint` 。

- **Settings "Open File" Button Silent No-Op / “”**: Fixed the Settings "Open File" action silently doing nothing in some hosts. Root cause was a combination of brittle delegated click targeting inside the WebView and host-specific differences in editor-opening behavior. The button now reliably posts its message, reports action status back to the UI, and opens through a host-tolerant command-first path.
  「」。 WebView ，。、，“”。


### 🗑 Removed /

- **Dead Code Cleanup / **: Removed `countPbFiles()` function (file system scan no longer needed after stat card consolidation). Removed ~30 lines of orphaned toolbar note HTML template.
   `countPbFiles()`（）。 30  HTML 。

### Changed /

- **Tab Bar Compacted / **: Reduced tab bar `gap` (6px→4px), `padding` (6px→4px), tab button `padding` (10px 16px→7px 12px), `font-size` (0.8em→0.76em), `gap` (6px→5px), and slider inset (6px→4px) to better accommodate 9 tabs within typical VS Code panel widths.
   `gap`（6→4px）、`padding`（6→4px）、（10px 16px→7px 12px）、（0.8→0.76em）、（6→5px）（6→4px）， 9  VS Code 。

- **Session Catalog Tab Label Shortened / **: Tab button text changed from `Session Catalog / ` to `Sessions / ` for horizontal space savings.
  「Session Catalog / 」「Sessions / 」，。

### 📊 Stats /

- **Files changed**: 11 (10 modified + 1 new)
- **TypeScript compile**: Zero errors
- **Vitest**: 12 files / 117 cases — all passing
- **New file**: `src/webview-chat-history-tab.ts` (484 lines)
- **Net addition**: ~1754 lines across styles, script logic, and tab content

### Contributors /

- Thanks to [@NightMin2002](https://github.com/NightMin2002) for the Sessions tab, UI improvements, state file hardening, and extensive code deduplication ([PR #36](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/36)).
   [@NightMin2002](https://github.com/NightMin2002) 、UI 、（[PR #36](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/36)）。

## [1.14.2] - 2026-03-28

### ⚡ Refactored /

- **PanelPayload Interface — Parameter Object Refactoring / PanelPayload  — **: Replaced the 17-positional-parameter signatures of `showMonitorPanel()` and `updateMonitorPanel()` with a single `PanelPayload` object interface. All 9 call sites in `extension.ts` updated. Added `buildPanelPayload()` helper to construct payloads from cached state. Improves readability, type safety, and extensibility — new fields can be added without touching call sites.
   `showMonitorPanel()`  `updateMonitorPanel()`  17  `PanelPayload` 。`extension.ts`  9 。 `buildPanelPayload()`  payload。、——。

- **Event Delegation — Eliminate Re-binding /  — **: Migrated 5 categories of button event handlers (Copy JSON, Pricing Save/Reset, Clear Active Tracking, Privacy Toggle, Tab Switching) from individual `addEventListener` bindings to a single `document.body`-level click delegation handler using `closest()` matching. Completely eliminated the ~130-line re-binding block inside the `updateTabs` message handler. Body-level delegation survives `innerHTML` swaps during incremental updates, so `updateTabs` now only needs to restore DOM visual state (privacy mask, active classes) without re-attaching any event listeners.
   5 （ JSON、/、、、Tab ） `addEventListener`  `document.body`  click ， `closest()` 。 `updateTabs`  ~130 。body  `innerHTML` ，`updateTabs`  DOM （、active ），。

- **Light Theme Tokenization /  Token **: Replaced 60+ hardcoded `rgba()` and hex color values in the `body.vscode-light` CSS overrides with 18 semantic CSS variables (`--lt-green`, `--lt-green-text`, `--lt-green-deep`, `--lt-amber`, `--lt-blue`, `--lt-red`, `--lt-orange`, `--lt-teal` and their text/deep variants). Future light-mode color adjustments can be made in one place (the variable declarations) rather than across 80+ individual CSS rules.
   `body.vscode-light` CSS  60+  `rgba()`  hex  18  CSS （`--lt-green`、`--lt-green-text`、`--lt-green-deep`、`--lt-amber`、`--lt-blue`、`--lt-red`、`--lt-orange`、`--lt-teal`  text/deep ）。， 80+  CSS 。

- **CSS Deduplication — Profile Tab Redundancy Removal / CSS  — Profile Tab **: Removed ~50 lines of duplicate CSS declarations in the Profile Tab region (`.credit-header`, `.credit-bar-wrap`, `.credit-bar`, `.feature-tag`, `.feature-tag.enabled`, `.default-model`, `.mime-count`) where identical selectors appeared twice — later declarations silently overriding earlier ones. Unique properties from the later block were merged back into the first definition.
   Profile Tab  ~50  CSS （`.credit-header`、`.credit-bar-wrap`、`.credit-bar`、`.feature-tag`、`.feature-tag.enabled`、`.default-model`、`.mime-count`），，。。

### 🐛 Fixed /

- **`::selection` Missing `color` Declaration / `::selection`  `color` **: Added `color: var(--vscode-editor-selectionForeground, #fff)` to the global `::selection` rule. Previously only `background` was set, which could result in invisible selected text on certain VS Code themes where the selection background color is close to the default text color.
   `::selection`  `color: var(--vscode-editor-selectionForeground, #fff)`。 `background`， VS Code ，。

- **Tab Slider Position Drift After Incremental Update /  Tab **: Added `updateTabSlider()` call at the end of the `updateTabs` message handler. Previously, after `innerHTML` replacement changed tab button text width (e.g., due to language differences or dynamic content), the capsule slider position was not recalculated, causing it to drift from the active tab.
   `updateTabs`  `updateTabSlider()` 。 `innerHTML`  tab （），，。

### 📊 Stats /

- **Net reduction**: ~230 lines removed across 4 files
- **TypeScript compile**: Zero errors
- **Vitest**: 12 files / 117 cases — all passing
- **Visual regression**: None — zero UI/UX changes

### Contributors /

- Thanks to [@NightMin2002](https://github.com/NightMin2002) for the bug fix and code quality refactors ([PR #35](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/35)).
   [@NightMin2002](https://github.com/NightMin2002)  Bug （[PR #35](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/35)）。

## [1.14.1] - 2026-03-28

### 🐛 Fixed /

- **GM Data Persists After Quota Reset (Empty Cache Race) /  GM （）**: Fixed a critical data persistence bug where Gemini model statistics (call counts, tokens, credits, cards) remained visible in the UI after a quota reset. Root cause: `serialize()` strips `calls[]` to save space, so after an extension restart, `_cache.calls` is empty. When `onQuotaReset` fired before `fetchAll()` repopulated the cache, the per-call `_archivedCallIds` mechanism had nothing to archive — and when `fetchAll()` later returned old calls from the API, they passed through unfiltered. Fix: replaced the permanent model-level blacklist (`_archivedModelIds: Set<string>`) with a **timestamp-based cutoff mechanism** (`_archivedModelCutoffs: Map<string, string>`). `reset()` now records `new Date().toISOString()` as the cutoff for each resetting model. `_buildSummary()` compares each call's `createdAt` against its model's cutoff — calls created at or before the cutoff are filtered out, while new calls in subsequent quota cycles pass through normally. Cutoffs survive extension restarts via `serialize()`/`restore()`. Calls with missing or unparseable `createdAt` are treated as stale and filtered by default.
   Gemini （、token、、） BUG。：`serialize()`  `calls[]`， `_cache.calls` 。 `onQuotaReset`  `fetchAll()` ， callId —— `fetchAll()`  API ，。：（`_archivedModelIds: Set<string>`）****（`_archivedModelCutoffs: Map<string, string>`）。`reset()`  `new Date().toISOString()` 。`_buildSummary()`  `createdAt` ——（），。 `serialize()`/`restore()` 。`createdAt` 。

## [1.14.0] - 2026-03-28

### 🐛 Fixed /

- **Workspace ID Mismatch for CJK (Chinese/Japanese/Korean) Folder Names /  ID **: Fixed a critical bug where workspaces with non-ASCII folder names (e.g., ``, `テスト`) could never discover the Language Server, permanently showing "LS not found". Root cause: when percent-encoded CJK characters appear in the URI (e.g., `%E7%AE%80`), the directory separator `/` and the percent sign `%` are both replaced by `_`, producing adjacent double underscores (`__E7`). The Language Server collapses `__` → `_` on all platforms, but the plugin only performed this collapse on Windows/WSL, causing a permanent `workspace_id` mismatch on macOS and Linux. Fix: moved the `/__+/g` → `_` collapse out of the Windows-only branch so it executes on all platforms, exactly mirroring the LS behavior.
   Bug：（ ``、`テスト`），，"LS not found"。：URI  CJK （ `%E7%AE%80`） `/%E7` ，`/`  `%`  `_`， `__E7`。 `__` → `_`， Windows/WSL ， macOS  Linux  `workspace_id` 。： `/__+/g` → `_`  Windows ，， LS 。

### ✅ Tests /

- Added 3 new `buildExpectedWorkspaceId()` tests in `discovery.test.ts`: Chinese folder names (`%E7%AE%80%E5%8E%86%E6%8A%95%E9%80%92`), mixed space + CJK paths (`linux%20do/%E7%AE%80%E5%8E%86`), and Japanese folder names (`%E3%83%86%E3%82%B9%E3%83%88`). All 25 discovery tests pass.
   `discovery.test.ts`  3  `buildExpectedWorkspaceId()` ：、 + 、。 25  discovery 。

## [1.13.91] - 2026-03-27

### 🐛 Fixed /

- **GM Archive Resurrection / GM **: Fixed a quota-cycle bug where GM calls archived during a reset could reappear in the next poll if the same historical invocation came back with a different `executionId`. GM reset now keeps both the original `executionId` marker and a stable archive key built from step indices, model identity, and call timestamp, so old calls no longer leak back into `GM `、``、``、`` after archive.
   GM “”。 `executionId` ， `executionId`，， `GM `、``、``、`` 。 `executionId` （ +  + ），。

- **Monitor GM Fallback No Longer Rehydrates Archived Data /  GM **: Tightened the Monitor tab fallback path so once live `gmSummary` exists, it no longer mixes in stale `monitor-store` GM conversation snapshots for the current cycle. This prevents post-reset monitor cards from being repopulated by historical per-conversation GM data.
   ``  GM fallback ： live `gmSummary` ， `monitor-store`  GM 。，“”。

- **Calendar Import Backfill Completeness / **: Fixed `DailyStore.importArchives()` so when it encounters an existing cycle, it now backfills the missing fields instead of only patching `modelStats`. Older calendar entries can now `triggeredBy`、`gmTotalCalls`、`gmTotalCredits`、`gmTotalTokens`、`gmRetry*`、`estimatedCost`、`gmModelStats`，“， GM//”。
   `DailyStore.importArchives()`  `modelStats` 。 cycle ， `triggeredBy`、`gmTotalCalls`、`gmTotalCredits`、`gmTotalTokens`、`gmRetry*`、`estimatedCost`、`gmModelStats`， GM /  / 。

- **Calendar Cache Hit Rate Weighting / **: Fixed the calendar summary's GM cache-hit aggregation so `0%` hit cycles are no longer dropped from the denominator. Cache hit rates are now weighted by actual call count even when a cycle had zero cache hits, preventing the daily merged cache rate from being systematically inflated.
   GM 。 `0%` ，。， `calls` ，`0%` 。

- **Dev Reset Simulation Now Clears Activity for Real /  Activity **: The dev reset button previously passed a fake model scope into `activityTracker.archiveAndReset()`, which meant GM/Cost/Model panes reset while `GM `  Activity 。 The simulation path now performs a real global Activity archive/reset before rebuilding GM summaries, so the test result matches actual quota-cycle behavior.
  “” GM、 Activity 。 `activityTracker.archiveAndReset()` ， `GM `  /  / 。 Activity ， GM ，。

- **Gemini Recent Activity Duplicate / Replacement Fix / Gemini **: Fixed a timeline bug that was most visible on Gemini Pro conversations, where user messages could appear twice, earlier AI replies could be repeated, or GM exact data could make a user row look like it had been "replaced". The tracker no longer treats `stepIndex` as the only stable identity for recent-step deduplication. Real step rows now carry a stable fingerprint built from conversation, step type, and creation time, so recent activity remains consistent even when the visible steps window shifts.
   Gemini Pro “”、AI 、。 `stepIndex` ， step 、。，，。

- **Startup Timeline Self-Healing / **: Added a startup repair pass for persisted recent activity state. When the extension restores old timeline data containing duplicated step rows or user rows polluted by GM metadata, it now compacts and sanitizes that state immediately and writes the cleaned result back to persistence, so users do not need to wait for later polls to gradually self-heal stale duplicates.
  。， step ， GM ，，。

### Changed /

- **Reset Test Tools Are Now Reversible / **: The Settings tab's debug tools now revolve around a single safe flow: `` captures a snapshot first, performs the reset simulation, and exposes a shared `` button to roll Activity / GM / Calendar back to the pre-test state in the same extension session.
  “、、”。`` ，； ``， Activity / GM / Calendar 。

- **Settings Tab Simplified / **: Removed `` and `` from the Settings tab, and also removed the unreliable ` GM ` test entry. The debug area now keeps only the reset simulation + restore pair, reducing confusion and lowering the chance of users accidentally mutating internal counters in unsupported ways.
   `` ： ``、``  UI， ` GM ` 。“ + ”，。

### ✅ Tests /

- Added a new `daily-store.test.ts` to lock the calendar import/backfill behavior and ensure old cycles can recover missing GM and cost fields.
   `daily-store.test.ts`，， cycle  GM / 。

- Expanded `gm-tracker.test.ts` with a regression case covering archived GM calls being refetched under a different `executionId`, ensuring they stay hidden after reset.
   `gm-tracker.test.ts`，“ GM  `executionId` ”，。

- Expanded `activity-tracker.test.ts` with Gemini-specific timeline regressions covering unstable `stepIndex` remapping, user-row GM pollution, and persisted duplicate cleanup on restore.
   `activity-tracker.test.ts`， Gemini ， `stepIndex` 、 GM ，。

## [1.13.9] - 2026-03-27

### 🐛 Fixed /

- **Quota Pool Representative Stability / **: Fixed a pool-dedup edge case where an already-tracking representative model could be replaced by another member of the same shared `resetTime` pool on a later poll. Once replaced, the old representative stopped receiving cycle-end checks, so a session could remain stuck in "tracking" even after its `cycleResetTime` had already passed. Pool selection now prefers members that are already actively tracking, ensuring reset archival still fires on time.
   `resetTime` ：， tracking ， `cycleResetTime` “”。，。

- **Quota Active-Session Sanitization / **: Hardened restore and tracking-start logic against dirty persisted sessions. The tracker now clamps future `startTime` values, drops future/invalid snapshots, re-sorts restored snapshots, and recomputes elapsed durations so corrupted sessions no longer render impossible timelines such as `0s` duration with older snapshots beneath them.
  。 `startTime`、、，，“ 0s、”。

- **Explicit Quota-Pool Mapping / **: Replaced the old “same resetTime means same pool” assumption with explicit known pool rules. Gemini Pro High/Low now share one pool, Gemini Flash is tracked independently, and Claude Sonnet / Claude Opus / GPT-OSS remain in the same shared pool. This prevents independent models that happen to refresh at the same moment from being incorrectly archived together.
  “`resetTime` ”。 Gemini Pro High/Low ，Gemini Flash ，Claude Sonnet / Claude Opus / GPT-OSS 。“”。

- **Targeted GM Residue Repair /  GM **: Startup-time GM repair is now limited to clearly provable historical contamination only. The extension only prunes GM calls when old quota history explicitly shows a session’s recorded `poolModels` contained models that do not belong to that model’s real pool, avoiding accidental removal of valid current-cycle counts before archive.
   GM “”。 quota  session  `poolModels` ， GM ，。

### ✅ Tests /

- Expanded `quota-tracker.test.ts` again to cover shared-pool representative stability and dirty active-session sanitization, including the case where a previously tracking pool member must remain the representative so `resetTime`-based archival still triggers correctly.
   `quota-tracker.test.ts`， active session ，“ tracking ， `resetTime` ”。

- Added pool-regression coverage so Gemini Flash and Gemini Pro remain separate even when their `resetTime` happens to be identical, and expanded GM tracker tests to verify only historically contaminated residual calls are repaired during startup.
  ， Gemini Flash  Gemini Pro  `resetTime` ； GM Tracker ，，。

### ✨ Added /

- **Model Tab + Persistent Model DNA /  DNA**: Added a dedicated `Models / ` tab to centralize model-related information. Personal model quota, default model, and GM-derived model DNA are now grouped together instead of being scattered across `Profile` and `Pricing`. Model DNA is now persisted independently from quota-cycle archives: static fields such as `responseModel`, provider, completion config, tool count, prompt sections, and system-prompt availability remain visible after archive, while current-cycle counters like calls, steps, credits, retries, and errors still reset normally with the quota cycle.
   `` ，。、 GM  DNA  ``  `` 。 DNA ：`responseModel`、、completion config、、prompt 、 system prompt ；、、、、。

- **Archive / GM Troubleshooting Map /  GM **: Added a new document [docs/archive_gm_troubleshooting.md](docs/archive_gm_troubleshooting.md) to explain archive triggers, GM cycle boundaries, per-page data scope differences, related persisted state keys, and a symptom-to-module troubleshooting map for faster diagnosis of quota and GM issues.
   [docs/archive_gm_troubleshooting.md](docs/archive_gm_troubleshooting.md)，、GM 、、“”， GM 。

### Changed /

- **Tab Order and Naming Cleanup / **: Reordered the main panel tabs to match daily usage priority: `Monitor → GM Data → Cost → Models → Quota Tracking → Calendar → Profile → Settings`. Renamed `Pricing / ` to `Cost / ` to better reflect that the page includes both estimation and editable pricing, and renamed `Quota / ` to `Quota Tracking / ` to distinguish it from the current model quota cards now shown in the `Models` tab.
  ，：` → GM  →  →  →  →  →  → `。 ``  ``，“ + ”； ``  ``， `` 。

- **Models Tab UI Cleanup / **: Simplified the new `Models` tab so it reads like product UI instead of a diagnostics console. Model quota cards now focus on quota and reset timing only, while MIME capability evidence was moved into the `Model Info / ` cards as expandable details. `Model DNA /  DNA` was renamed to `Model Info / `, the dense chip-style metadata strip was removed, raw model IDs were removed from quota cards, and low-value fields were collapsed into a `Technical Params / ` details section.
   `` ，。；MIME  `` ，。` DNA`  ``，， ID， `` 。

### 🐛 Fixed /

- **Checkpoint Ghost Models Removed from GM Data Surface / GM  CHECKPOINT **: Removed the `Sub-Agent Tokens / ` card group from the GM Data tab. Those cards were primarily surfacing internal checkpoint-related models such as `MODEL_PLACEHOLDER_M50` and `MODEL_GOOGLE_GEMINI_2_5_FLASH_LITE`, which are useful for low-level diagnostics but confusing in the main UI because they look like normal user-facing models and can be mistaken for archive residue or quota bugs.
   GM  `` 。 `MODEL_PLACEHOLDER_M50`、`MODEL_GOOGLE_GEMINI_2_5_FLASH_LITE`  CHECKPOINT ；，，、。

- **Model Info Details Stay Open Across Auto-Refresh / **: Added stable detail IDs for the `MIME Types` and `Technical Params` sections so WebView incremental refresh can restore their expanded state correctly instead of collapsing them after every `updateTabs` render.
   `MIME `  ``  detail ID。 WebView  `updateTabs` ，。

- **Duplicate Model Cards Merged by Stable DNA Key / **: Tightened model-DNA key normalization so known models are keyed by stable internal model identity first, rather than allowing history to keep separate entries for display name, placeholder ID, and `responseModel`. This prevents the `Models` tab from showing duplicated “current + cached” cards for the same model after restore.
   DNA  key 。，、 ID  `responseModel`  key。，`` “ + ”。

### ✅ Tests /

- Added `model-dna-store.test.ts` to lock the new persistence semantics: model DNA remains available after archive even when the current-cycle GM summary becomes empty, while the live counters still follow the active quota cycle.
   `model-dna-store.test.ts`，： GM ， DNA ；。

### Changed /

- **Monitor Tab Upgraded from Session View to Overview Dashboard / **: Reworked the `Monitor / ` tab into a real overview surface instead of a quota-only landing page. The top section now combines four concise summaries: model quota health, GM totals, cost snapshot, and quota-tracking status, while the current session and other-session sections remain below. This makes the first tab answer the core questions immediately: "what am I using now, how much have I called, how much did it cost, and which quotas are still active?"
   `` “”。、GM 、，。：、、、。

- **Quota Overview Simplified / **: Removed the old `Details / `  and replaced the previous one-line quota pills with a denser quota-health card. The monitor page now shows all visible models directly, highlights the current model, lowest remaining model, and nearest reset, and keeps each model's reset countdown inside the card instead of pushing the user elsewhere for basic quota awareness.
   `` ， pill 。，、，，。

- **Mini GM Summary + Dense Model Call Grid / GM **: Added a compact GM overview card with calls, input, output, thinking, cache hit rate, and average TTFT, then filled the previously empty lower area with a dense top-4 model call grid. Each mini card now shows the model name, call count, and call-share percentage so the monitor page exposes useful GM trends without requiring users to jump into the full `GM ` tab for every glance.
   GM ，、、、、 TTFT；。、， ``  GM ， `GM ` 。

- **Cost Snapshot Now Uses Total-Cost Share / **: The cost list in the monitor tab no longer uses a "relative to the most expensive model" progress bar, which looked visually full even when the real share was much smaller. Bars now represent each model's share of the total cycle cost, and each row shows the model's call count, total-cost percentage, and final USD estimate. This makes the mini cost panel behave like a real bill summary rather than an ambiguous ranking strip.
  “”，。“”，、，，。

- **Quota Tracking Snapshot Redesigned / **: The quota-tracking summary is no longer reduced to a single "lowest remaining" number. It has been redesigned as a full-width active-tracking card that lists each currently tracked model with status, remaining percentage, elapsed tracking time, reset countdown, and absolute reset time. This makes the monitor page much more useful for judging whether tracking is alive and whether archive timing still looks sane.
  `` “”，。，、、、，、。

## [1.13.8] - 2026-03-26

### ✨ Added /

- **Sticky TopBar — Fixed Navigation & Info Chips /  — **: Consolidated header, three information banners (GitHub, multi-window notice, data disclaimer), and the capsule tab bar into a single `position: sticky` top container (`.panel-topbar`). The tab bar is now always visible during scrolling, enabling instant tab switching at any scroll depth. Fixed-area vertical footprint reduced from ~172px to ~92px (−47%).
  、（GitHub、、） Tab  `position: sticky` （`.panel-topbar`）。Tab ，。 ~172px  ~92px（−47%）。

- **Info Chips with Dropdown Panels / **: Three banners compressed into compact chip buttons (`[GitHub ↗]` `[⚠ ]` `[ℹ ]`). Clicking a chip toggles its dropdown panel with mutually exclusive behavior (opening one auto-closes others). Expanded state persisted via `vscode.setState()` to survive auto-refresh and tab switches.
  。/，。 `vscode.setState()` ，。

- **Frosted Glass & Scroll Shadow / **: TopBar background uses `backdrop-filter: blur(16px)` with 92% opacity for frosted glass translucency. A subtle bottom shadow (`.scrolled` class) appears when `scrollY > 8px`, reinforcing the visual separation between fixed header and scrolling content.
   `backdrop-filter: blur(16px)` + 92% 。 8px （`.scrolled` ），。

### 🐛 Fixed /


- **Quota Tracker No Longer Assumes Another Pool's Window / **: Removed the old "borrow the max `timeToReset` across all 100% models" behavior when backdating tracking start time. This could incorrectly project a short-window model or pool onto a different provider's longer window. `quota-tracker.ts` now only trusts the same model/pool's previously learned full-window duration (`knownWindowMs`), and otherwise falls back to conservative official `resetTime` observation instead of inventing a 5-hour-style start point.
  “ 100%  `timeToReset` ”。 provider / 。 `quota-tracker.ts`  / （`knownWindowMs`）；， `resetTime` ， 5 。

- **0% Rebound Handling / 0% **: A session that reaches `0%` is no longer locked into a stale completed state. If the service later reports quota rising again (for example `0% → 20%`) before the quota cycle truly ends, the tracker now clears the completed marker and resumes active tracking instead of splitting or corrupting the session.
   `0%` 。（ `0% → 20%`）， completed ，。

- **Monitor Lifetime Call Counter Survives Rewind / Monitor **: Added per-conversation `lifetimeCalls` to GM conversation data and surfaced it in the Monitor tab. The current branch's call count may still shrink after rewind, but the new lifetime counter preserves cumulative usage history so users can distinguish "current visible calls" from "all calls ever made in this conversation".
   GM  `lifetimeCalls`， Monitor 。，，“”“”。

- **Reset Time Display Now Includes Date Context / **: Reset UI no longer renders long-window resets as a misleading bare clock like `09:05`. Status bar, Profile, and Quota Tracking views now format reset information as countdown plus local date/time, e.g. `1d19h (03/28 09:05)`, making long rolling windows immediately understandable.
  ， `09:05`。、Profile  Quota Tracking “ + ”， `1d19h (03/28 09:05)`，。

- **Recent Activity Late-Fill Recovery / **: Fixed a timeline gap where some models could surface a `PLANNER_RESPONSE` step before its final `response/modifiedResponse` text was filled in. The old tracker advanced `processedIndex` immediately, skipped the empty step, and never revisited it if `stepCount` stayed unchanged, causing user anchors to appear without the matching AI reply. `activity-tracker.ts` now keeps a short-lived pending set for empty planner steps, re-scans the visible tail even when `stepCount` does not grow, and repairs late-filled responses in place. This is model-agnostic and applies to any provider that emits placeholder planner steps first, although it was most visible on Gemini Pro conversations.
  “”： `PLANNER_RESPONSE` ， `response/modifiedResponse` 。 `processedIndex`，； `stepCount` ，，， AI 。 `activity-tracker.ts`  planner step ， `stepCount` ，。， planner step、 provider， Gemini Pro 。

- **Deterministic Recent-Activity Ordering / **: Added a render-time fallback sort in `activity-panel.ts` using `timestamp → stepIndex → source` so restored state, GM enrichment, and late repairs cannot accidentally shuffle the timeline order. The view remains a debugging-oriented execution timeline, but row order is now stable even when events are patched after the first render.
   `activity-panel.ts` ， `timestamp → stepIndex → source` 。、GM ，。，。

- **Recent Activity Stale-Row Cleanup / **: Fixed another timeline corruption case where a later poll could insert internal non-rendered steps (such as image-generation or ephemeral system steps) before a final planner response, shifting the visible step numbers. The old repair logic added the new rows but failed to delete the obsolete reasoning row that previously occupied that `stepIndex`, making Claude conversations appear to "send the same AI message twice". `activity-tracker.ts` now removes stale `step` events whenever a tail re-scan proves that a given `stepIndex` now belongs to a non-rendered internal step. This is the same model-agnostic repair path used for step reordering, not a Claude-only special case.
  “”： planner response ， `stepIndex` 。， `stepIndex` ， Claude “ AI ”。 `activity-tracker.ts` ， `stepIndex` ， `step` 。 step ， Claude 。

- **Cross-Language Model Bucket Merge / **: Fixed a persistence bug where Activity and GM summaries used localized display labels as internal keys. If stats were saved in English and later restored in Chinese (or vice versa), the same model could split into parallel buckets such as `Gemini 3.1 Pro (High)` and `Gemini 3.1 Pro ()`, causing duplicate model cards and incomplete per-pool archival on quota reset. The tracker now normalizes `modelId / English label / Chinese label / bilingual label` to one canonical current-language display name before aggregation, restore, cache reuse, and archive filtering.
   Activity / GM  key 。、（），， `Gemini 3.1 Pro (High)`  `Gemini 3.1 Pro ()`，、。、、， `modelId /  /  / ` 。

### ✅ Tests /

- Added `reset-time.test.ts` to lock the new reset-time formatting behavior and expanded `quota-tracker.test.ts` to cover `0%` completion persistence, genuine reset archival, and rebound recovery.
   `reset-time.test.ts` ， `quota-tracker.test.ts`， `0%` 、 reset ，。

- Added `activity-tracker.test.ts` coverage for late-filled planner responses: one case verifies that an empty planner step is repaired when the same `stepIndex` later gains a real response without `stepCount` growth, and another verifies that short restored conversations self-heal on the next poll.
   `activity-tracker.test.ts`， planner response： `stepIndex`  `stepCount` ，。

- Expanded `activity-tracker.test.ts` again to cover step-index shifts caused by later insertion of internal non-rendered steps. The test asserts that stale reasoning rows are removed and only the final, still-valid response remains visible in the timeline.
   `activity-tracker.test.ts`，“ stepIndex ”。，。

- Added cross-language restore regression coverage for model-key normalization: Activity restore now merges English and Chinese historical buckets into the current-language model card, and `gm-tracker.test.ts` verifies that restored GM summaries no longer surface duplicate model cards after language switching.
  ：Activity /，`gm-tracker.test.ts`  GM 。

## [1.13.7] - 2026-03-26

### ✨ Added /

- **Capsule Tab Bar with Color Themes /  Tab **: Replaced the flat underline tab bar with a pill-shaped capsule container featuring a sliding indicator. Each tab has a unique theme color (Monitor=blue, Profile=green, GM Data=orange, Pricing=purple, Calendar=cyan, Quota=yellow, Settings=gray). The slider smoothly transitions between tabs with spring easing (`cubic-bezier(.34,1.56,.64,1)`) and its color dynamically follows the active tab's theme via CSS custom properties (`--tab-c`, `--slider-c`).
   Tab  + 。7  Tab （=、=、GM =、=、=、=、=）。， CSS  Tab。

- **Heartbeat Animation / **: Added a pulsing heart icon (`ICON.heart`) with a double-peak CSS `@keyframes heartbeat` animation (1.4s cycle) to the GitHub support banner. The animation mimics a natural cardiac rhythm using `transform: scale()` keyframes.
   GitHub ， `scale()` 。

- **Star Twinkle Animation / **: Added a breathing `@keyframes starTwinkle` animation (2.4s cycle) to the star icon, using `opacity` and `transform: rotate()` oscillation. The desynchronized rhythm (1.4s vs 2.4s) prevents mechanical synchronization with the heartbeat.
  ，。

### Changed /

- **Quota Tab Label Shortened /  Tab **: "Quota Tracking / " shortened to "Quota / " for better fit in the capsule tab bar.
  """" Tab 。

### Accessibility /

- All new animations include `@media (prefers-reduced-motion: reduce)` overrides to disable motion for users who prefer reduced motion. Tab slider transition is also disabled under this preference.
   `prefers-reduced-motion` ，。。

### 🐛 Fixed /

- **Quota Tracker "Resurrection" Bug / ""**: Fixed a critical bug where reaching 0% immediately archived the session and entered a `done` state. If the API subsequently reported the fraction bouncing back (e.g., to 20%), the data would split and corrupt. Now, 0% only marks the session as `completed` while tracking continues until the actual quota cycle ends (detected via `cycleResetTime`).
   0% ""。 0% ，。

- **Quota Tracker Stale "Tracking..." Bug / ""**: Fixed a bug where sessions stayed stuck in "" forever. Root cause: `lastResetTime` was overwritten every poll cycle, so if the API's `resetTime` transitioned from T1→T2 between two polls, the old value was lost and cycle-end could never be detected. Introduced `cycleResetTime` (locked at tracking start) as the immutable anchor for cycle-end detection.
  ""。：`lastResetTime`  poll 。 `cycleResetTime` 。

- **Clear Active Tracking Button Not Responding / **: The button lost its event listener after incremental poll updates (`innerHTML` swap). Added re-bind logic in the `updateTabs` message handler.
  。 `updateTabs` 。

- **Zoom Level Not Persisted / **: Fixed zoom settings being lost when the panel was closed or the extension was restarted. Previously stored only in webview-internal state (`vscode.getState()`), which is volatile. Now persisted to `DurableState` file (`%APPDATA%/Antigravity Context Monitor/state-v1.json`), surviving panel close, extension reload, VS Code updates, and even uninstall/reinstall.
  。 webview ， `DurableState` ，。

### ✨ Added /  (cont.)

- **Clear Active Tracking Button / **: Added a "Clear" button next to the "Active Tracking" section header. Resets all tracking states without clearing archived history, useful for troubleshooting stuck sessions.
  ""。，。

- **GM Data Scope Note / GM **: Added a collapsible "Data Scope" info panel at the top of the GM Data tab. Explains that metrics accumulate per quota cycle (not per-session or per-day) and that each model pool (e.g., Claude+OSS vs Gemini Pro) resets independently.
   GM  Tab 「」，。

### Architecture /

- **Eliminated `done` state from quota tracker**: Simplified state machine from `idle→tracking→done` to `idle→tracking→(archive)→idle`. Legacy `done` states are auto-migrated to `idle` on extension load.
   `done` 。 `done`  `idle`。

- **Extracted `startTracking()` helper**: Deduplicated 3 identical session-creation code paths into a single `startTracking()` method.
   `startTracking()` ， 3  session 。

- **Added `isCycleEnded()` method**: Centralizes cycle-end detection logic: (a) `cycleResetTime` has passed, or (b) API `resetTime` jumped >30 min.
   `isCycleEnded()` 。

## [1.13.6] - 2026-03-25

### ⚡ Refactored /

- **Unified Polling Loop / **: Eliminated the redundant dual-loop polling architecture (`pollContextUsage` 5s + `pollActivity` 3s) and merged all data collection into a single global loop. Reduces `getAllTrajectories()` RPC calls from ~8 to ~3 per 15-second window, eliminating UI flickering caused by double WebView refreshes. Activity data processing now reuses the trajectory cache from the main poll instead of making independent RPC calls.
  （`pollContextUsage` 5s + `pollActivity` 3s），。15  `getAllTrajectories()` RPC  8  3 ， WebView  UI 。Activity  Trajectory 。

- **Dead Code Removal / **: Removed `activityPollingTimer`, `activityPollGeneration`, `isActivityPolling`, `pollActivity()`, `scheduleActivityPoll()` and a non-existent `statusBar.registerModelAliases()` call that was a latent compile risk.
   `activityPollingTimer`、`activityPollGeneration`、`isActivityPolling`、`pollActivity()`、`scheduleActivityPoll()`  `statusBar.registerModelAliases()` 。

### Changed /

- **Compression Warning Threshold Default / **: Lowered default `compressionWarningThreshold` from **200K** to **150K** tokens. Antigravity does not utilize the full 1M context window; actual effective context is roughly 128K–200K.
   **200K**  **150K** Token。Antigravity  1M ， 128K–200K。

- **Data Disclaimer Enhancements / **:
  - Added `▸` indicator to "Click to expand" text for clearer interactive affordance.
    "" `▸` ，。
  - Added **Context Window Limitation** section: documents that the effective context is ~128K–200K, not the model's nominal 1M.
    ****。
  - Added **Language Switching** hint: directs users to the  | EN |  buttons in the top-right corner.
    ****，。

- **Status Bar Tooltip Enhancement / **: The "Click to view details" line at the bottom of all tooltip variants (no conversation, idle, active) now renders with a `$(link-external)` icon, separator line, and **bold** Markdown formatting, making the clickable action immediately obvious.
   tooltip "" `$(link-external)` 、**** Markdown ，。

## [1.13.5] - 2026-03-24

### Fixed /

- **🔥 Workspace ID Mismatch for Paths with Special Characters /  ID **: Fixed critical bug where `buildExpectedWorkspaceId()` called `decodeURIComponent()` before constructing the workspace ID, but the Language Server builds workspace IDs from the **raw** (percent-encoded) URI. For paths containing spaces (e.g., `linux%20do/final/test`), the extension produced `linux do` (with space) while the LS produced `linux_20do` (percent sign replaced by underscore, preserving the `20` digits). This mismatch caused `selectMatchingProcessLine()` to fail, making LS discovery permanently fail for any workspace path containing spaces, parentheses, or other special characters. Fix: removed `decodeURIComponent()` and replaced individual character substitutions (`/`, `-`, `%`) with a single catch-all regex `[^a-zA-Z0-9_]` → `_`, exactly mirroring the LS's workspace ID generation behavior. This comprehensively handles all special characters and prevents future mismatches.
   Bug：`buildExpectedWorkspaceId()`  ID  `decodeURIComponent()`，****（）URI  ID。（ `linux%20do/final/test`）， `linux do`（）， LS  `linux_20do`（`%`  `_`， `20` ）。 `selectMatchingProcessLine()` ，、 LS。： `decodeURIComponent()`， `[^a-zA-Z0-9_]` → `_` ， LS  ID ，。

### Tests /

- Added 4 new tests for `buildExpectedWorkspaceId()` in `discovery.test.ts`: percent-encoded spaces (`%20` → `_20`), multiple percent-encoded characters, parentheses/special chars, and `vscode-remote://` URIs.
   `discovery.test.ts`  4  `buildExpectedWorkspaceId()` ：（`%20` → `_20`）、、、`vscode-remote://` URI。

## [1.13.4] - 2026-03-24

### Added /

- **Interface Zoom Control / **: New zoom control card in the Settings tab allows users to scale all WebView content (text, icons, spacing) from 60% to 150%. Features 6 preset buttons (80%–130%) and a fine-grained range slider (step 5%). Zoom level is persisted in WebView State (`vscode.getState()`) — survives poll refreshes, tab switches, language changes, and panel hide/reveal. Implementation uses CSS `zoom` on `<body>` (native Chromium support). New `ICON.zoom` (magnifier-plus SVG) and `data-accent="zoom"` purple accent (`#a78bfa`). Custom range slider thumb with hover scale animation and focus-visible ring.
  ， 60%–150% （、、）。6 （80%–130%）+  range （ 5%）。 WebView State ，、、、/。 CSS `zoom`（Chromium ）。 `ICON.zoom`  SVG  accent 。 thumb  hover  focus-visible 。

- **GitHub Project Banner / GitHub **: Added an info banner above the data disclaimer crediting the original author (**AGI-is-going-to-arrive**) with a direct link to the GitHub repository. Includes an inline star icon as a gentle encouragement for users to support the project. New `ICON.externalLink` SVG icon. Styled with green accent border (`--color-ok`) and a compact link button with hover/focus/active states. Full light-theme overrides included.
   GitHub ， **AGI-is-going-to-arrive** 。。 `ICON.externalLink` SVG 。 + （ hover/focus/active ）。。

- **Multi-Window Usage Warning / **: Added an amber-toned info banner recommending single-window usage. Multi-window setups may cause data desync between extension instances (activity timeline, quota tracking, etc.). New `ICON.windows` SVG icon. Styled consistently with the GitHub banner using the `.info-banner` base class.
  ，。（、）。 `ICON.windows` SVG 。 GitHub banner  `.info-banner` 。

- **Daily Aggregation Summary / **: `webview-calendar-tab.ts` now merges all quota cycles for a single day into a unified summary card. Per-model stats (reasoning, toolCalls, errors, estSteps, tokens) are summed across cycles; GM stats (calls, credits, tokens) are summed with TTFT and cache hit rate computed as call-weighted averages. When a day has >1 cycle, individual cycle cards collapse into a `<details>` element; single-cycle days render inline.
  ：，TTFT 。 `<details>` 。

- **Top Summary Bar Enhancements / **: Added GM Calls, weighted-average Cache Hit Rate, and Errors (red) to the day summary bar. Token display now prefers GM token totals (precise per-call API data) over Activity Tracker estimates when available — fixes the 139.6k → 6.5M discrepancy.
   GM 、、。Token  GM  Activity 。

### Changed /

- **Calendar Grid Compaction / **: Removed `aspect-ratio: 1` constraint from calendar cells, switching to compact `padding: var(--space-1) 0` layout. Significantly reduces vertical footprint.
  ， padding ，。

- **Font Size Uplift / **: Systematically increased font sizes across all calendar labels, chips, and stat values (e.g., `0.7em` → `0.85em+`) for improved readability.
  、chip、。

- **All-Time Summary Position / **: Moved "All-Time Summary" section to the top of the Calendar tab for immediate visibility on tab switch.
   Tab ，。

- **Inline Style Cleanup / **: Migrated remaining inline `style="..."` attributes to dedicated CSS classes (`.cal-clear-section`, `.cal-cycle-stats-spaced`, `.cal-day-total-danger`, `.cal-cycles-details`, `.cal-cycles-summary`).
   CSS class。

- **WebView Theme Color Refactoring / WebView **: Full removal of hardcoded purple (`#a78bfa`, `#8b5cf6`, etc.) across 5 source files (~30 sites). Replaced with functional semantic colors: Output→teal (`#2dd4bf`), Thinking/Context Growth→orange (`#f97316`), neutral labels→`var(--color-text-dim)`. Added comprehensive `body.vscode-light` overrides in `webview-styles.ts` (~25 selectors) and `webview-calendar-tab.ts` (~12 selectors) ensuring all GM chips, timeline tags, calendar chips, and disclaimer banner use high-contrast dark text (e.g., `#1d4ed8`, `#15803d`, `#92400e`) on light backgrounds. Dark theme AI response previews changed from blue `var(--color-accent)` to warm orange `#fb923c`.
   5  30 。：→、/→、→。 `webview-styles.ts`（~25 ） `webview-calendar-tab.ts`（~12 ） `body.vscode-light` ， GM chips、、 chips 。 AI 。

- **Hover Theme-Awareness Fix / **: Introduced `--color-border-hover` and `--color-surface-hover` CSS tokens with dark/light/high-contrast definitions. Replaced ~30 hardcoded `rgba(255,255,255,...)` hover styles across `webview-styles.ts` (15 selectors: `.card`, `.call-card`, `.compress-card`, `.ts-card`, `.collapsible`, `.model-card`, `.session-summary-row`, `.num-spinner-btn`, `.radio-row`, `.timeline-card`), `webview-calendar-tab.ts` (`.cal-nav-btn`, `.cal-cycle`, `.cal-cell`), and `pricing-panel.ts` (`.prc-cost-card`, `.prc-edit-card`, `.prc-edit-input`, `.prc-btn`, `.prc-dna-field`, `.prc-viz-highlight`, `.prc-bar-track`, `.prc-section-tag`). Added 10 light-theme overrides for pricing-panel color tags. Fixes counter-intuitive behavior where card borders turned invisible/white on hover in light mode.
   `--color-border-hover` / `--color-surface-hover` CSS token（//）。 `webview-styles.ts`（15 ）、`webview-calendar-tab.ts`（3 ）、`pricing-panel.ts`（11 ） `rgba(255,255,255,...)`  hover 。`pricing-panel.ts`  10 。 hover /。

- **Settings Panel Light Theme Fix / **: Replaced 8 hardcoded `rgba(255,255,255,...)` values with semantic tokens across Settings UI selectors (`.action-btn:hover`, `.num-spinner-btn`, `.preset-btn`, `.copy-btn`, `.storage-path-box`, `.storage-stat`). Added `--color-danger-border` / `--color-danger-surface` fallback tokens for `.danger-action`. Introduced 11 `body.vscode-light` overrides for `.toggle-track`, `.num-spinner`, `.threshold-input`, `.raw-json`, `.danger-action`, and `.storage-path-state` to ensure full light-theme readability.
   8  `rgba(255,255,255,...)`  token（`action-btn:hover`、`num-spinner-btn`、`preset-btn`、`copy-btn`、`storage-path-box`、`storage-stat`）。`danger-action`  fallback token。 11  `body.vscode-light` （toggle-track、num-spinner、threshold-input、raw-json、danger-action、storage-path-state），。

- **Settings Panel UI Redesign /  UI **: Introduced `.stg-card` card system replacing generic `.card` in Settings: colored left accent border (`::before`, 3px gradient), per-section data-accent attributes (10 colors: storage/warn/quota/poll/display/model/activity/privacy/history/debug), `.stg-header` with 28px circular icon background, `.storage-stat` upgrade (centered layout, hover translateY(-1px) + box-shadow, `--color-info` numerals), `.danger-action` refinement (font-weight 700, larger padding, border-radius). Full light-theme overrides for new components.
   `.stg-card`  `.card`：3px 、10  accent （data-accent ）、28px  header、storage （ + hover  + ）、danger （ +  + ）。。

- **Privacy Mask Default-ON / **: Privacy mask now defaults to ON. Removed the Settings panel Privacy card and `privacy.defaultMask` configuration property from `package.json`. Hardcoded `data-privacy-default="true"` in panel body. Added `.privacy-hint` visible text below account info in Profile tab explaining how to toggle. Fixed incremental update (`updateTabs`) privacy restore bug: `!!privState.privacyMasked` returned `false` when state was `undefined` (user never clicked); now falls back to `data-privacy-default` attribute, matching initial-load logic.
  。 `package.json`  `privacy.defaultMask` 。`data-privacy-default`  `"true"`。 `.privacy-hint` 。 bug：`privacyMasked`  `undefined`  `!!undefined` = `false` ， `data-privacy-default` ，。

### Changed /

- **Sticky Current-Conversation Selection / **: `extension.ts` now keeps the already tracked cascade stable as long as it still exists, instead of letting unrelated conversations with step-count changes or newer timestamps steal the GM Data view. This reduces cross-conversation jumps in the monitor panel during parallel or resumed sessions.
  `extension.ts` ，， GM Data ， / 。

- **Window-Outside Attribution Cleanup on Pool Reset / pool reset **: `activity-tracker.ts` now trims `_windowOutsideAttribution` during per-pool archival, removing or shrinking only the affected models' outside-window step attribution. This prevents archived pool data from leaking stale estimated steps back into active cycles after a reset.
  `activity-tracker.ts`  per-pool  `_windowOutsideAttribution`，，。

- **Timeline Three-Zone Layout / **: Refactored timeline rows into fixed-left (time+stepIdx) / elastic-center (model+detail) / fixed-right (meta+GM+duration) layout with `text-overflow: ellipsis`. User rows now have a green dot indicator matching AI rows for visual alignment.
  ， AI 。

- **Timeline Legend / **: Replaced `act-dist-note` with a collapsible `<details id="d-tl-legend">` table legend explaining 9 timeline elements. State persisted via existing `details[id]` restoration logic in webview-script.
  ， webview  poll 。

- **Removed "Exact" Label / ""**: Removed `act-tl-tag-exact` CSS and `buildMetaTags` rendering. Precision is conveyed through the legend.
   CSS 。

- **Cache Token Label /  Token **: Changed GM cache-read token suffix from `$` to `` / `cache`.
   token  `$`  ``。

- **Timeline Legend UI Overhaul /  UI **: Replaced `<table>` layout with flex-based `.act-tl-legend-row` card system. Groups wrapped in bordered+rounded containers with tinted header bars. Each row uses `.act-tl-legend-sample` (90px fixed) + `.act-tl-legend-desc` (fluid) two-column flex layout. Added hover highlight, border on info card and formula bar. Matches the card-based aesthetic of the information note.
   flex  `<table>` 。++。 90px  + 。 hover ，。。

- **Monitor Panel Full Audit / **:
  1. **Remove absolutism** — Replaced all "/Precise/Exact" labels with "GM" branding or softer "/Exact" phrasing. i18n `preciseShort` → `GM`.
  2. **Soften data disclaimer** — Rewrote disclaimer banner: "precise per-call values" → "higher per-call fidelity", added "All numbers are best-effort approximations" / "".
  3. **LLM Call Details newest-first** — Reversed call detail rendering so latest calls appear at top instead of bottom.
  4. **Call-row → call-card** — Replaced flat `.call-row` dividers with bordered `.call-card` cards featuring left accent border, hover highlight, and tag-chip stat layout (`.call-chip`).
  5. **Context X-ray children chip-ified** — Replaced dense comma-separated `breakdown-children` text with `.breakdown-chip` tag system: each child gets a pill with colored left border, name, token count, and percentage.
  6. **Other Sessions badge** — Changed `✓/` source badge to unified `GM` for non-estimated sessions.
  7. **Default-collapsed expert blocks** — Wrapped Output Breakdown, Cache Efficiency, GM Stats, and Context X-ray in `<details>` (default collapsed). Users can expand at will.
  8. **Compression History redesign** — Replaced plain `detail-row` with `.compress-card` cards: left warn-color accent, before/after progress bar, token counts with arrow.
  9. **Timestamps redesign** — Replaced flat rows with a 2×2 `.ts-grid` of `.ts-card` icon cards. Each card shows SVG icon + uppercase label + value. Cascade ID moved to a separate bottom strip.

- **Pricing Panel Card Redesign / **: Cost breakdown table replaced from 7-column table to responsive card grid. Edit pricing table replaced from wide table to 2-column field cards. Font sizes systematically increased (0.68→0.78em, 0.72→0.82em). All text labels bilingualized (legends, tooltips, column headers, badges). Remaining inline `style="..."` migrated to CSS classes.
   7 ；。。（/tooltip//badge）。 CSS class。

- **Quota Tracking Tab UI Overhaul /  Tab UI **:
  - **Session Cards / Session **: Left border coloring by state (active=blue, completed=green, reset=yellow). New horizontal progress bar (current%→0%, breathing animation when active). Meta row redesigned from plain text to chip-style (icon + background + border). Header switched to `space-between` layout.
  - **History Summary / **: New stats bar showing average duration, fastest, slowest, completed count, and reset count with flex-distributed layout.
  - **Timeline Enhancements / **: Vertical track changed to gradient (green→yellow→red, 0.4 opacity). Long timelines (>6 nodes) auto-collapse middle entries with "+N more" indicator. Font sizes increased (tl-content 0.82→0.88em, tl-time 0.9→0.92em).
  - **Motion / **: `prefers-reduced-motion` degradation disables progress bar and pulse animations. Progress bar fill uses 0.4s transition.

  Session  + （）+ chip  meta ；（////）； +  + ；reduced-motion 。

### Bug Fixes /

- **Timeline Step Deduplication / **: Fixed bug where `_injectTimelineEvent()` in `activity-tracker.ts` injected the most recent 20 steps on every `statusChanged` (IDLE→RUNNING) transition without checking for existing entries. Since `_pushEvent()` only performs `push` + `sort` with no dedup, this caused identical step events to accumulate in `_recentSteps`, producing duplicate AI and user entries in the "Recent Activity" timeline when scrolling down. Fix: added `cascadeId` + `stepIndex` + `source='step'` dedup guard at the entry of `_injectTimelineEvent()`.
   `activity-tracker.ts`  `_injectTimelineEvent()`  `statusChanged`（IDLE→RUNNING） 20 、 `_pushEvent()`  push+sort ， `_recentSteps`  Bug。： `_injectTimelineEvent()`  `cascadeId` + `stepIndex` + `source='step'` 。

- **Estimated Event Placeholder / **: Replaced hardcoded ` GM...` with `estimatedModel` variable.
   `estimatedModel` 。

- **Estimated Event Deduplication / **: Resolved estimated events are now removed from `_recentSteps` after GM data covers them (`estimatedResolved` flag).
  GM  `estimatedResolved`  estimated 。

- **GM User Anchor Deduplication / GM **: Added text-based deduplication for `gm_user` anchors (trimmed first 120 chars) preventing duplicate user message rows from different GM calls with different `stepIndex` offsets. Also filters anchors whose text matches existing `step`-source user events.
   anchor  step 。

- **GM Data Resolution Latency / GM **: `injectGMData()` now returns `boolean` indicating whether it modified the timeline (estimated resolution or virtual event injection). `pollActivity()` in `extension.ts` uses this return value in its UI refresh condition (`activityChanged || gmChanged || timelineChanged`), ensuring the panel updates immediately when GM data resolves estimated events — previously required the next user message to trigger a refresh.
  `injectGMData()`  `boolean`  timeline。`pollActivity()`  UI ， GM  estimated  —— 。

- **User Message Text Extraction / **: Fixed critical bug where `_processStep()` and `_injectTimelineEvent()` extracted user text from `userInput.items[0].text` (always empty in current API) instead of `userInput.userResponse`. User message rows were always blank. Added `userResponse` as fallback.
   Bug： `userInput.items[0].text`（ API ），。 `userResponse`  fallback。

- **User Message Expand Logic / **: Replaced fixed character threshold (80/96) with "truncation implies expandable" logic. `fullUserInput` now always stores original text; `hasExpand` is naturally determined by `fullText.length > previewText.length` — if truncation happened, expand is available.
  （80/96），「」：`fullUserInput` ，`hasExpand` 。

- **User Message Expand CSS Priority / **: Added `.act-tl-user.act-tl-expandable` CSS rule to override `.act-tl-user`'s `cursor: default`, enabling pointer cursor on expandable user messages.
   CSS  `.act-tl-user`  `cursor: default`。

- **GM Nearest-Neighbor Matching / GM **: Some `PLANNER_RESPONSE` steps share an LLM call with adjacent steps but are not listed in GM's `stepIndices`. Added ±3 step range fallback in `injectGMData()` so these "continuation" reasoning steps still receive token annotations.
   `PLANNER_RESPONSE`  LLM  GM `stepIndices` 。 ±3  fallback，「」 token 。

- **Expand Indicator False Positive / **: `hasExpand` now strictly checks `fullText.length > previewText.length` rather than just `!!fullText`, eliminating dotted underlines on short messages that have no hidden content.
  `hasExpand` ，。

### Documentation /

- **Project Structure Sync / **: Updated `docs/project_structure.md` to reflect the current repository layout, refreshed `activity-tracker.ts` / `gm-tracker.ts` responsibilities, and aligned the Vitest count to **88 tests**.
   `docs/project_structure.md`，、 `activity-tracker.ts` / `gm-tracker.ts` ， Vitest  **88 **。

- **Bilingual UX Copy Audit / **: Performed a user-visible wording audit across notifications, status bar tooltip, QuickPick details, Monitor / Profile / Pricing tabs, and `readme_CN.md`. Localized remaining labels and units such as `tokens`, `cr`, `Cascade ID`, pricing-unit subtitles, and WebView action feedback, while clarifying Chinese-facing terminology in the disclaimer and README.
  、 tooltip、QuickPick 、Monitor / Profile / Pricing  `readme_CN.md` 。 `tokens`、`cr`、`Cascade ID`、、WebView ， README 。

### Quality /

- **Codebase Health Check / **: Re-ran `npm run compile` and `npm test` against the current workspace state. Result: compile passes, **88/88** tests pass. During this review the primary desync found was documentation drift (test counts / structure description lagging behind code), which is now synchronized in `docs/project_structure.md`.
   `npm run compile`  `npm test`。：，**88/88** 。（、）， `docs/project_structure.md` 。

### Fixed /

- **🔥 Sub-Agent Data Loss on Restore — Key Mismatch /  — Key **: Fixed critical bug where `restore()` used `entry.modelId` as the Map key when restoring `_subAgentTokens`, but creation used composite key `${rawModel}::${ownerModel}`. When the same sub-agent model served multiple parent models (e.g., Flash Lite for both Sonnet and Opus), restoration collapsed entries via last-write-wins, permanently losing data.
   Bug：`restore()`  `_subAgentTokens`  `entry.modelId`  Map key， key `${rawModel}::${ownerModel}`。（ Flash Lite  Sonnet  Opus），，。

- **🔥 Sub-Agent Migration False Trigger — Ratio Threshold Too Aggressive /  — **: Fixed bug where `needsSubAgentMigration` check used `subAgentTotalCount < totalCheckpoints * 0.5` — a ratio-based threshold that falsely triggered nuclear reset when sub-agent activity was legitimately low relative to checkpoints. Nuclear reset cleared all restored data and forced re-warm-up, which could only see ~500 steps per conversation via API window, permanently losing older historical sub-agent data. Now only triggers when sub-agent data is entirely absent (old format migration).
   Bug：`needsSubAgentMigration`  `subAgentTotalCount < totalCheckpoints * 0.5` ，。 re-warm-up， API  ~500 ，。（）。

- **Timeline Model Name Truncation / **: Fixed `.act-tl-model` CSS that used `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` to truncate long model names. Changed to `word-break: break-word; overflow-wrap: anywhere` to allow natural wrapping, consistent with `.act-card-header` behavior.
   `.act-tl-model` CSS  `nowrap + ellipsis` 。 `break-word + anywhere` ， `.act-card-header` 。

- **Conversation Breakdown Key Mismatch on Restore /  Map key **: Fixed bug where `restore()` used `ConversationBreakdown.id` (short 8-char ID) as Map key, but `_updateConversationBreakdown()` uses full `cascadeId` UUID. After restore, GM-based corrections in `injectGMData()` couldn't find entries. Now uses trajectory baselines to reconstruct full cascadeId keys on restore.
   Bug：`restore()`  `cb.id`（8  ID） `_conversationBreakdown` Map key， `cascadeId` UUID。 `injectGMData()`  GM 。 trajectory baselines  cascadeId  key。

### Added /

- **Sub-Agent Conversation Attribution / **: `SubAgentTokenEntry` interface extended with `cascadeIds?: string[]` field tracking which conversations generated the sub-agent consumption. `_processStep()` now receives `cascadeId` parameter, transparently passed from all 4 call sites in `processTrajectories()`. Activity panel sub-agent cards now display: conversation count row, owner model badge (`→ ownerModel`), and footer with conversation ID short tags.
  `SubAgentTokenEntry`  `cascadeIds` 。`_processStep()`  `cascadeId` ， `processTrajectories()`  4 。：、ownerModel 、 ID 。

- **🚀 GM-Powered Sub-Agent Window Bypass / GM**: `GetCascadeTrajectorySteps` API has a hard ~500 step window — sub-agent data from earlier steps is permanently lost on re-warm-up. New `injectGMData()` supplement uses `GetCascadeTrajectoryGeneratorMetadata` (no window limit) to extract sub-agent calls from OUTSIDE the step API window. Separate `_gmSubAgentTokens` Map (runtime-only, rebuilt each poll) is merged with CP-based `_subAgentTokens` in `getSummary()`. Dominant model is determined from trajectory cache or GM call frequency fallback. Pool resets and full resets correctly clear both Maps.
  `GetCascadeTrajectorySteps` API  ~500 —— re-warm-up 。 `injectGMData()` ， `GetCascadeTrajectoryGeneratorMetadata`（）。 `_gmSubAgentTokens` Map（， poll ） `getSummary()`  CP 。 trajectory  GM 。Pool/ reset  Map。

- **GM Conversation Steps Correction / GM**: `_conversationBreakdown.steps` was limited by the Steps API ~500 window — always capped at the number of steps returned. Now `injectGMData()` corrects step counts using `GMConversationData.totalSteps` which reflects the actual total without window limitation.
  `_conversationBreakdown.steps`  Steps API ~500 ， API 。 `injectGMData()`  `GMConversationData.totalSteps`（）。

- **GM Context Growth History Supplement / GM**: `_checkpointHistory` was built only from CHECKPOINT steps within the API window, missing context growth from earlier steps. Now `injectGMData()` prepends virtual `CheckpointSnapshot` entries from `GMSummary.contextGrowth` data points that fall outside the step window, including compression detection. One-time injection guard prevents duplicate prepends across poll cycles.
  `_checkpointHistory`  API  CHECKPOINT ，。 `injectGMData()`  `GMSummary.contextGrowth`  `CheckpointSnapshot` ，。 poll 。

### Refactored /

- **Monitor ↔ GM Data Deduplication /  GM **: Removed 5 redundant data sections from the Monitor tab that overlap with the global-scope GM Data tab. Monitor now focuses exclusively on **current session** real-time status; all analytical/aggregated visualizations are delegated to GM Data.
   5  GM 。****；/ GM 。

  |  |  |
  |---|---|
  | GM  (Credits/TTFT/Stream/Calls/Retry) | GM  tab  |
  |  | /，GM  |
  |  X  (Token Breakdown) |  GM  |
  |  (Growth Curve) | GM  |
  |  (Model Distribution) | GM  |

  ** 352 ** (222  TS  + 131  CSS )。

- **Context X-ray → GM Data Composition /  X  GM **: Context X-ray detail view (per-group progress bars + child chip tags + total) relocated from Monitor tab to GM Data tab's "Context Composition" section. Rendered as a collapsible `<details>` beneath the donut chart — donut provides instant visual summary, expand reveals detailed per-group breakdown with progress bars and child chip tags.
   X （ +  chip  + ） GM 「」。 `<details>` — ，。

- **X-ray Detail Scroll Persistence / X **: `.xray-body` receives `max-height: 280px` + `overflow-y: auto` with themed 4px scrollbar. Added to `scrollableSelectors` array in `webview-script.ts` for automatic scroll position save/restore across DOM rebuilds.
  `.xray-body`  280px + 。 `webview-script.ts`  `scrollableSelectors`，DOM 。

## [1.13.3] - 2026-03-23

### Added /

- **Profile Panel Data Mining / **: Deep analysis of `GetUserStatus` response uncovered 227 leaf nodes and 3 previously unused fields: `userTier.description` (subscription status text), `upgradeSubscriptionText` (upgrade hint), and `clientModelSorts` (LS-recommended model ordering). Added `userTierDescription`, `upgradeSubscriptionText`, `modelSortOrder` to `UserStatusInfo` interface.
   `GetUserStatus`  227  3 ：`userTier.description`（）、`upgradeSubscriptionText`（）、`clientModelSorts`（LS ）。 `UserStatusInfo` 。

- **Profile Panel Model Card Grid / **: Model quota section redesigned as a responsive 2-column grid of `.model-card` components. Each card displays: model name with `tagTitle` badge (e.g., "New"), quota progress bar, MIME type categories (Docs/Code/Image/Media) with counts as `.mime-chip` tags, reset countdown, and full MIME list in collapsible section. Models sorted by LS-recommended `clientModelSorts` order.
   2 。： + `tagTitle` 、、MIME 、、 MIME 。 LS 。

- **Profile Panel Subscription Hint / **: Account section now displays `upgradeSubscriptionText` as a `.subscription-hint` styled prompt, and Google AI Credits are inlined as `.gai-credits` badge.
   `upgradeSubscriptionText`  Google AI Credits 。

- **Profile Panel Merged Sections / **: Feature Flags and Team Config merged into a single "Features & Team" collapsible section for reduced clutter.
  。

- **Probe Data: Retry Overhead Tracking / ：**: `GMCallEntry` now captures `retryTokensIn`, `retryTokensOut`, `retryCredits`, `retryErrors` from `retryInfos[]` in GeneratorMetadata. `GMSummary` aggregates `totalRetryTokens`, `totalRetryCredits`, `totalRetryCount`. A new "Retry" card in the Summary Bar and a dedicated Retry Overhead section display retry token waste, credit loss, and retry count. Stop reason distribution (`stopReasonCounts`) also tracked and visualized.
  `GMCallEntry`  `retryInfos[]`  `retryTokensIn/Out`、`retryCredits`、`retryErrors`。`GMSummary`  `totalRetryTokens/Credits/Count`。Summary Bar ""， token 、。`stopReason` 。

- **Probe Data: Token Breakdown Donut Chart / ：**: New `buildTokenBreakdownChart()` function renders a CSS donut chart visualizing the latest token composition (System Prompt, Chat Messages, MCP Tools, Rules, Skills, Native Tools, etc.) from `tokenBreakdown.groups[]`. Each segment has a distinct color from a predefined palette.
   `buildTokenBreakdownChart()` ， CSS  token （、、MCP 、、、），。

- **Probe Data: stopReason & timeSinceLastInvocation / ：**: `GMCallEntry` now captures `stopReason` (from `plannerResponse.stopReason`) and `timeSinceLastInvocation` for richer per-call diagnostics.
  `GMCallEntry`  `stopReason`（ `plannerResponse.stopReason`） `timeSinceLastInvocation` ，。

- **Durable External Persistence / **: Added `durable-state.ts`, an external JSON-file persistence layer mirrored with VS Code state. Key Monitor / GM Data / Pricing / Calendar / Quota History state is now recoverable after uninstall/reinstall as long as the state file remains.
   `durable-state.ts`  JSON ， VS Code state 。 Monitor / GM Data / Pricing / Calendar / Quota History  / 。

- **Monitor Snapshot Store / **: Added `monitor-store.ts` to persist `ContextUsage` plus per-conversation `GMConversationData` snapshots. The Monitor tab can now restore call counts, cache, retry, model distribution, compression history, and recent call details even when live `gmSummary` is unavailable.
   `monitor-store.ts`， `ContextUsage`  `GMConversationData` 。Monitor  `gmSummary` ，、、、、。

- **Settings Storage Diagnostics / **: The Settings tab now includes a "Persistent Storage" card showing the external state file path, existence status, and counters for Monitor / GM / Calendar / Pricing data. Added copy/open/reveal file actions for direct verification.
  「」，、， Monitor / GM / Calendar / Pricing ，、、。

### Fixed /

- **🔥 Privacy Toggle Broken After Refresh / **: Fixed critical bug where the privacy shield button (name/email masking) stopped working after any auto-refresh cycle. Root cause: `updateTabs` incremental refresh replaced Profile tab `innerHTML`, destroying the old `#privacyToggle` button and its click event listener. The re-apply logic (line 609-617) only restored mask text state but never re-bound the click handler. Fix: `updateTabs` handler now re-creates the full click listener on the new `#privacyToggle` button, restores `.active` class, and properly toggles `privacyMasked` state via `vscode.setState()`.
   Bug：（/）。：`updateTabs`  Profile  `innerHTML`， `#privacyToggle`  click 。， click 。：`updateTabs`  click  +  `.active`  +  `privacyMasked` 。

- **🔥 Per-Pool Quota Reset Clears All Models' Data / **: Fixed critical bug where a single model pool's quota reset (e.g., Gemini Pro) wiped GM data (call counts, tokens, credits) and Activity data (reasoning, tool calls, timeline events) for ALL models including unrelated ones (e.g., Claude). Root causes: (1) `gmTracker.reset()` was called globally without model IDs, clearing all call baselines; `dailyStore.addCycle()` archived all GM data regardless of pool. (2) `activityTracker.archiveAndReset()` cleared all `_modelStats`, timeline events, and GM breakdown even when `modelIds` were provided. Fix: (1) `GMTracker.reset(modelIds?)` now uses `_archivedCallIds` Set to track per-pool archived calls; `_buildSummary()` filters them out. (2) `ActivityTracker.archiveAndReset(modelIds?)` now converts model IDs to display names, builds filtered archive containing only pool models' stats/events, and preserves non-pool data. (3) `extension.ts` adds `expandToPool()` helper that groups models by `resetTime` and passes full pool member lists to both trackers.
   Bug：（ Gemini Pro）（ Claude） GM （、token、） Activity （、、）。：① `gmTracker.reset()`  ID ；`dailyStore.addCycle()`  GM 。② `activityTracker.archiveAndReset()`  modelIds  `_modelStats`、 GM breakdown。：① `GMTracker.reset(modelIds?)`  `_archivedCallIds` Set ，`_buildSummary()` 。② `ActivityTracker.archiveAndReset(modelIds?)`  modelId ，+ pool 。③ `extension.ts`  `expandToPool()`  resetTime  pool 。

- **🔥 Pool Archival Boundary & Cross-Tab Pollution / **: Fixed follow-up issues where one pool reset still leaked unrelated models' data into Calendar / Pricing archives, and some Activity-derived Monitor / GM Data metrics could appear mixed after pool resets. `extension.ts` now splits reset callbacks by reset-time pool, archives each pool independently using the matching `QuotaSession` time window, filters GM snapshots before cost calculation, and recalculates tool rankings from surviving per-model stats. `subAgentTokens` now carry `ownerModel` so pool resets only clear matching entries.
  ：，Calendar / Pricing ， Activity  Monitor / GM Data 。`extension.ts`  resetTime  pool， `QuotaSession` ， GM ； per-model stats 。`subAgentTokens`  `ownerModel`，。

- **🔥 Monitor Detail Loss After Restart/Reinstall / **: Fixed issue where Monitor tab could still show the session list but lose per-conversation GM details (calls, thinking split, cache, retry, model distribution, recent call rows) after reconnect, restart, or reinstall. `monitor-store.ts` now persists conversation-level GM snapshots, and `webview-monitor-tab.ts` falls back to them automatically when live GM data is not yet available.
   Monitor 、， GM （、、、、、）。`monitor-store.ts`  GM ，`webview-monitor-tab.ts`  GM 。

- **Settings Schema / UI Mismatch /  Schema **: Fixed anti-intuitive mismatch where UI text said `quotaNotificationThreshold=0` disables notifications, but `package.json` schema still enforced minimum `1`. Minimum is now `0`, and `setConfig` applies explicit normalization/clamping for quota notification, activity limits, privacy toggle, and context limit overrides.
  ： `quotaNotificationThreshold=0` ， `package.json`  schema  `1`。 `0`， `setConfig` 、、、 / 。

### Changed /

- **Monitor Tab: LS Raw Data Section Removed / ：LS **: Removed `buildRawDataSection()` from `webview-monitor-tab.ts`. Raw LS data is now fully represented by enriched GM Data tab components, making the redundant raw dump unnecessary.
   `webview-monitor-tab.ts`  `buildRawDataSection()`。LS  GM Data ，。

- **Daily Store: Retry Archiving / ：**: `DailyCycleEntry` now includes `gmRetryTokens`, `gmRetryCredits`, `gmRetryCount` optional fields. `addCycle()` populates them from `GMSummary` during quota reset archiving, ensuring retry overhead is preserved in calendar history.
  `DailyCycleEntry`  `gmRetryTokens`、`gmRetryCredits`、`gmRetryCount` 。`addCycle()`  `GMSummary` ，。

- **Profile Tab UI Overhaul /  UI **: Complete rewrite of `buildProfileContent()` in `webview-profile-tab.ts`. Account section integrates Google AI Credits inline. Model quota switches from flat list to card grid with MIME chips. Features and Team merged. New CSS classes added to `webview-styles.ts`: `.subscription-hint`, `.gai-credits`, `.model-grid`, `.model-card`, `.mime-chips`, `.mime-chip`.
   `webview-profile-tab.ts`  `buildProfileContent()`。 Credits。 + MIME 。。`webview-styles.ts`  6  CSS 。

- **Per-Pool Quota Reset Isolation /  per-pool **: `onQuotaReset` callback now expands triggering model IDs to their full quota pool via `expandToPool()` (groups by `resetTime`). Both `gmTracker.reset(poolModelIds)` and `activityTracker.archiveAndReset(poolModelIds)` now only affect data for models within the resetting pool. `GMTrackerState` extended with `archivedCallIds` for cross-session persistence of per-pool archived call tracking.
  `onQuotaReset`  `expandToPool()`  ID （ resetTime ）。`gmTracker.reset(poolModelIds)`  `activityTracker.archiveAndReset(poolModelIds)`  pool 。`GMTrackerState`  `archivedCallIds` 。

- **Monitor / GM Persistence Strategy / Monitor / GM **: `GMTracker.serialize()` still keeps a slim summary for fast baseline recovery, but `getDetailedSummary()` now exports a full `GMSummary` (with calls) to the external state file. This separates "lightweight cycle state" from "rich UI recovery state" and avoids forcing the WebView to wait for a fresh poll before restoring details.
  `GMTracker.serialize()`  summary ， `getDetailedSummary()`  `GMSummary`（ calls）。“”“ UI ”， WebView 。

- **Settings UX / **: Added success feedback mapping for quota notification, activity limits, quota-history max size, and persistent-state path copy action. Developer clear/reset actions now also refresh storage diagnostics immediately.
  ：、、； / 。

- **Data Disclaimer Wording Update / **: Disclaimer banner now clearly distinguishes data sources: items with a green **GM** badge are precise per-call values from Generator Metadata, while other metrics (context usage, token estimates) are derived from checkpoint snapshots or character-based heuristics. Previous wording implied all data was "estimated".
  ： **GM**  Generator Metadata ，（、Token ） Checkpoint 。“”。

- **Monitor Tab: GM Precision Sections / ：GM **: `buildMonitorSections()` now receives `GMSummary` and renders three new sections in the Monitor tab: ① **Output Split** — stacked bar chart showing input/output/cache/thinking token proportions per model, ② **Per-Call Detail** — expandable collapsible entries for each LLM call with full GM breakdown (tokens, TTFT, streaming speed, credits, stop reason, retry info), ③ **Stop Reason Distribution** — counts of each stop reason across all calls. New CSS classes in `webview-styles.ts`: `.gm-split-section`, `.gm-cache-section`, `.gm-stats-section`, `.output-split-bar`, `.call-row`, `.call-detail`.
  `buildMonitorSections()`  `GMSummary` ：① **** —  input/output/cache/thinking ；② **** —  LLM  GM （token、TTFT、、、、）；③ **** —  stopReason 。`webview-styles.ts`  6  CSS 。





## [1.13.3] - 2026-03-23

### Fixed /

- **🔥 WebView Disposed → Status Bar IDLE Loop / WebView  IDLE **: Fixed critical bug where closing the Monitor Panel caused `panel.webview.postMessage()` to throw `Error: Webview is disposed`, which propagated to the `pollContextUsage()` catch block and triggered `handleLsFailure()` — creating an infinite backoff loop showing "" in the status bar. Fix: introduced `safePostMessage()` wrapper that catches disposed errors at the source and calls `clearDisposedPanel()` to clean up state. All 11 `postMessage` call sites replaced.
   Bug： `panel.webview.postMessage()`  `Webview is disposed` ， `pollContextUsage()`  catch  `handleLsFailure()`，""。： `safePostMessage()`  disposed ， `clearDisposedPanel()` 。 11  `postMessage` 。

- **🔥 Multi-Workspace LS Cross-Binding /  LS **: Fixed critical bug where multiple VS Code windows with different workspaces could bind to the same Language Server process. Root cause: three discovery functions (WSL, Windows, macOS/Linux) silently fell back to `lines[0]` (the first discovered LS) when no exact `workspace_id` match was found. Fix: introduced `selectMatchingProcessLine()` with fail-closed behavior — when a `workspaceUri` is provided but no matching LS process exists, returns `null` instead of falling back. Three inline matching blocks replaced.
   Bug： VS Code 。：WSL、Windows、macOS/Linux  `workspace_id`  `lines[0]`（ LS）。： `selectMatchingProcessLine()`，—— `workspaceUri`  LS  `null`，。。

### Added /

- **`safePostMessage()` / **: Sync try-catch wrapper for `panel.webview.postMessage()`. Catches disposed errors silently, re-throws non-disposed errors to preserve call stacks.
  `panel.webview.postMessage()`  try-catch 。 disposed ， disposed 。

- **`selectMatchingProcessLine()` / **: New function for workspace-aware LS process selection. Without URI, falls back to first process (backward compat). With URI, performs exact `workspace_id` match and fails closed on mismatch.
   LS 。 URI （）。 URI  `workspace_id` ， null。

- **`decodeURIComponent` defense in `buildExpectedWorkspaceId()` / **: Percent-encoded workspace URIs (e.g., `file:///c%3A/...`) are now decoded before workspace ID construction, preventing match failures when VS Code sends encoded paths.
   URI（ `file:///c%3A/...`） ID ， VS Code 。

### Tests /

- Added 7 new tests for `selectMatchingProcessLine()` (6 branch tests) and `buildExpectedWorkspaceId()` (percent-encoded path test) in `discovery.test.ts`.
   `discovery.test.ts`  7 ：`selectMatchingProcessLine()` 6  + `buildExpectedWorkspaceId()` 。

### Contributors /

- Thanks to [@NightMin2002](https://github.com/NightMin2002) for identifying both bugs and proposing fixes ([PR #27](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/27)).
   [@NightMin2002](https://github.com/NightMin2002)  Bug （[PR #27](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/27)）。

## [1.13.2] - 2026-03-23

### Added /

- **Unified GM Data Tab /  GM **: Merged the former "Activity" and "GM Data" tabs into a single "GM Data" tab. Activity tracking (timeline, tools, distribution) and GM precision data (performance, cache efficiency, context growth, conversations) now coexist in one view. Former `gm-panel.ts` deleted; all rendering consolidated into `activity-panel.ts` via `buildGMDataTabContent()`. Tab count reduced from 8 to 7.
  「」「GM 」「GM 」。Activity （、、） GM （、、、）。 `gm-panel.ts` ， `activity-panel.ts`。 8  7。

- **GM Call Baselines — Cycle Isolation / GM  — **: `GMTracker` now tracks per-conversation call baselines (`_callBaselines` Map) to isolate quota cycles. `_buildSummary()` uses `calls.slice(baseline)` to count only current-cycle calls. Baselines are persisted in `GMTrackerState.callBaselines` and restored across sessions. `reset()` sets baselines and preserves cache stubs; `fullReset()` clears everything and sets `_needsBaselineInit` for zero-start counting.
  `GMTracker` （`_callBaselines` Map）。`_buildSummary()`  `calls.slice(baseline)` 。 `GMTrackerState.callBaselines` 。`reset()` ；`fullReset()` ， `_needsBaselineInit` 。

- **Quota Pool Deduplication / **: `QuotaTracker.processUpdate()` now groups models sharing the same `resetTime` into pools. Only one representative per pool is tracked (lowest fraction, alphabetical tie-break), preventing duplicate sessions in history from same-pool models (e.g., Claude Sonnet/Opus sharing quota).
  `processUpdate()`  `resetTime` ，（ fraction → ）， session。

- **Quota Pool Model Labels / **: `QuotaSession` now includes `poolModels?: string[]` field collecting display labels of all models in the same quota pool. `processUpdate()` builds a `poolLabelsForModel` map and injects it into sessions at creation and during tracking updates. The Quota Tracking tab renders additional pool members as `.pool-badge` tags next to the primary model label.
  `QuotaSession`  `poolModels` ，。`processUpdate()`  `poolLabelsForModel`  session。 `.pool-badge` 。

- **Debug / Testing Section in Settings / **: New section with two developer tools: "Simulate Quota Reset" (archives Activity + GM + Cost to Calendar, then resets baselines) and "Clear GM Data & Baselines" (nuclear reset, baselines all existing API data on next fetch).
  ：「」（）「 GM 」（， API ）。

- **Default Pricing Table / **: Pricing tab now shows an editable default pricing table even when no GM data is available, via `buildDefaultPricingTable()`. Users can configure custom prices before any AI conversations.
  Pricing  GM ，。

- **Immediate First Poll / **: `activate()` now triggers `pollContextUsage()` → `pollActivity()` chain immediately, reducing panel data readiness from ~6s to ~1-2s. Scheduled polls continue in parallel; `isPolling`/`isActivityPolling` guards prevent duplication.
  `activate()`  poll ， ~6s  ~1-2s。，。

- **`devPersistActivity` Command / **: New internal command `antigravity-context-monitor.devPersistActivity` persists the current `activityTracker` state to `globalState`. Called by `clearActivityData` to ensure the cleared state survives extension reload/reinstall.
  ， `activityTracker`  `globalState`。 `clearActivityData` ，/。

### Fixed /

- **🔥 IDLE Conversations GM Data Lost After Restart /  IDLE  GM **: Fixed critical bug where `serialize()` strips `calls[]` for storage efficiency, but `fetchAll()` skipped IDLE conversations with matching `totalSteps` — never re-fetching their calls. After restart, only RUNNING conversations had GM data; all IDLE conversations showed 0 calls. Fix: skip condition now requires `cached.calls.length > 0`, forcing a one-time re-fetch for restored stubs with empty calls.
   Bug：`serialize()`  `calls[]`， `fetchAll()`  `totalSteps`  IDLE ，。 RUNNING  GM ， IDLE  0 。： `calls.length > 0`，restore  calls  IDLE  `fetchAll()` 。

- **🔥 Settings Tab Buttons/Toggles Unresponsive / **: Fixed critical bug where `updateTabs` incremental refresh replaced Settings tab `innerHTML` every 3-5s, destroying all event listeners on toggles, dev buttons, and inputs. Fix: Settings tab excluded from `buildTabContents()` incremental updates; only rebuilt during full HTML renders (panel open, language switch, user actions).
   Bug：`updateTabs`  3-5  Settings  `innerHTML`， toggle、、。：Settings ， HTML 。

- **Panel Shows Stale GM Data After Quota Reset /  GM **: Fixed desync where `onQuotaReset` set `extension.ts lastGMSummary = null` but `pollContextUsage()`'s `updateMonitorPanel()` call didn't pass `lastGMSummary`, leaving the panel's cached copy unchanged. Both `updateMonitorPanel` calls in `pollContextUsage()` (idle path and normal path) now pass `lastGMSummary`.
  ：`onQuotaReset`  `extension.ts`  `lastGMSummary`， `pollContextUsage()`  `updateMonitorPanel()` ，。： `updateMonitorPanel`  `lastGMSummary`。

- **GM Change Detection Failure on null→empty / null→ summary **: Fixed edge case where `lastGMSummary = null` after reset, then `fetchAll()` returns `totalCalls=0` — `0 !== (null?.totalCalls ?? 0)` evaluated to false, leaving `lastGMSummary` permanently null. Fix: explicit `!lastGMSummary` check triggers update when transitioning from null to any valid summary.
  ：`lastGMSummary = null`  `fetchAll()`  `totalCalls=0`，`0 !== (null?.x ?? 0)`  false，`lastGMSummary`  null。：`!lastGMSummary`  null 。

- **Old Version Upgrade Shows Archived Data / **: Fixed migration issue where upgrading from pre-callBaselines version (no `callBaselines` in persisted state) caused all historical API data to display unfiltered. `restore()` now sets `_needsBaselineInit = true` when `callBaselines` is absent, baselining all existing API data on first fetch.
  ： `callBaselines` ， API 。`restore()`  `callBaselines`  `_needsBaselineInit = true`，。

- **🔥 Calendar Data Persists After Clear + Reinstall / **: Fixed critical bug where calendar highlights reappeared after "Clear Activity Data" → extension reinstall. Root cause: `importArchives()` ran on every `activate()`, re-populating `DailyStore` from `activityTracker.getArchives()` unconditionally. Also `clearActivityData` was missing `dailyStore.clear()` and didn't persist the cleared `activityTracker` state. Fix: (1) `DailyStoreState` now includes `backfilled?: boolean` flag; `importArchives()` skips entirely when `_backfilled` is true, and sets it after first run. (2) `clear()` sets `_backfilled = true` to prevent re-import. (3) `clearActivityData` now calls `dailyStore.clear()` and `devPersistActivity`.
   Bug：「」，。：`importArchives()`  `activate()`  `activityTracker.getArchives()` 。 `clearActivityData`  `dailyStore.clear()`、 activityTracker 。：① `DailyStoreState`  `backfilled` ，`importArchives()` ，；② `clear()`  `backfilled=true` ；③ `clearActivityData`  `dailyStore.clear()` + `devPersistActivity`。

- **Calendar Data Duplication from Live Snapshot / live-snapshot **: Removed the live-snapshot code path from `extension.ts activate()` that wrote current active session data into `DailyStore` on every activation. Calendar data is now written exclusively via `onQuotaReset` callback (authoritative) and `importArchives` one-time cold-start backfill, eliminating duplicate cycle entries.
   `extension.ts activate()`  live-snapshot 。 `onQuotaReset` （） `importArchives` ，。

### Changed /

- **Removed `gm-panel.ts` /  GM **: Content merged into `activity-panel.ts`. Functions `buildPerformanceChart`, `buildCacheEfficiency`, `buildContextGrowth`, `buildConversations` migrated. Exports renamed: `buildActivityTabContent` → `buildGMDataTabContent`, `getActivityTabStyles` → `getGMDataTabStyles`.
   `activity-panel.ts`。 GM 。。

- **Removed `statusBar.showActivity` and `activityDisplayMode` / **: Removed `statusBar.showActivity` toggle and `activityDisplayMode` radio (global/currentModel) from both `package.json` configuration and Settings tab UI. Related script handlers also removed.
   `package.json`  `statusBar.showActivity`  `activityDisplayMode` 。。

- **`showActivityPanel` command now opens GM Data tab /  GM **: The command `antigravity-context-monitor.showActivityPanel` now sets `initialTab` to `'gmdata'` instead of `'activity'`.
   `initialTab`  `'gmdata'`。

- **`clearActivityData` Full-Chain Cleanup / **: "Clear Activity Data" now also clears `DailyStore` (calendar data), persists the cleared `activityTracker` state to `globalState`, resets quota tracking states, clears quota history, and triggers `devClearGM`. All data subsystems are synchronized.
  「」 `DailyStore`（）、 `activityTracker` 、、、 `devClearGM`。。

- **`importArchives` One-Time Migration / **: `DailyStore.importArchives()` is now a one-time operation. Once backfill completes, a `backfilled` flag is persisted to `globalState`, preventing subsequent `activate()` calls from re-importing cleared data. `clear()` also sets this flag.
  `DailyStore.importArchives()` 。 `backfilled`  `globalState`， `activate()` 。`clear()` 。

### Tests /

- Added `poolModels` population test in `quota-tracker.test.ts`.
   `quota-tracker.test.ts`  `poolModels` 。
- Total test count: 75 (was 67 in v1.12.2).
  ：75（v1.12.2  67）。


## [1.13.0] - 2026-03-22

### Fixed /

- **🔥 Remote-WSL LS Discovery /  WSL **: When connected via Remote-WSL, the Antigravity IDE spawns a separate `language_server_linux_x64` process **inside** the WSL distro. Previously, the extension (running on the Windows UI side via `extensionKind`) only discovered the Windows-side LS, completely missing the WSL LS and its trajectory data. The extension now detects `vscode-remote://wsl+<distro>/...` workspace URIs, runs `wsl -d <distro> -- ps aux` to locate the LS inside WSL, extracts connection info (CSRF token, PID), discovers listening ports via `ss -tlnp`, and probes them from Windows via localhost (WSL2 auto-forwarding). This resolves the "idle / 0k/1M" display in Remote-WSL workspaces.
   Remote-WSL ，Antigravity IDE  WSL **** `language_server_linux_x64` 。（ `extensionKind`  Windows UI ） Windows  LS， WSL  LS 。 `vscode-remote://wsl+<distro>/...`  URI ， `wsl -d <distro> -- ps aux`  WSL  LS，（CSRF token、PID）， `ss -tlnp` ， Windows  localhost （WSL2 ）。 Remote-WSL " / 0k/1M"。

### Added /

- **`extractWslDistro()` helper**: Extracts WSL distro name from `vscode-remote://` URIs, handling both URL-encoded (`wsl%2Bubuntu`) and raw (`wsl+Ubuntu`) formats.
   `extractWslDistro()` ， `vscode-remote://` URI  WSL ， URL 。

- **`discoverWslLanguageServer()` function**: Complete WSL-side LS discovery pipeline: process scanning → workspace_id matching → CSRF/PID extraction → port discovery → RPC probing.
   `discoverWslLanguageServer()` ， WSL  LS ： → workspace_id  → CSRF/PID  →  → RPC 。

## [1.13.1] - 2026-03-22

### Added /

- **Incremental Refresh (PostMessage) / （PostMessage）**: Auto-refresh no longer replaces the entire WebView HTML. Instead, `updateMonitorPanel()` sends tab contents via `postMessage`, and the frontend updates each tab pane's `innerHTML` in-place. Scroll position, `<details>` expand states, disclaimer banner, and all UI state are preserved naturally. Full HTML rebuild only occurs on first show and user-initiated actions (language switch, clear data, etc.). Interactive elements (copy JSON, pricing save/reset, switch-tab links, privacy mask) are re-bound after each incremental update.
   WebView HTML。`updateMonitorPanel()`  `postMessage` ， `innerHTML`。、`<details>` 、 UI 。

- **Kill Native Number Input Spinners / **: Added global CSS to hide WebKit/Firefox native spinner buttons on `input[type="number"]`. Applies to pricing custom input fields.
   CSS  `input[type="number"]` 。

- **Data Disclaimer Banner / **: Collapsible disclaimer banner at the top of the monitor panel. Explains that data is derived from internal interfaces, provided best-effort, and not officially endorsed. Uses `<details>` for keyboard accessibility, amber-toned styling. Collapsed by default. Bilingual via `tBi()`.
  。，，。，。

- **Calendar Tab — Daily History /  — **: New 8th tab in WebView panel. Displays a 7×6 calendar grid with data indicators (dots on days with activity). Click any day to expand and view per-cycle details including Activity stats (reasoning/tools/tokens), GM data (calls/credits), and cost estimates. Month navigation with ◀/▶ buttons. All-time summary card with aggregated stats.
  WebView  8 「」。7×6 ，。：、GM 、。。。

- **`daily-store.ts` — Daily Store Data Layer / **: New module managing per-day aggregation of Activity + GM + Pricing snapshots. Persisted via globalState. Auto-trims records older than 90 days. Snapshots captured automatically at quota reset (archiveAndReset hook).
  ： Activity + GM + Pricing ，globalState ，90 ，。

- **`webview-calendar-tab.ts` — Calendar UI Builder /  UI **: New module rendering Calendar tab HTML: month navigation, calendar grid, expandable day detail panels, cycle cards, overall summary.
   UI：、、、、。

- **Retroactive Archive Import / **: `DailyStore.importArchives()` method imports existing `ActivityArchive` history into the calendar on startup. Uses `startTime`-based dedup for idempotent re-import across restarts. Also snapshots the current active session into today.
   `importArchives()` ，。 `startTime` ，。。

- **Calendar: Per-Model Cycle Detail / : **: Each cycle card now shows per-model breakdown rows with color-coded SVG stat chips: reasoning (purple), tools (blue), errors (red), est-steps (yellow), tokens (green). Data stored via new `ModelCycleStats` interface in `DailyCycleEntry.modelStats`.
  ， SVG  stat chips（////）。

- **Pricing: Cost Overview Visualization / : **: New visual section above the cost table: 4 highlight cards (Total Cost, Top Spender, Avg/Call, Models) + stacked bar chart per model showing Input/Output/Cache/Thinking cost breakdown with color-coded segments and legend.
  ：4  + （Input/Output/Cache/Thinking  + ）。

- **GM Tracker Persistence / GM **: `GMTracker` now supports `serialize()` / `restore()` for cross-session persistence via globalState. `serialize()` strips raw `calls[]` arrays (~1.4KB vs 537KB full). Restored on activate, cached summary available instantly via `getCachedSummary()`.
  `GMTracker`  `serialize()` / `restore()` ， globalState 。`serialize()`  `calls[]` （ ~1.4KB vs  537KB）。，`getCachedSummary()` 。

- **Calendar: GM Per-Model Breakdown / : GM **: Each cycle card now includes a GM Breakdown section showing per-model stats with color-coded chips: calls, credits, avg TTFT, cache hit rate, estimated cost (USD), and token counts (input/output/thinking). Data stored via new `GMModelCycleStats` interface in `DailyCycleEntry.gmModelStats`.
   GM Breakdown ，：、、 TTFT、、（USD）、token 。 `GMModelCycleStats` 。

### Fixed /

- **🔥 GM Data Flickering Between Poll Paths / GM **: Fixed critical bug where GM data in the model statistics panel flickered on/off every few seconds. Root cause: `pollContextUsage` (5s) called `updateMonitorPanel` *without* GM overrides, while `pollActivity` (3s) called it *with* GM data — the context poll overwrote the activity poll's GM data. Fix: `getSummary()` now uses persistent `_gmTotals`/`_gmModelBreakdown` caches populated by `injectGMData()`, and the redundant global override in `pollActivity()` was removed.
   Bug： GM 。：`pollContextUsage`（5s） `pollActivity`（3s） `updateMonitorPanel`， GM ， GM 。：`getSummary()`  `injectGMData()` ， `pollActivity()` 。

- **🔥 Sub-Agent Data Stale After Reload / **: Fixed critical bug where sub-agent data (FLASH_LITE) only showed data for the first checkpoint or went missing entirely after extension reload. `restore()` migration logic was too lenient — it didn't trigger re-warm-up when `subAgentTokens` contained stale data or when new GM persistence fields were absent. Now checks `subAgentTotalCount < totalCheckpoints * 0.5` and `!data.gmTotals` as additional nuclear reset triggers.
   Bug：（FLASH_LITE） checkpoint 。`restore()` 。 GM  nuclear reset 。

- **Nuclear Reset Missing `_sampleDist` Cleanup / Nuclear Reset **: Fixed anti-intuitive bug where `archiveAndReset()` and the nuclear reset path in `restore()` did not clear `_sampleDist` and `_sampleTotal`. Stale sampling distribution ratios from before the reset could pollute step type estimation after re-warm-up.
   Bug：`archiveAndReset()`  `restore()`  nuclear reset  `_sampleDist`/`_sampleTotal` ， re-warm-up 。

- **🔥 GM Data Duplication on Quota Reset /  GM **: Fixed critical bug where `gmTracker` and `lastGMSummary` were never reset during quota cycles. This caused the same full GM dataset and associated per-model costs to be archived into `dailyStore` on every quota reset, producing duplicate entries in the calendar. Now `gmTracker.reset()` + `lastGMSummary = null` are called after `dailyStore.addCycle()`, ensuring each cycle archives its own GM data and starts fresh.
   Bug：`gmTracker`  `lastGMSummary` ， GM ，。 `dailyStore.addCycle()`  `gmTracker.reset()` + `lastGMSummary = null`，、。

- **GM Cache Full-Clear on Quota Reset /  GM **: `gmTracker.reset()` now clears `_cache` (all cached conversation GM data) in addition to `_lastSummary`. Previously, the cache was intentionally preserved to avoid re-fetching, but this caused the GM panel to re-aggregate ALL historical calls after a reset — appearing as if data never zeroed out. Activity Tracker correctly baselines per-cycle but GM did not. Calendar already archives the pre-reset GM snapshot via `dailyStore.addCycle()`, so no data is lost. The one-time RPC re-fetch cost on next poll is negligible (quota resets occur every 5h–7d).
  `gmTracker.reset()`  `_cache`（ GM ）。 RPC， GM ——。Activity ，GM 。 `dailyStore.addCycle()` 。 RPC 。

- **Monitor Tab Scroll Jumping to Middle / **: Fixed page-level scroll jumping to wrong position on Monitor tab during auto-refresh. Root cause: `innerHTML` replacement collapsed `<details>` elements (Raw JSON ~10KB), drastically shrinking page height. The subsequent `scrollTop` read on inner elements forced a browser layout at the wrong height, permanently adjusting page scroll. Fix: reordered the `updateTabs` handler to restore `details[id]` open states **immediately** after `innerHTML` swap, before any layout-forcing DOM reads.
  。：`innerHTML`  `<details>` （Raw JSON ~10KB）→  → `scrollTop`  → 。：`updateTabs`  details  innerHTML 。

- **Inner Scrollable Element State Loss / **: Fixed inner scroll position of `.raw-json`, `.act-timeline`, `.details-body` elements resetting to top on each auto-refresh. These elements have their own scrollbars (CSS `overflow`) — when their parent `innerHTML` is replaced, the new elements start at `scrollTop: 0`. Fix: save `scrollTop` of all known scrollable selectors before DOM swap, restore after details are reopened.
   `.raw-json` 。 DOM 、details 。

- **Per-Tab Page Scroll Persistence / **: `switchTab()` now saves the outgoing tab's `window.scrollY` into `tabScrolls[tab]` and restores the incoming tab's scroll position via double `requestAnimationFrame` + `setTimeout` fallback for layout stabilization. Guards against saving `scrollY = 0` during DOM teardown.
  `switchTab()` /。 `requestAnimationFrame` + `setTimeout` 。

- **🔥 stepIndex Absolute Index Alignment / stepIndex **: Fixed critical bug where `_recentSteps` used 0-based array indices as `stepIndex` while GM `stepIndices` used absolute conversation indices. When Steps API returns a windowed subset (e.g., 416 of 576 steps), the array index `[0..415]` misaligned with GM's `[160..575]`. Now all 5 stepIndex assignment sites use `offset = totalSteps - fetchedSteps.length` to produce absolute indices, enabling correct GM annotation and virtual event generation.
   Bug：`_recentSteps`  `stepIndex`  0-based ， GM 。 Steps API （ 576  416）， `[0..415]`  GM  `[160..575]` 。 5  stepIndex  `offset = totalSteps - fetchedSteps.length` 。

- **Timeline GM Tags Reasoning-Only /  GM  reasoning **: GM precision tags (IN/OUT/TTFT/cache) now only display on 🧠 reasoning steps. Tool steps sharing the same LLM call no longer show duplicate GM data, reducing visual noise.
  GM （IN/OUT/TTFT/cache） 🧠 reasoning 。 LLM 。


### Changed /

- **Sub-Agent Card Enhancement / **: `SubAgentTokenEntry` interface extended with `cacheReadTokens`, `compressionEvents`, and `lastInputTokens` fields. Activity panel sub-agent card now displays: Cache Read tokens, Avg Input per Checkpoint (computed), and compression event count (when > 0, shown in orange). Compression detection uses ≥30% inputTokens drop between consecutive checkpoints.
  `SubAgentTokenEntry`  `cacheReadTokens`、`compressionEvents`、`lastInputTokens` 。： token、（）、（>0 ）。： inputTokens  ≥30%。

- **`daily-store.ts`**: Added `GMModelCycleStats` interface with `estimatedCost` field. `addCycle()` now accepts `costPerModel` parameter to archive per-model cost breakdown alongside GM model breakdown.
   `GMModelCycleStats` （ `estimatedCost` ）。`addCycle()`  `costPerModel` ，。

- **`extension.ts`**: `onQuotaReset` callback now extracts per-model costs from `pricingStore.calculateCosts()`, passes them to `dailyStore.addCycle()`, then resets GM state (`gmTracker.reset()` + `lastGMSummary = null` + persist). GM state also saved in dispose and 30s throttle.
  `onQuotaReset`  `dailyStore.addCycle()`， GM 。dispose  30s  GM。

- **History Tab → Quota Tracking /  → **: Renamed "History" tab to "Quota Tracking" (). Removed archived quota sessions and usage history sections (migrated to Calendar). Tab now only contains quota tracking toggle and active tracking.
  「」「」。（）。。

- **Removed `buildArchiveHistory` / **: Deleted `buildArchiveHistory()` and `formatDateShort()` from `activity-panel.ts`, along with Archive History CSS (~140 lines). Data now fully served by Calendar tab via `DailyStore`.
   `activity-panel.ts`  `buildArchiveHistory()`、`formatDateShort()`  Archive History CSS（ 140 ）。 `DailyStore` 。

- **`webview-panel.ts`**: Registered Calendar as 8th tab, added calendar CSS, DailyStore parameter, month navigation and clear history message handlers.
   8 ， CSS、DailyStore 、。

- **`webview-script.ts`**: Replaced per-element click handlers with event delegation on `document.body` using `target.closest()` for robust child-element detection. Added `calendarSelectedDate` to `vscode.setState()` persistence — expanded panel and cell highlight now survive auto-refresh. Restored panels skip `calFadeIn` animation to prevent visual flicker.
   `document.body` ，`closest()` 。 `vscode.setState()` — 。。



### Added /

- **Pricing Tab — Model DNA & Custom Pricing /  —  DNA **: New "Pricing" tab in WebView panel. Displays model DNA cards (completionConfig, tools, promptSections, systemPrompt indicator, error/retry counts), cost estimation table, and **editable** custom pricing inputs with globalState persistence.
  WebView 「」。 DNA 、、****（ globalState ）。

- **`pricing-store.ts` — Pricing Data Layer / **: New module managing pricing data: DEFAULT_PRICING table (5 active models, sourced from official Claude/Google Cloud docs as of 2026-03-22), 3-tier fuzzy model lookup, cost calculation engine, PricingStore class with globalState persistence.
  ：DEFAULT_PRICING （5 ， 2026-03-22）、、、globalState 。

- **`pricing-panel.ts` — Pricing UI Builder /  UI **: New module rendering Pricing tab HTML: model DNA grid cards, cost summary table, editable pricing form with save/reset buttons.
   HTML： DNA 、、（/）。

- **Model DNA Capture /  DNA **: Extended `gm-tracker.ts` GMCallEntry/GMModelStats interfaces with: `completionConfig` (maxTokens, temperature, topK/topP, stopPatterns), `systemPromptSnippet`, `toolNames`/`toolCount`, `promptSectionTitles`, `retries`, `errorMessage`/`errorCount`. New `GMCompletionConfig` interface and `parseCompletionConfig()` parser.
   `gm-tracker.ts` ， DNA 。

### Refactored /

- **Pricing code migrated from `gm-panel.ts`**: Removed legacy `DEFAULT_PRICING` table, `ModelPricing` interface, `findPricing()`, `buildCostSummary()`, `buildPricingTable()`, and all related CSS from `gm-panel.ts` (552 → 279 lines). All pricing/cost functionality now lives in `pricing-store.ts` + `pricing-panel.ts`.
   `gm-panel.ts` ： DEFAULT_PRICING、ModelPricing 、findPricing、buildCostSummary、buildPricingTable  CSS（552 → 279 ）。/。

- **Removed built-in pricing reference section**: Deleted `buildBuiltInReference()` collapsible table from `pricing-panel.ts`. Default prices now shown inline in the editable table with "Built-in" source indicator.
  。，「」。



### Added /

- **GM Data Tab — Generator Metadata Analytics / GM  — **: New "GM Data" tab in the WebView panel that calls `GetCascadeTrajectoryGeneratorMetadata` to fetch per-LLM-call data across all conversations. Displays 8 UI sections: Summary Bar, Model Cards, Cost Estimate, Performance Baseline, Cache Efficiency, Context Growth, Conversation Distribution, and Pricing Reference Table.
  WebView 「GM Data」， `GetCascadeTrajectoryGeneratorMetadata`  LLM 。 8  UI ：、、、、、、、。

- **Cost Estimation / **: Per-model cost breakdown table calculating USD costs from token counts × public API pricing. Supports 5 token types: Input, Output, Cache Read, Cache Write, Thinking. Hover tooltips show raw token counts and per-token prices. Grand Total aggregated across all models.
  ， token  ×  API  USD 。 5  token ：、、、、。 token 。。

- **Dynamic Pricing Reference Table / **: Pricing table dynamically displays only models captured in the current session — no hardcoded model list. Auto-matches prices from `pricing-store.ts` `DEFAULT_PRICING`; unmatched models show $0 with editable inputs in the Pricing tab.
  。 `pricing-store.ts` ； $0， Pricing 。

- **`gm-tracker.ts` — GM Data Layer / GM **: New module (325 lines) implementing `GMTracker` class. Calls `GetCascadeTrajectoryGeneratorMetadata` RPC, parses `generatorMetadata[]` entries (stepIndices, responseModel, usage, TTFT, streaming duration, cache tokens, consumed credits), aggregates per-model stats (`GMModelStats`) and per-conversation data (`GMConversationData`), produces `GMSummary` for the panel layer. Includes smart caching to avoid redundant RPC calls.
  （325 ）， `GMTracker` 。 `GetCascadeTrajectoryGeneratorMetadata` RPC， `generatorMetadata[]` （stepIndices、responseModel、usage、TTFT、、 token、），， `GMSummary` 。 RPC 。

- **`gm-panel.ts` — GM Data Panel / GM **: New module (~280 lines) generating HTML for the GM Data tab. 6 builder functions: `buildSummaryBar`, `buildModelCards`, `buildPerformanceBaseline`, `buildCacheEfficiency`, `buildContextGrowth`, `buildConversationList`. CSS variables for styling, SVG charts for cache/context visualizations.
  （~280 ）， GM Data  HTML。6 。CSS ，SVG /。

### Documentation /

- Updated `docs/ls-monitor-technical-notes.md`: Added `GetCascadeTrajectoryGeneratorMetadata` to RPC endpoint table. Added 5 new tech notes (#27-#31): generatorMetadata full structure, responseModel vs generatorModel precision, consumedCredits rules, cost estimation design, cacheCreationTokens vs cacheReadTokens.
  ：RPC  `GetCascadeTrajectoryGeneratorMetadata`。 5 （#27-#31）：generatorMetadata 、responseModel 、、、 token 。

- Updated `docs/project_structure.md`: Added `gm-tracker.ts`, `gm-panel.ts` module descriptions. Updated dependency graph and data flow diagram. Added `diag-scripts/` directory.
  ： `gm-tracker.ts`、`gm-panel.ts` 。。 `diag-scripts/` 。

## [1.12.2] - 2026-03-21

### Fixed /

- **🔥 Quota Reset Archive Fragmentation / **: Refactored `onQuotaReset` callback from parameterless `() => void` to `(modelIds: string[]) => void`. Previously, each model's quota reset independently triggered `archiveAndReset()`, causing fragmented archives when multiple models in the same quota pool (e.g., Gemini Pro High + Low) reset simultaneously. Now `processUpdate()` batches all resets into a single callback with the full list of reset model IDs.
   `onQuotaReset` ， `() => void`  `(modelIds: string[]) => void`。（ Gemini Pro High + Low），。 `processUpdate()` ，。

- **Archive Debounce for Cross-Pool Resets / **: Added 5-minute debounce interval (`MIN_ARCHIVE_INTERVAL_MS`) to `archiveAndReset()`. When different quota pools (e.g., Gemini pool and Claude pool) reset within 5 minutes of each other, the second archive merges into the first instead of creating a separate entry. Beyond 5 minutes, independent archives are created correctly.
  `archiveAndReset()`  5 。（ Gemini  Claude ） 5 ，。 5 。

- **Remote WSL Workspace Matching /  WSL **: `normalizeUri()` now strips `vscode-remote://` scheme+authority (e.g., `vscode-remote://wsl+Ubuntu/path` → `/path`) before comparison, so trajectory workspace filtering works correctly when the extension runs on the local (UI) side via `extensionKind`. `buildExpectedWorkspaceId()` similarly reconstructs remote URIs as `file://` before transformation. Previously, workspace matching silently failed in Remote-WSL, causing the panel to show "idle" with 0k/1M even though the LS was successfully connected.
  `normalizeUri()`  `vscode-remote://`  authority（ `vscode-remote://wsl+Ubuntu/path` → `/path`），（UI ）。`buildExpectedWorkspaceId()`  URI  `file://` 。 WSL ，"" 0k/1M， LS 。

### Added /

- **Archive Trigger Source Tracking / **: `ActivityArchive` interface now includes `triggeredBy?: string[]` field recording which model ID(s) triggered each archive. Backward compatible with older archives lacking this field.
  `ActivityArchive`  `triggeredBy?: string[]` ， ID 。。

### Improved /

- **Activity Panel SVG Icon Consistency /  SVG **: Replaced all remaining Emojis (🧠⚡💾❌📊🪙⏱∑🌐🔍📂📄✏️📋) in model stats, timeline, archive history, and accuracy notes with consistent inline SVG icons. Only the main status bar retains native Emojis for maximum visibility.
  、、、 Emoji  SVG 。 Emoji 。

- **Activity Panel Four-Section Layout / **: Reorganized the Activity tab into four logical sections: ① Summary + Recent Activity, ② Model Stats, ③ Model Distribution + Tool Ranking, ④ Context Growth + Conversation Breakdown. Uses CSS Grid two-column layout with `auto-fit` responsive breakpoints.
  ， CSS Grid  + `auto-fit` 。

- **Summary Stat Tooltips / **: Each stat cell in the summary bar now has a `data-tooltip` hover tooltip (CSS `::after` pseudo-element) with bilingual descriptions.
   `data-tooltip` （CSS `::after` ），。

- **Model Name Word-Wrap / **: Long model names in card headers now wrap instead of being truncated (`word-break: break-word; overflow-wrap: anywhere`).
  ，。

- **Archive Stat Chips / **: Per-model stats in usage history now use `.act-archive-stat-chip` bubble tags with rounded borders, subtle background, and hover highlight for visual separation.
  （ +  + hover ），。

- **Context Growth Chart Enhancement / **: Fixed `height: 240px` with `flex: 1` fill. Increased SVG viewBox height, stronger gradient fill (`stop-opacity: 0.5`), and thicker stroke for better visual presence in split layouts.
   240px  + flex 。 SVG 、、，。

- **Monitor Panel Responsive Stat Grid / **: `.stat-grid` upgraded to `repeat(auto-fit, minmax(...))` for fluid column layout across different panel widths.
  `.stat-grid` 。

### Removed /

- **Activity Status Bar Item / **: Removed the secondary status bar item (`ActivityStatusBarItem`) and its `statusBar.showActivity` configuration. The Activity tab is now accessed via the main status bar or command palette.
   `statusBar.showActivity` 。。

### Tests /

- Added batching behavior test to `quota-tracker.test.ts`: verifies same-pool multi-model reset produces single callback with all model IDs.
   `quota-tracker.test.ts` ：。
- Total test count: 67.
  ：67。

## [1.12.1] - 2026-03-21

### Fixed /

- **Remote WSL "LS not found" Fix /  WSL「LS 」**: Added `extensionKind: ["ui", "workspace"]` to `package.json`, telling VS Code to prefer running the extension on the **local (UI) side** where the Antigravity Language Server process lives. Previously, when connecting to WSL via VS Code Remote-WSL or Remote SSH, the extension defaulted to running on the remote side (`extensionKind` was missing, defaulting to `["workspace"]`), where no LS process exists — causing perpetual "LS not found" status. Users only need to reinstall the updated VSIX; no additional configuration required.
   `package.json`  `extensionKind: ["ui", "workspace"]`， VS Code **（UI ）**—— Antigravity 。 VS Code Remote-WSL  Remote SSH  WSL ，（`extensionKind` ， `["workspace"]`）， LS ，"LS not found"。 VSIX，。

### Improved /

- **Remote Workspace URI Logging /  URI **: `getWorkspaceUri()` now logs when a `vscode-remote://` workspace URI is detected, aiding diagnostics for remote connection scenarios.
  `getWorkspaceUri()`  `vscode-remote://`  URI ，。

## [1.12.0] - 2026-03-21

### Added /

- **WSL (Windows Subsystem for Linux) Support / WSL **: Full support for running the extension inside WSL via VS Code Remote-WSL. The extension now detects WSL environment via `/proc/version`, and uses Windows-side tools (`WMIC.exe`, `powershell.exe`, `netstat.exe`) through WSL interop for Language Server process and port discovery. Previously, the extension showed "LS not found" in WSL because Linux `ps` cannot see Windows host processes.
  WSL  VS Code Remote-WSL ，。 `/proc/version`  WSL ， WSL  Windows （`WMIC.exe`、`powershell.exe`、`netstat.exe`）。 WSL  Linux `ps`  Windows "LS not found"。

- **`isWSL()` Detection Function / `isWSL()` **: New exported function in `discovery.ts` that detects WSL by reading `/proc/version` for Microsoft/WSL signatures. Result is cached for performance (file I/O only once).
  `discovery.ts` ， `/proc/version`  Microsoft/WSL 。 I/O。

### Improved /

- **Cross-Environment Process Discovery / **: `discoverWindowsProcesses()` now dynamically selects executable paths — `/mnt/c/Windows/System32/wbem/WMIC.exe` in WSL vs `wmic` on native Windows. Port discovery similarly uses `/mnt/c/Windows/System32/netstat.exe` when in WSL.
  `discoverWindowsProcesses()` ——WSL  `/mnt/c/Windows/System32/wbem/WMIC.exe`， Windows  `wmic`。，WSL  `/mnt/c/Windows/System32/netstat.exe`。

- **WSL-Aware Workspace ID / WSL  ID**: `buildExpectedWorkspaceId()` now applies Windows-style transformations (colon hex-encoding `_3A_`, double-underscore collapse) when running in WSL, matching the Windows host LS's encoding.
  `buildExpectedWorkspaceId()`  WSL  Windows （ `_3A_`、）， Windows  LS 。

### Tests /

- Added `isWSL()` and `extractPortFromSs()` tests in `discovery.test.ts`.
   `discovery.test.ts`  `isWSL()`  `extractPortFromSs()` 。
- Total test count: 42 (was 40 in v1.11.3).
  ：42（v1.11.3  40）。


## [1.11.3] - 2026-03-20

### Added /

- **Independent Activity Polling /  Activity **: Activity tracking now runs on a separate 3-second polling loop (`pollActivity()`), decoupled from the global 5-second poll. Changes trigger immediate UI refresh.
  Activity  3 （`pollActivity()`）， 5 。 UI。

- **Tool Name Display / **: Timeline now prominently displays the tool name for each tool call (e.g., `gh/search_issues`, `view_file`, `run_command`). MCP tool names are extracted with namespace prefix.
  （ `gh/search_issues`、`view_file`）。MCP 。

- **Step Index Display / **: Each timeline entry shows its step index badge (e.g., `#142`), matching the LS internal step numbering for easier cross-referencing with diagnostic tools.
  （ `#142`）， LS ，。

- **Diagnostic Scripts Documentation / **: Added comprehensive documentation for `diag-verify.ts` (static data integrity checks, 6 verification phases) and `diag-monitor.ts` (real-time step monitoring) in technical notes.
   `diag-verify.ts`（，6 ） `diag-monitor.ts`（）。

- **Status Bar Activity Display Mode / **: New `statusBar.activityDisplayMode` setting with radio buttons in the Settings tab. Choose between `global` (all models combined) and `currentModel` (stats for the active model only).
   `statusBar.activityDisplayMode` ，。「」（）「」（）。

- **Context Growth Trend / **: SVG area chart visualizing inputTokens across all CHECKPOINTs. Compression events (≥30% inputTokens drop) marked with red circles. Displayable when ≥2 checkpoints exist.
  SVG  CHECKPOINT  inputTokens 。（inputTokens  ≥30%）。

- **Tool Ranking / **: Top 10 tool usage visualized as CSS horizontal bar chart with 10-color rainbow palette (CSS classes, CSP-safe). Each bar's count displayed in matching color.
  Top 10  CSS ，10 （CSS class ，CSP ）。。

- **Conversation Breakdown / **: Per-conversation stats showing step count and token usage (input/output). Tokens extracted from last CHECKPOINT cumulative snapshot.
   token （/），token  CHECKPOINT 。

- **Summary Bar Enhancement / **: CSS Grid card layout with session duration, checkpoint count, toolReturnTokens. All emoji icons replaced with semantically accurate inline SVGs (lightbulb for reasoning, arrows for input/output).
  CSS Grid ，、、 token。 emoji  inline SVG（=、=/）。

### Improved /

- **RUNNING-Only Step Fetching /  RUNNING **: Incremental updates now only fetch steps for `RUNNING` conversations, skipping already-processed IDLE ones. Reduces unnecessary API calls.
   RUNNING ， IDLE 。 API 。

- **Precise Incremental Capture / **: Incremental path now re-fetches steps via `GetCascadeTrajectorySteps` instead of relying on `stepCount` delta estimation. Only steps beyond the API window (~500) use delta estimation.
   `GetCascadeTrajectorySteps` ， `stepCount` delta 。 API 。

- **Model Stats Accuracy Disclaimer / **: When estimated steps exist, a note is shown below the "Model Stats" title clarifying that reasoning/tool/error counts are precisely recorded, while steps beyond the API window are estimates.
  ，""：、、； API 。

- **Faster Quota Status Refresh / **: `STATUS_REFRESH_INTERVAL` reduced from 6 to 2 (user status now refreshes every ~10 seconds instead of ~30s), enabling quicker detection of quota changes reported by the API.
  `STATUS_REFRESH_INTERVAL`  6  2（ 30  10 ）， API 。

### Fixed /

- **Activity Panel Migration / **: Fixed missing data for context trend and conversation breakdown after upgrading. Three migration triggers in `restore()` force re-warm-up: missing subAgentTokens, empty checkpointHistory, or all-zero conversationBreakdown (caused by wrong field path `meta.cortexStepType` → corrected to `step.type`).
  。`restore()`  re-warm-up： subAgentTokens、checkpointHistory 、conversationBreakdown （ `meta.cortexStepType` →  `step.type`）。

- **Tool Ranking Bar Rendering / **: Fixed invisible bar chart caused by `<span>` elements lacking `display: block`. Added CSS class-based 10-color palette to avoid CSP-blocked inline styles.
  ：`<span>`  `display: block`  `width`/`height` 。 CSS class  CSP  inline style。

- **🔥 Ghost Model Attribution / **: Fixed critical bug where `CHECKPOINT.modelUsage.model` always reported `MODEL_GOOGLE_GEMINI_2_5_FLASH_LITE` regardless of the actual generating model, causing all token stats to be attributed to Flash Lite. Diagnosis across 5 conversations (29 CHECKPOINTs) confirmed 100% ghost attribution. Token attribution now uses `contextModel` (detected from `generatorModel` of surrounding steps) with priority: `contextModel` > `generatorModel` > `modelUsage.model` (fallback).
   Bug：`CHECKPOINT.modelUsage.model`  `FLASH_LITE`，， token 。 5 （29  CHECKPOINT） 100% 。Token  `contextModel`（ `generatorModel` ），：`contextModel` > `generatorModel` > `modelUsage.model`（）。

- **🤖 Sub-Agent Token Transparency /  Token **: CHECKPOINT's `modelUsage.model` (e.g. Gemini 2.5 Flash Lite) is now tracked as sub-agent token consumption when it differs from the main generating model. A new "Sub-Agent Tokens" section appears in the Activity panel showing the sub-agent's display name, token counts (in/out), and checkpoint count. This makes the sub-agent's resource usage fully visible instead of hidden.
   CHECKPOINT  `modelUsage.model`（ Flash Lite）， token 。""，、Token 。。

- **🔥 Instant Usage Detection at 100% / 100% **: Completely reworked dynamic usage detection with three-layer strategy. **Layer 1 (Instant)**: On the very first poll, calculates `elapsedInCycle = maxTimeToReset − thisTimeToReset` across all models; if ≥10 min → model is immediately tracked with backDated startTime. **Layer 2 (Drift)**: If resetTime stays locked (no API refresh) for ≥10 min → model is tracked. **Layer 3 (Fraction)**: fraction < 100% → immediate tracking. Previously required waiting 10 minutes before any detection. *Verified over a full 5-hour live cycle with Claude + Flash models.*
  ，：****—— poll  `elapsedInCycle = maxTimeToReset − thisTimeToReset` ，≥10 ；**Drift **——resetTime  10 ；**Fraction **——fraction < 100% 。 10 。* 5 。*

- **Cycle Start Backdating / **: Both instant detection (100%) and fraction-drop detection (<100%) now backdate the session `startTime` to the estimated cycle start (`resetTime − maxTimeToReset`) instead of using the current poll time. Previously, sessions started at "now" which was misleading.
  （100%）（<100%） session  `startTime` （`resetTime − maxTimeToReset`），。 session ""，。

- **Persist/Restore Missing Fields / **: Fixed `persist()` silently dropping `lastResetTime`, `baselineResetTime`, and `idleSince` from serialized ModelState. Added backward-compatible `restore()` backfill for older state data. Without these fields, dynamic detection logic produced incorrect drift calculations after extension reload.
   `persist()`  `lastResetTime`、`baselineResetTime`、`idleSince`  Bug。 `restore()` 。 drift 。

- **Early Quota Tracking / **: Fixed critical delay where quota tracking only started after the fraction dropped below 100%. Now uses `isUnusedModel(resetTime)` to detect active models: when `resetTime` drifts more than 10 minutes from a full cycle (indicating usage), a tracking session is created immediately — even while the API still reports 100%. Previously, models could be used for 20+ minutes before any tracking began.
   fraction  100% 。 `isUnusedModel(resetTime)` ： resetTime  10 （）， session—— API  100%。 20 。

- **Tracking State 100% Reset False Positive /  100% **: Fixed bug where early-started tracking sessions (at 100%) were immediately archived on the next poll because `fraction >= 1.0` in the `tracking` state was unconditionally treated as a quota reset. Now checks `lastFraction`: if the previous fraction was also 100% (quota hasn't dropped yet), the session continues tracking instead of being falsely archived.
   session（100%） Bug。 `tracking`  `fraction >= 1.0` 。 `lastFraction`： fraction  100%（），session 。

- **New Conversation First Message Delay / **: Fixed bug where new conversations with initial `stepCount=0` created empty tracking entries, causing the first message to be skipped until the second poll cycle.
   `stepCount=0` ， Bug。

- **Warm-up Swallows First Message / Warm-up **: Fixed warm-up phase consuming all existing steps with `emitEvent=false`, making the first user message invisible in "Recent Activity" timeline. Now injects last 30 steps from RUNNING conversations after warm-up using `_injectTimelineEvent()`.
   Warm-up  `emitEvent=false` 。 warm-up  RUNNING  30 。

- **Conversation Switch / Rollback / Resend Not Recorded / //**: Fixed `statusChanged` detection being blocked by early skip logic (`currSteps <= processedIndex`). Now detects `IDLE→RUNNING` transitions before any skips, handles `stepCount` decrease (rollback/resend), and injects recent timeline events on conversation resume.
   `statusChanged` 。， stepCount （/），。

- **Empty Reasoning Steps / **: Reasoning timeline entries with empty `response` now show "" fallback text when `thinkingDuration` is present, instead of appearing blank.
   response ， `thinkingDuration` ""，。

- **Thinking Duration Removed from Timeline / **: Removed per-step thinking duration display from timeline as it was inaccurate with 3-second polling (captures partial values). Aggregate `thinkingTimeMs` in model stats retained.
  （3 ，）。 `thinkingTimeMs` 。

### Documentation /

- Added gotcha #22 (Ghost Model Attribution) to `docs/ls-monitor-technical-notes.md`.
   #22（）。

- Added `diag-conversation.ts` v2.0 diagnostic script with batch analysis capability.
   `diag-conversation.ts` v2.0 ，。

- Updated `docs/ls-monitor-technical-notes.md`: Architecture diagram reflects dual polling, added 9 new gotcha records (#12-#20), diagnostic scripts section, new step types (TASK_BOUNDARY, NOTIFY_USER).
  ：， 9 （#12-#20），，。

- Updated `docs/project_structure.md`: Reflects independent polling, diagnostic scripts, 21 step types, tool detail extraction.
  ：、、21 、。


- **Model Activity Monitor Panel / **: New Activity tab in the WebView panel that tracks real-time AI model usage across all conversations. Includes model stats cards, operation timeline, model distribution donut chart, and quota linkage view.
  ， AI 。、、。

- **Activity Status Bar Indicator / **: Second status bar item showing live reasoning count (`🧠`), tool call count (`⚡`), and token consumption (`🪙`). Click to open the activity panel.
  ，、 Token 。。

- **Activity Data Persistence / **: Activity tracking data is automatically saved to `globalState` and restored across VS Code sessions. Throttled to max once per 30 seconds to minimize I/O.
  ， 30 。

- **`statusBar.showActivity` Setting / **: New configuration option to toggle the activity indicator visibility in the status bar.
  /。

- **Quota Reset Auto-Archive / **: When model quota resets (fraction jumps back to 100%), the current activity session is automatically archived to history and stats are reset. Archives are displayed in the Activity tab's new "📋 Usage History" section.
  （ 100%），，。「📋 」。

- **Full Quota-Cycle Stats / **: Warm-up now processes ALL conversations (including IDLE) to reflect full usage within the current quota cycle. Combined with auto-archive, each quota period produces a complete usage report.
  warm-up （ IDLE）。，。

- **Estimated Steps Tracking / **: When conversations exceed the LS API's ~500 step retrieval window, additional steps are tracked as a separate `estSteps` counter per model. Clearly distinguished from actual data in the UI with 📊 icon.
   LS API  500 ， `estSteps` 。 UI  📊 。

- **Per-Trajectory Model Binding / **: Each conversation trajectory now records its dominant model. Estimated steps are attributed directly to the correct model instead of being distributed proportionally across all models.
  。，。

- **Estimated Steps Persistence / **: `estSteps` and per-trajectory `dominantModel` are now persisted across VS Code restarts via `globalState`.
  `estSteps`  `dominantModel`  `globalState` 。

### Improved /

- **Status Bar → Activity Tab Navigation / →**: Clicking the activity status bar item now correctly opens the monitor panel and switches to the Activity tab via `postMessage`.
  。

- **Usage History Redesign / **: Archived usage history now displays each model on its own row with right-aligned stats (🧠/⚡/📊), sorted by step count. Total steps show actual+estimated breakdown.
  ，（🧠/⚡/📊），。+。

- **Quota Indicator Color Thresholds / **: Adjusted from (≥60%/≥40%/<40%) to (80-100% 🟢 / 40-60% 🟡 / 0-20% 🔴) for more useful early warning.
   (≥60%/≥40%/<40%)  (80-100% 🟢 / 40-60% 🟡 / 0-20% 🔴)，。

- **AI Response Preview Removed /  AI **: Removed the expandable `<details>` AI response preview from the timeline. Now only shows a brief inline excerpt. Full responses can be viewed in the official tool.
   AI  `<details>` 。，。

- **WebView Module Split / WebView **: Refactored the monolithic `webview-panel.ts` (1200+ lines) into 8 focused modules: `webview-styles.ts`, `webview-script.ts`, `webview-helpers.ts`, `webview-icons.ts`, `webview-monitor-tab.ts`, `webview-settings-tab.ts`, `webview-profile-tab.ts`, `webview-history-tab.ts`.
   1200+  `webview-panel.ts`  8 。

### Fixed /

- **Archive Reset Data Integrity / **: Fixed critical bug where `archiveAndReset()` cleared trajectory baselines causing warm-up to re-count all historical steps.
   Bug：`archiveAndReset()`  warm-up 。

- **Restore Duplicate Events / **: Fixed bug where `restore()` kept old `recentSteps` then warm-up added duplicates.
   `recentSteps`  warm-up  Bug。

- **Estimated Steps Misattribution / **: Fixed bug where estimated steps were distributed proportionally across ALL models instead of only the trajectory's actual model.
   Bug。

- **Removed Recheck Mechanism /  recheck **: Removed the processedIndex back-by-1 recheck logic for streaming AI responses (no longer needed after removing expandable preview).
   AI  recheck （）。

## [1.11.1] - 2026-03-19
### Improved /
- **Card-Style Collapsible Panels / **: All collapsible sections (quota, features, sessions, raw data, etc.) upgraded from plain dividers to rounded card containers with hover highlights and a custom expand/collapse arrow button.
  （、、、）， hover /。
- **Custom Number Spinners / **: Replaced browser-default number input spinners with custom [−] [+] buttons for all numeric settings (compression threshold, polling interval, model limits).
  （、、） [−] [+] 。
### Contributors /
- Thanks to [@NightMin2002](https://github.com/NightMin2002) for contributing UI polish ([PR #15](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/15)).
   [@NightMin2002](https://github.com/NightMin2002)  UI （[PR #15](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/15)）。

## [1.11.0] - 2026-03-19
### Added /
- **Interactive Settings Dashboard / **: Split the WebView panel into dual tabs ('Monitor' and 'Settings'). The new settings page provides an intuitive UI to configure extension behaviors directly.
- **Custom Compression Warning Threshold / **: Added a UI setting to adjust the context compression warning threshold. Default 200K matches Antigravity's internal compression point.
- **Custom Model Context Limits / **: Each model's context limit can now be independently overridden directly from the Settings tab.
- **Status Bar Quota Indicator / **: Current model's quota percentage is now directly visible on the status bar.
- **Current-Model Reset Countdown / **: The status bar countdown now tracks the reset time of the model you are currently using.
- **Status Bar Display Toggles / **: Added toggle switches in the Settings panel for Context Usage, Quota Indicator, and Reset Countdown.
- **Polling Interval UI / **: Modify the polling interval directly from the settings menu.
### Fixed /
- **State Clean-up / **: Fixed a minor timer leak by ensuring StatusBarManager properly disposes the reset countdown timer when the extension is deactivated.

## [1.10.3] - 2026-03-17

### Added /

- **Status Bar Quota Summary / **: Tooltip now includes per-model quota percentages with color indicators (🟢≥60% / 🟡≥40% / 🔴<40%), reset countdown per model, and plan/tier display (Markdown table layout).
  （）、（Markdown ）。

- **Auto-Refresh User Status / **: Model quotas and plan info automatically refresh every ~60 seconds. Data is persisted via `globalState` for instant display on reload.
   ~60 。 `globalState` ，。

### Contributors /

- Follow-up to [PR #10](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/10) — these changes were committed after the original merge and need to be applied separately.
  [PR #10](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/10) ——，。

## [1.10.2] - 2026-03-17

### Fixed /

- **Cross-Platform Workspace ID Hyphen Handling /  ID **: `buildExpectedWorkspaceId()` now replaces hyphens (`-`) with underscores (`_`) on **all platforms**, not just Windows. Previously, macOS and Linux users with hyphens in their project folder names (e.g., `my-project`, `schic-diff`) would experience workspace discovery matching the wrong LS process, causing stale data from a different workspace to be displayed.
  `buildExpectedWorkspaceId()` ****（`-`）（`_`）， Windows 。，macOS  Linux （ `my-project`、`schic-diff`）， LS ，。

### Tests /

- Added cross-platform hyphen handling test in `discovery.test.ts`.
   `discovery.test.ts` 。
- Total test count: 38 (was 37 in v1.10.0).
  ：38（v1.10.0  37）。

### Contributors /

- Thanks to [@FlorianHuo](https://github.com/FlorianHuo) for reporting and fixing this issue ([PR #12](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/12)).
   [@FlorianHuo](https://github.com/FlorianHuo) （[PR #12](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/12)）。

## [1.10.1] - 2026-03-16

### Added /

- **WebView Monitor Panel / WebView **: Click the status bar to open a full dashboard showing account info, Credits balance, model quotas, feature flags, team config, and Google AI credits — all from the existing `GetUserStatus` API (zero additional network calls).
  ，、Credits 、、、 Google AI —— `GetUserStatus` API （）。

  ![WebView Monitor Panel](src/images/webview_panel_en.png)

- **Privacy Mask / **: Shield button in the panel header masks name and email. State persists across refreshes.
  ，。

- **Collapsible Sections / **: Plan Limits, Feature Flags, Team Config, and Google AI Credits are hidden by default in collapsible sections. Open/close state persists.
  、、 Google AI ，/。

- **Status Bar Quota Summary / **: Tooltip now includes per-model quota percentages with color indicators.
  。

### Changed /

- **showDetails Command Now Opens WebView Panel / showDetails  WebView **: Clicking the status bar or running `Show Context Window Details` now opens the WebView side panel instead of the QuickPick popup. The old `showDetailsPanel()` method is preserved but no longer the default entry point.
   `Show Context Window Details`  WebView ， QuickPick 。 `showDetailsPanel()` 。

- **`models.ts` Interface Expansion / `models.ts` **: `ModelConfig` extended with `quotaInfo`, `allowedTiers`, `tagTitle`, `mimeTypeCount` fields. Added `QuotaInfo`, `PlanLimits`, `TeamConfig`, `CreditInfo`, `UserStatusInfo`, `FullUserStatus` interfaces mapping the full `GetUserStatus` API response.
  `ModelConfig`  `quotaInfo`、`allowedTiers`、`tagTitle`、`mimeTypeCount` 。 `QuotaInfo`、`PlanLimits`、`TeamConfig`、`CreditInfo`、`UserStatusInfo`、`FullUserStatus` ， `GetUserStatus` API 。

- **`tracker.ts` Added `fetchFullUserStatus()` / `tracker.ts`  `fetchFullUserStatus()`**: Added `fetchFullUserStatus()` to fetch complete user status (account, quotas, feature flags) for the WebView panel. Original `fetchModelConfigs()` marked as `@deprecated`.
   `fetchFullUserStatus()` ，（、、Feature Flags）， WebView 。 `fetchModelConfigs()`  `@deprecated`。

### Contributors /

- Thanks to [@NightMin2002](https://github.com/NightMin2002) for contributing this feature ([PR #10](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/10)).
   [@NightMin2002](https://github.com/NightMin2002) （[PR #10](https://github.com/AGI-is-going-to-arrive/Antigravity-Context-Window-Monitor/pull/10)）。

## [1.10.0] - 2026-03-15

### Added /

- **Language Switching / **: New command `Switch Display Language` allows users to choose between Chinese-only, English-only, or bilingual display mode. Preference is persisted via `globalState`. Accessible directly from the details panel (Settings section).
   `` ，、。 `globalState` 。。

- **i18n Module / **: Centralized translation system (`src/i18n.ts`) with `t(key)` and `tBi(en, zh)` helper functions. 80+ translation keys covering all user-facing strings.
  （`src/i18n.ts`）， `t(key)`  `tBi(en, zh)` 。80+  key 。

### Changed /

- **Claude 4.6 Context Limits Updated / Claude 4.6 **: Both Claude Sonnet 4.6 (`MODEL_PLACEHOLDER_M35`) and Claude Opus 4.6 (`MODEL_PLACEHOLDER_M26`) context limits updated from 200K to **1M tokens**, reflecting the GA release on 2026-03-13.
  Claude Sonnet 4.6  Claude Opus 4.6  200K  **1M tokens**， 2026-03-13  1M 。

### Refactored /

- **Module Extraction / **: Broke down the 838-line `tracker.ts` into focused modules:
  - `src/rpc-client.ts` — RPC communication layer
  - `src/models.ts` — Model configuration and display names (with i18n support)
  - `src/constants.ts` — All magic strings and numeric constants centralized
  - `src/i18n.ts` — Internationalization system
   838  `tracker.ts` 。

- **processSteps() Decomposition / processSteps() **: Extracted helper functions from the 240-line monolithic function.
   240 。

- **Token Formatting Unified / Token **: Merged duplicate logic between `formatTokenCount` and `formatContextLimit` into a single `formatTokenValue()`.
   `formatTokenValue()`。

- **Magic Strings → Constants /  → **: Extracted `CASCADE_RUN_STATUS_RUNNING`, `CORTEX_STEP_TYPE_*` and all numeric constants into `src/constants.ts`.
   `src/constants.ts`。

### Tests /

- Added `src/tracker.test.ts` (16 tests) and `src/statusbar.test.ts` (11 tests).
   `tracker.test.ts`（16 ） `statusbar.test.ts`（11 ）。

- Added `__mocks__/vscode.ts` and `vitest.config.ts` for proper VS Code API mocking in unit tests.
   vscode  mock  vitest 。

- Total test count: 37 (was 10 in v1.9.0).
  ：37（v1.9.0  10）。

### Documentation /

- **README.md & readme_CN.md Updated for v1.10.0 / README **: Rewrote "Bilingual Interface" feature as "Language Switching" to reflect the new three-mode display (Chinese-only / English-only / bilingual). Updated Claude 4.6 context limits from 200K to 1M in the supported models table. Revised sub-agent switching note (no longer causes visible limit change). Added new "Commands" section listing all available commands. Version bumped to 1.10.0.
  """"，（//）。 Claude 4.6  200K  1M。（）。""。 1.10.0。

- **Technical Implementation Docs Updated / **: Updated `docs/technical_implementation.md` module list to include newly extracted modules (`rpc-client.ts`, `models.ts`, `constants.ts`, `i18n.ts`). Corrected test count to 37 (3 test files).
   `docs/technical_implementation.md` ，（`rpc-client.ts`、`models.ts`、`constants.ts`、`i18n.ts`）。 37（3 ）。

## [1.9.0] - 2026-03-15

### Fixed (Critical) / （）

- **Gemini 3 Flash Model ID Rename / Gemini 3 Flash  ID **: Gemini 3 Flash's internal model ID changed from `MODEL_PLACEHOLDER_M18` to `MODEL_PLACEHOLDER_M47` on the backend. Updated `DEFAULT_CONTEXT_LIMITS` and `modelDisplayNames` in `tracker.ts` to use M47 as the primary entry. `MODEL_PLACEHOLDER_M18` is preserved as a backward-compatible legacy alias so older trajectories still display correctly.
  Gemini 3 Flash  ID  `MODEL_PLACEHOLDER_M18`  `MODEL_PLACEHOLDER_M47`。 `tracker.ts`  `DEFAULT_CONTEXT_LIMITS`  `modelDisplayNames`， M47 。`MODEL_PLACEHOLDER_M18` ，。

- **`package.json` Default Config / `package.json` **: Added `MODEL_PLACEHOLDER_M47` to the default `contextLimits` configuration object so new installations automatically recognize the updated model ID.
   `contextLimits`  `MODEL_PLACEHOLDER_M47`， ID。

### Verified /

- Confirmed via live LS probe (`GetUserStatus` RPC): M18 is absent from the server's `cascadeModelConfigData`, replaced by M47 with the same label "Gemini 3 Flash". All other model IDs (M37, M36, M35, M26, GPT-OSS 120B) remain unchanged.
   LS （`GetUserStatus` RPC）：M18  `cascadeModelConfigData` ， M47 ， "Gemini 3 Flash"。 ID（M37、M36、M35、M26、GPT-OSS 120B）。

### Notes /

- The `GetUserStatus` API does not expose context window limits — they remain hardcoded in `DEFAULT_CONTEXT_LIMITS`. Gemini 3 Flash (M47) context limit remains 1,000,000 tokens.
  `GetUserStatus` API —— `DEFAULT_CONTEXT_LIMITS` 。Gemini 3 Flash (M47)  1,000,000 tokens。

## [1.8.0] - 2026-03-15

### Added /
- **Priority 1b & 4 Fallbacks /  1b & 4 **: Added sophisticated trajectory selection fallbacks to handle "Idle" status and new conversations. Priority 1b detects running conversations that haven't registered a workspace URI yet (common in new chats), while Priority 4 falls back to the most recently modified trajectory in the workspace when all are idle. This ensures the context monitor stays active and accurate even between turns.
  。 1b  URI （）， 4 。。

### Fixed /
- **Windows Process Discovery Cache / Windows **: Added caching for `wmic` availability and optimized PowerShell commands to reduce polling overhead on Windows systems.
   `wmic`  PowerShell ， Windows 。

### Known Issues & Notes /
- **Summarization Threshold / **: Antigravity IDE has a hardcoded 7500 token "Summarization Threshold" for checkpoint summaries. This may lead to slight calculation discrepancies during long conversations. Reference: [Reddit Post](https://www.reddit.com/r/google_antigravity/comments/1q7zcag/heres_how_to_find_which_mcp_tools_are_leading_to/)
  Antigravity IDE  7500 token ""。。：[Reddit ](https://www.reddit.com/r/google_antigravity/comments/1q7zcag/heres_how_to_find_which_mcp_tools_are_leading_to/)
- **Dynamic Sub-Agent Switching / **: When using Claude models, Antigravity may call Gemini 2.5 Flash Lite as a sub-agent for lightweight tasks. This causes the context limit to temporarily jump to 1M, returning to 200k when Claude resumes execution.
   Claude ，Antigravity  Gemini 2.5 Flash Lite 。 1M， Claude  200k。

## [1.7.1] - 2026-03-14

### Fixed (Critical) / （）

- **Windows Workspace ID Matching / Windows  ID **: `buildExpectedWorkspaceId()` now correctly hex-encodes the drive-letter colon as `_3A_` and replaces hyphens with underscores on `win32`, matching the LS process's actual `--workspace_id` encoding. Previously, multi-workspace setups on Windows would connect to the wrong LS instance, causing "no conversation" or "idle" status.
  `buildExpectedWorkspaceId()`  Windows  `_3A_` ， LS  `--workspace_id` 。 Windows  LS ，""""。

- **Windows URI Normalization / Windows URI **: `normalizeUri()` now strips the leading `/` before Windows drive letters (e.g., `/c:/Users/...` → `c:/Users/...`) for semantically correct path comparison.
  `normalizeUri()`  Windows  `/`（ `/c:/Users/...` → `c:/Users/...`），。

## [1.7.0] - 2026-03-14

### Added /

- **Windows Platform Support / Windows **: Full Windows compatibility for process discovery. `filterLsProcessLines()` dynamically selects binary name (`language_server_windows` for Windows, `language_server_linux` for Linux, `language_server_macos` for macOS) based on `process.platform`. Process discovery uses `wmic.exe` (native executable, no PowerShell startup overhead) with PowerShell `Get-CimInstance` fallback for future Windows versions that may deprecate wmic. Port discovery uses `netstat -ano` (~25ms, fastest available option). New `extractPortFromNetstat()` parser exported for unit testing.
   Windows 。`filterLsProcessLines()`  `process.platform` 。 `wmic.exe`（， PowerShell ）， `netstat -ano`（ 25ms，）。 `extractPortFromNetstat()` 。

- **Windows Case-Insensitive Path Handling / Windows **: `normalizeUri()` in `tracker.ts` now applies `toLowerCase()` on both macOS (`darwin`) and Windows (`win32`), preserving case sensitivity only on Linux file systems.
  `tracker.ts`  `normalizeUri()`  macOS  Windows  `toLowerCase()`， Linux 。

### Verified /

- Tested on Windows 10/11 (x64) with Antigravity installed. Confirmed `language_server_windows_x64.exe` process discovery with correct `csrf_token` and port extraction via `wmic` + `netstat`. All RPC endpoints (GetUnleashData, GetUserStatus, GetAllCascadeTrajectories) verified working over HTTPS.
   Windows 10/11 (x64)  Antigravity 。 `wmic` + `netstat`  `language_server_windows_x64.exe`  `csrf_token` 。 RPC  HTTPS 。

## [1.6.0] - 2026-03-07

### Added /

- **Linux Platform Support / Linux **: Full Linux compatibility for process discovery. `filterLsProcessLines()` dynamically selects binary name (`language_server_linux` for Linux, `language_server_macos` for macOS) based on `process.platform`. Supports both x64 (`language_server_linux_x64`) and ARM64 (`language_server_linux_arm`) architectures.
   Linux 。`filterLsProcessLines()`  `process.platform` 。 x64  ARM64 。

- **`ss` Fallback for Port Discovery / `ss` **: New `findListeningPorts()` function prioritizes `lsof` and falls back to `ss -tlnp` on Linux if `lsof` is unavailable. Includes dedicated `extractPortFromSs()` parser.
   `findListeningPorts()` ， `lsof`，Linux  `lsof`  `ss -tlnp`。 `extractPortFromSs()` 。

- **Case-Sensitive Path Handling / **: `normalizeUri()` in `tracker.ts` now conditionally applies `toLowerCase()` only on macOS (`process.platform === 'darwin'`), preserving case sensitivity on Linux file systems.
  `tracker.ts`  `normalizeUri()`  macOS  `toLowerCase()`， Linux 。

### Changed /

- **README Restructure / README **: Split bilingual README into pure English `README.md` (default) and Chinese `readme_CN.md` with cross-links. Improved readability by eliminating mixed-language paragraphs.
   README  `README.md`（） `readme_CN.md`，。，。

### Verified /

- Tested in Docker (Ubuntu 22.04 / ARM64) with Antigravity installed via APT. Confirmed `language_server_linux_arm` process discovery with correct `csrf_token` and `extension_server_port` extraction.
   Docker (Ubuntu 22.04 / ARM64)  Antigravity 。 `language_server_linux_arm`  `csrf_token`、`extension_server_port` 。

## [1.5.3] - 2026-02-22

### Fixed (Medium) / （）

- **CR3-Fix2**: `discoverLanguageServer` workspace matching now delegates to the exported `extractWorkspaceId()` instead of duplicating the regex inline — eliminates regex drift risk between production code and tests
  `discoverLanguageServer`  `extractWorkspaceId()`，

### Tests /

- **CR3-Fix3**: Added `tests/extension.test.ts` (7 tests) covering polling race logic: `activate`/`deactivate` lifecycle, `disposed` guard, `isPolling` reentrance guard, `pollGeneration` orphan chain prevention, LS discovery failure recovery
   `tests/extension.test.ts`（7 ），：、disposed 、isPolling 、pollGeneration 、LS
- Total test count: 78 (was 57 in v1.5.2)
  ：78（v1.5.2  57）

## [1.5.2] - 2026-02-22

### Fixed (Critical) / （）

- **CR2-Fix1**: `schedulePoll` generation counter — `restartPolling()` increments `pollGeneration` so the old chain's `finally` block silently exits instead of creating orphan parallel timers
  `schedulePoll` ——`restartPolling()`  `finally` ，

- **CR2-Fix3**: `probePort` now handles response-side stream errors via `res.on('error')` — previously could hang until timeout on TCP RST or half-broken connections
  `probePort`  `res.on('error')` —— TCP RST

- **CR2-Fix4**: Extracted 6 parsing functions (`buildExpectedWorkspaceId`, `extractPid`, `extractCsrfToken`, `extractWorkspaceId`, `filterLsProcessLines`, `extractPort`) from `discoverLanguageServer()` as exports. Tests now import production code directly instead of reimplementing regex logic
   `discoverLanguageServer()`  6  export，

### Fixed (Medium) / （）

- **CR2-Fix2**: Status bar main text now appends `⚠️` when `hasGaps` is true — previously gaps warning was only visible in tooltip
   `hasGaps`  `⚠️`—— tooltip

- **CR2-Fix5**: `pollContextUsage` captures `cachedLsInfo` to local `lsInfo` snapshot at entry — concurrent refresh command setting `cachedLsInfo=null` can no longer cause null to be passed to downstream RPC calls
  `pollContextUsage`  `cachedLsInfo` ——refresh  null  RPC

- **CR2-Fix6**: Batch step fetching now limited to `MAX_CONCURRENT_BATCHES=5` — prevents bursting hundreds of concurrent RPC calls on long conversations
   5 —— RPC

- **CR2-Fix7**: `effectiveModel` priority chain: `generatorModel → checkpoint muModel → requestedModel`. Checkpoint's `modelUsage.model` now correctly overrides `generatorModel`
  `effectiveModel` ：`generatorModel → checkpoint muModel → requestedModel`

### Fixed (Minor) / （）

- **CR2-Fix8**: `getContextLimit` clamps custom limits to minimum 1; `formatContextLimit` clamps input to minimum 0 — prevents negative/zero context limits from user configuration
  `getContextLimit`  clamp  1；`formatContextLimit` clamp  0

### Tests /

- Rewrote `discovery.test.ts` to import production parsing functions (16 tests)
   `discovery.test.ts`
- Added tests for negative/zero custom limits in `getContextLimit` and `formatContextLimit`
   `getContextLimit`  `formatContextLimit` /
- Added test for checkpoint `modelUsage.model` priority in `processSteps`
   `processSteps`  checkpoint `modelUsage.model`

## [1.5.1] - 2026-02-22

### Improved /

- **Two-Layer Compression Detection / **: Primary layer compares consecutive checkpoint `inputTokens` in `processSteps()` — drop > 5000 tokens flags compression. Immune to Undo false positives (checkpoint data immutable). Fallback layer: cross-poll `contextUsed` comparison with Undo exclusion guard (skips when `stepCount` decreases). Both layers feed `compressionPersistCounters` (3 poll cycles ~15s)
   `processSteps()`  checkpoint `inputTokens`—— 5000 tokens ， Undo 。： `contextUsed`  Undo 。

- **SYSTEM_PROMPT_OVERHEAD**: Updated from 2000 to 10,000 tokens based on real Antigravity LS measurement (~10K actual system prompt tokens)
   2000  10000 tokens

## [1.4.1] - 2026-02-22

### Fixed (Critical) / （）

- **CR-C2**: `probePort` in `discovery.ts` now supports `AbortSignal` for cancellation on extension deactivate; uses `settled` guard pattern to prevent double resolution
  `discovery.ts`  `probePort`  `AbortSignal`，； `settled`  resolve

- **CR-C3**: Added `hasGaps` flag to `TokenUsageResult` and `ContextUsage` — when step batch fetching has gaps, UI shows "⚠️ Data may be incomplete / " in tooltip and `[⚠️Gaps/]` tag in QuickPick
   `hasGaps` ——，""

### Fixed (Medium) / （）

- **CR-M2**: Renamed `const MODEL_DISPLAY_NAMES` to `let modelDisplayNames` to accurately reflect runtime mutability via `updateModelDisplayNames()`
   `const MODEL_DISPLAY_NAMES`  `let modelDisplayNames`，

- **CR-M3**: `rpcCall` now uses `settled` flag with `safeResolve`/`safeReject` wrappers to prevent double reject from abort + error event overlap
  `rpcCall`  `settled`  `safeResolve`/`safeReject` ， abort + error  reject

- **CR-M5**: Polling interval now has `Math.max(1, ...)` lower bound — 0 or negative config values no longer cause excessive polling
   `Math.max(1, ...)` ——0

### Improved /

- **CR-m1**: `formatTokenCount` now displays `M` suffix for values ≥ 1,000,000 (e.g., `1.5M` instead of `1500k`) for better readability
  `formatTokenCount`  ≥ 100  `M` （ `1.5M`  `1500k`），

- **CR-m5**: Added `discovery.test.ts` with 16 unit tests for parsing logic (workspace ID generation, PID/CSRF/port extraction, process line filtering)
   `discovery.test.ts`， 16

## [1.4.0] - 2026-02-22

### Added /

- **Content-Based Token Estimation /  Token **: Replaced fixed constants (`USER_INPUT_OVERHEAD=500`, `PLANNER_RESPONSE_ESTIMATE=800`) with character-based estimates from actual step text content (`userInput.userResponse`, `plannerResponse.response/thinking/toolCalls`). Fixed constants remain as fallback.
  ， checkpoint  token 。 fallback 。

- **Dynamic Model Display Names / **: Fetch model configurations from `GetUserStatus` API on LS connection to dynamically update display names. Hardcoded names preserved as fallback.
   LS  `GetUserStatus` API 。 fallback 。

- **Retry Token Observation /  Token **: Checkpoint `retryInfos[].usage` token data is now logged for analysis (observation mode — not yet counted toward totals pending verification of double-counting risk).
  Checkpoint  `retryInfos[].usage`  token （—— modelUsage ）。

### Fixed /

- **CR-C1**: Added `isPolling` reentrance lock to prevent concurrent `pollContextUsage()` execution when RPC calls exceed the polling interval
   `isPolling` ， RPC  `pollContextUsage()`

- **CR-M2**: Fallback estimation formula (no checkpoint path) now uses accumulated `estimationOverhead` from content-based estimates instead of recalculating with fixed constants
   checkpoint  fallback  `estimationOverhead`（），

- **CR-m1**: `escapeMarkdown` now escapes `<` and `>` to prevent MarkdownString HTML interpretation
  `escapeMarkdown`  `<`  `>`， MarkdownString  HTML

- **CR-m2**: `formatTokenCount` guards against negative values with `Math.max(0, count)`
  `formatTokenCount`  `Math.max(0, count)`

- **CR-m3**: `previousContextUsedMap` now cleaned up in `updateBaselines` — stale entries for disappeared trajectories are removed
  `previousContextUsedMap`  `updateBaselines` —— trajectory

- **CR-m6**: `selectionReason` context preserved through cascade selection → display logic, improving debug log quality
  `selectionReason`  cascade ，

## [1.3.1] - 2026-02-21

### Fixed /

- **C3 Fix**: Fixed `globalStepIdx` off-by-one bug in image generation detection — both stepType and model name checks now use the same step index, preventing duplicate counting
   `globalStepIdx`  off-by-one bug——stepType ，

### Improved /

- **Bilingual CHANGELOG / **: All CHANGELOG entries now include both English and Chinese descriptions

- **README limitations / README **: Added documentation for known limitations (same-workspace multi-window, compression detection timing)
   README （ workspace 、）

## [1.3.0] - 2026-02-21

### Fixed (Critical) / （）

- **C2**: `contextUsed` now includes `outputTokens` from the last checkpoint — both input and output tokens count toward context window occupation
  `contextUsed`  checkpoint  `outputTokens`—— token

- **C3**: Added real compression detection via cross-poll comparison. When `contextUsed` drops between polls, tooltip shows before/after values with 🗜 indicator
  。 `contextUsed` ，/ 🗜

### Fixed (Medium) / （）

- **M1**: `globalStepIdx` now increments per step regardless of metadata presence, fixing potential image generation dedup index skew
  `globalStepIdx` ，

- **M4**: `lastKnownModel` is now persisted to `workspaceState`, surviving extension restarts
  `lastKnownModel`  `workspaceState`，

- **M5**: README version synced to 1.3.0
  README  1.3.0

- **M7**: Internal model context limits kept at 1M (no LS API available to query them dynamically)
   1M（ LS API ）

### Improved /

- **m5**: Added `escapeMarkdown` helper for tooltip content — special characters (`|`, `*`, `_`, etc.) no longer break MarkdownString rendering
   `escapeMarkdown` ——（`|`、`*`、`_` ） MarkdownString

- **m6**: QuickPick detail now uses newline-separated layout for better readability
  QuickPick ，

- **Compression UX / **: Tooltip distinguishes between "compressing" (>100%) and "compressed" (detected drop) states with different messages
  ""（>100%）""（），

### Cleaned /

- Removed all old `.vsix` build artifacts from project root
   `.vsix`
- Removed empty file `0` from project root
   `0`

## [1.2.0] - 2026-02-21

### Fixed (Critical) / （）

- **C1**: Fixed `contextUsed` calculation — separated actual output tokens from estimation overhead (USER_INPUT_OVERHEAD, PLANNER_RESPONSE_ESTIMATE) to prevent potential double-counting
   `contextUsed` —— token ，

- **C2**: Fixed `totalOutputTokens` to only include actual output tokens (toolCallOutputTokens + checkpoint outputTokens), not estimation overhead
   `totalOutputTokens`  token，

### Added /

- **Image Generation Tracking / **: Explicit detection of image generation steps (by step type and model name). Shows 📷 indicator in tooltip and QuickPick panel when detected.
  （）。 QuickPick  📷 。

- **Estimation Delta Display / **: Tooltip now shows `estimatedDeltaSinceCheckpoint` when applicable, helping verify accuracy.
   `estimatedDeltaSinceCheckpoint`，。

- **Output Tokens Display /  Token **: Tooltip now explicitly shows output token count separate from total context usage.
   token ，。

- **Exponential Backoff / **: Polling backs off (5s → 10s → 20s → 60s) when LS discovery fails, resets on reconnect. Reduces CPU overhead when Antigravity is not running.
   LS （5 → 10 → 20 → 60），。 Antigravity  CPU 。

- **Manual Refresh Reset / **: "Refresh" command now resets backoff state immediately.
  ""。

### Changed /

- **Probe Endpoint / **: Switched from `GetUserStatus` to lightweight `GetUnleashData` for port probing (per openusage reference docs).
   `GetUserStatus`  `GetUnleashData`（ openusage ）。

- **RPC Timeout / RPC **: `GetCascadeTrajectorySteps` now uses 30s timeout (was 10s) to handle large conversations.
  `GetCascadeTrajectorySteps`  30 （ 10 ），。

- **Context Limits Description / **: Settings now include model ID → display name mapping for user clarity.
   ID → ，。

- **README**: Added macOS-only platform note. Added image generation tracking and exponential backoff to features.
  README  macOS 、。

## [1.1.0] - 2026-02-21

### Fixed (Critical) / （）

- Replaced ALL placeholder model IDs (`MODEL_PLACEHOLDER_M7`, `M8`, etc.) with real IDs discovered from live Antigravity LS (`MODEL_PLACEHOLDER_M37`, `M36`, `M18`, `MODEL_OPENAI_GPT_OSS_120B_MEDIUM`)
   ID  Antigravity LS  ID

- Fixed duplicate Claude Sonnet 4.6 model mapping (`334` vs `MODEL_PLACEHOLDER_M35`)
   Claude Sonnet 4.6

- Undo/Rewind detection now catches stepCount **decrease** (not just increase), ensuring context usage immediately reflects undone steps
  Undo/Rewind  stepCount ****（），

### Fixed (Medium) / （）

- Context compression (>100%) now displays `~100% 🗜` with compression indicator instead of raw `>100%` value
  （>100%） `~100% 🗜` ， `>100%`

- Tooltip clarifies that "Used" includes both input and output tokens (total context window occupation)
  "" token（）

- Polling interval reduced from 15s to 5s for more responsive updates
   15  5 ，

- Status bar severity thresholds adjusted: critical at 95% (was 100%)
  ：95% （ 100%）

### Fixed (Minor) / （）

- `.vscodeignore` now excludes debug scripts and temp files from packaged extension
  `.vscodeignore`

- Bilingual improvements across all user-facing strings


- Default status bar background returns `undefined` (not a ThemeColor) for 'ok' state
   `undefined`（ ThemeColor）

## [1.0.2] - 2026-02-21

### Fixed /

- Fixed bug where context usage displayed data from previous conversation after rewind
   bug

## [1.0.1] - 2026-02-21

### Fixed /

- Minor stability improvements


## [1.0.0] - 2026-02-21

### Added /

- Initial release with full context window monitoring
  ，
- Multi-window workspace isolation

- Bilingual UI (English + Simplified Chinese)
  （ + ）
- Undo/Rewind support
   Undo/Rewind
- Context compression awareness


## [0.4.6] - 2026-02-21

### Fixed /

- Fixed an issue where context usage would incorrectly display data from a previous conversation after rewinding/clearing the current conversation to an empty state.
  /，。

---

## Detailed v1.15.2+ Maintenance Notes / v1.15.2+

The detailed notes that used to live in `CHANGELOG-v2.md` are now imported here as maintenance detail, not as a second release index. `CHANGELOG.md` is the only canonical changelog.

 `CHANGELOG-v2.md` ，。`CHANGELOG.md` 。

### Imported detail: [1.16.4] UI polish, shadow checkpoint visibility, and safer catalog/pricing persistence — 2026-05-06

#### Added /

- **Checkpoint shadow model visibility / Checkpoint **:
  The status bar tooltip now shows the latest checkpoint's internal model in a short form such as `(M50)`. This is shown as diagnostic context only; the main model row still follows the user-selected model.

   tooltip  checkpoint （ `(M50)`）。，。

- **Tool catalog cleanup / **:
  GM Data now has a collapsible tool catalog with smarter chip tooltips and a clear button. Clearing the catalog removes stale inventory entries only; tool ranking counts are not reset.

  GM Data 、 chip tooltip，。，。

- **Shared empty-state styling / **:
  `.empty-msg` is now available as a shared WebView empty-state style, including light-theme coverage.

  `.empty-msg`  WebView ，。

#### Improved /

- **Cost tab readability / Cost **:
  The cost analysis area uses clearer sub-sections, chip-style totals, blue tab coloring, and structured info bars for notes and billing disclaimers.

  Cost 、chip 、，。，。

- **Pricing editor coverage / **:
  The pricing editor shows called models first and appends built-in default pricing models that were not called yet. Saving now persists only existing custom rows or rows the user actually changed, so untouched default prices stay as built-ins.

  ，。，。

- **Models tab layout / Models **:
  Model info cards moved from a two-column grid to full-width rows with compact stats on the left and expandable details on the right. Narrow screens still stack the sections vertically.

  ，，；。

- **Context Intelligence scrolling / **:
  Context Intelligence scroll containers now contain overscroll inside the card/list instead of leaking wheel gestures to the whole WebView page.

  /， WebView 。

#### Fixed /

- **Shadow model pollution / **:
  `CHECKPOINT` steps no longer overwrite the user-visible display model. They still provide token baselines and now flow separately through `checkpointModel`.

  `CHECKPOINT` 。 token ， `checkpointModel` 。

- **Empty `responseModel` pricing edge case /  `responseModel` **:
  Placeholder GM data with an empty `responseModel` no longer marks every built-in price as covered and no longer renders editable rows with `data-model=""`.

   `responseModel`  placeholder GM ， `data-model=""` 。

- **Tool catalog reload persistence / **:
  Clearing the tool catalog now writes the cleared summary to both `gmTrackerState` and the file-backed `gmDetailedSummary`, preventing stale catalog entries from coming back after reload or reinstall.

   `gmTrackerState`  `gmDetailedSummary`，。

#### Validation /

- **Tests**: 49 passed (`npm test`)
- **TypeScript compile**: passed (`npm run compile`)
- **Package**: passed (`npm run package`)
- **Antigravity CLI probe**: packaged VSIX installed and activated in an isolated Antigravity profile

#### Files /

- **Code changed**: `src/activity-panel.ts`, `src/extension.ts`, `src/gm/tracker.ts`, `src/pricing-panel.ts`, `src/statusbar.ts`, `src/tracker.ts`, `src/webview-panel.ts`, `src/webview-script.ts`, `src/webview-styles.ts`
- **Tests added**: `tests/pricing-panel.test.ts`, `tests/webview-script.test.ts`, `tests/tool-catalog-clear.test.ts`
- **Docs updated**: `README.md`, `readme_CN.md`, `CHANGELOG.md`, `docs/project_structure.md`, `docs/technical_implementation.md`; `CHANGELOG-v2.md` is now an old-link compatibility pointer

---

### Imported detail: [1.16.2] Settings  — 2026-04-29

####  / Removed

- **7  / 7 Redundant Storage Stat Cards**:
  Settings 「」 9 ， 2 。 7 。

  Reviewed 9 storage stat cards in the Settings tab's \"Persistent Storage\" section. Reduced to 2 after removing duplicates and stats already shown in other tabs.

  |  |  |
  |--------|---------|
  | GM Calls (Cycle) | GM  Dashboard Grid  |
  | Input Tokens |  0，GM  |
  | Output Tokens |  |
  | Credits Used | GM  |
  | Est. Total Cost |  |
  | Archival Days |  Calendar Days （`dailyStore.totalDays`）|
  | Calendar Cycles |  |

  ** / Retained**: File Size（）、Calendar Days（）

####  / Cleanup

- **`formatTokenCount()` **:  Input/Output Tokens ，
- **`computeAllTimeCost()` **:  Est. Total Cost ，
- **`StorageDiagnostics` **:  11  6 （ `gmCallCount`、`gmTotalInputTokens`、`gmTotalOutputTokens`、`gmTotalCredits`、`estimatedCostAllTime`、`quotaResetCount`、`calendarCycleCount`）
- **`refreshLocalStorageDiagnostics()` **:  `calendarCycleCount`  7 （ `estimatedCostAllTime` IIFE）

####  / Stats

- **Files changed**: 3 (`src/webview-settings-tab.ts`, `src/extension.ts`, `src/webview-panel.ts`)
- **Docs updated**: 1 (`docs/project_structure.md`)
- **TypeScript compile**: Zero errors

---

### Imported detail: About  +  — 2026-04-26

####  / Added

- **About 「」 / Compatibility Section in About Tab**:
  「」「」「」（ SVG  + ）， Antigravity IDE ：
  - ：v1.18.4、v1.19.6
  - ：v1.19.6 → v1.20.6 → v1.23.2，
  - ，

  New \"Compatibility\" section between Tips and Disclaimer in the About tab (shield-check SVG icon + green left border). Documents contributor-tested Antigravity IDE versions: most stable v1.18.4 & v1.19.6, tested range v1.19.6 → v1.23.2.

####  / Fixed

- ** Context Intelligence  / Light Theme CI Card Color Readability**:
   9  3  Model DNA （ `user_info`  `#4ade80` ）。

  ****:  inline `color:${conf.color}`  CSS  `var(--ci-color)` ， `data-ci-type` 。 `webview-styles.ts`  `--ci-color` 。header badge  `ci-badge` class + `data-ci-type` 。

  Fix: Context Intelligence card colors were nearly invisible on light theme backgrounds (especially `user_info` green `#4ade80`). Refactored all inline colors to CSS variable `var(--ci-color)` with `data-ci-type` attribute per card. Added light theme overrides in `webview-styles.ts` with darker color values for all 12 card types.

  |  |  |  |
  |---|---|---|
  | user_info | `#4ade80` | `#15803d` |
  | checkpoint | `#fbbf24` | `#b45309` |
  | context_injection | `#60a5fa` | `#2563eb` |
  | mcp_servers | `#2dd4bf` | `#0f766e` |
  | user_rules | `#06b6d4` | `#0e7490` |
  | workflows | `#f472b6` | `#be185d` |
  | artifacts | `#a78bfa` | `#7c3aed` |
  | dna_prompt | `#60a5fa` | `#2563eb` |
  | dna_config | `#f59e0b` | `#b45309` |
  | dna_tokens | `#f97316` | `#c2410c` |

- **About  / About Compat Section Light Theme Fix**:
  `about-info-compat`  strong  `var(--color-ok-light)` 。 `var(--color-ok)` +  `#15803d`。

  Fixed: compat section strong text used light green (`--color-ok-light`) unreadable on white. Changed to `--color-ok` with light theme override `#15803d`.

####  / Stats

- **Files changed**: 3 (`src/webview-about-tab.ts`, `src/activity-panel.ts`, `src/webview-styles.ts`)
- **Docs updated**: 1 (`docs/project_structure.md`)
- **TypeScript compile**: Zero errors

---

### Imported detail: ： +  — 2026-04-26

####  / Improved

- ** / Long Error Message Truncation**:
  `normalizeErrorMessage()`  3 ：
  1. `trying to unmarshal args to {TargetFile:... CodeContent:......}` → `trying to unmarshal args to {…}`（）
  2. `failed to read file: open e:/path/to/file.txt` → `failed to read file: open <path>`（）
  3.  300  297 + `...`（）

  New normalization rules: (1) truncate unmarshal errors embedding entire file contents, (2) normalize file paths in error messages, (3) general 300-char max-length truncation.

- ** / Display Normalized Messages in Error Catalog**:
   `message`  `normalizeErrorMessage()` 。IP///，。。

  Error type catalog now stores the normalized message for display instead of the raw original. Persisted data is automatically cleaned on next rebuild.

####  / Stats

- **Files changed**: 2 (`src/gm/summary.ts`, `src/gm/tracker.ts`)
- **TypeScript compile**: Zero errors

---

### Imported detail: "" — 2026-04-26

####  / Removed

- **"" / Standalone Context Composition Donut Chart**:
   `buildTokenBreakdownChart()`  CSS（`act-legend-dot`、`act-xray-details`、`xray-*`  200 ）。"""Token "（`buildContextIntelViewer()` ） `GMSummary.latestTokenBreakdown` ，。

  Removed `buildTokenBreakdownChart()` and its associated CSS (~200 lines). This standalone donut chart + X-ray breakdown duplicated the "Token Composition" card already present inside `buildContextIntelViewer()`, both consuming the same `GMSummary.latestTokenBreakdown` data.

   / Cleanup items:
  - `buildTokenBreakdownChart()` （ SVG +  + X-ray ）
  - （`act-two-col`） `errorDetails`
  - CSS: `act-legend-dot`、`act-xray-details`、`xray-body/item/header/bar-wrap/bar/chips/chip/chip-val/total` + light theme
  - `webview-script.ts`: `scrollableSelectors`  `.xray-body`

####  / Stats

- **Files changed**: 2 (`src/activity-panel.ts`, `src/webview-script.ts`)
- **TypeScript compile**: Zero errors
- **Net change**: ~-200 （CSS +  + light theme ）

---

### Imported detail:  /  +  — 2026-04-25

####  / Fixed

- ** /  / Error Types & Tool Catalog Not Shared Across Accounts**:
  「」(`uniqueErrors`) 「」(`toolCatalog`)  per-account email  key ，/。。

  Root cause: `_persistedUniqueErrorsByAccount`  `_persistedToolCatalogByAccount`  `_buildSummary()`  `_currentAccountEmail` ，。

  ****: ****（ per-account ）， `__shared__` 。 per-account ， `__shared__` 。。

  Error types and tool catalog were stored per-account, showing inconsistent counts when switching accounts. Fix: read phase aggregates ALL account buckets; write phase merges into a single `__shared__` bucket. Legacy per-account data is automatically migrated on first rebuild.

- **"" / About Tab Icon Invisible in Dark Theme**:
  "" SVG ，"i" `<path>`  `fill="currentColor"`，，。

  Fix: Added `fill="currentColor"` to the second `<path>` in the About tab button SVG icon.

####  / Improved

- **： IP  / Enhanced Error Dedup: Destination IP Normalization**:
  `normalizeErrorMessage()`  TCP  IP:port （`->198.18.0.57:443` → `->HOST:443`）。 TCP （ `wsasend: connection forcibly closed`） IP ，。

  New normalization rule for TCP destination `IP:port` in `normalizeErrorMessage()`. Connection errors to different backend IPs (e.g., `.22` vs `.57`) are now correctly collapsed into a single error type.

####  / Stats

- **Files changed**: 3 (`src/gm/tracker.ts`, `src/gm/summary.ts`, `src/webview-panel.ts`)
- **Docs updated**: 1 (`docs/project_structure.md`)
- **TypeScript compile**: Zero errors

---

### Imported detail:  — 2026-04-25

####  / Improved

- ** / Account Popover De-purple**:
  Account Popover（ + ），（slate `rgba(148,163,184,*)`）。 `rgba(34,34,50)`  `rgb(24,24,30)`。Light theme  `rgba(124,58,237)`  slate 。

  Removed all purple-tinted gradients from Account Popover (trigger + dropdown). Replaced with neutral slate tones. Dark dropdown background changed from cold-purple to neutral dark gray `rgb(24,24,30)`. Light theme updated from purple to slate gray.

- ** / Quota Progress Bar Alignment Fix**:
   countdown （ `1d5h`、`6d10h`、``、``）。 `font-size: 0.85em` + `min-width: 5em` + `text-align: right` + `flex-shrink: 0`，。

  Fixed misaligned quota bars caused by varying countdown text widths. Unified `font-size`, `min-width`, and `flex-shrink` across `.acct-reset-countdown` and `.acct-reset-idle` for consistent right-side spacing.

####  / Stats

- **Files changed**: 2 (`src/webview-styles.ts`, `src/activity-panel.ts`)
- **TypeScript compile**: Zero errors

---

### Imported detail: "" +  TopBar Chips — 2026-04-24

####  / Added

- **"" / About Tab**:
  ""，：
  - **Hero **： +  +
  - ****：8 （GM 、、、、、、、）， SVG  + ，
  - **GitHub **： + Star
  - ****：
  - ****：、、
  - ****：

  New "About" tab at the end of the tab bar with feature navigation cards, GitHub info, tips, disclaimer, and language hints.

####  / Removed

- **TopBar Chips (GitHub /  / )**:
  （GitHub、Notice、Disclaimer），""，。

  Removed GitHub/Notice/Disclaimer chip dropdowns from topbar; content relocated to the About tab for permanent display.

####  / Fixed

- ** / Light Theme Visibility**:
   GitHub 。 `.about-card-icon`  CSS （`--color-ok-light` → `#16a34a` ） GitHub （`#15803d`），。

  Fix: CSS variable overrides scoped to `.about-card-icon` for light theme; GitHub link button and info boxes use darker accent colors.

- ** / Disclaimer Revision**:
   GM （ GM ）， 128K–200K  120K–160K。 tooltip （`✅ `）。

  Removed GM badge mention from disclaimer, updated context window range to 120K–160K, removed data source label from statusbar tooltip.

- ** ID / Raw Model ID Exposed in UI**:
   GM  ID（ `MODEL_PLACEHOLDER_M26`）。 `calculateCosts`  `buildModelCards`  `modelBreakdown` key  `normalizeModelDisplayName()` ，，。

  Fix: Apply `normalizeModelDisplayName()` to `modelBreakdown` keys in cost calculation and GM model cards. Display-only change; storage keys unchanged.

####  / Cleanup

- **TopBar Chips  / Dead Code Removal**:
   254 ：
  - `webview-styles.ts`: topbar-chips / info-chip / chip-dropdown / disclaimer-body / info-banner-link CSS +  overrides (~210)
  - `webview-script.ts`: `bindChipToggles()`  + `savedChip`  (~39)
  - `statusbar.ts`: `dataSourceLabel`  (3)
  - `i18n.ts`: `tooltip.estimated` / `tooltip.precise`  (2)

  Removed ~254 lines of dead CSS, JS, and i18n keys from the former topbar chips system.

####  / Stats

- **New file**: `src/webview-about-tab.ts` (About tab builder + styles)
- **Files changed**: 7 (`webview-panel.ts`, `webview-script.ts`, `webview-about-tab.ts`, `webview-styles.ts`, `statusbar.ts`, `i18n.ts`, `pricing-store.ts`, `activity-panel.ts`)
- **Dead code removed**: ~254 lines
- **TypeScript compile**: Zero errors

---

### Imported detail:  + API  — 2026-04-24

####  / Fixed

- ** / Compound Duration Not Normalized**:
  `normalizeErrorMessage()`  `/reset after \d+s/` （ `1s`）， API （ `19h22m14s`、`3h12m38s`）。 429 ""。

  ： `/reset after \d+[hms][\dhms]*/`，， `reset after <time>`。

  Fix: regex now matches compound durations (`19h22m14s`, `3h12m38s`, `1s`) instead of only seconds.

- **API  / API Duplicated Error Messages Not Collapsed**:
  API  bug  `MSG: MSG` （ `UNAVAILABLE ...server: UNAVAILABLE ...server`）。 `.: ` ， `server: UNAVAILABLE`  `canceled: request` 。

  ： `deduplicateApiErrorText()` ， `: ` ，。

  Fix: new `deduplicateApiErrorText()` scans all `: ` positions for split-point matching, covering all duplication patterns.

- ** / Persisted Messages Not Cleaned**:
  `_persistedUniqueErrorsByAccount` （ API ） `_buildSummary()`  `firstSeen` ""， UI 。

  ： `uniqueErrors`  message  `deduplicateApiErrorText()` ，。。

  Fix: persisted messages are now cleaned through `deduplicateApiErrorText()` during merge, with cleaned versions written back to storage.

####  / Stats

- **Files changed**: 3 (`src/gm/summary.ts`, `src/gm/parser.ts`, `src/gm/tracker.ts`)
- **New export**: `deduplicateApiErrorText()` (parser.ts)
- **TypeScript compile**: Zero errors

---

### Imported detail:  +  — 2026-04-24

####  / Removed

- ** / Monitor Tab**:
  ""（`webview-monitor-tab.ts`，1008 ）。 GM ，。GM 。

  Removed the entire "Monitor" tab (~1008 lines). All functionality was superseded by the GM Data dashboard. GM Data is now the default landing tab.

  ：GM 、、/、/、、、、。

- **monitor-\* CSS（ 300 ）**:
- **Light Theme monitor （7 ）**:

####  / Added

- ****:  50px ，。： > 40%、 20–40%、 < 20%。 active ，idle/ready 。 `ModelConfig.quotaInfo.remainingFraction`（20% ）。

####  / Stats

- **Files deleted**: 1 (`src/webview-monitor-tab.ts`)
- **Files changed**: 5 (`src/webview-panel.ts`, `src/webview-styles.ts`, `src/webview-script.ts`, `src/activity-panel.ts`, `src/extension.ts`)
- **TypeScript compile**: Zero errors

---

####  / Improved

- ** / Tool Catalog Container**:
  （`background + border + border-radius + padding`），： SVG  + ""  +  badge。

  Tool catalog chips now wrapped in a proper container matching the ranking list style, with header row (book icon + title + count badge).

- ** / Catalog Chips Sorted by Usage**:
  ，。，/MCP 。 counts  `firstSeen` 。

  Catalog chips sorted by call count descending (matching ranking order). After midnight reset, falls back to firstSeen order.

- ** / Ranking Shows All Tools**:
   top 15 ，。 "+X " 。

  Removed `entries.slice(0, 15)` limit — ranking now shows all tools. Removed "+X more" note.

- **Tooltip  / Tooltip Font Size Fix**:
   hover tooltip  `~0.53em`  `12px`，。

  Fixed tooltip font-size from nested-shrunk ~0.53em to fixed 12px for readability.

####  / Fixed

- ** / Permanent Catalog Persistence**:
  （`_persistedUniqueErrorsByAccount`）（`_persistedToolCatalogByAccount`）， `reset()`  `baselineForQuotaReset()` 。 `fullReset()`（）。

  Unique error catalog and tool catalog are now permanent — NOT cleared by midnight `reset()` or quota `baselineForQuotaReset()`. Only `fullReset()` (nuclear) clears them.

  |  |  |  | / |
  |---|---|---|---|
  | `reset()`（） |  |  |  |
  | `baselineForQuotaReset()`（） |  |  |  |
  | `fullReset()`（） |  |  |  |

####  / Stats

- **Files changed**: 2 (`src/gm/tracker.ts`, `src/activity-panel.ts`)
- **TypeScript compile**: Zero errors
- **Tests**: 50 passed
- **New CSS classes**: `.tool-cat-section`, `.tool-cat-header`

---

####  / Improved

- ** / Error Types Deduplicated by Message Content**:
  「」" error code "（ `429`/`500`/`unknown`）""。，。

  Error type catalog deduplication changed from error-code-based to normalized-message-content-based. Different messages under the same error code are now tracked as separate error types.

  |  |  |
  |------|------|
  |  429  →  1  |  429  →  |
  | `wsasend:14266`  `wsasend:5167` → （ 500） | （TCP ） |
  | `reset after 0s`  `reset after 1s` → （ 429） | （） |
  | `context canceled`  `wsasend` → （ 500） | （） |
  | `failed to read file`  `task scope too simple` → （ unknown） | （） |

- ** / Error Types Cross-Account Visibility**:
  ，（）。。

  Error type catalog now collects from ALL accounts (like tool call ranking). Error log remains current-account only.

####  / Added

- **`normalizeErrorMessage()`  / Error Message Normalization**:
   `normalizeErrorMessage()`（`summary.ts`）， key：
  - TCP  `198.18.0.1:14266->` → `198.18.0.1:PORT->`
  - Quota reset  `reset after 0s` → `reset after Ns`
  - （、 URL、）

  New `normalizeErrorMessage()` strips volatile parts (port numbers, reset wait times) while preserving semantic identity for deduplication.

####  / Fixed

- ** / Legacy Persisted Data Migration**:
   `persistedUniqueErrorsByAccount`  errorCode  key（ `"500"` → `{message, firstSeen}`）， `normalizeErrorMessage(msg)`  key。 `normalizeErrorMessage()` ， key 。

  Old persisted entries (keyed by errorCode) are migrated to normalized-message keys during merge, preventing duplicate entries from key format mismatch.

####  / Stats

- **Files changed**: 3 (`src/gm/types.ts`, `src/gm/tracker.ts`, `src/gm/summary.ts`)
- **UI updated**: 1 (`src/activity-panel.ts` — )
- **TypeScript compile**: Zero errors
- **Tests**: 50 passed

---

### Imported detail:  — GM  — 2026-04-24

####  / Changed

- ** / Context Limits Now Use Platform Truncation Thresholds**:
  `DEFAULT_CONTEXT_LIMITS` （1M） GM `plannerConfig.truncationThresholdTokens` 。

  |  |  |  |  |
  |---|---|---|---|
  | Claude Opus/Sonnet | 1,000,000 | 160,000 | GM plannerConfig |
  | Gemini 3.1 Pro | 1,000,000 | 120,000 |  ~125K |
  | Gemini Flash | 1,000,000 | 160,000 | GM plannerConfig |
  | GPT-OSS 120B | 128,000 | 128,000 |  |

- ** contextUsed  GM  / Status Bar Uses GM Precision Data**:
  poll  GM ， `contextTokensUsed`（ `contextWindowMetadata`） step-based ， Context Intelligence 。

  After GM fetch, `currentUsage.contextUsed` is overridden with GM's `contextTokensUsed` for precision.

- ** / Automatic Migration for Old Versions**:
  ， 1M ， `package.json` 。 `inspect()` + `contextLimitsMigrationV` 。

  One-time migration detects stale 1M defaults and resets to new platform thresholds.

####  / Stats

- **Files changed**: 3 (`src/models.ts`, `src/extension.ts`, `package.json`)
- **Impact**:  `~13%` (1M)  `~82%` (160K)，

---

### Imported detail: Model DNA  — 2026-04-24

####  / Fixed

- **DNA  / Cross-session DNA Card Leakage**:
  ，（ Claude + Gemini）DNA 。。

  Fixed DNA cards showing models from all sessions. Now filtered to current conversation's models only via `primaryModels` set.

- ** / Context Window Cross-session Data**:
   `latestContextUsed` / `maxContextSeen` ，。

  Fixed context window progress bar pulling data from all conversations instead of the current one.

---

### Imported detail:  — Model DNA +  — 2026-04-24

####  / Added

- **Artifacts  / Artifacts System Context Classification**:
  `classifySystemContext()`  `<artifacts>` ，`GMSystemContextType`  `'artifacts'` （）。

  New `artifacts` classification for `<artifacts>` tags in system context with purple icon.

- **Model DNA  / Model DNA Visualization**:
  （Context Intelligence） 3  Model DNA ，：

  New collapsible Model DNA cards at the bottom of Context Intelligence viewer:

  |  |  |  |
  |------|--------|---------|
  |  | `promptSectionTitles` |  + 13  promptSection  + / |
  |  | `completionConfig` + `contextWindowCapacity` | temperature/topK/maxOutputTokens/stopPatterns +  |
  | Token  | `latestTokenBreakdown` |  token （System Prompt / Chat / Tools ） |

- ** / Context Window Capacity from GM Data**:
   `gm.plannerConfig.truncationThresholdTokens` （ 160000），。

  `contextWindowCapacity` extracted directly from `plannerConfig.truncationThresholdTokens` in GM data, no heuristic estimation.

  -  `GMCallEntry.contextWindowCapacity` / `GMModelStats.contextWindowCapacity`
  - `parseGMEntry()` → `tracker.ts`  → `summary.ts` ，
  -  `~200.0k`（） `160.0k`（），

- ** / Empty State Placeholder**:
   GM ，" AI  — "，。

  Empty state hint shown when no context data is available (e.g., after reinstall before first AI response).

####  / Stats

- **Files changed**: 5 (`src/gm/types.ts`, `src/gm/parser.ts`, `src/gm/tracker.ts`, `src/gm/summary.ts`, `src/activity-panel.ts`)
- **TypeScript compile**: Zero errors
- **New fields**: `GMCallEntry.contextWindowCapacity`, `GMModelStats.contextWindowCapacity`
- **New CSS classes**: `.ci-dna-chips`, `.ci-dna-chip`, `.ci-cfg-grid`, `.ci-cfg-row`, `.ci-cfg-label`, `.ci-cfg-val`

---

### Imported detail:  +  — 2026-04-24

####  / Improved

- ****:
  、Summary Bar 、，。

  Unified color system across timeline tags, summary bar chips, and model stats card values.

  |  |  | CSS  |
  |---|---|---|
  |  |  | `--color-info-light` |
  |  |  | `--color-info-light` |
  |  |  | `--color-ok-light` |
  |  (TTFT/) |  | `--color-amber-light` |
  |  |  | `--color-teal-light` |
  |  |  | `--color-ok-light` |
  |  |  | `--color-danger-light` |
  |  |  | `--color-orange` |

- ****:
   AI ， UI 。→，Ultra →，→，→。

  Removed purple (AI-symbolic color) globally: ctx→orange, Ultra badge→cyan, account count→info blue.

- ****:
   `.act-tl-gm-tag` ， Summary Bar 。

  Added matching `border-color` to all timeline tags for visual consistency with summary bar chips.

- ** SVG **:
  🔧 emoji  `stroke="currentColor"`  SVG ，。

  Replaced wrench emoji with SVG icon using `currentColor` for theme-adaptive visibility.

- ****:
  （ / ），。

  Improved light theme contrast for tool tags with darker text colors.

- ****:
   + ， Summary Bar 。

  All model card values and account counts now have chip-style backgrounds and borders matching summary bar chips.

####  / Stats

- **Files changed**: 1 (`src/activity-panel.ts`)
- **TypeScript compile**: Zero errors
- **Tests**: 50 passed
- **New CSS classes**: `.val-in`, `.val-out`, `.val-time`, `.val-calls`, `.val-cache`, `.val-cost`, `.val-hit`, `.val-credits`

---

### Imported detail:  — 2026-04-24

####  / Added

- ** / Tool Catalog**:
  （flex-wrap chips），，hover  tooltip。

  New tool catalog bubble tags at the bottom of the Tool Call Ranking section. Each bubble shows a unique tool name; hover displays a Chinese description tooltip.

  -  `ToolCatalogEntry` （`name` / `firstSeen` / `description?`）
  - `GMSummary.toolCatalog`  + `GMTrackerState.persistedToolCatalogByAccount`
  -  `firstSeen`（ `call.createdAt`）
  - （ firstSeen +  description）
  - 、、 /
  -  19  AI （`toolDesc`）
  - `data-tooltip` CSS tooltip ，hover

####  / Stats

- **Files changed**: 5 (`src/gm/types.ts`, `src/gm/tracker.ts`, `src/gm/index.ts`, `src/gm-tracker.ts`, `src/activity-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Tests**: 50 passed
- **New types**: `ToolCatalogEntry`
- **New CSS classes**: `.tool-cat-chips`, `.tool-cat-chip`

---

### Imported detail:  +  — 2026-04-24

####  / Added

- ** / Unique Error Type Catalog**:
  「」「」， error code（ `429`/`503`/`stream_error`），（ + ）。""。

  New collapsible "Error Types" sub-section deduplicates errors by error code, keeping only the first occurrence of each type. Useful for investigating what varieties of errors have been encountered.

  -  `UniqueErrorEntry` （`code` / `message` / `firstSeen`）
  - `GMSummary.uniqueErrors`  + `GMTrackerState.persistedUniqueErrorsByAccount`
  - 、、 /

- ** / Structured Error Log**:
   `RecentErrorEntry[]`（`message` + `code` + `createdAt`），： + （//） +  +  → 。

  Recent errors upgraded from plain string array to structured `RecentErrorEntry[]` with parsed error code and timestamp. Uses the same row format as unique error types.

  -  `RecentErrorEntry`
  - 「」（），「」

- ** / Copy All Errors to Clipboard**:
  「」（ CSS tooltip  `title`），，：

  ```
  ---  (2 ) ---
  #1 [500] 04/24 06:29 request failed: ...
  #2 [429] 04/24 08:10 RESOURCE_EXHAUSTED...

  ---  (4 ) ---
  #1 [429] 04/24 08:10 RESOURCE_EXHAUSTED...
  #2 [500] 04/24 07:45 request failed: ...
  ...

  1.2k token  | 0.5 credits
  ```

   AI 。。

  Copy button with custom CSS tooltip copies all error data (types + log + overhead) to clipboard as formatted plain text.

####  / Stats

- **Files changed**: 6 (`src/gm/types.ts`, `src/gm/tracker.ts`, `src/gm/index.ts`, `src/gm-tracker.ts`, `src/activity-panel.ts`, `src/webview-script.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Tests**: 50 passed
- **New types**: `UniqueErrorEntry`, `RecentErrorEntry`
- **New CSS classes**: `.gm-ue-section`, `.gm-ue-header`, `.gm-ue-row`, `.gm-ue-copy-btn`, `.gm-ue-tooltip`

### Imported detail:  + Tooltip  — 2026-04-23

####  / Fixed

- ** / Error Count Cross-Account Contamination**:
  Summary Bar 「」，「」。。

  Root cause: `_buildSummary()`  `retryErrorCodes`  `accountFilteredCalls`（）， `_persistedRetryErrorCodesByAccount`  **max-wins** （），：
  1. ：，
  2. ：`_persistedRetryErrorCodes`（）

  / max-wins —— `accountFilteredCalls` 。

  ****: max-wins  **fallback-only** —— API （`freshErrorTotal === 0`，）。API ，/。

  Error count mixed in other accounts' historical errors. `retryErrorCodes` was correctly aggregated from `accountFilteredCalls`, but then unconditionally inflated by max-wins merge with persisted data. Fix: persisted data now used only as fallback when fresh data is zero (API not yet repopulated after restart), matching how totalCalls/totalCredits work.

- **Tooltip  / Tooltip Jump on Mouse Leave**:
  Summary Bar  tooltip 。

  Root cause:  tooltip —— `[data-tooltip]::after`  `bottom`（）+ ， `.act-stat`  `:hover`  `top`（）。 hover ，tooltip  `bottom` 。

  ****:  `.act-stat`  tooltip  `:hover`  `::after`（`bottom: auto; top: calc(100% + 6px)`）， tooltip  hover ，。。

  Two tooltip styles conflicted: global used `bottom` (upward) + transition, act-stat overrode to `top` (downward) only in `:hover`. On mouse leave, the hover override disappeared, tooltip jumped from bottom to top then faded out. Fix: override direction in base `::after` state so it's always consistent.

####  / Stats

- **Files changed**: 2 (`src/gm/tracker.ts`, `src/activity-panel.ts`)
- **TypeScript compile**: Zero errors

---

### Imported detail: Timeline  — 2026-04-23

####  / Fixed

- ** / Duplicate User Messages in Timeline**:
  Timeline ""（ 3  2  step #36 ），""。/。

  ** / Two-Layer Root Cause**:

  1. **`_compactRecentSteps` dedup key **: `gm_user`  dedup key  `buildLegacyStepEventIdentity()`， `timestamp`。 `nextCall?.createdAt`（ AI ），。 `gm_user`  dedup key → 。

  2. **step-source  gm_user **: `injectGMData`  step-source （`gmUserTextSet.has(userText)`）， Steps API warm-up  step-source  `userInput`  →  → step-source  gm_user  → 。

  ** / Fix**:
  - `_compactRecentSteps`: `gm_user`/`gm_virtual`  `cascadeId+stepIndex+category`  dedup key
  - `injectGMData` step-source :  `gmUserStepKeys`（`cascadeId:stepIndex`），

  Duplicate user messages appeared in adjacent turns (e.g., same step #36 in Turn 3 and Turn 2). Two-layer fix: (1) stable dedup key using cascadeId+stepIndex instead of drifting timestamp, (2) stepIndex-based fallback for filtering step-source user events when text matching fails.

####  / Stats

- **Files changed**: 1 (`src/activity/tracker.ts`)
- **TypeScript compile**: Zero errors

---

### Imported detail:  UI  — 2026-04-23

####  / Refactored

- ** UI  / Cost Tab UI Overhaul**:
  「」「」「」， Grand Total 。CSS  `prc-viz-*` / `prc-cost-*`  `cost-*`。

  Merged "Cost Overview" and "Cost Breakdown" into a unified "Cost Analysis" panel, eliminating triple Grand Total display. CSS namespace unified from `prc-viz-*` / `prc-cost-*` to `cost-*`.

  |  |  |  |
  |------|------|------|
  |  | 3 （ + 4  highlight + Grand Total ） | 1 （summary bar ） |
  |  | 4  highlight （///） |  summary bar  |
  |  | ， tooltip（ token ） |  |
  |  |  `prc-cost-grid` （per-model 2×2 grid） | （ +  + ）， |
  | Grand Total  |  | ****（summary bar ） |
  | CSS  | `prc-viz-*` + `prc-cost-*`（~180 ） | `cost-*`（~150 ） |

- ** / Duplicate Function Cleanup**:
  `fmtUsd` / `fmtCost` / `fmtTokensK`  `fmtUsd()` + `fmtTok()`。`buildMonthlyCostSummary`  `fmtUsd()`。

  Deduplicated three formatting functions into shared file-level `fmtUsd()` + `fmtTok()`.

####  / Removed

- `buildCostVisualization()` —  `buildCostPanel()`
- `buildCostSummary()` —  `buildCostPanel()`
- `fmtCost()` / `fmtTokensK()` —  `fmtUsd()` / `fmtTok()`
- `prc-viz-*` CSS（~90  highlight + bar chart ）
- `prc-cost-*` CSS（~90  card grid ）
- 3  Light Theme （`prc-cost-card-total` / `prc-cost-grand-val` / `prc-cost-card.prc-cost-grand`）

####  / Stats

- **Files changed**: 1 (`src/pricing-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Net lines**: ~-120
- **New CSS classes**: `cost-panel`, `cost-chips`, `cost-chip`, `cost-bar-*`, `cost-detail-*`, `cost-legend-*`, `cost-note`

---

### Imported detail:  UI  — 2026-04-23

####  / Refactored

- ** UI  / Sessions Tab UI Overhaul**:
  「」「GM 」，CSS  `history-*`  `ses-*`。

  Sessions tab visual design unified with GM Data panel. CSS namespace migrated from `history-*` to `ses-*`.

  |  |  |  |
  |------|------|------|
  |  | 7  + spotlight  | 4 （→→→） |
  | Summary Bar | 3  | ****（） |
  | Shortcut |  | （`ses-shortcut`） |
  | / |  `.card`  +  | （ + ） |
  |  |  | （12px SVG） |
  |  |  `title`（~1s ） | CSS tooltip（`data-tooltip` + `::after`， 0.12s ） |
  | CSS  | `history-*`（~740 ） | `ses-*`（~250 ） |

- ** / Session Row Simplification**:
  、、、（ GM Data ）。： + （Brain/Rec/PB）。

  Removed calls, steps, credits, and model name chips from session rows (already shown in GM Data). Each row now shows: time range + storage tags only.

####  / Added

- **CSS Tooltip  / CSS Tooltip System**:
   `data-tooltip`  CSS tooltip， `::after` 。hover （0.12s  + scale ）， JS 。 `disabled` 、Light/Dark 、`focus-visible` 。

  Pure CSS tooltip via `data-tooltip` attribute + `::after` pseudo-element. Instant display on hover (0.12s fade-in + scale micro-animation), no JS needed. Supports disabled state, light/dark theme, and focus-visible accessibility.

####  / Removed

- **`history-*`  / Dead CSS Cleanup**:
  -  ~740  `history-*` CSS（ +  ~75  light theme ）
  -  `renderSummary()`
  -  `ses-summary-bar` / `ses-stat*` / `ses-ctx-model` / `ses-chip-credit`  CSS
  - `webview-script.ts`  2 （`.history-filter-btn` → `.ses-filter-btn`，`.history-group` → `.ses-group`）

####  / Stats

- **Files changed**: 3 (`src/webview-chat-history-tab.ts`, `src/webview-styles.ts`, `src/webview-script.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **CSS net**: ~-740  `history-*` + ~250  `ses-*` + ~35  CSS tooltip = ** ~455  CSS**
- **New CSS classes**: `ses-shortcut`, `ses-toolbar`, `ses-search-wrap`, `ses-row`, `ses-badge`, `ses-chip`, `ses-act-btn`, `[data-tooltip]`

---

### Imported detail: Thinking Tokens  — 2026-04-23

####  / Fixed

- **Thinking Tokens  / Thinking Token Double-Counting Bug**:
  `outputTokens`  `thinkingOutputTokens`（ `output = responseOutput + thinking`）， `outputTokens × output_price`  `thinkingTokens × thinking_price`， thinking 。

  ： 8  `respOut = outputTokens - thinkingTokens`， `respOut × output_price` 。

   Claude （`thinkingTokens`  0）， Gemini  12-15%。

  Fix: `outputTokens` includes `thinkingOutputTokens`, but the cost formula was using both `outputTokens × output_price` AND `thinkingTokens × thinking_price`, double-charging thinking. All 8 cost calculation sites now use `respOut = outputTokens - thinkingTokens` for the output cost.

- ** / Monthly Cost Missing Pending Archive**:
  `buildMonthlyCostSummary`  + ， `estimatedCost`。

  ：`buildPricingTabContent`  `pendingArchiveCost` ，`webview-panel.ts`  `lastPendingArchives.reduce(estimatedCost)`。、、。

  Fix: Monthly cost now includes pending archive `estimatedCost` sum. All three cost display sections (overview, breakdown, monthly) unified.

####  / Improved

- ** Cache Write  / Remove Cache Write Cost Display**:
  API  `cacheCreationTokens`（858  0）， UI ：
  - `ModelCostRow`  `cacheWriteCost`、`cacheWriteTokens`
  - 「」
  -  cacheWrite
  -  cacheWrite

  Removed cacheWrite cost from all UI surfaces since API never reports `cacheCreationTokens`. `ModelPricing` and `DEFAULT_PRICING` retain the field for future use.

####  / Stats

- **Files changed**: 5 (`src/pricing-store.ts`, `src/pricing-panel.ts`, `src/activity-panel.ts`, `src/gm/tracker.ts`, `src/webview-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors

---

### Imported detail:  +  GM  — 2026-04-23

####  / Fixed

- **Cost  / Cost Tab Only Showing Active Account**:
  `GMTracker._buildSummary()`  `modelBreakdown`， Cost 。

  Fix: `PanelPayload`  `gmFullSummary` ， `gmTracker.getFullSummary()`（`skipAccountFilter=true`）。Cost  Settings `estimatedCostAllTime`  `lastGMFullSummary`。

####  / Added

- ** / Per-Model Cost Row in Model Cards**:
  （ + GM-only） Credits  **Cost / ** ， `findPricing(responseModel) || findPricing(displayName)` 。 `gm.modelBreakdown`（）。

  New green Cost row in each model card, showing current account's per-model estimated cost.

- ** / Cost in Model Stats Total Row**:
  Sigma ， `conversations[].calls` 。

  New cost chip in the model stats total row, aggregating active (non-archived) costs across all accounts.

- ** / Cost in Pending Archive Panel**:
  `PendingArchiveEntry`  `estimatedCost?: number` 。`baselineForQuotaReset()`  `findPricing(call.responseModel)` 。。

  New `estimatedCost` field in `PendingArchiveEntry`, pre-computed at baseline time using `responseModel` pricing. Pending archive panel displays the sum.

  >  entries ， entries 。

- **findPricing display name fallback / Display Name Matching Enhancement**:
  `findPricing()` ： display name（//）， kebab-case （ `Claude Opus 4.6 (Thinking)` → `claude-opus-4-6-thinking` → prefix match `claude-opus-4-6`）。。

  Enhanced `findPricing()` with display name fallback: auto-converts to kebab-case for retry matching. Added empty string guard.

####  / Three-Layer Cost Display

|  / Location |  / Scope |  / Source |
|---|---|---|
|  / Model Card |  / Current account | `gm.modelBreakdown` |
|  / Total Row | 、 / All accounts, active | `conversations[].calls` |
|  / Pending Archive | 、 / All accounts, archived | `PendingArchiveEntry.estimatedCost` |
| Cost  / Cost Tab | 、 / All accounts, all | `gmFullSummary.modelBreakdown` |

####  / Stats

- **Files changed**: 6 (`src/pricing-store.ts`, `src/activity-panel.ts`, `src/gm/types.ts`, `src/gm/tracker.ts`, `src/webview-panel.ts`, `src/extension.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **New CSS classes**: `.act-card-row-cost`, `.mst-item-cost`, `.pending-stat-cost`

---

### Imported detail:  — 2026-04-23

####  / Added

- ** / Context Intelligence System**:
  「」，「」，。

  New "Context Intelligence" viewer replacing the old "Context Checkpoints" viewer, unified display of all system-injected context.

  ** / Type System**:
  - `GMSystemContextType`: 8  — `checkpoint` | `context_injection` | `user_info` | `user_rules` | `mcp_servers` | `workflows` | `ephemeral` | `system_preamble`
  - `GMSystemContextItem`: （type / stepIndex / tokens / label / fullText / checkpointNumber?）
  - `GMCallEntry` + `GMConversationData`  `systemContextItems: GMSystemContextItem[]`
  - clone / slim / persistence

  ** / Data Extraction** (`parser.ts`):
  - `classifySystemContext()`:  USER （`<user_information>` / `<user_rules>` / `<mcp_servers>` / `<workflows>` / `# Conversation History` / `{{ CHECKPOINT }}` ）
  - `extractSystemContextItems()`:  `messagePrompts`
  - ：`extractPromptData` → `parseGMEntry` → `mergeGMCallEntries` → `maybeEnrichCallsFromTrajectory`（ call）
  - `deduplicateSystemContextItems()`  conversation  `type:stepIndex`

  **UI  / UI Viewer** (`activity-panel.ts`):
  - `buildContextIntelViewer()`  `buildCheckpointViewer()`
  -  SVG  + （ Checkpoint /  /  /  /  MCP /  / ）
  -  `<details id="ciSection">` （），`restoreDetailsState()`
  -  +  + hover
  -  badge（ 1 ）
  - `stepIndex < 0`  step

- ** / Timeline System Injection Classification**:
  `injectGMData()`  `<user_information>`、`<user_rules>`、`<mcp_servers>`、`<workflows>`，（）。

  Extended system injection classification in `injectGMData()` to recognize user_information, user_rules, mcp_servers, and workflows as system events instead of user messages.

####  / Refactored

- **`.act-badge`  / Badge Border Radius**:
   `.act-badge`  `padding: 1px 6px` + `border-radius: var(--radius-sm)`，。

  Global `.act-badge` upgraded with padding and border-radius for rounded pill shape.

####  / Stats

- **Files changed**: 7 (`src/gm/types.ts`, `src/gm/parser.ts`, `src/gm/tracker.ts`, `src/gm/index.ts`, `src/gm-tracker.ts`, `src/activity/tracker.ts`, `src/activity-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Net lines**: +366 -27
- **New types**: `GMSystemContextType`, `GMSystemContextItem`
- **New CSS classes**: `.ci-section`, `.ci-section-header`, `.ci-badges`

---

### Imported detail:  — 2026-04-23

####  / Added

- ** / Per-Call Cost Tags in Timeline**:
   reasoning  USD （`act-tl-gm-cost`， SVG）， `findPricing(gmModel)` 。：`(input × price.input + output × price.output + cacheRead × price.cacheRead + thinking × price.thinking) / 1M`。 tokenParts （ →  →  →  → ）。

  New per-call USD cost tag on each reasoning event row, calculated via `findPricing(gmModel)` using the pricing table. Green dollar-sign SVG icon, placed leftmost in tokenParts.

- **Turn Header  / Turn Header Cost Chip**:
   `seg-chip-cost`（），`buildSegmentStats()`  action  `findPricing()` 。。

  New `seg-chip-cost` in Turn headers showing aggregated per-turn USD cost, placed between calls and cache chips.

- ** Token  / Pending Archive Cache Token Stats**:
  `PendingArchiveEntry`  `totalCacheRead: number` 。`baselineForQuotaReset()` （summary/cache） `cacheReadTokens`。`buildPendingArchivePanel()` （`totalCache > 0` ）。

  New `totalCacheRead` field in `PendingArchiveEntry`. Both aggregation paths in `baselineForQuotaReset()` accumulate `cacheReadTokens`. Cache chip rendered in pending archive stats between output and credits.

####  / Refactored

- ** / Credits Tag Repositioned**:
  ： tokenParts（） statusParts（），。Turn Header：。（→）： →  →  → TTFT →  |  →  →  →  → 。

  Credits moved from tokenParts (right-anchored) to statusParts (occasional zone), placed after error. Final order: error → credits → tools → TTFT → duration | cost → cache → in → out → ctx.

####  / Fixed

- ** Credits i18n  / Pending Archive Credits Missing i18n**:
  `buildPendingArchivePanel()`  Credits  `Credits`  `tBi('Credits', '')`。

  Credits label in pending archive changed from hardcoded `Credits` to `tBi('Credits', '')`.

####  / Stats

- **Files changed**: 3 (`src/activity-panel.ts`, `src/gm/tracker.ts`, `src/gm/types.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **New CSS classes**: `.act-tl-gm-cost` (event row), `.seg-chip-cost` (turn header)
- **New import**: `findPricing` from `pricing-store.ts` into `activity-panel.ts`

---

### Imported detail: Turn Header  — 2026-04-23

####  / Refactored

- **Turn Header  / Turn Header Chip Reordering**:
  Timeline「」 Turn header （`seg-chips`），：，/。。

  Turn header chips reordered for right-alignment stability: stable elements anchor the right edge, occasional items grow leftward when present.

  | （→） |  |  |
  |---|---|---|
  | （） | `error(N)` |  |
  | ← | `🔧N ` |  |
  | ← | `N.N ` |  |
  | → | `N ` |  |
  | → | `Nk ` |  |
  | → | `Nk  / Nk ` |  |
  | （） | ` Nk` |  |

- ** / Event Row Tag Reordering**:
  Timeline  reasoning  GM ，：` →  →  →  → `。， Turn header 。

  Event row GM tags reordered (left→right): cache → in → out → ctx → credits. Context anchors the right edge, matching Turn headers.

####  / Added

- ** / Context Window Chip**:
  Turn header  `seg-chip-ctx`（）， reasoning  `gmContextTokensUsed`， ` Nk` / `Ctx Nk`。

  New `seg-chip-ctx` (purple theme) showing the last reasoning event's context window size per turn.

####  / Removed

- ** / Duration Chip**:  `seg-chip-dur`（），（1  = 0s）。 `buildSegmentStats()`  `durationSec` / `minTime` / `maxTime` 。

  Removed imprecise duration chip (depended on first/last event timestamp diff). Removed `durationSec` calculation from `buildSegmentStats()`.

- ** / Model Name Chip**:  Turn header  `seg-chip-model`， `act-tl-model` ，header 。

  Removed `seg-chip-model` from Turn headers — model name already displayed per-event-row via `act-tl-model`.

####  / Stats

- **Files changed**: 1 (`src/activity-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors

---

### Imported detail:  UI  — 2026-04-23

####  / Refactored

- ** UI  / Model Info Card UI Overhaul**:
   `prc-dna-card`  `act-model-card` ， GM ""：
  - ：`act-card-header` + `act-card-body`（`act-card-row`  icon+label+value） + `act-card-footer`（ MIME/）
  -  SVG icon（////），，
  -  `act-checkpoint-model`  + `act-badge`

  Rewrites model info cards from `prc-dna-card` grid layout to `act-model-card` row-based layout, matching the GM Data tab's "Model Stats" visual style.

- ** / Same-Name Model Deduplication**:
  `buildModelDNACards()`  displayName（`.toLowerCase()`）。 GM ，persisted-only 。

  Deduplicates by normalized displayName after sorting. Entries with current GM data take priority; persisted-only duplicates are merged and discarded.

- **responseModel  / Smart responseModel Suppression**:
   `responseModel`（ `claude-opus-4-6-thinking`）（ "Claude Opus 4.6 (Thinking)"）， `responseModel` 。

  Hides `responseModel` when it's essentially the same as the card title after stripping punctuation/spaces.

- **Meta  / Meta Bar Visual Enhancement**:
  `prc-dna-meta` → `prc-dna-meta-bar`： +  + ，。/。

  `prc-dna-meta` → `prc-dna-meta-bar`: from plain text to a container with blue left border, subtle background, and rounded border for better visual hierarchy.

####  / Stats

- **Files changed**: 2 (`src/pricing-panel.ts`, `docs/project_structure.md`)
- **TypeScript compile**: Zero errors

---

### Imported detail:  — 2026-04-23

####  / Fixed

- ** / Cached Account Tracking Sessions Never Ending**:
  `processUpdate()`  API configs， `ModelState`  `isCycleEnded()` ， "" 。

  `processUpdate()` only receives API configs for the active account. Cached accounts' `ModelState` never reaches `isCycleEnded()`, leaving sessions stuck in "ACTIVE" until the user manually switches to that account.

  ****: `QuotaTracker`  `archiveExpiredSessions(email, modelLabels)` 。`checkCachedAccountResets()` （ GM baseline ），。 `stateKey`  + `modelLabel`/`poolModels` 。

  Fix: New `archiveExpiredSessions()` method on `QuotaTracker`. Called by `checkCachedAccountResets()` alongside GM baselining when cached account quota expires. Matches by `stateKey` email prefix + `modelLabel`/`poolModels` pool scope.

####  / Added

- ** / Current Account Session Pin & Highlight**:
  ，，：

  |  |  |
  |------|------|
  |  | （`--color-ok`）， |
  |  |  `rgba(74,222,128,0.06)` |
  |  |  `rgba(74,222,128,0.18)` |
  |  |  |

  ** / API Changes**:
  - `buildHistoryHtml()`  `currentAccountEmail`
  - `buildSessionCard()`  `isCurrentAccount` ， `qt-card-current`
  - ：，
  - /

####  / Stats

- **Files changed**: 4 (`src/quota-tracker.ts`, `src/extension.ts`, `src/webview-history-tab.ts`, `src/webview-panel.ts`, `src/webview-styles.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Root cause**: `processUpdate()`  configs →  `ModelState`  cycle-end → `archiveExpiredSessions()`

---

### Imported detail:  GM-only  — 2026-04-23

####  / Refactored

- ** GM-only  / Calendar Module GM-Only Cleanup**:
   Step API ， GM 。

  ** / Summary Grid Cleanup**:
  |  |  |  |
  |------|------|------|
  | （Errors） |  | Step API `totalErrors`，GM  `retryErrors` |
  | （Cycles） |  | ，， |
  | GM  ×2 |  |  bug， |
  |  |  | ，（） |

  ** / Day Detail Panel Cleanup**:
  -  Activity （`totalReasoning`/`totalToolCalls`/`totalErrors`/`totalInput`/`totalOutput`）
  -  `mergedModel`  `mergedModelHtml` （Step API ）
  -  `displayTokens` ， `gmTotalTokens`
  -
  - Tokens （`gmTotalTokens > 0`）

  ** / Dead Code Removal**:
  -  `buildMergedModelRows()`（Activity ，）
  -  `buildCycleCard()`（，）
  -  `buildPerModelRows()`（Activity per-model ，）
  -  `buildGMModelRows()`（ `buildCycleCard` ）
  - （`DailyCycleEntry`/`ModelCycleStats`/`GMModelCycleStats`/`formatShortTime`/`formatDuration`）

  **highActivity  / High Activity Detection Fix**:
   `totalReasoning > 20`（Step API） `gmCalls > 20`（GM ）。`MonthCellSummary`  `gmCalls` 。

####  / Stats

- **Files changed**: 2 (`src/webview-calendar-tab.ts`, `src/daily-store.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Net lines**: ~-155

---

### Imported detail: Credits  — 2026-04-23

####  / Refactored

- **Credits  (i18n) / Credits Display Unification**:
   GM  credits/ ， `cr` / `Credits`  `tBi` 。

  |  |  |  |
  |------|------|------|
  | Summary Bar  label | `Credits` | `tBi('Credits', '')` |
  | Summary Bar tooltip | ` credits` | `` |
  |  Credits  | `Credits` | `tBi('Credits', '')` |
  | Timeline  tag | `cr` | `tBi('credits', '')` |
  | Timeline segment header chip | `87.0 cr` | `87.0 credits/` |
  | Timeline  | `9 cr` | `9 credits/` |
  |  credits chip | `cr` | `tBi('credits', '')` |

####  / Added

- ** / Credit Call Count**:
   Credits （），。

  - : `GMModelStats`  `creditCallCount: number`
  - : `tracker.ts` + `summary.ts`  `credits > 0`
  - UI: `189.0 (22)` — ，
  - CSS:  `.act-credit-calls`（`font-size:0.82em`, `color:var(--color-orange-light)`, `opacity:0.7`）

- ** / Per-Account Credit Annotation in Conversations**:
  （）， `+x` 。

  - : `GMConversationData`  `accountCredits?: number`
  - : `tracker.ts`  `accountFilteredCalls`
  - UI: `821  +292`（ `+x`）

####  / Removed

- **Timeline  / Timeline Redundant Model Chip**:
  `buildMetaTags()`  `act-tl-tag-model` （ `act-tl-model` ）

- ** responseModel footer / Model Card Redundant Footer Tag**:
   `claude-opus-4-6-thinking` raw API （ normalized  `Claude Opus 4.6 (Thinking)`）。 GM-only 。

####  / Stats

- **Files changed**: 4 (`src/activity-panel.ts`, `src/gm/types.ts`, `src/gm/tracker.ts`, `src/gm/summary.ts`)
- **TypeScript compile**: Zero errors
- **Net lines**: +38 -19

---

### Imported detail: GM Data  — 2026-04-23

####  / Refactored

- **GM Data  / GM Data Panel Visual Refinement**:
  ，。

  |  |  |  |
  |------|------|------|
  | GM  | ~20+  `gm-badge-real`  | （ 100% GM，） |
  | Performance Baseline |  | （TTFT  Model Cards ） |
  | Cache Efficiency |  | （Cache Hit Rate  Model Cards ） |
  | GM  | Timeline  `GM 85%` badge | （） |

- ** / Timeline Legend Redesign**:
   ~36  `<details>`  18px  `(?)` 。hover  280×260px （`#1e1e2e`  + `backdrop-filter: blur`）， Token +。

  Legend replaced from large collapsible block to a compact `(?)` hover tooltip button in the section title bar.

- ** Timeline / Checkpoint Viewer Embedded in Timeline**:
   section 「」（ →  → ），。（ Timeline badge ）。

  Checkpoint viewer moved from standalone section into the Timeline section header area.

- ** / Conversation Cards Redesign**:
  （6 ：/////）：

  |  |  |  |
  |------|------|------|
  |  | ` xxxxxxxx`（ ID） | （`act-conv-title-chip`） |
  |  |  | （ `flex:1`  +  `flex-shrink:0` ） |
  |  |  + % +  token + credits |  + credits +  |
  |  |  | `MM/DD HH:mm → MM/DD HH:mm`（ calls.createdAt ） |
  |  |  | hover  +  cascadeId tooltip |
  |  |  240px | max-height 300px +  4px  |

####  / Added

- ** / Conversation Title Resolution**:
  Timeline  badge  `gmSummary.conversations` （`GMConversationData.title`）， fallback  cascadeId  8 。hover  cascadeId。`buildTimeline()`  `gm` 。

  Timeline title and conversation cards now resolve actual conversation titles from GM data.

####  / Removed

-  `gm-badge-real` （`activity-panel.ts` ~20  + `pricing-panel.ts` 2 ）
- Performance Baseline （`buildPerformanceChart()` ）
- Cache Efficiency （`buildCacheEfficiency()` ）
-  `<details>`  + ~140  `.act-tl-legend-*` CSS + 6  light theme override
- Summary Bar `gmTag`
- Timeline `GM xx%`  badge
- Timeline「」
- 、 token、``
-

####  / Stats

- **Files changed**: 2 (`src/activity-panel.ts`, `src/pricing-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **CSS net**:  ~140  legend CSS， ~100  tooltip CSS + ~90  conversation card CSS
- **Design principle**:  — 、、（→Timeline）、（→tooltip）

####  / Fixed

- **/ / Error Details Expand/Collapse Fix**:
   `<details>/<summary>` ：

  | # |  |  |  |
  |---|------|------|------|
  | 1 |  | summary  full div  |  summary |
  | 2 |  |  `<details>` | JS  `scrollWidth <= clientWidth`， `.no-overflow`  |
  | 3 |  | summary  `display:block; min-width:0` |  CSS  `text-overflow:ellipsis`  |
  | 4 |  | summary  | body ： |
  | 5 | / | `font-size:0`  `0.65em`  0 |  summary  `▶`， `.gm-err-msg-full::before`  `▼`， |

  ****: ； `▶ + ...` →  → `▼ + ` → 。

  Files changed: 2 (`src/activity-panel.ts`, `src/webview-script.ts`)

---

### Imported detail:  — 2026-04-22

####  / Fixed

- ** / Calendar Data Duplication**:
  （`onQuotaReset`/`checkCachedAccountResets`/`baselineExpiredPoolsForAccount`）， `getFullSummary()` ， `append`  DailyStore 。 cycles ，（ 1124 → 2248 → 3372）。。

  Each quota reset event called `getFullSummary()` for a complete snapshot and appended it to DailyStore. Calendar rendering summed all cycles, causing N× duplication when N resets fired on the same day (e.g., 1124 → 2248 → 3372). Costs doubled accordingly.

  ****: ——** baseline**（）， DailyStore。 `performDailyArchival()` 。

  Fix: Restructured archival data flow — quota resets only baseline calls (mark as pending archive), no DailyStore writes. Calendar data is written once at midnight by `performDailyArchival()`.

####  / Added

- **`getArchivalSummary()`  / Full Archival Snapshot**:
  `GMTracker`  `getArchivalSummary()` ， `_buildSummary(skipAccountFilter=true, skipArchivalFilter=true)`。，（ + ）， DailyStore 。

  New `GMTracker.getArchivalSummary()` method bypasses both account filtering and archival filtering, returning complete day data (pending-archive + active calls) for midnight DailyStore writes.

- **`_buildSummary()` `skipArchivalFilter`  / New Parameter**:
  `_buildSummary()`  `skipArchivalFilter`（ `false`）。 `true`  `_archivedCallIds`  `_archivedAccountModelCutoffs` ， `sliced`（）。

  New `skipArchivalFilter` parameter for `_buildSummary()`. When `true`, skips archival filtering and uses all current-cycle calls.

####  / Refactored

- ** / Pre-Reset Snapshot Removal**:
   `extension.ts`  `addDailySnapshot` （ 75 ）。 `baselineForQuotaReset()`，。

  Removed ~75 lines of pre-baseline DailyStore snapshot code from all three quota reset callbacks in `extension.ts`.

- ** / Midnight Archival Data Source**:
  `performDailyArchival()`  `getFullSummary()`（） `getArchivalSummary()`（），。

  `performDailyArchival()` switched from `getFullSummary()` to `getArchivalSummary()`, ensuring midnight archival captures complete daily usage including already-baselined calls.

####  / Stats

- **Files changed**: 3 (`src/extension.ts`, `src/gm/tracker.ts`, `src/daily-archival.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Root cause**: `getFullSummary()`  + `append`  →  N  = N ；， `getArchivalSummary()`

---

### Imported detail:  — 2026-04-22

####  / Refactored

- ** / Model Identity System Modernization**:
   i18n （`en`/`zh` ） API 。LS API `GetUserStatus`  `label` ，`updateModelDisplayNames()`  API  `modelDisplayNames` Record。

  Migrated from hardcoded i18n display name mappings (`en`/`zh` keys) to a purely API-driven dynamic naming architecture. The LS API `GetUserStatus` `label` field is now the single source of truth, dynamically populated via `updateModelDisplayNames()` on each API poll.

  ** / Key Changes**:
  |  |  |  |
  |------|------|------|
  |  |  `modelDisplayNames` （`en`/`zh` ） |  `Record<string, string>`，API  |
  | i18n  | `tBi` + `getLanguage()`  |  i18n ， API label |
  |  |  | `LEGACY_ZH_MODEL_NAMES` ， |

- ** / Runtime Data Normalization**:
   DailyStore / Model DNA / PricingStore  UI  `normalizeModelDisplayName()` ， JSON 。

  All UI paths reading persisted data from DailyStore / Model DNA / PricingStore now apply `normalizeModelDisplayName()` at render time, avoiding destructive migration of stored JSON data.

  ** / Normalized Paths**:
  - `webview-calendar-tab.ts` — `buildPerModelRows` / `buildGMModelRows` / `buildMergedModelRows` / `buildMergedGMRows` / model chip
  - `daily-store.ts` — `getMonthCostBreakdown()`
  - `pricing-panel.ts` — `buildMonthlyCostSummary()`  + `buildModelDNACards()`
  - `model-dna-store.ts` — `clonePersistedEntry()` / `buildPersistedEntry()` / `restoreModelDNAState()`

####  / Added

- **`LEGACY_ZH_MODEL_NAMES`  / Legacy Chinese Name Mapping**:
  `models.ts` ， 5 （ `Gemini 3.1 Pro ()` → `MODEL_PLACEHOLDER_M37`） canonical model ID。`resolveModelId()`  map ，。

  New static mapping resolving 5 known Chinese model display names back to canonical model IDs. Used as fallback in `resolveModelId()` when dynamic map lookup fails.

####  / Removed

- **i18n  / i18n Model Name Dependencies**:
  - `models.ts`  `tBi`  `zh`
  -  `setLanguage('zh')`
  - `extension.ts`

####  / Cleanup

- ** / Test Suite Updates**:
  - `model-dna-store.test.ts` —  `updateModelDisplayNames()`
  - `gm-tracker.test.ts` —  GM ，`beforeEach`
  - `activity-tracker.test.ts` —

####  / Stats

- **Files changed**: 7 (`src/models.ts`, `src/daily-store.ts`, `src/pricing-panel.ts`, `src/extension.ts`, `src/webview-calendar-tab.ts`, `tests/model-dna-store.test.ts`, `tests/gm-tracker.test.ts`, `tests/activity-tracker.test.ts`)
- **TypeScript compile**: Zero errors
- **Key design**: ，；`LEGACY_ZH_MODEL_NAMES`

---

### Imported detail: GM-only Timeline  — 2026-04-22

####  / Refactored

- **GM-only Timeline  / GM-Only Timeline Architecture**:
  `injectGMData()` "GM  step ""GM  Timeline"。 `step`  `estimated` ， `gm_virtual`（reasoning） `gm_user`（）。Timeline  Step API  `processedIndex`，。

  `injectGMData()` refactored from "GM annotates step events" to "GM replaces entire Timeline". All `step`/`estimated` events are purged and replaced by `gm_virtual` + `gm_user` events. Timeline no longer depends on Step API's `processedIndex`, immune to conversation rewind data loss.

- **Segment Header  / Turn Number Headers**:
   Header （` N ` / `Turn N`）， body ，。

  Segment headers changed from repeating user message preview to turn numbers (` N ` / `Turn N`). User message displayed once in the segment body only.

####  / Fixed

- **GM  / Last GM Call Missing**:
  `GMTracker.fetchAll()`  IDLE  re-fetch。 RUNNING → IDLE ， GM ， IDLE  re-fetch。： `_lastRunningStatus` Map ，RUNNING → IDLE  re-fetch。

  `GMTracker.fetchAll()` skipped IDLE conversations. The last GM call might not have been captured during the final RUNNING poll; once IDLE, it was never re-fetched. Fix: new `_lastRunningStatus` Map tracks RUNNING→IDLE transition and forces one extra re-fetch.

- **Timeline  / Timeline Blank on New Steps**:
  GM-only  step ， `injectGMData()`  `activityChanged || gmChanged` 。，step  gm_virtual  → Timeline 。：`injectGMData()` （ `lastGMSummary` ）。

  GM-only replacement deleted all step events, but `injectGMData()` only ran when `activityChanged || gmChanged`. Fix: now runs unconditionally whenever `lastGMSummary` exists.

- **GM Coverage Boundary  / Coverage Boundary Protection**:
  Steps API  GM API ， AI  step ， GM 。 step  → 。： `maxGMStep`， `stepIndex ≤ maxGMStep`  step ， step 。GM  gm_virtual 。

  Steps API is faster than GM API. Fix: compute `maxGMStep` per conversation, only remove step events within GM coverage range. Beyond-coverage step events are kept as temporary placeholders until GM catches up.

####  / Added

- **System  / System Event Rendering**:
  CHECKPOINT （`# Conversation History`）， `category: 'system'` 。CHECKPOINT  `Checkpoint N`， ``。 CSS ： +  +  SVG 。 segment （ action ）。EPHEMERAL 。

  CHECKPOINT and Conversation History injections now create `category: 'system'` events with amber styling instead of being filtered out. EPHEMERAL still skipped.

- ** Timeline Bootstrap / Reinstall Timeline Bootstrap**:
  `activate()` （ `activityTrackerState`） `gmDetailedSummary` ， `injectGMData()`  Timeline。（model、tokens、steps）， poll 。

  `activate()` detects fresh install (no saved activity state) but existing file-backed GM summary, bootstrapping the timeline immediately. Text previews populate after the first poll cycle.

####  / Removed

- ** / Expand Feature**:
   AI （`hasExpand`  `false`）。GM  `aiSnippetsByStep` ，`fullAiResponse` ，。 40 。

  Removed expandable full-text feature for both user messages and AI responses. Under GM-only architecture, expand has no useful content to show.

- **Estimated  / Estimated Events**:
   `processTrajectories()`  24  estimated 。 `buildMetaTags()`  `buildSegmentStats()`  `estimated` 。Timeline  "Estimated" 。

  Removed ~24 lines of estimated event creation from `processTrajectories()`. Cleaned up `estimated` branches from `buildMetaTags()` and `buildSegmentStats()`.

####  / Stats

- **Files changed**: 4 (`src/activity/tracker.ts`, `src/activity-panel.ts`, `src/extension.ts`, `src/gm/tracker.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Root cause chain**: Step API  Timeline  GM  → Coverage Boundary  GM  → RUNNING→IDLE  re-fetch  →  poll

---

### Imported detail:  — 2026-04-22

####  / Fixed

- ** / Error Attribution After Extension Restart**:
   `_currentAccountEmail` （）， `handleAccountSwitchIfNeeded()`  2 （`STATUS_REFRESH_INTERVAL = 2`）。，`gmTracker.fetchAll()`  →  `accountFilteredCalls`  → 。

  After extension restart, `_currentAccountEmail` restored from persistence with a stale account email. `handleAccountSwitchIfNeeded()` only runs every 2nd poll cycle, so the first `fetchAll()` tagged new calls with the wrong account. These calls were then filtered out of `accountFilteredCalls`, under-counting errors.

  ****: `pollContextUsage()` （`!firstPollDone`）， `_currentAccountEmail`  `fetchAll()` 。
  Fix: Force user status refresh on first poll (`!firstPollDone`), ensuring `_currentAccountEmail` is updated before the first `fetchAll()`.

####  / Improved

- **`_callAccountMap` key  / Identity-Based Call Account Mapping**:
  `_callAccountMap`  key （`cascadeId:index`）（`exec:{executionId}`  `cascadeId:stepIndices:model` ）。 API ，/，。 key ， legacy key 。

  `_callAccountMap` key changed from array index (`cascadeId:index`) to call identity (`exec:{executionId}` or `cascadeId:stepIndices:model` fallback). Array index depends on stable API ordering; identity-based keys are immune to reordering. Legacy key migration included.

####  / Stats

- **Files changed**: 2 (`src/extension.ts`, `src/gm/tracker.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Root cause**: `STATUS_REFRESH_INTERVAL(2)`  → `fetchAll()`  restore  →

---

### Imported detail:  — 2026-04-22

####  / Fixed

- ** / Cached Account Quota Reset Archival Failure**:
  `checkCachedAccountResets()`  3  `try { ... } catch { /* Silent */ }` ，，。： `pollContextUsage()`  `finally` ， try/catch 。

  `checkCachedAccountResets()` was placed inside 3 silent `try/catch` blocks. Any exception (network failure or internal error) silently skipped it. Fix: moved to `finally` block with its own error-logging try/catch.

- **`isPoolArchived()`  / Stale Cutoff Blocking New Archival**:
   `_archivedAccountModelCutoffs`  key。 cutoff entry ，。： `_cache` ， `true`。

  Old logic only checked if a cutoff key existed. Stale entries from previous quota cycles permanently blocked new archival. Fix: now scans `_cache` for un-archived calls; returns `true` only when all calls are archived.

- ** / Error Count Inflation After Archival**:
  `baselineForQuotaReset()` ，`_persistedRetryErrorCodesByAccount` 。`_buildSummary()`  max-wins 。：， `_buildSummary()` 。

  `baselineForQuotaReset()` did not clear all persisted error baselines. The max-wins merge in `_buildSummary()` restored archived error counts. Fix: clear all persisted error data on archival, forcing recalculation from actual remaining calls.

- **`hasUsage`  / Missing hasUsage Guard**:
  `checkCachedAccountResets()`  `pool.hasUsage === false`，（UI ""）。： UI `hasAccountReadyPool()` 。

  Added `hasUsage` check to prevent archiving unused pools, aligning with UI "Ready" indicator logic.

####  / Added

- **`baselineExpiredPoolsForAccount()`  / Account Switch Archival**:
  ， `handleAccountSwitchIfNeeded()` 。 `updateAccountSnapshot()`  resetTime 。。

  New function called during account switches to baseline expired pools for both outgoing and incoming accounts, preventing missed archival windows.

####  / Refactored

- **Summary Bar  / Summary Bar Chip Layout**:
   CSS Grid （`grid-template-columns: auto-fill`） flex-wrap （`justify-content: center`）。 `icon + value + label` 。

  |  |  |  |
  |------|------|------|
  |  | CSS Grid  | flex-wrap  |
  |  |  icon → value → label |  icon + value + label |
  |  | outline + 1px gap  |  border + border-radius |
  | SVG  |  |  |
  |  |  IIFE  |  `buildErrorChip()`  |

####  / Removed

- **"" / Data Scope Explanation**:  GM Data  `gmScopeNote` details
- **"Step API " / Step API Accuracy Note**:  `act-dist-note` （）
- **Distribution  CSS / Distribution Chart CSS**:  `act-dist-container`、`act-donut-chart`、`act-dist-legend`、`act-legend-item`、`act-legend-pct` （ `act-legend-dot`  X-ray ）
- ** Summary Bar  / Redundant Summary Metrics**: 、、、（）
- ** / Test Reset Detection Button**:  `#acctTestResetBtn`（HTML、CSS、、、getter ）

####  / Stats

- **Files changed**: 5 (`src/extension.ts`, `src/gm/tracker.ts`, `src/activity-panel.ts`, `src/webview-script.ts`, `src/webview-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Root cause chain**: `checkCachedAccountResets` （ → silent catch  → isPoolArchived ）→  finally  +  isPoolArchived +

---

### Imported detail:  +  — 2026-04-22

####  / Fixed

- ** `+x`  / Error Delta Exceeds Total**:
  `retryErrorCodesByConv`（per-conversation ） `sliced`（）， `retryErrorCodes`（） `accountFilteredCalls`（）， `+x` 。：`retryErrorCodesByConv`  `accountFilteredCalls`，。

  `retryErrorCodesByConv` used `sliced` (no account/archive filtering) while `retryErrorCodes` used `accountFilteredCalls`, causing `+x` to exceed the total. Fix: both now use `accountFilteredCalls`.

- ** / Errors Not Cleared After Quota Reset**:
  `baselineForQuotaReset()` ，`_persistedRetryErrorCodesByAccount`  `_persistedRecentErrorsByAccount` ，max-wins 。：。

  `baselineForQuotaReset()` did not clear persisted error data, causing max-wins merge to restore archived counts. Fix: delete target account's persisted error entries on archival.

####  / Refactored

- ** / Pending Archive Panel Repositioned**:
  `buildPendingArchivePanel()`  GM Data ********，，。

  Moved pending archive panel from tab top to below model stats total row.

####  / Added

- ** per-model  / Per-Model Error Counts in Model Cards**:
   `accountErrorsByModel: Map<modelName, Map<email, errorCount>>`， `gm.conversations[].calls[]`  +  `retryErrors.length` +  `errorMessage`。 `+N` （ + ），。

  New per-model per-account error counting. Each account row in model cards shows a red `+N` pill badge alongside the call count, independently scoped to that model.

  ** / Format**: `` `+` →  `15 +3`（15，3）

- ** / Error Toggle Button**:
  「」（`#modelStatsErrToggle`）。

  |  |  |
  |------|------|
  |  | （ `.is-off`）， |
  |  | ， `+N` |
  |  |  `hasAnyAccountErrors = true`  |
  |  | `vscode.getState().modelStatsShowErrors`， poll  |
  | CSS  | `.act-cards-grid.model-stats-show-errors .gm-account-err { display: inline }` |
  |  | （on:  `is-off` +  `show-errors`；off:  `is-off` +  `show-errors`） |

####  / Styles

- **`.gm-account-err`** — （`display: none` ， +  + tabular-nums）
- **`.model-stats-err-toggle`** — （ / `.is-off`  / hover + light theme ）
- **`.model-stats-show-errors`** —  `.act-cards-grid` ， `.gm-account-err`

####  / Stats

- **Files changed**: 3 (`src/gm/tracker.ts`, `src/activity-panel.ts`, `src/webview-script.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Key fix**: `retryErrorCodesByConv`  `retryErrorCodes`  `accountFilteredCalls` ；`baselineForQuotaReset()`  max-wins

---

### Imported detail:  — 2026-04-22

####  / Refactored

- ** / Account Panel Globalization**:
  "" GM Data ， dropdown ，。

  ** / Changes**:
  |  |  |  |
  |------|------|------|
  |  | GM Data  | topbar  |
  |  | ， | ， dropdown |
  |  |  tab-pane innerHTML  |  tab-pane，poll / |
  |  | — |  |

  ** / Trigger Button**:
  - ， "Antigravity " h1
  -  SVG  + ""
  - （`hasAccountReadyPool()` ）

  **Dropdown  / Dropdown Panel**:
  -  topbar ，`left/right: var(--space-3)`
  - （`border-radius: 12px`）， +
  - `scaleY + translateY` /，`transform-origin: top center`
  - `max-height: 70vh` ，
  - /

  ** / Incremental Refresh Protection**:
  - `buildTabContents()`  `accountPopover`（HTML string） `accountPopoverHasReady`（boolean）
  -  `updateTabs` ， `acctPopoverBody.innerHTML`， `hidden` / `is-visible`
  -  DOM ，

- ** / Delete Button Inline Redesign**:
   X ""（`acct-delete-link`），，。， spacer。

####  / Added

- **`buildAccountStatusPanel()`  / Exported Function**:
   `activity-panel.ts`  `export`， `webview-panel.ts` topbar 。

- **`hasAccountReadyPool()`  / Ready Pool Detection**:
  ， `resetPools`，（`resetTime ≤ now && hasUsage !== false`）。。

####  / Cleanup

-  `buildGMDataTabContent()`  `buildAccountStatusPanel()`  `accountPanel`
-  `acct-delete-btn` X （`opacity: 0` hover ） `acct-delete-spacer`
- ：`gap: var(--space-3)` → `var(--space-2)`，`padding: var(--space-2)` → `6px`

####  / Styles

- **`.acct-popover-trigger`** — （ + hover/active  + is-open ）
- **`.acct-popover-dot`** — （`@keyframes acctDotPulse`，）
- **`.acct-popover-dropdown`** —  dropdown（topbar ， + 12px  + ）
- **`.acct-popover-body .acct-card`** — flex-wrap （ + ）
- **`.acct-delete-link`** — （hover ）
- /

####  / Stats

- **Files changed**: 4 (`src/activity-panel.ts`, `src/webview-panel.ts`, `src/webview-styles.ts`, `src/webview-script.ts`)
- **Docs updated**: 1 (`CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Key design**: dropdown  `panel-topbar` ， sticky  containing block ；`updateTabs`  HTML，/ DOM

---

### Imported detail:  — 2026-04-22

####  / Refactored

- ** / Model Card Account Breakdown Redesign**:
   footer （`gm-account-tag`） card-body ：
  - ， GM
  -  SVG  + （） + （）
  - `justify-content: space-between` ，/TTFT

  Redesigned account breakdown from purple pill bubbles in card footer to structured data rows inside card body, with divider separator, user SVG icons, and consistent layout with other stat rows.

- ** / Active Account Highlight**:
  ：2px  +  +  +  +  + 。。 `accountSnapshots.find(s => s.isActive)`  `buildModelCards()`。

  Active account row highlighted with green selected state: left border + border + background + icon/text color change. Auto-sorted to top.

####  / Added

- ** / Model Stats Total Row**:
  ，、、// token。 `gm.conversations[].calls[]` （`allAccountTotalCalls` / `allAccountTotalIn` / `allAccountTotalOut` / `allAccountTotalCache`）， `accountFilteredCalls`  `gm.totalCalls` 。

  New summary chip-bar below model cards grid showing cross-account totals (calls, models, in/out/cache tokens), computed from raw `gm.conversations[].calls[]` to bypass account filtering.

  ** / Visual Design**:
  - Sigma (Σ) SVG  +  ""  + （ +  +  + hover ）
  - /
  - 、，

####  / Removed

- ** / Card Header Call Badge**:
   `<span class="act-badge act-badge-total">xx </span>`  GM-only  `<span class="act-badge">xx calls</span>`。，。

  Removed redundant call count badges from model card headers. Call counts are now shown only in the card body stats row and account breakdown section.

####  / Cleanup

- ****:  `totalLabel`  `gmStatsForLabel`  `avgThink`

####  / Enhanced

- ** / Per-Account Error Isolation**:
  （`_persistedRetryErrorCodes`）（`_persistedRetryErrorCodesByAccount`: email → { code → count }）。，。

  Error persistence refactored from global single-bucket to per-account isolated storage. Each account retains its own error history across account switches.

  ****: `restore()` ，。。
  Migration: `restore()` detects legacy global fields and attributes them to the current account.

- ** / Error Delta Display (+x)**:
   `+x` ，：

  |  |  |  |
  |------|------|------|
  | Summary Bar  |  `+x` | `11 +6` |
  | Summary Bar tooltip |  `(+x)` | `429 ×8 (+6), 500 ×2` |
  |  |  `+x ` | `  +6 ` |
  |  |  `+x` | `429 ×8 +6` |

  ****: `GMSummary.retryErrorCodesByConv`（cascadeId → { errorCode → count }）， `accountFilteredCalls` （v1.17.4 ，）。 ≥2 。

  Mirrors the tool call ranking `+x` pattern for error tracking. Shows per-conversation error contribution in red across Summary Bar, tooltips, and Error Details section.

####  / Stats

- **Files changed**: 3 (`src/gm/types.ts`, `src/gm/tracker.ts`, `src/activity-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Key design**:  = （`retryErrorCodes` from `accountFilteredCalls`）； `+x` = （`retryErrorCodesByConv[cascadeId]` from `sliced`）

---

### Imported detail:  — 2026-04-22

####  / Fixed

- ** / Retry Count False Positive**:
  `parser.ts`  `cm.retries`  GM payload ""（ = `1`），""。 `parseInt0(cm.retries)`  `retries=1`，。 43 「43 」。
  `cm.retries` in the GM payload means "total attempts" (1 = first-try success), not "failed retry count". The old parser used this value directly, causing every call to have `retries=1`.

  ****:  `retryInfos[]`  `error` （ `gm-live-watcher.ts` ）。 `retryInfos`  `cm.retries > 1` ， `cm.retries - 1` 。
  Fix: Only count `retryInfos` entries with actual error messages as retries. Fallback: `cm.retries - 1` when no retryInfos available.

####  / Refactored

- ** / Error Reporting Modernization**:
  ：

  ****:
  - `GMSummary`  `retryErrorCodes: Record<string, number>`  `recentErrors: string[]`
  -  `parseErrorCode()`  HTTP （`429`/`503`/`400`/`stream_error`/`timeout`/`unknown`）
  - `_buildSummary()`、`filterGMSummaryByModels()`、`buildSummaryFromConversations()`
  - `getDetailedSummary()`/`getFullSummary()`

  **UI **:
  |  |  |  |
  |------|------|------|
  | Summary Bar | "N GM " | "N "（），tooltip  |
  | Timeline | `retry(1)⚠429` | `error(N)` |
  | Turn header | `retry(N)⚠429` | `error(N)` |
  | GM Data  | 「」4  (`buildRetryOverhead`) | 「」 (`buildErrorDetailsSection`)： +  +  |

####  / Removed

- **`buildRetryOverhead()` **: ""（4  grid: token  / credits  /  /  + stopReason ）， Summary Bar tooltip  `buildErrorDetailsSection()`
- **`retry429`  CSS**:  `.act-tl-gm-retry429`、`.seg-chip-retry429`
- **`has429` turn **: `buildTimeline()`  turn header  429
- **`StepEvent.gmRetryHas429`**:  `@deprecated`（）

####  / Stats

- **Files changed**: 5 (`src/gm/parser.ts`, `src/gm/types.ts`, `src/gm/summary.ts`, `src/gm/tracker.ts`, `src/activity-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Key fix insight**: `retryInfos`  entry（ error ）， error  entry

####  / Enhanced

- ** UI  / Error Details Persistence & UI**:

  ****:
  - `GMTrackerState`  `persistedRecentErrors` + `persistedRetryErrorCodes`
  -  `state-v1.json`（），， `reset()`
  - ：errorCodes  max-wins，recentErrors

  ****:
  -  `substring(0, 120)` ，
  - API （`"msg.: msg."` → `"msg."`）
  - `errorMessage`  `retryErrors` ：`errorMessage`  `retryErrors`
  - (estimated) error  turn header （ gm_virtual ）

  **UI **:
  -  `<details>` /，CSS `text-overflow: ellipsis`
  -  `id="d-err-N"` + `restoreDetailsState()`  poll
  - （）， `#N` （ = ）
  -  10 ， 30

---

### Imported detail:  — 2026-04-22

#### 🏗 Refactored /

- ** / Tool Call Ranking Data Source Overhaul**:
  `toolCallCounts`  `accountFilteredCalls`（ + ） `sliced`（ baseline ）。
  Tool call counting migrated from `accountFilteredCalls` (account-filtered + archival-filtered) to `sliced` (post-baseline only).

  ** / Before**:  `accountFilteredCalls`  → ，。
  ** / After**:  `sliced`  → ，。 `reset()`  baseline 。

- **`+x`  `cascadeId`  / Delta Uses Stable CascadeId**:
  `buildToolCallRanking()` """ `calls[].createdAt` " `currentUsage.cascadeId` 。`cascadeId` ，//checkpoint 。
  Current conversation identification changed from "latest createdAt timestamp scan" to exact `currentUsage.cascadeId` match — stable across compressions, renames, and checkpoints.

- **`+x`  / Pre-Computed Delta Data**:
  `+x`  `gm.conversations[].calls`  `toolCallsByStep` ， `GMSummary.toolCallCountsByConv[cascadeId]`（ `_buildSummary()` ）。。
  Delta no longer computed live from `conversations[].calls`; reads pre-computed `toolCallCountsByConv` (same `sliced` source as totals).

#### ✨ Added /

- **`GMSummary.toolCallCountsByConv`**:
   `Record<cascadeId, Record<toolName, count>>` ，。 `toolCallCounts`  `sliced` ，。UI  `+x` ，。
  New optional field storing per-conversation tool call breakdown, immune to quota-reset archival.

- **`_persistedToolCounts` / `_persistedToolCountsByConv` **:
  ， `serialize()`/`restore()` 。`_buildSummary()`  **max-wins** （）， API 。 `reset()`  `fullReset()` 。
  New persisted fields surviving restarts via serialize/restore. `_buildSummary()` merges with max-wins strategy.

- **`GMTrackerState.persistedToolCallCounts` / `persistedToolCallCountsByConv`**:
  （v1.17.0）， state （）。
  Two new optional fields in serialized state (backward compatible).

#### 🏗 Improved /

- ** GM  / Model Card GM-Only Filter**:
  `buildModelCards()`  GM （`callCount > 0`）， Step API  " XX " 。
  Model cards now filter to GM-data-only entries, removing legacy "XX steps" fallback labels.

#### 📊 Stats /

- **Files changed**: 3 (`src/gm/tracker.ts`, `src/gm/types.ts`, `src/activity-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Key design**: `sliced`（post-baseline, pre-archival）；max-wins ；`cascadeId`  `createdAt`

---

### Imported detail:  — 2026-04-21

#### ✨ Added /

- ** / Tool Call Ranking**:
   GM Data （`buildToolCallRanking()`）， GM `messagePrompts` SYSTEM  `toolCalls[]`  AI ， stepIdx 。
  New tool call ranking section in the GM Data tab, extracting AI-invoked tool names from `messagePrompts` SYSTEM entries' `toolCalls[]` field, deduplicated by stepIdx.

  ** / Data Pipeline**:
  ```
  messagePrompts → SYSTEM messages with { stepIdx, toolCalls[{ functionName }] }
    → extractToolCallsByStep() → Record<stepIdx, toolName[]>
    → maybeEnrichCallsFromTrajectory() broadcasts to all calls
    → _buildSummary() aggregates → GMSummary.toolCallCounts
    → buildToolCallRanking() renders bar chart
  ```

  ** / Features**:
  - ，6 （、、、、、），nth-child
  - ：
  -  `+x` ：，
  - ：`toolCallCounts`  `GMSummary`  `serialize()/restore()`
  - ：daily archival `reset()`  `_lastSummary`，
  -  15 ， `+N `
  - 、、

- **`extractToolCallsByStep()`  / Parser Function**:
   `parser.ts` ， `messagePrompts` SYSTEM  `stepIdx`  `toolCalls[].functionName`， `Record<number, string[]>` 。 `extractPromptData()`  `parseGMEntry()` ， `maybeEnrichCallsFromTrajectory()` 。
  New parser function that extracts tool call names from SYSTEM messages by stepIdx. Integrated into the extraction pipeline and broadcast via trajectory enrichment.

#### 🏗 Improved /

- **`GMCallEntry.toolCallsByStep`**:
   `Record<number, string[]>`  step  AI 。`slimCallForPersistence()`  `{}`（ API ），。
  New field storing per-step tool call names. Cleared in `slimCallForPersistence()` to keep state file lean; repopulated from API on restart.

- **`GMSummary.toolCallCounts`**:
   `Record<string, number>` 。`filterGMSummaryByModels()`、`normalizeGMSummary()`、`buildSummaryFromConversations()` 。
  New field for aggregated tool frequency counts, propagated through all summary functions.

#### 📊 Stats /

- **Files changed**: 5 (`src/gm/types.ts`, `src/gm/parser.ts`, `src/gm/tracker.ts`, `src/gm/summary.ts`, `src/activity-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Key design**: （`toolCallsByStep`），（`toolCallCounts`）， API

---

### Imported detail:  +  — 2026-04-21

####  / Fixed

- ** / PendingArchive Persistence**:
  `_pendingArchives` ，。 `serialize()`/`restore()`  `state-v1.json`（，），。 `reset()` 。
  `_pendingArchives` was pure in-memory data, lost on restart. Now persisted via `serialize()`/`restore()` to `state-v1.json` (file-level, independent of extension install dir). Only cleared on midnight `reset()`.

- ** / Inaccurate Archive Count**:
  `baselineForQuotaReset()`  `_cache`  calls，（ 20 vs 126）。： `_lastSummary`（）； `_archivedAccountModelCutoffs`（`email|model` → ISO ），， `_cache` ， `_buildSummary()` 。
  `baselineForQuotaReset()` only iterated loaded calls in `_cache`, missing conversations not yet re-fetched (observed 20 vs 126). Fix: prioritize `_lastSummary` for accurate stats; new `_archivedAccountModelCutoffs` (`email|model` → ISO timestamp) with cutoff at `now` ensures future `_buildSummary()` filters correctly even with incomplete cache.

- ** / Cross-Pool Over-Archival**:
  `baselineForQuotaReset()` ****，。 Claude+GPT ，Gemini Pro  Flash 。： `poolModelFilter` ， `normalizeModelDisplayName` ，。——`onQuotaReset`（ `modelIds`） `checkCachedAccountResets`（ `pool.modelLabels`）——。
  `baselineForQuotaReset()` archived ALL models for an account instead of only the reset pool's models. Fix: new `poolModelFilter` parameter with `normalizeModelDisplayName` matching. Both callsites — `onQuotaReset` (passes `modelIds`) and `checkCachedAccountResets` (passes `pool.modelLabels`) — updated.

####  / Improved

- ** / Cached Account Pre-Baseline Snapshot**:
   (`checkCachedAccountResets`)  baseline  DailyStore ， `reset()` 。： `preBaselineSummary → DailyStore`（append）， `baselineForQuotaReset`。
  Cached account quota reset path now snapshots data to DailyStore before baselining (same as active account), preventing data loss at midnight `reset()`.

####  / Refactored

- **`PendingArchiveEntry` **:
   `gm/tracker.ts`  `gm/types.ts`， barrel 。`gm/index.ts`  `gm-tracker.ts` 。
  `PendingArchiveEntry` moved from `gm/tracker.ts` to `gm/types.ts` to avoid circular dependency. Export chain updated.

####  / Stats

- **Files changed**: 4 (`src/gm/types.ts`, `src/gm/tracker.ts`, `src/gm/index.ts`, `src/extension.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors

---

### Imported detail: Step API  — 2026-04-21

#### 🗑 Removed /

- **Step API  / Step API Unreliable Data Purge**:
   Activity  Step API 。Step API  ~500 ，，。
  Removed all Step API-based imprecise statistics from both the Activity panel and Calendar panel. Step API step details are limited to a ~500-step window, causing data loss in long conversations.

  **Activity  / Activity Panel**:
  - `buildToolRanking()` —  `globalToolStats` （ + 10  CSS ）
  - `buildDistribution()` —  `modelStats` （ + SVG ）
  - Summary Bar：、、、、  5
  - ：、、、、、、、  8
  -  footer：`toolBreakdown`

  ** / Calendar Panel (`webview-calendar-tab.ts`)**:
  - ：、、 →  GM （）
  -  Grid：、 →  GM
  - ：、、 →  GM
  - ：`buildPerModelRows()` （ GM ）
  - ：`mergedModelHtml`（ GM ）

#### ✨ Added /

- **GM  / GM Retry Stats**:
  Summary Bar ， `gm.totalRetryCount`（GM ），tooltip  token （`gm.totalRetryTokens`）。，。
  New red retry stat card showing `gm.totalRetryCount` with GM badge. Tooltip includes wasted token count.

#### 🎨 Styles /

- **Dashboard Grid  / Dashboard Grid Layout**:
  Summary Bar  `flex-wrap`  CSS Grid (`auto-fill, minmax(85px, 1fr)`) ：1px ，`outline` （ `overflow: hidden`  tooltip），hover 。
  Summary Bar upgraded from loose flex-wrap cards to CSS Grid unified panel with 1px gap grid lines and outline-based rounded corners.

- **Tooltip  / Tooltip Edge Anchoring**:
  ； (`max-width: 220px`)；`:first-child` 、`:last-child` ， webview 。

- ** / Model Card Headers**:
   Step API `actualSteps+estSteps`  GM `callCount`，GM 。

#### 📊 Stats /

- **Files changed**: 3 (`src/activity-panel.ts`, `src/webview-calendar-tab.ts`, `docs/project_structure.md`)
- **Net change**: +57, −194 (net −137)
- **TypeScript compile**: Zero errors
- **Key decision**:  GM ，Step API

---

### Imported detail: QuotaTracker  — 2026-04-21

#### 🏗 Refactored /

- **QuotaTracker  / Usage Detection Overhaul**:
   instant detect（ `knownWindowMs` ） observation window（10  resetTime ）， `remainingFraction` 20%  session。 GMTracker ： `usedModelIds`  LLM  ID ，frac=1.0 。 `ELAPSED_THRESHOLD_MS`  `OBSERVATION_WINDOW_MS`。
  Removed unreliable instant detect (elapsed time inference from `knownWindowMs`) and observation window (10-min resetTime stability check) strategies — both produced ghost sessions under 20% quantization. Replaced with GMTracker-assisted detection via new `usedModelIds` parameter. Removed unused `ELAPSED_THRESHOLD_MS` and `OBSERVATION_WINDOW_MS` constants.

- **QuotaTracker  / Per-Account State Isolation**:
  `modelStates` key  `modelId`  `email:modelId`，—— Map ，。（ `:` ） key  Map ，。
  `modelStates` key changed from `modelId` to `email:modelId`. Each account's tracking state is fully independent — switching accounts freezes the old state in the map without overwriting, resuming when switching back.

- ** `buildUsedModelIds()` / Shared Helper**:
   `updateAccountSnapshot()`  GMTracker 。 `accountEmail` 、 `model` (model ID) ， account snapshot  QuotaTracker 。
  Extracted duplicated GMTracker call filtering logic into a shared function, used by both account snapshot `hasUsage` detection and QuotaTracker early tracking entry.

#### ✨ Added /

- **QuotaSession  / Session Account Attribution**:
  `QuotaSession`  `accountEmail?: string` ， session 。

- ** / Tracking Card Account Badge**:
  （`webview-history-tab.ts`）（`webview-monitor-tab.ts`） session  badge， SVG ，（ `moonwolf200202`），。
  Both the Quota Tracking tab and Monitor tab session cards now show a blue account badge with user SVG icon displaying the email prefix.

#### ✨ Improved /

- ** / Tracking Description Update**:
  "100%  resetTime （ 10 ）""100%  GMTracker "，。

#### 📊 Stats /

- **Files changed**: 4 (`src/extension.ts`, `src/quota-tracker.ts`, `src/webview-history-tab.ts`, `src/webview-monitor-tab.ts`)
- **Docs updated**: 1 (`docs/project_structure.md`)
- **TypeScript compile**: Zero errors
- **Key architectural decision**: GMTracker call records as the definitive usage signal at frac=1.0, replacing unreliable time-based heuristics

---

### Imported detail:  — 2026-04-21

#### ✨ Added /

- ** / Quota-Cycle Baselining**:
   `baselineForQuotaReset(targetEmail?)` ， GM （`_archivedCallIds` + `_archivedModelCutoffs`）， `PendingArchiveEntry`，、token、credits  per-model 。`getPendingArchives()`  UI 。
  New `baselineForQuotaReset(targetEmail?)` marks current cycle's GM calls as archived by account, generating `PendingArchiveEntry` with per-model stats. `getPendingArchives()` exposes the pending list for UI rendering.

- ** / Pending Archive Panel**:
   GM Data 。、/ token、credits  per-model 。，"、"。
  New amber-themed pending archive panel below the account status cards. Shows baselined cycle stats with per-model chip breakdown. Only visible after a quota reset triggers baselining.

- ** / Cached Account Removal**:
  （）（X），。。
  Cached account cards now have a delete button (X) on the right side. Active account cards use invisible spacers for alignment.

- ** / Idle Pool Detection**:
  `updateAccountSnapshot()`  `hasUsage` （`remainingFraction < 1.0`）。「」，。
  `updateAccountSnapshot()` now tracks `hasUsage` per pool. Unused pools display a dimmed "Idle" label instead of a misleading countdown.

- ** GM  / Per-Account GM Filtering**:
  `_buildSummary()`  `accountFilteredCalls` ， `totalCalls` / `modelBreakdown` / `totalCredits` 。`conversations[]` ，。
  `_buildSummary()` now filters calls by `_currentAccountEmail` for global stats while keeping `conversations[]` unfiltered for cross-account breakdown tags.

#### 🏗 Improved /

- ** / Automatic Pre-Reset Snapshot**:
  ，`onQuotaReset`  GM+Activity  `append`  DailyStore，。。
  Active account quota resets now snapshot current data to DailyStore (append mode) before baselining, preventing data loss across quota cycles.

- ** / Cached Account Auto-Baselining**:
  `checkCachedAccountResets()` ， `baselineForQuotaReset(email)` ，。
  Cached account quota expiry now automatically baselines that account's calls, preventing duplicate counts when switching back.

- **DailyStore  / DailyStore Append Mode**:
  `addDailySnapshot()`  `append` 。`append=true` ，。`performDailyArchival`  append ，。
  `addDailySnapshot()` now supports `append` mode. Both quota-reset pre-snapshots and midnight archival use append, preserving multiple cycles per day.

- ** / Storage Cleanup**:
  `_callAccountMap`（→） `reset()` ， 3 。
  `_callAccountMap` is now cleared on `reset()`, preventing unbounded growth from historical call-to-account mappings.

#### 📊 Stats /

- **Files changed**: 9 (`src/gm/tracker.ts`, `src/gm/index.ts`, `src/gm-tracker.ts`, `src/extension.ts`, `src/daily-store.ts`, `src/daily-archival.ts`, `src/activity-panel.ts`, `src/webview-panel.ts`, `src/webview-script.ts`)
- **Net change**: +398 lines, −18 lines
- **TypeScript compile**: Zero errors

---

### Imported detail:  — 2026-04-20

#### ✨ Added /

- ** / Cross-Account Quota Isolation**:
   GM 。 LLM  `_callAccountMap`（`cascadeId:index → email` ）， re-fetch  VS Code 。
  Full multi-account GM call attribution and isolation. Each LLM call is permanently mapped to its originating account via `_callAccountMap` (`cascadeId:index → email`), surviving re-fetches and VS Code restarts.

- ** / Account Switch Guard**:
  `handleAccountSwitchIfNeeded()`  `fetchFullUserStatus` （、、LS PID ）， `quotaTracker`  `resetTime` 。
  `handleAccountSwitchIfNeeded()` detects account switches at all three `fetchFullUserStatus` entry points, immediately reseting `quotaTracker` to prevent stale `resetTime` from triggering false archival.

- ** / Zero-Usage Archive Guard**:
  `onQuotaReset`  GM  + Activity ，。
  `onQuotaReset` verifies current account's GM calls + activity steps are both zero before archiving, preventing empty archives on account switches.

- ** / Calendar Account Tags**:
  `DailyCycleEntry`  `accountEmail` ，`addCycle()`  `extension.ts` 。 `.cal-account-tag` ，/。
  `DailyCycleEntry` now includes `accountEmail`. Calendar cycle cards show purple account tags at the end of the header line.

- ** / Model Card Account Breakdown**:
   footer ， `accountEmail` ，。
  Model stat card footers show vertical purple pill tags grouped by account email with full prefix display.

#### 🗑 Removed /

- ** / Redundant Model Tags**:
  「」「」 footer 「 N」「ANTHROPIC VERTEX」 API provider ，。
  Removed "Exact Calls", "Alias Only" rows and API provider / alias count tags from model card footers.

#### 🔧 Fixed /

- ** / Dev Simulate Reset Missing Account Tag**:
  `devSimulateReset`  `dailyStore.addCycle()`  `currentAccountEmail`，。
  Fixed `devSimulateReset` not passing `currentAccountEmail` to `dailyStore.addCycle()`.

---

### Imported detail:  — 2026-04-20

#### 🏗 Refactored /

- ** / Daily Archival Architecture**:
  「」「」。 `onQuotaReset` ，， Tracker。
  Replaced the complex per-pool quota-reset callback archival with a streamlined daily date-based archival. The system no longer depends on `onQuotaReset` for per-pool archiving; instead, it detects local date changes on each poll and automatically archives the previous day's data with a global tracker reset.

  ** / Architecture changes**:

  |  / Component |  / Change |
  |---|---|
  | `daily-archival.ts` | **** — ， `DailyArchivalContext` ， `now`  |
  | `extension.ts` | `performDailyArchival()` ；`onQuotaReset`  |
  | `daily-store.ts` |  `addDailySnapshot()` ； `importArchives()`  `backfilled`  |
  | `activity/tracker.ts` | `archiveAndReset()` （-145 ）， |
  | `gm/tracker.ts` | `reset()`  per-pool （-26 ）， |
  | `gm/summary.ts` | `filterGMSummaryByModels()`  `accountEmail`  |

  ** / Trigger rules**:
  - ：，
  - ：
  - （ 23:59→00:00）：， Tracker
  - Force ：（dev ）
  - ： DailyStore ，

#### ✨ Improved /

- ** UI  / Calendar UI Simplification**:
   cycle （`<details>` + ），。 `cycleCount > 2`  `totalCost > 0.5`。
  Removed multi-cycle collapsible details; each day now shows a single aggregated snapshot. High-activity highlight changed from cycle count to cost threshold.

- **Settings  / Settings Copy Update**:
  「」→「」；「」→「」；。
  "Simulate Quota Reset" → "Simulate Daily Archival"; "Quota Resets" → "Archival Days"; all description copy updated.

- ** / Storage Diagnostics Fix**:
  `quotaResetCount`  `lastArchives.length`  `lastDailyStore.totalDays`。
  Fixed `quotaResetCount` data source from archive count to daily store day count.

#### 🗑 Removed /

- ** / Per-Pool Archival Logic**:
   `ActivityTracker.getCurrentStepCountForModels()`、`archiveAndReset()`  modelIds 、`GMTracker.reset()`  modelIds 、`filterGMSummaryByModels()`  accountEmail 。
  Removed pool-scoped archival methods and parameters that are no longer needed.

- ** barrel export**:
   `activity/index.ts`  `activity-tracker.ts`  `sameTriggeredByScope` 。
  Removed unused `sameTriggeredByScope` export from barrel files.

- **`daily-archival-refactor-plan.md`**: ，。

#### 🧪 Tests /

- **`daily-archival.test.ts`**:  13  `toLocalDateKey`（、、） `performDailyArchival`（、、、、、force、、23:59→00:00 、 DailyStore ）。
  13 new test cases covering date formatting, rollover detection, midnight boundary, force mode, and error resilience.

- **`daily-store.test.ts`**:  `addDailySnapshot` （5 ：、 GM、 addCycle 、、clear）。
  Rewritten with 5 test cases for `addDailySnapshot`.

- **`activity-tracker.test.ts`**:  `archiveAndReset()` ， modelIds 。

#### 📊 Stats /

- **Files changed**: 11 (`src/daily-archival.ts` [new], `src/extension.ts`, `src/daily-store.ts`, `src/activity/tracker.ts`, `src/gm/tracker.ts`, `src/gm/summary.ts`, `src/webview-calendar-tab.ts`, `src/webview-settings-tab.ts`, `src/webview-panel.ts`, `src/activity/index.ts`, `src/activity-tracker.ts`)
- **TypeScript compile**: Zero errors
- **Key architectural decision**: Daily time-based archival replaces event-driven per-pool archival; testability achieved through dependency injection and injectable time

---

### Imported detail:  — 2026-04-20

#### ✨ Added /

- **Multi-Account Status Panel / **:
   GM Data 。 `fetchFullUserStatus` ， `email` + `ModelConfig.quotaInfo.resetTime` ， email  `Map<email, AccountSnapshot>`  `state-v1.json`。，「」，「」。
  New multi-account status panel at the top of the GM Data tab. On each successful `fetchFullUserStatus`, the current account's snapshot is upserted into a `Map<email, AccountSnapshot>` and persisted to `state-v1.json`. When switching accounts, the previous account remains as "cached" while the new one is marked "active".

  |  / Field |  / Description |
  |---|---|
  |  / Active indicator |  = ； =  |
  | Plan  / Plan badge | Pro () / Ultra () / Team () / Free () |
  |  / Per-pool countdown | ， |
  |  / Expiry label | 「」 |
  |  / Warning |  < 30  |

- **Per-Pool Model Countdown / **:
   `ResetPool` ， `resetTime` + `modelLabels[]`。，。：Claude + GPT ，Gemini Pro ，Gemini Flash ——。
  New `ResetPool` type with `resetTime` + `modelLabels[]`. Each account card shows per-pool rows with model chips and independent countdowns. Models sharing the same `quotaInfo.resetTime` are automatically grouped into one pool — no hardcoded rules.

- **Cached Account Reset Notification / **:
   `checkCachedAccountResets()`，。 VS Code ：`✅ Night Min: Claude 3.5 Sonnet, GPT-4o ，。` 「」。 `email:resetTime` ，，。
  New `checkCachedAccountResets()` checks all cached accounts' quota pools on every poll cycle. When a pool expires, a one-time VS Code notification prompts the user to switch accounts. Deduplication via `email:resetTime` key ensures no spam.

#### 🏗 Technical /

- **Data Flow / **:
  ```
  fetchFullUserStatus() → userInfo.email + configs[].quotaInfo.resetTime
    → updateAccountSnapshot()
      → poolMap: Map<resetTime, modelLabels[]>
      → AccountSnapshot { email, name, planName, resetPools, isActive, lastSeen }
      → persistAccountSnapshots() → durableFileGlobalState → state-v1.json
    → PanelPayload.accountSnapshots → buildGMDataTabContent()
      → buildAccountStatusPanel() → per-pool HTML with countdowns
  ```

- **New Types / ** (`activity-panel.ts`):
  - `ResetPool { resetTime: string; modelLabels: string[] }`
  - `AccountSnapshot { email, name, planName, tierName, earliestResetTime, allResetTimes, resetPools, isActive, lastSeen }`

- **Persistence Key / **: `durableFileGlobalState → 'accountSnapshots'` (Array\<AccountSnapshot\>)

#### 🎨 Styles /

- **Account Status Panel CSS / **:
  - `.acct-panel` / `.acct-panel-header` —  +
  - `.acct-card` — （flex ，hover ）
  - `.acct-indicator-active` —  (`@keyframes acctPulse`)
  - `.acct-indicator-cached` —
  - `.acct-plan-pro/free/ultra/team` — Plan  4
  - `.acct-pools` / `.acct-pool-row` / `.acct-pool-model` —  +
  - `.acct-reset-countdown-warn` —  (<30min)
  - `.acct-reset-countdown-expired` —  ()

#### 📊 Stats /

- **Files changed**: 3 (`src/extension.ts`, `src/activity-panel.ts`, `src/webview-panel.ts`)
- **Docs updated**: 2 (`docs/project_structure.md`, `CHANGELOG-v2.md`)
- **TypeScript compile**: Zero errors
- **Net change**: ~280 lines added (types + snapshot management + UI + CSS + notification)
- **No settings required**: Account reset notifications work automatically with zero configuration

---

### Imported detail:  — 2026-04-20

#### 🏗 Refactored /

- **Lossy Persistence — Slim-on-Write Architecture /  — **:
  Implemented a "slim-on-write" strategy that strips heavy, redundant metadata from GM and Activity data **only** at the serialization boundary (before writing to disk). Runtime memory remains fully intact — all stripped fields are dynamically re-fetched from the LS API on next poll cycle.
  ""：（） GM  Activity 。—— poll  LS API 。

  **State file size reduction / **:
  - Before: ~245 MB (6670+ GM calls with full chat history, prompts, tool lists, token trees)
  - After: ~1 MB (structural stats only: token counts, credits, timestamps, step indices)

  **Layer 1 — GM Summary Slim / GM ** (`gm/types.ts`):
  Three new persistence helpers strip heavy fields from `GMCallEntry` and `GMSummary`:

  | Function | Strips |
  |----------|--------|
  | `slimCallForPersistence()` | `promptSnippet`, `aiSnippetsByStep`, `checkpointSummaries`, `systemPromptSnippet`, `userMessageAnchors.text`, `tokenBreakdownGroups`, `tools`, `retryErrors` |
  | `slimSummaryForPersistence()` | Applies `slimCallForPersistence()` to all calls in all conversations |
  | `slimConversationForPersistence()` | Applies to a single conversation's calls |

  **Layer 2 — Activity Timeline Slim / ** (`activity/helpers.ts`):

  | Function | Strips |
  |----------|--------|
  | `slimStepEventForPersistence()` | `fullUserInput`, `fullAiResponse`, `gmPromptSnippet`, `browserSub`; truncates `userInput`/`aiResponse`/`detail` to 40/60/80 chars |

  Applied in `ActivityTracker.serialize()` to both `summary.recentSteps` and all `archives[].recentSteps`.

  **Persistence Points Updated / **:
  - `extension.ts`: Centralized all 5 `gmDetailedSummary` writes into `persistGMSummaryToFile()` helper
  - `monitor-store.ts`: GM conversations slimmed via `slimConversationForPersistence()` before workspace state write
  - `activity/tracker.ts`: `serialize()` applies `slimStepEventForPersistence()` to all timeline events and archives

#### ✨ Improved /

- **Settings Storage Diagnostics Redesign / **:
  Replaced 11 confusing internal metrics (Monitor Sessions, GM Snapshots, GM Conversations, Quota History, Price Overrides, Open Warn At...) with 9 user-meaningful stats:
   11  9 ：

  | Stat | Description |
  |------|-------------|
  | File Size /  | Current state file size |
  | GM Calls (Cycle) / GM  () | LLM invocations in current quota period |
  | Input Tokens /  Tokens | Total input tokens this cycle |
  | Output Tokens /  Tokens | Total output tokens this cycle |
  | Credits Used /  | Credits consumed this cycle |
  | Est. Total Cost /  | All-time cost: archived cycles (dailyStore) + current cycle (pricingStore) |
  | Quota Resets /  | Number of historical quota reset archives |
  | Calendar Days /  | Days with recorded data |
  | Calendar Cycles /  | Total archived quota cycles across all days |

- **All-Time Cost Calculation / **:
  New `computeAllTimeCost()` sums all `estimatedCost` from every archived cycle in `dailyStore` plus the current in-progress cycle's live cost from `pricingStore.calculateCosts()`.
  ： + 。

- **File Stat Error Handling / **:
  Wrapped `fs.statSync()` in try-catch in both `getStorageDiagnostics()` and `refreshLocalStorageDiagnostics()` to prevent crashes when the state file is temporarily locked or inaccessible.
  ，。

#### 🐛 Fixed /

- **Test Fixture Missing Fields / **:
  `activity-tracker.test.ts` fixtures were missing `aiSnippetsByStep` and `checkpointSummaries` fields (added in v1.15.3/v1.15.7), causing `Object.keys(undefined)` crashes in `buildGMVirtualPreview()`. Added empty defaults to all test GM call fixtures.
   v1.15.3/v1.15.7 ， `buildGMVirtualPreview()` 。

#### 🗑 Removed /

- **`webview-settings-tab.test.ts`**: Removed trivial UI snapshot test — the settings tab HTML is simple enough to validate visually.
   UI 。

#### 📊 Stats /

- **Files changed**: 9 (`src/gm/types.ts`, `src/gm/index.ts`, `src/gm-tracker.ts`, `src/extension.ts`, `src/monitor-store.ts`, `src/activity/helpers.ts`, `src/activity/tracker.ts`, `src/webview-settings-tab.ts`, `src/webview-panel.ts`)
- **TypeScript compile**: Zero errors
- **Key architectural decision**: Lossy persistence is safe because all text content is re-fetched from API within 5 seconds of startup; only structural/statistical data needs to survive restarts

---

### Imported detail:  — 2026-04-18

#### ✨ Added /

- **Context Checkpoint Viewer / **:
  New collapsible card section in the GM Data tab that renders the full content of system-injected `{{ CHECKPOINT N }}` compression summaries. Users can now read exactly what the AI "remembers" after context compression — making the previously opaque truncation process fully transparent.
   GM ， `{{ CHECKPOINT N }}` 。 AI ""，。

  **Data Pipeline / **:
  ```
  GetCascadeTrajectory → embedded GM → messagePrompts
    → extractCheckpointSummaries() → GMCheckpointSummary[]
    → maybeEnrichCallsFromTrajectory() broadcasts to all calls
    → deduplicateCheckpoints() per conversation
    → buildCheckpointViewer() renders active conversation only
  ```

- **`GMCheckpointSummary` Type / **:
  New interface with `checkpointNumber`, `stepIndex`, `tokens`, and `fullText` fields, integrated into `GMCallEntry` and `GMConversationData`.
  ，、、token ， GM 。

#### ✨ Improved /

- **Active Conversation Detection / **:
  Checkpoint viewer identifies the currently active conversation by finding the one with the most recent `createdAt` timestamp on its calls, rather than the highest step count. This ensures the viewer always displays checkpoints for the *running* conversation, not a historical one.
   `createdAt` ，，**。

- **Enrichment Trigger on Checkpoint / **:
  `shouldEnrichConversation()` now triggers full trajectory fetch when `checkpointIndex > 0` is detected, ensuring compressed conversations automatically receive their checkpoint summaries.
   `checkpointIndex > 0` ，。

- **Scroll State Preservation / **:
  Added `.cp-viewer` and `.cp-card-body` to the incremental refresh scroll-preservation system, preventing loss of reading position when the panel auto-refreshes.
  ，。

- **Badge Shows Compression Count / **:
  Section badge displays `#N` (the checkpoint number) instead of card count, so users can see total compression count at a glance.
   `#N`（），。

#### 🎨 Styles /

- **Checkpoint Viewer CSS / **:
  - `.cp-viewer` — amber-bordered scrollable container (max-height 400px) with thin custom scrollbar
  - `.cp-card` — collapsible `<details>` card with amber border, hover highlight
  - `.cp-card-header` — flex row with `📋 #N`, step/token chips
  - `.cp-card-body` — scrollable body (max-height 280px) with Markdown-like rendering (headings, bold, code)
  - `.cp-card-chip-step`, `.cp-card-chip-tok` — metadata chips (gray/amber)

#### 🔬 Verified /

- **Checkpoint Persistence Behavior**: Deep diagnostic script confirmed that the API (`GetCascadeTrajectory`) only retains `messagePrompts` on the **latest** GM entry. Older CHECKPOINT texts (1,2,3...) are absorbed into each subsequent compression — only the newest survives. This is by design, not a data loss bug.
   API  GM  `messagePrompts`。 CHECKPOINT ，——，。

#### 📊 Stats /

- **Files changed**: 8 (`src/gm/types.ts`, `src/gm/parser.ts`, `src/gm/tracker.ts`, `src/gm/summary.ts`, `src/gm/index.ts`, `src/gm-tracker.ts`, `src/activity-panel.ts`, `src/webview-script.ts`)
- **TypeScript compile**: Zero errors
- **Net change**: +291 lines (data pipeline + UI + CSS)
- **Key discovery**: `messagePrompts` exists only on the last GM entry; `checkpointIndex` distribution records compression history

---

### Imported detail: Timeline  — 2026-04-18

#### 🏗 Refactored /

- **Timeline Unification — GM-Only Truth /  — GM **:
  Replaced the dual Steps+GM event system with a single GM-driven timeline. All GM calls now generate virtual events covering the full conversation, not just the window-outside range. Steps API events with `stepIndex ≤ maxGMStep` are range-suppressed, eliminating all duplicates.
   GM  Steps+GM 。 GM ， `stepIndex ≤ maxGMStep`  step-source 。

- **Right-Aligned Chip System — Two-Group Layout /  — **:
  Split right-side metadata into two independent flex containers:
   flex ：

  | Group | CSS Class | Content | Alignment |
  |-------|-----------|---------|-----------|
  | **statusParts** | `.act-tl-gm-status` | retry, tools, TTFT, duration | ， |
  | **tokenParts** | `.act-tl-gm` | , , , ,  | ， |

  **statusParts order** (right→left): `duration → TTFT → 🔧tools → retry`
  **tokenParts order** (fixed): `Ctx → input → output → cache → credits`

  This ensures token columns stay vertically aligned across all rows, regardless of whether retry/tools/TTFT are present.
   token ， retry//TTFT 。

#### ✨ Improved /

- **Context Chip Regrouped / **:
  Moved ` 138k` from `buildMetaTags` (separated, misaligned) into `tokenParts` as the first element (purple `.act-tl-gm-ctx` chip). Now vertically aligned with other token data.
   chip  `buildMetaTags`（） `tokenParts` 。

- **TTFT Labeled / TTFT **:
  Changed ambiguous `2.5s` to `TTFT 2.5s` to distinguish from step duration.
   `2.5s`  `TTFT 2.5s`，。

- **Retry Format / **:
  Changed cryptic `r1` to human-readable `retry(1)` / `retry(1)⚠429`. Orange color for 429, red for other errors.
   `r1`  `retry(1)` / `retry(1)⚠429`，429 ，。

- **Turn Header Enhanced / **:
  - Tools: `🔧N` count → `🔧16 ` (accumulated from all calls)
  - Added summary retry chip: `retry(5)⚠429`
  - Tokens split: `15.2k tok` → `8.5k  / 2.0k `

- **GM-STRUCT/GM-TEXT Tags Removed /  GM **:
  Stripped redundant source tags from timeline rows — GM is now the only source.

#### 🐛 Fixed /

- **Tool Name Extraction Bug / **:
  `buildGMVirtualPreview` was extracting tool names from `aiSnippetsByStep` `🔧` markers, which are **historical tool results in context** (dozens of tool definitions), not the **current call's tool invocations**. Fixed by computing tool count from `stepIndices.length - 1` (non-reasoning steps).
  `buildGMVirtualPreview`  snippet  🔧 ——****（），****。 `stepIndices.length - 1` 。

- **Left-Side Tool Name Duplication / **:
  When detail contained only tool names without `→` prefix, the left-side strip regex failed, showing raw tool names on both left and right. Fixed by always preserving the `→` prefix in `toolSuffix`.
  detail  `→` ， strip 。： `→` 。

- **`gmRetryHas429` Structural Detection /  429 **:
  Added `gmRetryHas429: boolean` to `StepEvent`, populated from `retryErrors` array. Retry badge color now determined by structure, not by scanning detail text.
   `gmRetryHas429` ， `retryErrors`  429，。

#### 🎨 Styles /

- **New CSS classes /  CSS **:
  - `.act-tl-gm-status` — status chips container (flex, min-width 7em, right-justified)
  - `.act-tl-gm-ctx` — context window chip (purple: `#8b5cf6` light / `#a78bfa` dark)
  - `.act-tl-gm-retry429` — 429 rate-limit retry chip (orange)
  - `.seg-chip-retry` / `.seg-chip-retry429` — turn header retry chips

#### 📊 Stats /

- **Files changed**: 5 (`src/activity-panel.ts`, `src/activity/tracker.ts`, `src/activity/helpers.ts`, `src/activity/types.ts`, `src/webview-styles.ts`)
- **TypeScript compile**: Zero errors
- **Key architectural decision**: GM data as single source of truth; Steps API events serve only as fallback for the latest uncovered steps

---

### Imported detail: GM  — 2026-04-18

#### 🚀 Enhanced /

- **GM-Driven Activity Classification / GM **:
  Replaced the blind `+N steps (estimated)` counters with precise GM-derived category counts.
  Each window-outside GM call is now classified into reasoning / toolCalls / errors / userInputs,
  feeding directly into `ModelActivityStats`. The status bar and activity panel now show real
  numbers instead of zeros for long conversations that exceed the ~500 Steps API window.
   GM " +N "。 GM
  ///， `ModelActivityStats`，。

- **Timeline Retry / 429 Display / /429 **:
  Virtual GM timeline events now show retry and rate-limit information inline:
  `⚠️2×retry(429)` for rate-limited calls, `🔄1×retry` for other retries.
  GM 。

#### 🐛 Fixed /

- **Retry Count Inflation / **:
  `retryInfos` array always includes the successful attempt as its last entry (no error).
  The parser now only counts entries with actual error messages as retries, fixing the bug
  where every GM call showed `retries=1` even without any failures.
  `retryInfos`  entry， entry  retry。

- **Category Counter Inflation / **:
  `_normalizeModelState()` was stripping `categoriesByModel` from `_windowOutsideAttribution`
  on every poll, causing the reconciliation to skip reversal of old categories and add full
  new categories each cycle — inflating reasoning/toolCalls/userInputs indefinitely.
  Fixed by preserving `categoriesByModel` during normalization.
  `_normalizeModelState()`  poll  `categoriesByModel`，。
  ： `categoriesByModel`。

#### 📊 Stats /

- **Files changed**: 3 (`src/gm/parser.ts`, `src/activity/tracker.ts`, `src/extension.ts`)
- **TypeScript compile**: Zero errors
- **Key insight**: `retryInfos` always contains N+1 entries (N failures + 1 success)

---

### Imported detail: GM  — 2026-04-18

#### 🏗 Refactored /

- **GM Module Modularization / GM **:
  Split `gm-tracker.ts` (1728 lines) into 5 focused sub-modules under `src/gm/`:
   `gm-tracker.ts`（1728 ） `src/gm/`  5 ：

  | Module | Lines | Responsibility |
  |--------|:-----:|----------------|
  | `types.ts` | ~210 |  GM  + clone  |
  | `parser.ts` | ~390 |  +  + // |
  | `summary.ts` | ~360 |  +  +  |
  | `tracker.ts` | ~500 | GMTracker  |
  | `index.ts` | ~50 | barrel re-export |

  Original `gm-tracker.ts` reduced to a ~40-line backward-compatible re-export shim.
  All 12 external import sites (`import { ... } from './gm-tracker'`) work unchanged.
   `gm-tracker.ts`  40  re-export，12  import 。

- **Interrupted Call Detection / **:
  GM timeline rows for interrupted/cancelled calls (0 tokens in + 0 tokens out) now show `⚡ ` instead of falling back to user message bubble or generic "GM ".
  / GM  `⚡ `， "GM "。

- **User Message Fallback Removed / **:
  GM rows no longer echo the user's input text as a fallback preview. GM rows should only display AI behavior (responses, tool calls, or status).
  GM ， AI 。

- **Activity Module Modularization / Activity **:
  Split `activity-tracker.ts` (2718 lines) into 3 focused sub-modules under `src/activity/`:
   `activity-tracker.ts`（2718 ） `src/activity/`  3 ：

  | Module | Lines | Responsibility |
  |--------|:-----:|----------------|
  | `types.ts` | ~180 |  Activity  |
  | `helpers.ts` | ~280 | （///） |
  | `tracker.ts` | ~2260 | ActivityTracker  |
  | `index.ts` | ~45 | barrel re-export |

  Original `activity-tracker.ts` reduced to a ~40-line backward-compatible re-export shim.
  All 4 external import sites (`import { ... } from './activity-tracker'`) work unchanged.
   `activity-tracker.ts`  40  re-export，4  import 。

#### 📊 Stats /

- **Files changed**: 4 (`gm-tracker.ts`, `activity-tracker.ts`, `docs/project_structure.md`, `CHANGELOG-v2.md`)
- **Files created**: 9 (`src/gm/{types,parser,summary,tracker,index}.ts`, `src/activity/{types,helpers,tracker,index}.ts`)
- **TypeScript compile**: Zero errors
- **Net LOC**: ~80 (2 re-export shims) replaces ~4446 (2 monoliths) — zero logic change

---

### Imported detail: AI  — 2026-04-18

#### 🔬 Breakthrough /

- **Per-Step AI Response Extraction /  AI **:
  Discovered that `GetCascadeTrajectory` endpoint's embedded GM data contains `messagePrompts` with complete conversation history, where each SYSTEM message carries a `stepIdx` field. Built a `stepIdx → AI snippet` mapping system that enables each GM call to display its **own** AI response text or tool calls, rather than sharing identical previews.
   `GetCascadeTrajectory`  GM  messagePrompts， SYSTEM  `stepIdx` 。 `stepIdx → AI ` ， GM **** AI 。

  **Data Pipeline**:
  ```
  GetCascadeTrajectory → embedded GM → messagePrompts (array[180+])
    → SYSTEM messages with { stepIdx, prompt, toolCalls }
    → extractAISnippetsByStep() → Record<stepIdx, snippet>
    → maybeEnrichCallsFromTrajectory() broadcasts to ALL calls
    → buildGMVirtualPreview() lookups by call.stepIndices
  ```

#### ✨ Improved /

- **GM Timeline Row Previews / GM **:
  - AI text responses now show actual response content (e.g. "OK！", "！v1.15.2...")
  - Tool-call-only steps show `🔧 view_file` instead of generic "GM "
  - Combined steps show text + tool badge: `，...  🔧grep_search`
  - Eliminated duplicate metrics in detail text (tokens/TTFT already shown as right-side chips)

  AI ， `🔧 `，。 detail 。

- **Data Model Upgrade / **:
  `GMCallEntry.lastAISnippet: string` → `GMCallEntry.aiSnippetsByStep: Record<number, string>` — from single shared string to per-step indexed map, solving the "all rows show same text" problem.
  ，""。

#### 🔧 Tools /

- **`gm-live-watcher.ts` v3**: Real-time GM call monitor with dual-endpoint cross-validation (`GetCascadeTrajectoryGeneratorMetadata` vs `GetCascadeTrajectory`). Displays per-call AI response (📝), thinking preview (🧠), and tool invocations (🔧). Key diagnostic tool for validating data pipeline changes.
   GM ，， AI 、。。

#### 📊 Stats /

- **Files changed**: 3 (`gm-tracker.ts`, `activity-tracker.ts`, `diag-scripts/deep-dive/gm-live-watcher.ts`)
- **TypeScript compile**: Zero errors
- **Key discovery**: `GetCascadeTrajectoryGeneratorMetadata` has NO messagePrompts; only `GetCascadeTrajectory` embedded GM has them

---

### Imported detail:  — 2026-04-18

#### ✨ Added /

- **Collapsible Turn Groups in Timeline / **:
  Refactored the "Recent Activity" timeline from a flat segment list into collapsible `<details>` turn groups. Each group is anchored by the user's message and visually titled with a preview of the user input. The latest turn defaults to **open**; historical turns default to **collapsed**, dramatically reducing visual clutter on long conversations.
  "" segment  `<details>` 。，。****，****，。

- **Segment Summary Chips / **:
  Each turn header now shows a row of compact, color-coded chips aggregated from GM data within that turn:
  - 🔵 **Model** — dominant model name (filtered `MODEL_PLACEHOLDER_*`)
  - 🟢 **Calls** — number of reasoning calls
  - 🟡 **Tools** — tool invocation count (`🔧N`)
  - 🔴 **Tokens** — total input + output tokens (e.g. `15.2k tok`)
  - 🟤 **Cache** — cache read tokens
  - 🟠 **Credits** — credit consumption (`0.4 cr`)
  - ⚫ **Duration** — wall-clock span between first and last event (`2m14s`)

   header  GM  chip：、、、Token、、、。

#### ✨ Improved /

- **User Anchor at Bottom / **:
  Within each expanded turn, the user message (turn origin) now renders at the bottom, with the newest AI actions at the top. This matches the visual convention where top = newest, bottom = oldest, making the timeline read naturally from the most recent action downward to the triggering input.
  ，（），AI 。： =  →  = ，。

#### 🗑 Removed /

- **Alias / Placeholder / Basis Tags / **:
  Removed the `Alias ()`, `Summary ()`, `Generator ()`, and `Dominant ()` tags from timeline rows. These were legacy indicators from the era before GM provided exact model identification via `responseModel`. Since GM now reliably returns exact model names, these ambiguous "model basis" labels are no longer needed.
  """"""""。 GM  `responseModel` ， GM ，""。

#### 🎨 Styles /

- **Turn Group CSS / **:
  New `.act-tl-turn` / `.act-tl-turn-header` / `.seg-chip-*` CSS system with:
  - Smooth triangle arrow rotation (90° on open)
  - Green border highlight when expanded (`.act-tl-turn[open]`)
  - Hover background feedback
  - Full light theme (`body.vscode-light`) overrides for all 7 chip variants (`model`, `calls`, `tools`, `tok`, `cache`, `credits`, `dur`)

   CSS ：、、hover ， 7  chip 。

- **Light Theme Fix / **:
  Fixed `seg-chip-dur` (duration) and `seg-chip-credits` being invisible on light backgrounds due to missing `body.vscode-light` overrides. Duration now uses `#334155` (dark slate), credits use `var(--lt-orange-text)`.
   chip ， light theme 。

#### 📊 Stats /

- **Files changed**: 2 (`activity-panel.ts`, `webview-styles.ts`)
- **TypeScript compile**: Zero errors
- **Net change**: ~+100 lines (CSS) / ~+60 lines (render logic) / −30 lines (removed alias tags)
