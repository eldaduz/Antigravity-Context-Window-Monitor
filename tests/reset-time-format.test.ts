import { describe, expect, it } from 'vitest';
import { formatResetAbsolute } from '../src/reset-time';

describe('formatResetAbsolute', () => {
    it('uses Israeli day/month date order', () => {
        expect(formatResetAbsolute('2026-07-30T12:29:00Z')).toBe('30/07 15:29');
    });
});
