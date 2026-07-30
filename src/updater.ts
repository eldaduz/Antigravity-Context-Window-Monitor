import * as vscode from 'vscode';

const RELEASES_URL = 'https://api.github.com/repos/eldaduz/Antigravity-Context-Window-Monitor/releases?per_page=20';
const ASSET_PATTERN = 'antigravity-context-monitor-*.vsix';

export interface ReleaseAsset {
    name: string;
    browser_download_url?: string;
}

export interface Release {
    tag_name: string;
    assets: ReleaseAsset[];
}

function versionParts(version: string): number[] {
    return version.replace(/^v/i, '').split('.').map(part => Number.parseInt(part, 10) || 0);
}

export function compareVersions(remote: string, current: string): number {
    const remoteParts = versionParts(remote);
    const currentParts = versionParts(current);
    const length = Math.max(remoteParts.length, currentParts.length);
    for (let index = 0; index < length; index++) {
        const difference = (remoteParts[index] || 0) - (currentParts[index] || 0);
        if (difference) return Math.sign(difference);
    }
    return 0;
}

export function findReleaseMatch(releases: Release[], assetPattern: string): { version: string; asset: ReleaseAsset } | null {
    for (const release of releases) {
        const version = release.tag_name.replace(/^v/i, '');
        const expectedName = assetPattern.replace('*', version).toLowerCase();
        const asset = release.assets.find(candidate => candidate.name.toLowerCase() === expectedName);
        if (asset) return { version, asset };
    }
    return null;
}

export async function checkForUpdates(context: vscode.ExtensionContext, trigger: 'startup' | 'manual'): Promise<boolean> {
    try {
        const response = await fetch(RELEASES_URL, {
            headers: { Accept: 'application/vnd.github+json' },
        });
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

        const releases = await response.json() as Release[];
        const match = findReleaseMatch(releases, ASSET_PATTERN);
        if (!match || compareVersions(match.version, context.extension.packageJSON.version) <= 0) {
            if (trigger === 'manual') await vscode.window.showInformationMessage('Antigravity Context Window Monitor is up to date.');
            return false;
        }
        if (!match.asset.browser_download_url) throw new Error('Release asset download URL is missing.');

        const assetResponse = await fetch(match.asset.browser_download_url);
        if (!assetResponse.ok) throw new Error(`VSIX download returned ${assetResponse.status}`);
        await vscode.workspace.fs.createDirectory(context.globalStorageUri);
        const destination = vscode.Uri.joinPath(context.globalStorageUri, match.asset.name);
        await vscode.workspace.fs.writeFile(destination, new Uint8Array(await assetResponse.arrayBuffer()));
        await vscode.commands.executeCommand('workbench.extensions.installExtension', destination);

        const reload = await vscode.window.showInformationMessage(
            `Antigravity Context Window Monitor ${match.version} installed. Reload to activate it.`,
            'Reload Window',
        );
        if (reload === 'Reload Window') await vscode.commands.executeCommand('workbench.action.reloadWindow');
        return true;
    } catch (error) {
        if (trigger === 'manual') {
            const message = error instanceof Error ? error.message : String(error);
            await vscode.window.showErrorMessage(`Unable to check for updates: ${message}`);
        }
        return false;
    }
}
