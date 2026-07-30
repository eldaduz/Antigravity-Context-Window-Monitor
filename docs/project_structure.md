#

 Antigravity Context Window Monitor 、。

---

##
```text
antigravity-context-monitor/
├── src/                          # TypeScript
│   ├── extension.ts              # ：/、、、
│   ├── daily-archival.ts         # （，）
│   ├── daily-ledger.ts           # （+，，，）
│   ├── discovery.ts              # Language Server （）
│   ├── rpc-client.ts             # Connect-RPC
│   ├── tracker.ts                # Token 、、
│   ├── models.ts                 # 、（）、、、responseModel
│   ├── constants.ts              # （Step 、、）
│   ├── statusbar.ts              #  UI（StatusBarManager， hover 、AI 、|| ）
│   ├── durable-state.ts          # ：JSON  + VS Code state
│   ├── monitor-store.ts          # ： ContextUsage + GM
│   ├── pool-utils.ts             # ： pool key  /  /  quota session
│   ├── quota-tracker.ts          # （per-account  + GMTracker  + ； UI ）
│   ├── reset-time.ts             # （ + ）
│   ├── billing-day.ts            # （DST  helper）
│   ├── activity-tracker.ts       #  re-export shim（， activity/）
│   ├── activity/                 # Activity （ activity-tracker.ts ）
│   │   ├── index.ts              #   barrel re-export
│   │   ├── types.ts              #    Activity
│   │   ├── helpers.ts            #   （////）
│   │   └── tracker.ts            #   ActivityTracker
│   ├── gm-tracker.ts             # GM  re-export shim（， gm/）
│   ├── gm/                       # GM （ gm-tracker.ts ）
│   │   ├── index.ts              #   barrel re-export
│   │   ├── types.ts              #    GM  + clone  +  slim （ modelSource / toolCallsByStep / toolCallCounts / GMSystemContextItem）
│   │   ├── parser.ts             #    +  + // + trajectory  +  +  +  + API
│   │   ├── summary.ts            #    +  + （ toolCallCounts ）
│   │   └── tracker.ts            #   GMTracker （fetch/reset/serialize + live UI summary +  + toolCallCounts  + toolCatalog /）
│   ├── pricing-store.ts          # ： +  + （respOut = output - thinking  double-counting）+ findPricing display name fallback
│   ├── model-dna-store.ts        # ： DNA
│   ├── daily-store.ts            # ： Activity / GM / Cost（）
│   ├── webview-panel.ts          # WebView （8  +  +  dropdown + gmFullSummary ）
│   ├── webview-styles.ts         # WebView  CSS （Design Token ）
│   ├── webview-script.ts         # WebView  JS（、、）
│   ├── webview-helpers.ts        # WebView （、）
│   ├── webview-icons.ts          # WebView  SVG

│   ├── webview-models-tab.ts     # Models  HTML（ +  + ）
│   ├── webview-settings-tab.ts   # Settings  HTML（/ +  + ）
│   ├── webview-profile-tab.ts    # Profile  HTML（ /  /  / AI ）
│   ├── webview-chat-history-tab.ts # Sessions  HTML（ses-*  —  + shortcut  +  + CSS tooltip）
│   ├── activity-panel.ts         # GM Data  HTML（Activity + GM  +  +  + // + respOut ）
│   ├── pricing-panel.ts          # Cost  HTML（cost-*  —  cost tab +  +  +  + ）
│   ├── webview-calendar-tab.ts   # Calendar  HTML
│   ├── webview-about-tab.ts      # About  HTML（Hero +  + GitHub +  +  +  + ， TopBar Chips ）
│   ├── i18n.ts                   # ：、、
│   ├── legacy-migration.ts       #  Antigravity （ state.vscdb + child_process ）
│   └── images/                   # README
├── __mocks__/
│   └── vscode.ts                 # VS Code API mock（Vitest ）
├── tests/                        # Vitest （，）
│   ├── discovery.test.ts         # discovery （ FlorianHuo ）
│   ├── pricing-panel.test.ts     # Cost
│   ├── webview-script.test.ts    # WebView
│   ├── tool-catalog-clear.test.ts #
│   ├── billing-day.test.ts       #  DST
│   ├── extension-selection.test.ts #
│   ├── activity-recent-steps.test.ts #  warm-up
│   ├── daily-archival-time.test.ts #  / stale ledger
│   ├── daily-ledger-date-filter.test.ts # DailyLedger
│   ├── reset-time-turnover.test.ts # resetTime
│   ├── gm-quota-reset-filter.test.ts # GM  cutoff
│   ├── gm-model-capture.test.ts # GM 、trajectory  responseModel
│   ├── gm-summary-change.test.ts  # GM
│   ├── gm-tracker-restore-fetch.test.ts # GM  idle stub
│   ├── i18n-persistence.test.ts  # （ IO ）
│   ├── monitor-store-gm.test.ts  # Sessions  GM
│   └── multi-account-archival.test.ts #
├── docs/
│   ├── technical_implementation.md   #
│   └── project_structure.md          #
├── out/                          # tsc （ git ，.gitignore ）
├── package.json                  # 、、
├── package-lock.json             #  npm （Git/VSIX ）
├── tsconfig.json                 # TypeScript
├── vitest.config.ts              #
├── README.md                     #
├── readme_CN.md                  #
├── CHANGELOG.md                  # （ v1.15.2+ ）
├── CHANGELOG-v2.md               # ，
└── LICENSE                       #
```

