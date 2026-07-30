// ─── Settings Tab Content Builder ────────────────────────────────────────────
// Builds HTML for the "Settings" tab: threshold, polling, status bar toggles,
// per-model context limit overrides, notification, activity, and panel settings.

import * as vscode from 'vscode';
import { tBi } from './i18n';
import { ModelConfig, getContextLimit } from './models';
import { ICON } from './webview-icons';
import { esc, formatFileSize } from './webview-helpers';



export interface StorageDiagnostics {
    stateFilePath: string;
    stateFileExists: boolean;
    stateFileSizeBytes: number;
    stateFileOpenWarnBytes: number;
    calendarDayCount: number;
}

export interface PanelHintPreferences {
    showTabScrollHint: boolean;
    showScrollbar: boolean;
    showEndOfContent: boolean;
}



// ─── Public API ──────────────────────────────────────────────────────────────

/** Build the Settings tab HTML from current VS Code configuration. */
export function buildSettingsContent(
    configs: ModelConfig[],
    storage?: StorageDiagnostics,
    panelPrefs?: PanelHintPreferences,
): string {
    const cfg = vscode.workspace.getConfiguration('antigravityContextMonitor');

    const pollingInterval = cfg.get<number>('pollingInterval', 5);
    const showContext = cfg.get<boolean>('statusBar.showContext', true);
    const showQuota = cfg.get<boolean>('statusBar.showQuota', true);
    const showResetCountdown = cfg.get<boolean>('statusBar.showResetCountdown', true);
    const showAiCredits = cfg.get<boolean>('statusBar.showAiCredits', true);
    const showModelInternalId = cfg.get<boolean>('showModelInternalId', false);
    const quotaNotifyThreshold = cfg.get<number>('quotaNotificationThreshold', 20);
    const tabScrollHintEnabled = panelPrefs?.showTabScrollHint ?? true;
    const showScrollbar = panelPrefs?.showScrollbar ?? false;
    const showEndOfContent = panelPrefs?.showEndOfContent ?? true;
    const stateFileSizeLabel = storage ? formatFileSize(storage.stateFileSizeBytes) : '0 B';

    const storageCard = storage ? `
        <section class="stg-card" data-accent="storage">
            <div class="stg-header">
                <span class="stg-header-icon">${ICON.database}</span>
                <h2>${tBi('Persistent Storage', '')}</h2>
            </div>
            <p class="raw-desc">${tBi(
        'This file is stored outside the extension state database, so it survives uninstall/reinstall unless you delete it manually.',
        '，，/。',
    )}</p>
            <div class="storage-path-box">
                <code class="storage-path-text">${esc(storage.stateFilePath)}</code>
                <span class="storage-path-state ${storage.stateFileExists ? 'is-ready' : 'is-missing'}">
                    ${storage.stateFileExists ? tBi('Ready', '') : tBi('Missing', '')}
                </span>
            </div>
            <div class="storage-actions">
                <button class="action-btn" id="copyStatePath">${ICON.copy} ${tBi('Copy Path', '')}</button>
                <button class="action-btn" id="openStateFile">${ICON.file} ${tBi('Open File', '')}</button>
                <button class="action-btn" id="revealStateFile">${ICON.folder} ${tBi('Reveal', '')}</button>
                <span id="statePathFeedback" class="threshold-feedback"></span>
            </div>
            <div class="storage-stat-grid">
                <div class="storage-stat"><span class="storage-stat-val">${stateFileSizeLabel}</span><span class="storage-stat-label">${tBi('File Size', '')}</span></div>
                <div class="storage-stat"><span class="storage-stat-val">${storage.calendarDayCount}</span><span class="storage-stat-label">${tBi('Calendar Days', '')}</span></div>
            </div>
        </section>` : '';

    return `
        ${storageCard}



        <section class="stg-card" data-accent="quota">
            <div class="stg-header">
                <span class="stg-header-icon">${ICON.bolt}</span>
                <h2>${tBi('Quota Notification', '')}</h2>
            </div>
            <div class="setting-row">
                <label for="quotaNotifyInput">${tBi(
        'Low quota warning threshold (%)',
        '（%）',
    )}</label>
                <p class="raw-desc">${tBi(
        'Show a warning notification when any model\'s remaining quota drops below this percentage. Set to 0 to disable.',
        '。 0 。',
    )}</p>
                <div class="threshold-input-row">
                    <div class="num-spinner">
                        <button type="button" class="num-spinner-btn decrement">−</button>
                        <input type="number" id="quotaNotifyInput" class="threshold-input"
                               value="${quotaNotifyThreshold}" min="0" max="99" step="5" />
                        <button type="button" class="num-spinner-btn increment">+</button>
                    </div>
                    <button class="action-btn" id="quotaNotifySaveBtn">${tBi('Save', '')}</button>
                    <span id="quotaNotifyFeedback" class="threshold-feedback"></span>
                </div>
            </div>
        </section>

        <section class="stg-card" data-accent="poll">
            <div class="stg-header">
                <span class="stg-header-icon">${ICON.clock}</span>
                <h2>${tBi('Polling', '')}</h2>
            </div>
            <div class="setting-row">
                <label for="pollingInput">${tBi(
        'Polling interval (seconds)',
        '（）',
    )}</label>
                <div class="threshold-input-row">
                    <div class="num-spinner">
                        <button type="button" class="num-spinner-btn decrement" data-target="pollingInput">−</button>
                        <input type="number" id="pollingInput" class="threshold-input"
                               value="${pollingInterval}" min="1" max="60" step="1" />
                        <button type="button" class="num-spinner-btn increment" data-target="pollingInput">+</button>
                    </div>
                    <button class="action-btn" id="pollingSaveBtn">${tBi('Save', '')}</button>
                    <span id="pollingFeedback" class="threshold-feedback"></span>
                </div>
            </div>
        </section>

        <section class="stg-card" data-accent="display">
            <div class="stg-header">
                <span class="stg-header-icon">${ICON.chart}</span>
                <h2>${tBi('Status Bar Display', '')}</h2>
            </div>
            <p class="raw-desc">${tBi(
        'Toggle which elements appear in the status bar.',
        '。',
    )}</p>
            <div class="toggle-group">
                <label class="toggle-row">
                    <input type="checkbox" id="toggleContext" class="toggle-cb" ${showContext ? 'checked' : ''} />
                    <span class="toggle-track"><span class="toggle-thumb"></span></span>
                    <span>${tBi('Context usage', '')} <code>45k/1M, 4.5%</code></span>
                </label>
                <label class="toggle-row">
                    <input type="checkbox" id="toggleQuota" class="toggle-cb" ${showQuota ? 'checked' : ''} />
                    <span class="toggle-track"><span class="toggle-thumb"></span></span>
                    <span>${tBi('Quota indicator', '')} <code>🟢85%</code></span>
                </label>
                <label class="toggle-row">
                    <input type="checkbox" id="toggleCountdown" class="toggle-cb" ${showResetCountdown ? 'checked' : ''} />
                    <span class="toggle-track"><span class="toggle-thumb"></span></span>
                    <span>${tBi('Reset countdown', '')} <code>&#x23F3;4h32m</code></span>
                </label>
                <label class="toggle-row">
                    <input type="checkbox" id="toggleAiCredits" class="toggle-cb" ${showAiCredits ? 'checked' : ''} />
                    <span class="toggle-track"><span class="toggle-thumb"></span></span>
                    <span>${tBi('AI Credits balance', 'AI ')} <code>⚡14,701</code></span>
                </label>
            </div>
        </section>

        <section class="stg-card" data-accent="display">
            <div class="stg-header">
                <span class="stg-header-icon">${ICON.chart}</span>
                <h2>${tBi('Advanced Display', '')}</h2>
            </div>
            <p class="raw-desc">${tBi(
        'Show extra diagnostic information useful for tracking platform-level model changes.',
        '。',
    )}</p>
            <div class="toggle-group">
                <label class="toggle-row">
                    <input type="checkbox" id="toggleModelInternalId" class="toggle-cb" ${showModelInternalId ? 'checked' : ''} />
                    <span class="toggle-track"><span class="toggle-thumb"></span></span>
                    <span>${tBi('Show model internal ID', ' ID')} <code>(M16)</code></span>
                </label>
            </div>
        </section>

        <section class="stg-card" data-accent="zoom">
            <div class="stg-header">
                <span class="stg-header-icon">${ICON.zoom}</span>
                <h2>${tBi('Interface Zoom', '')}</h2>
            </div>
            <p class="raw-desc">${tBi(
        'Scale all content in the panel. Applies to text, icons, and spacing.',
        '。、。',
    )}</p>
            <div class="zoom-control">
                <div class="zoom-presets">
                    <button class="preset-btn zoom-preset" data-zoom="80">80%</button>
                    <button class="preset-btn zoom-preset" data-zoom="90">90%</button>
                    <button class="preset-btn zoom-preset" data-zoom="100">100%</button>
                    <button class="preset-btn zoom-preset" data-zoom="110">110%</button>
                    <button class="preset-btn zoom-preset" data-zoom="120">120%</button>
                    <button class="preset-btn zoom-preset" data-zoom="130">130%</button>
                </div>
                <div class="zoom-slider-row">
                    <input type="range" id="zoomRange" class="zoom-range"
                           min="60" max="150" step="5" value="100" />
                    <span class="zoom-value" id="zoomValue">100%</span>
                </div>
            </div>
        </section>

        <section class="stg-card" data-accent="history">
            <div class="stg-header">
                <span class="stg-header-icon">${ICON.timeline}</span>
                <h2>${tBi('Panel Tips', '')}</h2>
            </div>
            <p class="raw-desc">${tBi(
        'This state only means whether auto-display is enabled. It does not mean the hint is currently visible at the top. Use the button below to show it immediately once.',
        '“”，。，。',
    )}</p>
            <div class="storage-actions">
                <button class="action-btn" id="restoreTabScrollHint">${ICON.refresh} ${tBi('Show Hint Now', '')}</button>
                <span class="storage-path-state ${tabScrollHintEnabled ? 'is-ready' : 'is-missing'}" id="tabHintState">
                    ${tabScrollHintEnabled ? tBi('Auto Hint Enabled', '') : tBi('Auto Hint Disabled', '')}
                </span>
                <span id="panelHintFeedback" class="threshold-feedback"></span>
            </div>
        </section>

        <section class="stg-card" data-accent="display">
            <div class="stg-header">
                <span class="stg-header-icon">${ICON.chart}</span>
                <h2>${tBi('Scrollbar Appearance', '')}</h2>
            </div>
            <p class="raw-desc">${tBi(
        'Control scrollbar visibility and end-of-content indicators across all tabs.',
        '「」。',
    )}</p>
            <div class="toggle-group">
                <label class="toggle-row">
                    <input type="checkbox" id="toggleScrollbar" class="toggle-cb" ${showScrollbar ? 'checked' : ''} />
                    <span class="toggle-track"><span class="toggle-thumb"></span></span>
                    <span>${tBi('Show scrollbar', '')}</span>
                </label>
                <label class="toggle-row">
                    <input type="checkbox" id="toggleEndOfContent" class="toggle-cb" ${showEndOfContent ? 'checked' : ''} />
                    <span class="toggle-track"><span class="toggle-thumb"></span></span>
                    <span>${tBi('Show "end of content" indicator', '「」')}</span>
                </label>
            </div>
        </section>

    `;
}
