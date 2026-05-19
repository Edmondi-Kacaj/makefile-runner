import * as vscode from 'vscode';
import { makefileService } from './core/makefileService.js';
import { isConfigChanged } from './config.js';
import { registerQuickPickCommand } from './commands/quickPickCommand.js';
import { registerRefreshCommand } from './commands/refreshCommand.js';
import { registerCreateMakefileCommand } from './commands/createMakefileCommand.js';
import { registerRunTargetCommand } from './commands/runTargetCommand.js';
import { createTargetUI } from './ui/uiFactory.js';
import { registerCommandCenterView } from './ui/commandCenterView.js';

let currentUI = createTargetUI();

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	// Initialize the service
	await makefileService.initialize();

	// Register all commands
	registerQuickPickCommand(context);
	registerRefreshCommand(context);
	registerCreateMakefileCommand(context);
	registerRunTargetCommand(context);
	registerCommandCenterView(context);

	// Listen for configuration changes
	const onConfigChange = vscode.workspace.onDidChangeConfiguration(async (event) => {
		if (!isConfigChanged(event)) {
			return;
		}

		await makefileService.onConfigChanged();

		// Recreate UI if UI preferences changed
		if (
			event.affectsConfiguration('makefileRunner.showTreeView') ||
			event.affectsConfiguration('makefileRunner.showQuickPick')
		) {
			currentUI.dispose();
			currentUI = createTargetUI();
			const targets = await makefileService.getTargets();
			await currentUI.refresh(targets);
		}
	});

	// Listen for workspace folder changes
	const onWorkspaceFoldersChange = vscode.workspace.onDidChangeWorkspaceFolders(async () => {
		await makefileService.onWorkspaceFoldersChanged();
	});

	// Listen for target changes and update UI
	const onTargetsChanged = makefileService.onTargetsChanged(async (targets) => {
		await currentUI.refresh(targets);
	});

	context.subscriptions.push(onConfigChange, onWorkspaceFoldersChange, onTargetsChanged, currentUI);
}

export function deactivate(): void {
	makefileService.dispose();
	currentUI.dispose();
}
