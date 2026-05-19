import * as vscode from 'vscode';
import { TargetEntry } from '../cacheManager.js';
import { makefileService } from '../core/makefileService.js';

interface CommandEntry {
	label: string;
	description: string;
	commandId: string;
	arguments?: unknown[];
	icon: vscode.ThemeIcon;
	collapsibleState?: vscode.TreeItemCollapsibleState;
}

interface TargetGroup {
	key: string;
	label: string;
	description: string;
	targets: TargetEntry[];
}

class CommandItem extends vscode.TreeItem {
	kind: 'run-group' | 'target-group' | 'command' | 'target' | 'command-preview' | 'placeholder';
	target?: TargetEntry;
	groupKey?: string;

	constructor(entry: CommandEntry) {
		super(entry.label, entry.collapsibleState ?? vscode.TreeItemCollapsibleState.None);
		this.kind = 'command';
		this.description = entry.description;
		this.tooltip = `${entry.label} - ${entry.description}`;
		this.iconPath = entry.icon;
		this.command = {
			title: entry.label,
			command: entry.commandId,
			arguments: entry.arguments,
		};
	}

	static targetGroup(group: TargetGroup): CommandItem {
		const item = new CommandItem({
			label: group.label,
			description: group.description,
			commandId: '',
			icon: new vscode.ThemeIcon('list-unordered'),
			collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
		});

		item.kind = 'target-group';
		item.groupKey = group.key;
		item.command = undefined;
		item.contextValue = 'target-group';
		return item;
	}

	static runGroup(): CommandItem {
		const item = new CommandItem({
			label: 'Run Target',
			description: 'Select from discovered Makefile tasks',
			commandId: 'makefileRunner.quickPick',
			icon: new vscode.ThemeIcon('list-unordered'),
			collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
		});
		item.kind = 'run-group';
		item.command = undefined;
		item.contextValue = 'run-group';
		return item;
	}

	static target(target: TargetEntry): CommandItem {
		const workspaceName = target.workspaceFolder?.name;
		const description = workspaceName ? `${workspaceName} - ${target.relativeMakefilePath}` : target.relativeMakefilePath;

		const item = new CommandItem({
			label: target.target,
			description,
			commandId: 'makefileRunner.runTargetFromCommandCenter',
			arguments: [target],
			icon: new vscode.ThemeIcon('terminal'),
		});

		item.kind = 'target';
		item.target = target;
		item.contextValue = 'target';
		return item;
	}

	static commandPreview(target: TargetEntry): CommandItem {
		const item = new CommandItem({
			label: `>_ make ${target.target}`,
			description: `Run from ${target.workspaceFolder?.name ?? 'Workspace'}`,
			commandId: 'makefileRunner.runTargetFromCommandCenter',
			arguments: [target],
			icon: new vscode.ThemeIcon('terminal'),
		});

		item.kind = 'command-preview';
		item.contextValue = 'command-preview';
		return item;
	}

	static placeholder(label: string, description: string): CommandItem {
		const item = new CommandItem({
			label,
			description,
			commandId: '',
			icon: new vscode.ThemeIcon('info'),
		});

		item.kind = 'placeholder';
		item.command = undefined;
		item.contextValue = 'placeholder';
		return item;
	}
}

class CommandCenterProvider implements vscode.TreeDataProvider<CommandItem> {
	private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<CommandItem | undefined>();
	readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

	private targets: TargetEntry[] = [];
	private targetGroups: TargetGroup[] = [];
	private lastTarget?: TargetEntry;

	private readonly commandItems: CommandItem[] = [
		CommandItem.runGroup(),
		new CommandItem({
			label: 'Refresh Targets',
			description: 'Rescan Makefiles and rebuild cache',
			commandId: 'makefileRunner.refreshTargets',
			icon: new vscode.ThemeIcon('refresh'),
		}),
		new CommandItem({
			label: 'Create Default Makefile',
			description: 'Generate a starter Makefile in workspace',
			commandId: 'makefileRunner.createDefaultMakefile',
			icon: new vscode.ThemeIcon('new-file'),
		}),
		new CommandItem({
			label: 'Open Extension Settings',
			description: 'Configure UI and discovery options',
			commandId: 'workbench.action.openSettings',
			arguments: ['@ext:e-kacaj.makefile-runner'],
			icon: new vscode.ThemeIcon('settings-gear'),
		}),
	];

