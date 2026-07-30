// ─── Profile Tab Content Builder ─────────────────────────────────────────────
// Builds HTML for the "Profile" tab: Account info, plan limits,
// and feature/team config. Model-specific content is rendered in Models tab.

import { tBi } from './i18n';
import { ModelConfig, UserStatusInfo, getContextLimit } from './models';
import { formatResetAbsolute, formatResetCountdown } from './reset-time';
import { ICON } from './webview-icons';
import { esc } from './webview-helpers';
import { getDaysUntilBillingDay } from './billing-day';
import { collapseModelQuotas, getResetHorizon } from './quota-families';

function formatCreditTypeLabel(creditType: string): string {
    const key = creditType.replace('CREDIT_TYPE_', '');
    const labelMap: Record<string, [string, string]> = {
        PROMPT: ['Prompt Credits', 'Prompt '],
        FLOW: ['Flow Credits', 'Flow '],
        GOOGLE_AI: ['Google AI Credits', 'Google AI '],
        GOOGLE_AI_STUDIO: ['Google AI Studio Credits', 'Google AI Studio '],
    };
    const mapped = labelMap[key];
    return mapped ? tBi(mapped[0], mapped[1]) : key.replace(/_/g, ' ');
}


// ─── Public API ──────────────────────────────────────────────────────────────

/** Build the complete Profile tab HTML. */
export function buildProfileContent(
    userInfo: UserStatusInfo | null,
    configs: ModelConfig[],
    billingDay?: number,
): string {
    if (!userInfo) {
        return `
            <section class="card empty">
                <h2>${ICON.user} ${tBi('Profile', '')}</h2>
                <p class="empty-desc">${tBi(
            'Waiting for user data from LS...',
            ' LS ...',
        )}</p>
            </section>`;
    }

    return [
        buildAccountSection(userInfo, billingDay),
        buildLimitsSection(userInfo),
        buildFeatureAndTeamGrid(userInfo),
    ].join('');
}

// ─── Model Sort ──────────────────────────────────────────────────────────────

export function sortModels(configs: ModelConfig[], sortOrder: string[]): ModelConfig[] {
    if (!sortOrder || sortOrder.length === 0) { return configs; }
    const orderMap = new Map(sortOrder.map((label, i) => [label, i]));
    return [...configs].sort((a, b) => {
        const aIdx = orderMap.get(a.label) ?? 999;
        const bIdx = orderMap.get(b.label) ?? 999;
        return aIdx - bIdx;
    });
}

// ─── Section Builders ────────────────────────────────────────────────────────

