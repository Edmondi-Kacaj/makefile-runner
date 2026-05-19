import * as vscode from 'vscode';
import { buildDefaultMakefileTemplate } from '../makefileTemplate.js';
import { makefileService } from '../core/makefileService.js';
import { getConfig } from '../config.js';

/**
 * Command: Makefile: Create Default Makefile (Ctrl+Alt+N)
 * Creates a default Makefile in the workspace.
 */
export async function createMakefileCommand(): Promise<void> {
	if (!vscode.workspace.workspaceFolders?.length) {
		vscode.window.showWarningMessage('Open a workspace folder to create a Makefile.');
		return;
	}

	const folder =
		vscode.workspace.workspaceFolders.length === 1
			? vscode.workspace.workspaceFolders[0]
			: await vscode.window.showWorkspaceFolderPick();

	if (!folder) {
		return;
	}

	const makefilePath = vscode.Uri.joinPath(folder.uri, 'Makefile');

	// Check if Makefile already exists
	try {
		await vscode.workspace.fs.stat(makefilePath);
		const overwrite = await vscode.window.showWarningMessage(
			`Makefile already exists at ${makefilePath.fsPath}. Overwrite?`,
			'Overwrite',
			'Cancel',
		);
		if (overwrite !== 'Overwrite') {
			return;
		}
	} catch (error) {
		// File doesn't exist, which is fine
	}

	const config = getConfig(folder);
	const template = buildDefaultMakefileTemplate(config.defaultMakefileTemplate);
	await vscode.workspace.fs.writeFile(makefilePath, Buffer.from(template, 'utf8'));

	vscode.window.showInformationMessage(`Default Makefile created at ${makefilePath.fsPath}`);

	// Refresh to pick up the new Makefile
	await makefileService.refreshDiscovery(true);
}

/**
 * Register the create makefile command.
 */
export function registerCreateMakefileCommand(context: vscode.ExtensionContext): void {
	const disposable = vscode.commands.registerCommand('makefileRunner.createDefaultMakefile', createMakefileCommand);
	context.subscriptions.push(disposable);
}