	setTargets(targets: TargetEntry[]): void {
		this.targets = [...targets].sort((a, b) => {
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

		const groups = new Map<string, TargetGroup>();
		for (const target of this.targets) {
			const key = this.getGroupKey(target);
			const existing = groups.get(key);
			if (existing) {
				existing.targets.push(target);
				continue;
			}

			groups.set(key, {
				key,
				label: this.getGroupLabel(target),
				description: target.relativeMakefilePath,
				targets: [target],
			});
		}

		this.targetGroups = Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));

		if (this.lastTarget) {
			const stillExists = this.targets.some(
				(item) =>
					item.target === this.lastTarget?.target &&
					item.relativeMakefilePath === this.lastTarget?.relativeMakefilePath,
			);
			if (!stillExists) {
				this.lastTarget = undefined;
			}
		}

		this.onDidChangeTreeDataEmitter.fire(undefined);
	}

	setLastTarget(target: TargetEntry): void {
		this.lastTarget = target;
		this.onDidChangeTreeDataEmitter.fire(undefined);
	}

	private getGroupKey(target: TargetEntry): string {
		const workspaceName = target.workspaceFolder?.name ?? 'External';
		return `${workspaceName}::${target.relativeMakefilePath}`;
	}

	private getGroupLabel(target: TargetEntry): string {
		const workspaceName = target.workspaceFolder?.name;
		if (workspaceName) {
			return workspaceName;
		}

		const segments = target.relativeMakefilePath.split('/').filter(Boolean);
		if (segments.length > 1) {
			return segments[segments.length - 2];
		}

		return 'Build';
	}

	getTreeItem(element: CommandItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: CommandItem): vscode.ProviderResult<CommandItem[]> {
		if (!element) {
			return this.commandItems;
		}

		if (element.kind === 'run-group') {
			if (this.targets.length === 0) {
				return [
					CommandItem.placeholder('No targets found', 'Create or discover a Makefile, then refresh targets'),
				];
			}

			const groupItems = this.targetGroups.map((group) => CommandItem.targetGroup(group));
			const previewTarget = this.lastTarget ?? this.targets[0];
			return [...groupItems, CommandItem.commandPreview(previewTarget)];
		}

		if (element.kind === 'target-group' && element.groupKey) {
			const group = this.targetGroups.find((item) => item.key === element.groupKey);
			if (!group) {
				return [];
			}

			return group.targets.map((target) => CommandItem.target(target));
		}

		return [];
	}

	dispose(): void {
		this.onDidChangeTreeDataEmitter.dispose();
	}
}

export function registerCommandCenterView(context: vscode.ExtensionContext): void {
	const provider = new CommandCenterProvider();
	const treeView = vscode.window.createTreeView('makefileRunner.commandCenter', {
		treeDataProvider: provider,
		showCollapseAll: false,
	});

	void makefileService
		.refreshDiscovery(true)
		.then(() => makefileService.getTargets())
		.then((targets) => provider.setTargets(targets))
		.catch(() => {
			provider.setTargets([]);
		});

	const targetsChangedDisposable = makefileService.onTargetsChanged((targets) => {
		provider.setTargets(targets);
	});

	const runFromCommandCenterDisposable = vscode.commands.registerCommand(
		'makefileRunner.runTargetFromCommandCenter',
		async (target: TargetEntry) => {
			provider.setLastTarget(target);
			await vscode.commands.executeCommand('makefileRunner.runTarget', target);
		},
	);

	context.subscriptions.push(
		treeView,
		targetsChangedDisposable,
		runFromCommandCenterDisposable,
		provider,
	);
}