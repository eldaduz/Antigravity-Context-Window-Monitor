import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { checkForUpdates, compareVersions, findReleaseMatch } from '../src/updater';

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

    it('matches a plain VSIX asset from a suffixed release tag', () => {
        expect(findReleaseMatch([
            {
                tag_name: 'v1.16.16-english-only',
                assets: [{ name: 'antigravity-context-monitor-1.16.16.vsix' }],
            },
        ], 'antigravity-context-monitor-*.vsix')?.version).toBe('1.16.16');
    });

    it('chooses the highest stable release with a matching VSIX', () => {
        expect(findReleaseMatch([
            {
                tag_name: 'v1.17.0-beta',
                prerelease: true,
                assets: [{ name: 'antigravity-context-monitor-1.17.0.vsix' }],
            },
            {
                tag_name: 'v1.16.16',
                assets: [{ name: 'antigravity-context-monitor-1.16.16.vsix' }],
            },
            {
                tag_name: 'v1.16.17-english-only',
                assets: [{ name: 'antigravity-context-monitor-1.16.17.vsix' }],
            },
        ], 'antigravity-context-monitor-*.vsix')?.version).toBe('1.16.17');
    });

    it('rejects VSIX assets for another version', () => {
        expect(findReleaseMatch([
            {
                tag_name: 'v1.16.16',
                assets: [{ name: 'antigravity-context-monitor-1.16.15.vsix' }],
            },
        ], 'antigravity-context-monitor-*.vsix')).toBeNull();
    });

    it('does not download or install until Install Update is selected', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [{
                tag_name: 'v1.16.16',
                assets: [{
                    name: 'antigravity-context-monitor-1.16.16.vsix',
                    browser_download_url: 'https://example.test/update.vsix',
                }],
            }],
        });
        vi.stubGlobal('fetch', fetchMock);
        const prompt = vi.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
        const install = vi.spyOn(vscode.commands, 'executeCommand');

        await expect(checkForUpdates({
            extension: { packageJSON: { version: '1.16.15' } },
        } as unknown as vscode.ExtensionContext, 'manual')).resolves.toBe(false);

        expect(prompt).toHaveBeenCalledWith(
            'Antigravity Context Window Monitor 1.16.16 is available.',
            'Install Update',
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
            signal: expect.any(AbortSignal),
        }));
        expect(install).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });
});
