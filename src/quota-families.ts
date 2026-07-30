import type { ModelConfig, QuotaInfo } from './models';

export type QuotaFamily = 'Gemini' | 'Claude';

export interface FamilyQuota {
    family: QuotaFamily;
    quotaInfo: QuotaInfo;
}

function getFamily(label: string): QuotaFamily | undefined {
    const normalized = label.toLowerCase();
    if (normalized.includes('gemini')) { return 'Gemini'; }
    if (normalized.includes('claude') || normalized.includes('gpt-oss') || normalized.includes('gpt oss') || normalized.startsWith('gpt-')) {
        return 'Claude';
    }
}

export function collapseModelQuotas(configs: Pick<ModelConfig, 'label' | 'quotaInfo'>[]): FamilyQuota[] {
    const quotas = new Map<QuotaFamily, QuotaInfo>();
    for (const config of configs) {
        const family = getFamily(config.label);
        const quota = config.quotaInfo;
        if (!family || !quota || !Number.isFinite(quota.remainingFraction)) { continue; }
        const current = quotas.get(family);
        if (!current || quota.remainingFraction < current.remainingFraction) {
            quotas.set(family, quota);
        }
    }
    return (['Gemini', 'Claude'] as const)
        .flatMap(family => {
            const quotaInfo = quotas.get(family);
            return quotaInfo ? [{ family, quotaInfo }] : [];
        });
}

export function formatQuotaIndicators(configs: Pick<ModelConfig, 'label' | 'quotaInfo'>[]): string {
    return collapseModelQuotas(configs).map(({ family, quotaInfo }) => {
        const pct = Math.round(quotaInfo.remainingFraction * 100);
        const dot = pct >= 80 ? '🟢' : pct > 20 ? '🟡' : '🔴';
        return `${family} ${dot}${pct}%`;
    }).join(' · ');
}

export function getResetHorizon(resetTime: string, now = Date.now()): string {
    return new Date(resetTime).getTime() - now < 24 * 60 * 60 * 1000 ? 'Five-hour limit' : 'Weekly limit';
}
