import * as vscode from 'vscode';
import * as path from 'path';
import { CacheManager, TargetEntry } from './cacheManager';
import { getConfig, isConfigChanged } from './config';
import { FileChangeEvent, FileWatcherManager } from './fileWatcher';
import { createLogger } from './logger';
import { buildDefaultMakefileTemplate } from './makefileTemplate';
import { showTargetQuickPick } from './uiProvider';

export function activate(context: vscode.ExtensionContext) {
	const logger = createLogger(() => getConfig().debug);
	const cacheManager = new CacheManager(logger);
	const watcher = new FileWatcherManager(logger, (events) => {
		void onMakefileEvents(events, cacheManager);
	});

	const ensureDiscovery = async (force = false): Promise<void> => {
		if (!force && cacheManager.hasMakefiles()) {
			return;
		}

		await cacheManager.refreshDiscovery(getConfig());
	};

	const runTargetCommand = vscode.commands.registerCommand('makefileTargetRunner.quickPick', async () => {
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('Open a workspace folder to run Makefile targets.');
			return;
		}

		await ensureDiscovery();
		if (!cacheManager.hasMakefiles()) {
			await handleNoMakefile(cacheManager);
			return;
		}

		const targets = await cacheManager.getAllTargets();
		if (targets.length === 0) {
			vscode.window.showInformationMessage('No runnable targets were found in discovered Makefiles.');
			return;
		}

		const config = getConfig();
		if (config.uiMode !== 'quickPick') {
			vscode.window.showInformationMessage('Only quickPick mode is currently implemented. Using quick pick.');
		}

		const selected = await showTargetQuickPick(targets, config.groupByWorkspace);
		if (!selected) {
			return;
		}

		runTargetInTerminal(selected);
	});

	const refreshCommand = vscode.commands.registerCommand('makefileTargetRunner.refreshTargets', async () => {
		cacheManager.invalidateAll();
		await cacheManager.refreshDiscovery(getConfig());
		vscode.window.showInformationMessage('Makefile target cache refreshed.');
	});

	const createDefaultMakefileCommand = vscode.commands.registerCommand('makefileTargetRunner.createDefaultMakefile', async () => {
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('Open a workspace folder before creating a Makefile.');
			return;
		}
		await createMakefileFromTemplate();
		await cacheManager.refreshDiscovery(getConfig());
	});

	const onConfigChange = vscode.workspace.onDidChangeConfiguration(async (event) => {
		if (!isConfigChanged(event)) {
			return;
		}

		cacheManager.invalidateAll();
		watcher.rebuild(getConfig());
		await cacheManager.refreshDiscovery(getConfig());
	});

	const onWorkspaceFoldersChange = vscode.workspace.onDidChangeWorkspaceFolders(async () => {
		cacheManager.invalidateAll();
		await cacheManager.refreshDiscovery(getConfig());
		watcher.rebuild(getConfig());
	});

	watcher.rebuild(getConfig());
	void cacheManager.refreshDiscovery(getConfig());

	context.subscriptions.push(runTargetCommand, refreshCommand, createDefaultMakefileCommand, onConfigChange, onWorkspaceFoldersChange, watcher);
}

export function deactivate() {}

async function onMakefileEvents(events: FileChangeEvent[], cacheManager: CacheManager): Promise<void> {
	const config = getConfig();
	if (!config.autoRefresh) {
		return;
	}

	for (const event of events) {
		if (event.type === 'delete') {
			cacheManager.removeMakefile(event.uri);
			continue;
		}

		if (event.type === 'create') {
			cacheManager.addMakefile(event.uri);
		}

		cacheManager.invalidateMakefile(event.uri);
	}
}

async function handleNoMakefile(cacheManager: CacheManager): Promise<void> {
	const action = await vscode.window.showInformationMessage(
		'No Makefile was found in this workspace.',
		'Create Makefile',
		'Select Existing Makefile',
	);

	if (action === 'Create Makefile') {
		await createMakefileFromTemplate();
		await cacheManager.refreshDiscovery(getConfig());
		return;
	}

	if (action === 'Select Existing Makefile') {
		await selectExistingMakefile();
		await cacheManager.refreshDiscovery(getConfig());
	}
}

async function createMakefileFromTemplate(): Promise<void> {
	const folder = await pickWorkspaceFolder();
	if (!folder) {
		return;
	}

	const makefileUri = vscode.Uri.joinPath(folder.uri, 'Makefile');
	const content = buildDefaultMakefileTemplate(getConfig(folder).defaultMakefileTemplate);

	try {
		await vscode.workspace.fs.stat(makefileUri);
		const overwrite = await vscode.window.showWarningMessage(
			'A Makefile already exists. Do you want to overwrite it?',
			'Overwrite',
		);
		if (overwrite !== 'Overwrite') {
			return;
		}
	} catch {
		// File does not exist, continue with creation.
	}

	await vscode.workspace.fs.writeFile(makefileUri, new TextEncoder().encode(content));
	const document = await vscode.workspace.openTextDocument(makefileUri);
	await vscode.window.showTextDocument(document, { preview: false });
	vscode.window.showInformationMessage(`Created Makefile at ${vscode.workspace.asRelativePath(makefileUri)}`);
}

async function selectExistingMakefile(): Promise<void> {
	const selected = await vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false,
		openLabel: 'Use Makefile',
	});

	if (!selected || selected.length === 0) {
		return;
	}

	const selectedUri = selected[0];
	const existing = getConfig().makefilePaths;
	const valueToStore = toWorkspaceRelativePath(selectedUri);
	if (existing.includes(valueToStore)) {
		return;
	}

	await vscode.workspace.getConfiguration('makefileTargetRunner').update(
		'makefilePaths',
		[...existing, valueToStore],
		vscode.ConfigurationTarget.Workspace,
	);
}

function toWorkspaceRelativePath(uri: vscode.Uri): string {
	const folder = vscode.workspace.getWorkspaceFolder(uri);
	if (!folder) {
		return uri.fsPath;
	}

	return vscode.workspace.asRelativePath(uri, false);
}

async function pickWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders || folders.length === 0) {
		vscode.window.showWarningMessage('Open a workspace folder before creating a Makefile.');
		return undefined;
	}

	if (folders.length === 1) {
		return folders[0];
	}

	const selected = await vscode.window.showQuickPick(
		folders.map((folder) => ({ label: folder.name, folder })),
		{ placeHolder: 'Select a workspace folder for the new Makefile' },
	);

	return selected?.folder;
}

function runTargetInTerminal(target: TargetEntry): void {
	const cwd = path.dirname(target.makefileUri.fsPath);
	const terminal = vscode.window.createTerminal({
		name: `make ${target.target}`,
		cwd,
	});

	const targetArg = shellEscape(target.target);
	const makefileArg = shellEscape(target.makefileUri.fsPath);
	terminal.show(true);
	terminal.sendText(`make -f ${makefileArg} ${targetArg}`);
}

function shellEscape(value: string): string {
	if (value.length === 0) {
		return "''";
	}

	return `'${value.replace(/'/g, `'"'"'`)}'`;
}