---

##

### extension.ts --  +

：、、（ 5s）、（RUNNING  +  RUNNING ）、（ + URI  + ）、、、、。 `gmDetailedSummary`  `GMTracker`， GM ， /  /  / 。，“ / ” return 。

---

### discovery.ts --

 Language Server （macOS/Linux/Windows/WSL/Remote-WSL），。

---

### rpc-client.ts -- RPC

 Connect-RPC ， HTTPS/HTTP 、CSRF 、AbortSignal 。

---

### tracker.ts -- Token  +

、Token 、。CHECKPOINT  token ，； checkpoint  `checkpointModel`  tooltip。：`getAllTrajectories()`、`getContextUsage()`、`fetchFullUserStatus()`。

---

### models.ts --

、（i18n ）、（`ModelConfig`、`UserStatusInfo`）。 `normalizeModelDisplayName()` / `resolveModelId()` / `getQuotaPoolKey()` 。`KNOWN_QUOTA_POOLS`  Gemini Flash + Pro  `gemini` （mid-2026 API ）。`responseModel` ， M132/M133 。

---

### statusbar.ts --  UI

`StatusBarManager`：、、、。tooltip  checkpoint （ `M50`），。

---

### durable-state.ts --

 VS Code state  JSON （`%APPDATA%\Antigravity Context Monitor\state-v1.json`），、、。

---

### monitor-store.ts -- Monitor

 `ContextUsage`  `GMConversationData`， 200 ，。GM  `calls.length`， latest call 、、， Sessions 。

---

### pool-utils.ts --

 pool key ：`expandModelIdsToPool()` / `groupModelIdsByResetPool()` / `findLatestQuotaSessionForPool()`。

---

### quota-tracker.ts --

 per-model （`idle->tracking->(archive)->idle`），per-account ，GMTracker 。 `Quota Tracking` ，、， GM 。

---

### activity-tracker.ts --

：GM-only Timeline（`injectGMData()` ）、、、、、。 `recentSteps` ； warm-up ， `activity.maxRecentSteps` ，。

---

### gm-tracker.ts -- Generator Metadata

 GM API  per-LLM-call ， `GMSummary`。（ `calls`  hydrate  IDLE ， stub ）、、、、。 `chatModel.model` ； GM  `responseModel` ， trajectory  step metadata / planner requestedModel 。UI summary  GM hydrate，； call ID， cutoff。`clearToolCatalog()` ，；full-summary/archival-summary 。

---
### activity-panel.ts -- GM Data

 GM 。：Dashboard Grid 、（）、Timeline（Turn  + ）、（）、、（ + Model DNA ）、、。 `buildAccountStatusPanel()` / `hasAccountReadyPool()` 。

---

### webview-chat-history-tab.ts -- Sessions /

/，、、（/Brain / .pb ）。GM  /  /  `gmSummary`， `monitor-store` 。

---

### pricing-store.ts --

：、、、。， Antigravity 。

---

### model-dna-store.ts --

（`responseModel`、provider、completionConfig ）， `GMSummary`。

---

### pricing-panel.ts -- Cost

 Cost  HTML， `buildModelDNACards()`  Models 。；， custom override。

---

### daily-archival.ts --

， `DailyArchivalContext` 。 Tracker。 `DailyLedger.rollover()`（）， `getArchivalSummary()` + `pendingArchives` 。，、stale ledger 。

---

### daily-ledger.ts --

 LS 。+， `GMTracker.getNewCallsSinceLastRecord()` ，。 resetTime ， resetTime 。：
- `recordCalls(entries)` —  + `dedupKey`
- `settleForQuotaReset(email, poolModels)` —
- `rollover(dateKey)` — ，
- `clearRecordedIdsForConversation(cascadeId)` —  dedup
- `serialize()` / `restore()` —  `globalState`

“”“”，。

---

### daily-store.ts --

 Activity + GM + Cost ， replace （）。 `mergeRecords()` （，）。

---

### webview-calendar-tab.ts -- Calendar

 + （GM /// + ）。

---

### webview-panel.ts -- WebView

：8 、、 dropdown、。；`Quota Tracking` 。

