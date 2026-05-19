import * as vscode from 'vscode';
import { TargetEntry } from '../cacheManager.js';
import { getConfig } from '../config.js';
import { ITargetUI } from './types.js';

interface TargetQuickPickItem extends vscode.QuickPickItem {
	target: TargetEntry;
}

export class QuickPickUI implements ITargetUI {
	async show(targets: TargetEntry[]): Promise<TargetEntry | undefined> {
		if (targets.length === 0) {
			return undefined;
		}

		const config = getConfig();
		const filtered = config.showPrivateTargets
			? targets
			: targets.filter((t) => !t.target.startsWith('_'));
		const sorted = this.sortTargets(filtered);

		let items: Array<TargetQuickPickItem | vscode.QuickPickItem>;
		if (config.groupBy === 'workspace') {
			items = this.buildGroupedItems(sorted, (t) => t.workspaceFolder?.name ?? 'External');
		} else if (config.groupBy === 'makefile') {
			items = this.buildGroupedItems(sorted, (t) => t.relativeMakefilePath);
		} else {
			items = this.buildFlatItems(sorted);
		}

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

	async refresh(): Promise<void> {
		// Quick Pick is stateless; no refresh needed
	}

	dispose(): void {
		// Nothing to clean up
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

	private buildFlatItems(targets: TargetEntry[]): TargetQuickPickItem[] {
		return targets.map((target) => ({
			label: `$(terminal) ${target.target}`,
			description: this.buildDescription(target),
			detail: this.buildCommandPreview(target),
			target,
		}));
	}

	private buildGroupedItems(
		targets: TargetEntry[],
		groupKey: (t: TargetEntry) => string,
	): Array<TargetQuickPickItem | vscode.QuickPickItem> {
		const items: Array<TargetQuickPickItem | vscode.QuickPickItem> = [];
		let previousGroup = '';

		for (const target of targets) {
			const group = groupKey(target);
			if (group !== previousGroup) {
				items.push({
					label: group,
					kind: vscode.QuickPickItemKind.Separator,
				});
				previousGroup = group;
			}

			items.push({
				label: `$(terminal) ${target.target}`,
				description: this.buildDescription(target),
				detail: this.buildCommandPreview(target),
				target,
			});
		}

		return items;
	}

	private buildDescription(target: TargetEntry): string {
		const workspaceName = target.workspaceFolder?.name ?? 'External';
		return `${workspaceName} | ${target.relativeMakefilePath}`;
	}

	private buildCommandPreview(target: TargetEntry): string {
		return `make -f ${target.relativeMakefilePath} ${target.target}`;
	}
}
