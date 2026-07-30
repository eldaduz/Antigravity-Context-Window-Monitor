import * as vscode from 'vscode';
import type { StateBucket } from './durable-state';

export type Language = 'zh' | 'en' | 'both';

export function isLanguage(value: unknown): value is Language { return value === 'en'; }

export function initI18n(_context: vscode.ExtensionContext): void {}
export function initI18nFromState(_state: StateBucket): void {}
export function getLanguage(): Language { return 'en'; }

export async function setLanguage(_lang: Language, context: vscode.ExtensionContext, state?: StateBucket): Promise<void> {
    await context.globalState.update('displayLanguage', 'en');
    await state?.update('displayLanguage', 'en');
}

export async function setLanguageToState(_lang: Language, state: StateBucket): Promise<void> {
    await state.update('displayLanguage', 'en');
}

export function t(key: string): string {
    return key.split('.').at(-1)!.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, char => char.toUpperCase());
}
export function tBi(en: string, _legacy?: string, _separator?: string): string { return en; }

export async function showLanguagePicker(context: vscode.ExtensionContext, state?: StateBucket): Promise<void> {
    await setLanguage('en', context, state);
}