function buildAccountSection(userInfo: UserStatusInfo, billingDay?: number): string {
    const tierMap: Record<string, { bg: string; color: string }> = {
        'TEAMS_TIER_FREE': { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
        'TEAMS_TIER_PRO': { bg: 'rgba(74,222,128,0.15)', color: 'var(--color-ok)' },
        'TEAMS_TIER_TEAMS': { bg: 'rgba(96,165,250,0.15)', color: 'var(--color-info)' },
        'TEAMS_TIER_ENTERPRISE_SAAS': { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
        'TEAMS_TIER_PRO_ULTIMATE': { bg: 'rgba(250,204,21,0.15)', color: 'var(--color-warn)' },
    };
    const tier = tierMap[userInfo.teamsTier] || tierMap['TEAMS_TIER_PRO'];
    const maskedEmail = userInfo.email.replace(/^(.{2}).*(@.*)$/, '$1****$2');

    const promptPct = userInfo.monthlyPromptCredits > 0
        ? Math.round((userInfo.availablePromptCredits / userInfo.monthlyPromptCredits) * 100) : 0;
    const flowPct = userInfo.monthlyFlowCredits > 0
        ? Math.round((userInfo.availableFlowCredits / userInfo.monthlyFlowCredits) * 100) : 0;
    const promptBarColor = promptPct <= 10 ? 'var(--color-danger)' : promptPct <= 30 ? 'var(--color-warn)' : 'var(--color-ok)';
    const flowBarColor = flowPct <= 10 ? 'var(--color-danger)' : flowPct <= 30 ? 'var(--color-warn)' : 'var(--color-info)';

    // Subscription hint
    const subHint = userInfo.upgradeSubscriptionText
        ? `<div class="subscription-hint">${esc(userInfo.upgradeSubscriptionText)}</div>` : '';

    // Google AI Credits inline with refresh countdown
    const validCredits = userInfo.availableCredits.filter(c => c.creditAmount > 0);
    const day = billingDay || 0;
    let refreshBadge = '';
    if (day >= 1 && day <= 31) {
        const daysLeft = getDaysUntilBillingDay(day) ?? 0;
        const activityLink = ` <a class="gai-action-link" href="https://antigravity.google/g1-activity" target="_blank">${tBi('Activity Dashboard', '')}</a>`;
        if (daysLeft === 0) {
            refreshBadge = `<span class="gai-refresh-badge gai-refresh-today">${tBi('Expires today', '')}</span>` + activityLink;
        } else {
            refreshBadge = `<span class="gai-refresh-badge">${daysLeft}${tBi('d until expiry', '')}</span>` + activityLink;
        }
    } else {
        refreshBadge = `<span class="gai-refresh-badge gai-refresh-unset">${tBi('Expiry date not set', '')}</span>`
            + ` <a class="gai-action-link" data-scroll-to="profileBillingDayInput">${tBi('Set below', '')}</a>`
            + ` <a class="gai-action-link" href="https://antigravity.google/g1-activity" target="_blank">${tBi('Activity Dashboard', '')}</a>`;
    }

    let creditsHtml = '';
    if (validCredits.length > 0) {
        creditsHtml = `<div class="gai-credits">${validCredits.map(c => {
            const typeName = formatCreditTypeLabel(c.creditType);
            return `<div class="gai-credit-item">
                        <span class="gai-label">${esc(typeName)}</span>
                        <span class="gai-value">${c.creditAmount.toLocaleString()}</span>
                    </div>`;
        }).join('')}<div class="gai-credit-item gai-credit-refresh">${refreshBadge}</div></div>`;
    } else if (refreshBadge) {
        // No credits but billing day or "not set" info still relevant
        creditsHtml = `<div class="gai-credits gai-credits-empty">
            <div class="gai-credit-item">
                <span class="gai-label">${tBi('AI Credits', 'AI ')}</span>
                <span class="gai-value" style="color:var(--color-text-dim)">0</span>
            </div>
            <div class="gai-credit-item gai-credit-refresh">${refreshBadge}</div>
        </div>`;
    }

    return `
        <section class="card">
            <h2>
                ${ICON.user}
                ${tBi('Account', '')}
                <span class="tier-badge" style="background:${tier.bg};color:${tier.color}">${esc(userInfo.planName)}</span>
                ${userInfo.userTierName ? `<span class="tier-badge tier-sub" style="background:rgba(255,255,255,0.06);color:var(--color-text-dim)">${esc(userInfo.userTierName)}</span>` : ''}
                <button class="privacy-btn" id="privacyToggle" aria-label="${tBi('Toggle privacy mask', '')}">${ICON.shield}</button>
            </h2>
            <div class="account-info">
                <span class="account-name" data-real="${esc(userInfo.name)}" data-masked="${esc(userInfo.name.charAt(0))}***">${esc(userInfo.name)}</span>
                <span class="account-email" data-real="${esc(userInfo.email)}" data-masked="${esc(maskedEmail)}">${esc(userInfo.email)}</span>
            </div>
            <p class="privacy-hint">${tBi(
        'Privacy mask is ON by default. Click the shield button above to reveal sensitive data.',
        '。 \ud83d\udee1\ufe0f /。',
    )}</p>
            ${subHint}
            <div class="credits-section">
                <div class="credit-row">
                    <div class="credit-header">
                        <span>${tBi('Prompt Credits', 'Prompt ')}</span>
                        <span>${userInfo.availablePromptCredits.toLocaleString()} / ${userInfo.monthlyPromptCredits.toLocaleString()}</span>
                    </div>
                    <div class="credit-bar-wrap">
                        <div class="credit-bar" style="width:${promptPct}%;background:${promptBarColor}"></div>
                    </div>
                </div>
                <div class="credit-row">
                    <div class="credit-header">
                        <span>${tBi('Flow Credits', 'Flow ')}</span>
                        <span>${userInfo.availableFlowCredits.toLocaleString()} / ${userInfo.monthlyFlowCredits.toLocaleString()}</span>
                    </div>
                    <div class="credit-bar-wrap">
                        <div class="credit-bar" style="width:${flowPct}%;background:${flowBarColor}"></div>
                    </div>
                </div>
            </div>
            ${creditsHtml}
            <div class="billing-day-inline">
                <div class="billing-day-header">
                    <span class="billing-day-label">${tBi('Monthly credits expiry day', '')}</span>
                    <div class="billing-day-input-group">
                        <div class="num-spinner">
                            <button type="button" class="num-spinner-btn decrement">\u2212</button>
                            <input type="number" id="profileBillingDayInput" class="threshold-input"
                                   data-email="${esc(userInfo.email || '')}"
                                   value="${day}" min="0" max="31" step="1" />
                            <button type="button" class="num-spinner-btn increment">+</button>
                        </div>
                        <button class="action-btn" id="profileBillingDaySaveBtn">${tBi('Save', '\u4fdd\u5b58')}</button>
                        <span id="profileBillingDayFeedback" class="threshold-feedback"></span>
                    </div>
                </div>
                <p class="billing-day-desc">${tBi(
        'Your credits expire on a fixed day each month (e.g. the 15th). Set it here so the countdown shows how many days remaining. Check your billing email or payment history to find the exact date. Set to 0 to disable.',
        '（ 15 ）。。。 0 。',
    )}</p>
            </div>
        </section>`;
}

export function buildModelQuotaGrid(configs: ModelConfig[]): string {
    const quotaModels = collapseModelQuotas(configs);
    if (quotaModels.length === 0) { return ''; }

    const cards = quotaModels.map((c) => {
        const qi = c.quotaInfo;
        const pct = Math.round(qi.remainingFraction * 100);
        const barColor = pct <= 30 ? 'var(--color-danger)' : pct < 80 ? 'var(--color-warn)' : 'var(--color-ok)';

        let resetLabel = '';
        if (qi.resetTime) {
            const countdown = formatResetCountdown(qi.resetTime);
            const absolute = formatResetAbsolute(qi.resetTime);
            resetLabel = `${getResetHorizon(qi.resetTime)} · ${countdown ? `${countdown} · ${absolute}` : absolute}`;
        }

        return `
            <div class="model-card">
                <div class="model-card-header">
                    <span class="model-card-name">${esc(c.family)}</span>
                    <span class="model-card-pct" style="color:${barColor}">${pct}%</span>
                </div>
                <div class="quota-bar-wrap">
                    <div class="quota-bar" style="width:${pct}%;background:${barColor}"></div>
                </div>
                <div class="model-card-meta" style="display: flex; align-items: center; justify-content: space-between;">
                    ${resetLabel ? `<span class="model-card-reset">${tBi('Reset', '')} ${resetLabel}</span>` : ''}
                </div>
            </div>`;
    }).join('');

    return `
        <section class="card">
            <h2>${ICON.bolt} ${tBi('Model Quota', '')}</h2>
            <div class="model-grid">
                ${cards}
            </div>
        </section>`;
}

export function buildDefaultModelCard(userInfo: UserStatusInfo | null): string {
    if (!userInfo?.defaultModelLabel) { return ''; }
    return `
        <section class="card">
            <h2>${ICON.bolt} ${tBi('Default Model', '')}</h2>
            <div class="default-model">${tBi('Current default', '')}: <strong>${esc(userInfo.defaultModelLabel)}</strong></div>
            ${userInfo.userTierDescription
            ? `<p class="raw-desc">${esc(userInfo.userTierDescription)}</p>`
            : ''}
        </section>`;
}

function buildLimitsSection(userInfo: UserStatusInfo): string {
    const fmtLimit = (v: number): string => v === -1 ? '∞' : v.toLocaleString();
    const pl = userInfo.planLimits;
    const limitCards = [
        [tBi('Max Input Tokens', ''), fmtLimit(pl.maxNumChatInputTokens)],
        [tBi('Premium Messages', ''), fmtLimit(pl.maxNumPremiumChatMessages)],
        [tBi('Custom Instructions', ''), tBi(
            `${fmtLimit(pl.maxCustomChatInstructionCharacters)} chars`,
            `${fmtLimit(pl.maxCustomChatInstructionCharacters)} `,
        )],
        [tBi('Pinned Context', ''), fmtLimit(pl.maxNumPinnedContextItems)],
        [tBi('Local Index', ''), fmtLimit(pl.maxLocalIndexSize)],
        [tBi('Flex Credits', 'Flex '), tBi(
            `${pl.monthlyFlexCreditPurchaseAmount.toLocaleString()} / mo`,
            `${pl.monthlyFlexCreditPurchaseAmount.toLocaleString()} /`,
        )],
    ].map(([k, v]) => `
        <div class="profile-metric-card">
            <span class="profile-metric-label">${k}</span>
            <span class="profile-metric-value">${v}</span>
        </div>`).join('');

    return `
        <section class="card">
            <h2>${ICON.shield} ${tBi('Plan Limits', '')}</h2>
            <div class="profile-metric-grid">${limitCards}</div>
        </section>`;
}

function buildFeatureAndTeamGrid(userInfo: UserStatusInfo): string {
    // Feature flags
    const allFeatures: { label: string; enabled: boolean }[] = [
        { label: tBi('Web Search', ''), enabled: userInfo.cascadeWebSearchEnabled },
        { label: tBi('Browser', ''), enabled: userInfo.browserEnabled },
        { label: tBi('Knowledge Base', ''), enabled: userInfo.knowledgeBaseEnabled },
        { label: tBi('Commit Msg', ''), enabled: userInfo.canGenerateCommitMessages },
        { label: tBi('Auto Run', ''), enabled: userInfo.cascadeCanAutoRunCommands },
        { label: tBi('Background', ''), enabled: userInfo.canAllowCascadeInBackground },
        { label: tBi('Buy Credits', ''), enabled: userInfo.canBuyMoreCredits },
        { label: tBi('Fast Autocomplete', ''), enabled: userInfo.hasAutocompleteFastMode },
        { label: tBi('Sticky Premium', ''), enabled: userInfo.allowStickyPremiumModels },
        { label: tBi('Command Models', ''), enabled: userInfo.allowPremiumCommandModels },
        { label: tBi('Tab Jump', 'Tab '), enabled: userInfo.hasTabToJump },
        { label: tBi('Custom Icon', ''), enabled: userInfo.canCustomizeAppIcon },
    ];
    const featureTags = allFeatures.map(f =>
        `<span class="feature-tag${f.enabled ? ' enabled' : ''}">${f.label}</span>`
    ).join('');

    // Team config
    const tc = userInfo.teamConfig;
    const teamTags = [
        { label: tBi('MCP Servers', 'MCP '), enabled: tc.allowMcpServers },
        { label: tBi('Auto Run Cmd', ''), enabled: tc.allowAutoRunCommands },
        { label: tBi('Browser Experimental', ''), enabled: tc.allowBrowserExperimentalFeatures },
    ].map(f => `<span class="feature-tag${f.enabled ? ' enabled' : ''}">${f.label}</span>`).join('');

    return `
        <div class="profile-two-col">
            <section class="card profile-panel-card">
                <h2>${ICON.bolt} ${tBi('Feature Flags', '')}</h2>
                <div class="profile-chip-grid">${featureTags}</div>
            </section>
            <section class="card profile-panel-card">
                <h2>${ICON.shield} ${tBi('Team Config', '')}</h2>
                <div class="profile-chip-grid">${teamTags}</div>
            </section>
        </div>`;
}
