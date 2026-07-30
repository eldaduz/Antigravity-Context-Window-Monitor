import { describe, expect, it } from 'vitest';
import { collapseModelQuotas, formatQuotaIndicators, getResetHorizon } from '../src/quota-families';

describe('collapseModelQuotas', () => {
    it('shows only shared family quotas from GetUserStatus data', () => {
        expect(collapseModelQuotas([
            { label: 'Gemini 3.6 Flash', quotaInfo: { remainingFraction: 0.65, resetTime: '2026-07-30T14:00:00Z' } },
            { label: 'Gemini 3.1 Pro', quotaInfo: { remainingFraction: 0.42, resetTime: '2026-07-30T14:00:00Z' } },
            { label: 'Claude Opus', quotaInfo: { remainingFraction: 0.70, resetTime: '2026-08-03T14:00:00Z' } },
            { label: 'GPT OSS 120B', quotaInfo: { remainingFraction: 0.10, resetTime: '2026-08-03T14:00:00Z' } },
        ])).toEqual([
            { family: 'Gemini', quotaInfo: { remainingFraction: 0.42, resetTime: '2026-07-30T14:00:00Z' } },
            { family: 'Claude', quotaInfo: { remainingFraction: 0.10, resetTime: '2026-08-03T14:00:00Z' } },
        ]);
    });

    it('renders one compact indicator per shared family', () => {
        expect(formatQuotaIndicators([
            { label: 'Gemini 3.6 Flash', quotaInfo: { remainingFraction: 0.42, resetTime: '2026-07-30T14:00:00Z' } },
            { label: 'Claude Opus', quotaInfo: { remainingFraction: 0.10, resetTime: '2026-08-03T14:00:00Z' } },
        ])).toBe('Gemini 🟡42% · Claude 🔴10%');
    });

    it('marks 30% remaining red', () => {
        expect(formatQuotaIndicators([
            { label: 'Gemini 3.6 Flash', quotaInfo: { remainingFraction: 0.3, resetTime: '2026-07-30T14:00:00Z' } },
        ])).toBe('Gemini 🔴30%');
    });

    it('labels resets under a day as 5-hour limits', () => {
        expect(getResetHorizon('2026-07-30T14:00:00Z', Date.parse('2026-07-30T13:00:00Z')))
            .toBe('5-hour limit');
    });
});
