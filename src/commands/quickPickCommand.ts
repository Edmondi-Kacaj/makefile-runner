import * as vscode from 'vscode';
import { makefileService } from '../core/makefileService.js';
import { createTargetUI } from '../ui/uiFactory.js';
import { buildDefaultMakefileTemplate } from '../makefileTemplate.js';
import { getConfig } from '../config.js';

let currentUI = createTargetUI();

/**
 * Command: Makefile: Run Target (Ctrl+Alt+M)
 * Shows the Quick Pick or Tree View to select and run a target.
 */
export async function quickPickCommand(): Promise<void> {
	// Verify workspace is ready
	if (!(await makefileService.ensureReady())) {
		// Service handles the warning
		return;
	}

	// Check if Makefiles exist
	if (!makefileService.hasMakefiles()) {
		await handleNoMakefile();
		return;
	}

	// Get targets and show UI
	const targets = await makefileService.getTargets();
	if (targets.length === 0) {
		vscode.window.showInformationMessage('No runnable targets were found in discovered Makefiles.');
		return;
	}

	const config = getConfig();
	if (!config.showQuickPick) {
		if (config.showTreeView) {
			await vscode.commands.executeCommand('makefileRunner.treeView.focus');
			vscode.window.showInformationMessage(
				'Quick Pick UI is disabled in settings. Open targets from the Makefile Targets tree view.',
			);
		} else {
			vscode.window.showWarningMessage(
				'Both Quick Pick and Tree View are disabled. Enable at least one UI mode in settings.',
			);
		}
		return;
	}

	const selected = await currentUI.show(targets);
	if (selected) {
		await vscode.commands.executeCommand('makefileRunner.runTarget', selected);
	}
}

/**
 * Register the quick pick command.
 */
export function registerQuickPickCommand(context: vscode.ExtensionContext): void {
	// Listen for UI changes if UI config changes
	const uiConfigChange = vscode.workspace.onDidChangeConfiguration((event) => {
		if (
			event.affectsConfiguration('makefileRunner.showTreeView') ||
			event.affectsConfiguration('makefileRunner.showQuickPick')
		) {
			currentUI.dispose();
			currentUI = createTargetUI();
		}
	});

	const disposable = vscode.commands.registerCommand('makefileRunner.quickPick', quickPickCommand);
	context.subscriptions.push(uiConfigChange, disposable);
}

async function handleNoMakefile(): Promise<void> {
	const action = await vscode.window.showInformationMessage(
		'No Makefile was found in this workspace.',
		'Create Makefile',
		'Select Existing Makefile',
	);

	if (action === 'Create Makefile') {
		await createMakefileFromTemplate();
		await makefileService.refreshDiscovery();
		return;
	}

	if (action === 'Select Existing Makefile') {
		await selectExistingMakefile();
		await makefileService.refreshDiscovery();
	}
}

async function createMakefileFromTemplate(): Promise<void> {
	const folder = await pickWorkspaceFolder();
	if (!folder) {
		return;
	}

	const config = getConfig(folder);
	const makefilePath = vscode.Uri.joinPath(folder.uri, 'Makefile');
	const template = buildDefaultMakefileTemplate(config.defaultMakefileTemplate);
	await vscode.workspace.fs.writeFile(makefilePath, Buffer.from(template, 'utf8'));
	vscode.window.showInformationMessage(`Makefile created at ${makefilePath.fsPath}`);
}

async function selectExistingMakefile(): Promise<void> {
	const uris = await vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		filters: { 'Makefile': ['', 'makefile', 'Makefile'] },
		title: 'Select a Makefile',
	});

	if (!uris || uris.length === 0) {
		return;
	}

	const config = getConfig();
	const relativePath = vscode.workspace.asRelativePath(uris[0]);
	config.makefilePaths = [...(config.makefilePaths || []), relativePath];
	await vscode.workspace.getConfiguration('makefileRunner').update('makefilePaths', config.makefilePaths);
}

async function pickWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
	if (!vscode.workspace.workspaceFolders?.length) {
		vscode.window.showWarningMessage('No workspace folder is open.');
		return undefined;
	}

	if (vscode.workspace.workspaceFolders.length === 1) {
		return vscode.workspace.workspaceFolders[0];
	}

	return await vscode.window.showWorkspaceFolderPick();
}

