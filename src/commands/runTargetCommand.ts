import * as vscode from 'vscode';
import { TargetEntry } from '../cacheManager.js';
import { getConfig } from '../config.js';

/**
 * Command: Makefile: Run Target (hidden, invoked by UI)
 * Runs a target in the terminal. Invoked by Quick Pick and Tree View selections.
 */
export async function runTargetCommand(target: TargetEntry): Promise<void> {
	const cwd = target.workspaceFolder?.uri.fsPath;
	if (!cwd) {
		vscode.window.showErrorMessage('Unable to determine workspace folder for target.');
		return;
	}

	const terminalName = `Makefile Runner (${target.workspaceFolder?.name ?? 'Workspace'})`;
	const { terminalReuse } = getConfig(target.workspaceFolder);
	const terminal = terminalReuse
		? (vscode.window.terminals.find((item) => item.name === terminalName) ??
			vscode.window.createTerminal({
				name: terminalName,
				cwd,
			}))
		: vscode.window.createTerminal({
			name: terminalName,
			cwd,
		});

	terminal.show();
	terminal.sendText(`make ${target.target}`, true);
}

/**
 * Register the run target command.
 */
export function registerRunTargetCommand(context: vscode.ExtensionContext): void {
	const disposable = vscode.commands.registerCommand('makefileRunner.runTarget', (target: TargetEntry) =>
		runTargetCommand(target),
	);
	context.subscriptions.push(disposable);
}
