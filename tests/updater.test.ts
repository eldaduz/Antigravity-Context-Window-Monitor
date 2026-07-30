import { describe, expect, it } from 'vitest';
import { compareVersions, findReleaseMatch } from '../src/updater';

describe('updater', () => {
    it('compares semantic release versions', () => {
        expect(compareVersions('1.16.16', '1.16.15')).toBe(1);
    });

    it('finds matching VSIX asset in a release', () => {
        expect(findReleaseMatch([
            {
                tag_name: 'v1.16.16',
                assets: [{ name: 'antigravity-context-monitor-1.16.16.vsix' }],
            },
        ], 'antigravity-context-monitor-*.vsix')?.version).toBe('1.16.16');
    });

    it('rejects VSIX assets for another version', () => {
        expect(findReleaseMatch([
            {
                tag_name: 'v1.16.16',
                assets: [{ name: 'antigravity-context-monitor-1.16.15.vsix' }],
            },
        ], 'antigravity-context-monitor-*.vsix')).toBeNull();
    });
});
