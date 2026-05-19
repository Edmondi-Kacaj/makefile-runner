import * as vscode from 'vscode';
import { TargetEntry } from './cacheManager';

interface TargetQuickPickItem extends vscode.QuickPickItem {
	target: TargetEntry;
}

class TargetTreeItem extends vscode.TreeItem {
	constructor(
		public readonly target: TargetEntry,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
	) {
		super(target.target, collapsibleState);
		this.description = target.relativeMakefilePath;
		this.tooltip = `${target.target} (${target.relativeMakefilePath})`;
		this.command = {
			title: 'Run Target',
			command: 'makefileRunner.runTarget',
			arguments: [target],
		};
	}
}

class TargetTreeDataProvider implements vscode.TreeDataProvider<TargetTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<TargetTreeItem | undefined | null | void> =
		new vscode.EventEmitter<TargetTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<TargetTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor(private targets: TargetEntry[]) {}

	refresh(targets: TargetEntry[]): void {
		this.targets = targets;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TargetTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: TargetTreeItem): TargetTreeItem[] {
		if (element) {
			return [];
		}

		const sorted = [...this.targets].sort((a, b) => {
			const workspaceA = a.workspaceFolder?.name ?? '';
			const workspaceB = b.workspaceFolder?.name ?? '';
			const workspaceCompare = workspaceA.localeCompare(workspaceB);
			if (workspaceCompare !== 0) {
				return workspaceCompare;
			}

			const makefileCompare = a.relativeMakefilePath.localeCompare(b.relativeMakefilePath);
			if (makefileCompare !== 0) {
				return makefileCompare;
			}

			return a.target.localeCompare(b.target);
		});

		return sorted.map((target) => new TargetTreeItem(target));
	}
}

export async function showTargetQuickPick(
	targets: TargetEntry[],
	groupByWorkspace: boolean,
): Promise<TargetEntry | undefined> {
	if (targets.length === 0) {
		return undefined;
	}

	const sorted = [...targets].sort((a, b) => {
		const workspaceA = a.workspaceFolder?.name ?? '';
		const workspaceB = b.workspaceFolder?.name ?? '';
		const workspaceCompare = workspaceA.localeCompare(workspaceB);
		if (workspaceCompare !== 0) {
			return workspaceCompare;
		}

		const makefileCompare = a.relativeMakefilePath.localeCompare(b.relativeMakefilePath);
		if (makefileCompare !== 0) {
			return makefileCompare;
		}

		return a.target.localeCompare(b.target);
	});

	const items = groupByWorkspace ? buildGroupedItems(sorted) : buildFlatItems(sorted);
	const selected = await vscode.window.showQuickPick(items, {
		matchOnDescription: true,
		matchOnDetail: true,
		placeHolder: 'Select a Makefile target to run',
		ignoreFocusOut: false,
	});

	if (!selected || selected.kind === vscode.QuickPickItemKind.Separator) {
		return undefined;
	}

	return (selected as TargetQuickPickItem).target;
}

function buildFlatItems(targets: TargetEntry[]): TargetQuickPickItem[] {
	return targets.map((target) => ({
		label: target.target,
		description: target.workspaceFolder?.name,
		detail: target.relativeMakefilePath,
		target,
	}));
}

function buildGroupedItems(targets: TargetEntry[]): Array<TargetQuickPickItem | vscode.QuickPickItem> {
	const items: Array<TargetQuickPickItem | vscode.QuickPickItem> = [];
	let previousWorkspace = '';

	for (const target of targets) {
		const workspaceName = target.workspaceFolder?.name ?? 'External';
		if (workspaceName !== previousWorkspace) {
			items.push({
				label: workspaceName,
				kind: vscode.QuickPickItemKind.Separator,
			});
			previousWorkspace = workspaceName;
		}

		items.push({
			label: target.target,
			description: target.workspaceFolder?.name,
			detail: target.relativeMakefilePath,
			target,
		});
	}

	return items;
}

export async function createAndShowTargetTreeView(
	targets: TargetEntry[],
): Promise<TargetTreeDataProvider> {
	const provider = new TargetTreeDataProvider(targets);
	const treeView = vscode.window.createTreeView('makefileRunner.treeView', {
		treeDataProvider: provider,
	});

	return provider;
}