：`webview-models-tab.ts`（Models）、`webview-settings-tab.ts`（Settings）、`webview-profile-tab.ts`（Profile）、`webview-chat-history-tab.ts`（Sessions）、`webview-calendar-tab.ts`（Calendar）、`webview-about-tab.ts`（About）、`webview-script.ts`（ JS）、`webview-styles.ts`（CSS Design Token）、`webview-icons.ts`（SVG ）、`webview-helpers.ts`（）。

---

### i18n.ts --

（//）， `durable-state.ts` 。

---

### legacy-migration.ts --

 Antigravity（pre-2.0） `state.vscdb`（SQLite ）， `child_process` + `node --experimental-sqlite` ，。（Windows/macOS/Linux）。 `legacyMigrationDone` ，。

---

### billing-day.ts --

（DST），（1-31），，。

---

### constants.ts --

 Step 、Token 、、RPC 、。

---


##

（ Node / VS Code ）。

```text
extension.ts ( + )
├── daily-ledger.ts       ← （ +  + ）
├── daily-archival.ts     ← （）
│   ├── activity-tracker.ts
│   ├── gm-tracker.ts
│   ├── daily-ledger.ts   ← rollover()
│   ├── daily-store.ts
│   ├── pricing-store.ts
│   └── model-dna-store.ts
├── durable-state.ts      ←
├── monitor-store.ts      ← Monitor
│   ├── tracker.ts (types)
│   └── gm-tracker.ts (types)
├── pool-utils.ts         ←
├── discovery.ts          ← LS
├── tracker.ts            ← Token  +
│   ├── rpc-client.ts     ← RPC
│   ├── models.ts         ←
│   │   └── i18n.ts       ←
│   └── constants.ts      ←
├── statusbar.ts          ←  UI
│   ├── tracker.ts
│   ├── models.ts
│   └── i18n.ts
├── i18n.ts               ←  /
├── quota-tracker.ts      ←
├── activity-tracker.ts   ←
│   ├── gm-tracker.ts (types)
│   ├── rpc-client.ts
│   ├── discovery.ts (LSInfo type)
│   ├── models.ts
│   └── i18n.ts
├── gm-tracker.ts         ← GM
│   ├── rpc-client.ts
│   ├── discovery.ts (LSInfo type)
│   └── models.ts
├── pricing-store.ts      ←
│   └── gm-tracker.ts (types)
├── model-dna-store.ts    ←
│   ├── models.ts
│   └── gm-tracker.ts (types)
├── daily-store.ts        ←
│   ├── activity-tracker.ts (types)
│   └── gm-tracker.ts (types)
└── webview-panel.ts      ← WebView
    ├── i18n.ts
    ├── tracker.ts (types)
    ├── models.ts
    ├── activity-tracker.ts
    ├── gm-tracker.ts
    ├── pricing-store.ts
    ├── model-dna-store.ts (types)
    ├── daily-store.ts
    ├── webview-models-tab.ts
    ├── webview-profile-tab.ts
    ├── webview-settings-tab.ts
    ├── webview-chat-history-tab.ts
    ├── activity-panel.ts
    ├── pricing-panel.ts
    ├── webview-calendar-tab.ts
    ├── webview-script.ts
    ├── webview-styles.ts
    ├── webview-icons.ts
    └── webview-helpers.ts
```

---

##

```text
Antigravity Language Server (localhost)
        │
        │ Connect-RPC (HTTPS/HTTP + CSRF token)
        ▼
    rpc-client.ts ────► tracker.ts ────► extension.ts ()
        │                                     │
        │             ┌───────────────┬───────┬───────────────┬────────────────┐
        │             ▼               ▼       ▼               ▼                ▼
        │    activity-tracker.ts  monitor-store.ts  quota-tracker.ts  gm-tracker.ts  model-dna-store.ts
        │             │               │       │               │                │
        │             │               │       │          pricing-store.ts      │
        │             │               │       │               │                │
        │             └───────────────┴───────┴───────────────┘                │
        │                             │                                        │
        │                   daily-archival.ts ()                       │
        │                             │                                        │
        │                             ▼                                        │
        │                      daily-store.ts ()                       │
        │                                                                      │
        │    activity-panel.ts ◄─────────────────── pricing-panel.ts           │
        │             │                                                        │
        │    webview-chat-history-tab.ts ◄─── trajectories + GM conversations  │
        │             │
        ▼             ▼
    statusbar.ts   webview-panel.ts
        │             │
        │             ▼
        │        durable-state.ts
        │        (external JSON file)
        ▼
    VS Code
    Status Bar
```

---

##

```bash
#
npm run compile

#
npm test
npm run test:watch

#
npx vsce package --no-dependencies
```

：VS Code  `Ctrl+Shift+P` → `Extensions: Install from VSIX...` →  `.vsix`  → 。

 `tests/`， Vitest ， VSIX 。
