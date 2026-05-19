import * as vscode from 'vscode';
import { makefileService } from '../core/makefileService.js';

/**
 * Command: Makefile: Refresh Targets (Ctrl+Alt+Shift+M)
 * Manually refresh the cached target list.
 */
export async function refreshCommand(): Promise<void> {
	await makefileService.refreshDiscovery(true);
	vscode.window.showInformationMessage('Makefile target cache refreshed.');
}

/**
 * Register the refresh command.
 */
export function registerRefreshCommand(context: vscode.ExtensionContext): void {
	const disposable = vscode.commands.registerCommand('makefileRunner.refreshTargets', refreshCommand);
	context.subscriptions.push(disposable);
}
