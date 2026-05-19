import * as vscode from 'vscode';
import { TargetEntry } from '../cacheManager.js';
import { ITargetUI } from './types.js';

type TreeNode = MakefileGroupTreeItem | TargetTreeItem;

class MakefileGroupTreeItem extends vscode.TreeItem {
	constructor(
		public readonly groupKey: string,
		label: string,
		description: string,
	) {
		super(label, vscode.TreeItemCollapsibleState.Expanded);
		this.description = description;
		this.tooltip = `${label} (${description})`;
		this.iconPath = new vscode.ThemeIcon('list-unordered');
		this.contextValue = 'makefile-group';
	}
}

class TargetTreeItem extends vscode.TreeItem {
	constructor(
		public readonly target: TargetEntry,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
	) {
		super(target.target, collapsibleState);
		this.description = `make ${target.target}`;
		this.tooltip = `Run make ${target.target} in ${target.relativeMakefilePath}`;
		this.iconPath = new vscode.ThemeIcon('terminal');
		this.command = {
			title: 'Run Target',
			command: 'makefileRunner.runTarget',
			arguments: [target],
		};
		this.contextValue = 'makefile-target';
	}
}

class TargetTreeDataProvider implements vscode.TreeDataProvider<TreeNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined | null | void> =
		new vscode.EventEmitter<TreeNode | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined | null | void> = this._onDidChangeTreeData.event;

	private groupedTargets = new Map<string, TargetEntry[]>();
	private orderedGroupKeys: string[] = [];

	constructor(private targets: TargetEntry[]) {
		this.rebuildGroups();
	}

	refresh(targets: TargetEntry[]): void {
		this.targets = targets;
		this.rebuildGroups();
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TreeNode): vscode.TreeItem {
		return element;
	}

	getChildren(element?: TreeNode): TreeNode[] {
		if (!element) {
			return this.orderedGroupKeys.map((groupKey) => {
				const [workspaceLabel, makefilePath] = groupKey.split('::');
				return new MakefileGroupTreeItem(groupKey, workspaceLabel, makefilePath);
			});
		}

		if (element instanceof MakefileGroupTreeItem) {
			const targets = this.groupedTargets.get(element.groupKey) ?? [];
			return targets.map((target) => new TargetTreeItem(target));
		}

		return [];
	}

	private rebuildGroups(): void {
		this.groupedTargets.clear();

		const sortedTargets = this.sortTargets(this.targets);
		for (const target of sortedTargets) {
			const workspaceLabel = target.workspaceFolder?.name ?? 'External';
			const groupKey = `${workspaceLabel}::${target.relativeMakefilePath}`;
			const existing = this.groupedTargets.get(groupKey);
			if (existing) {
				existing.push(target);
				continue;
			}

			this.groupedTargets.set(groupKey, [target]);
		}

		this.orderedGroupKeys = Array.from(this.groupedTargets.keys());
	}

	private sortTargets(targets: TargetEntry[]): TargetEntry[] {
		return [...targets].sort((a, b) => {
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
	}

	dispose(): void {
		this._onDidChangeTreeData.dispose();
	}
}

export class TreeViewUI implements ITargetUI {
	private readonly provider: TargetTreeDataProvider;
	private readonly treeView: vscode.TreeView<TreeNode>;

	constructor() {
		this.provider = new TargetTreeDataProvider([]);
		this.treeView = vscode.window.createTreeView('makefileRunner.treeView', {
			treeDataProvider: this.provider,
			showCollapseAll: true,
		});
	}

	async show(targets: TargetEntry[]): Promise<TargetEntry | undefined> {
		await this.refresh(targets);
		return undefined;
	}

	async refresh(targets: TargetEntry[]): Promise<void> {
		this.provider.refresh(targets);
	}

	dispose(): void {
		this.treeView.dispose();
		this.provider.dispose();
	}
}
