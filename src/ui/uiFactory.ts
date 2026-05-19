import { getConfig } from '../config';
import { QuickPickUI } from './quickPickUI.js';
import { TreeViewUI } from './treeViewUI.js';
import { ITargetUI } from './types.js';

class CompositeTargetUI implements ITargetUI {
	constructor(
		private readonly primaryUI: ITargetUI,
		private readonly secondaryUI?: ITargetUI,
	) {}

	async show(targets: Parameters<ITargetUI['show']>[0]): ReturnType<ITargetUI['show']> {
		if (this.secondaryUI) {
			await this.secondaryUI.refresh(targets);
		}

		return this.primaryUI.show(targets);
	}

	async refresh(targets: Parameters<ITargetUI['refresh']>[0]): ReturnType<ITargetUI['refresh']> {
		await this.primaryUI.refresh(targets);

		if (this.secondaryUI) {
			await this.secondaryUI.refresh(targets);
		}
	}

	dispose(): void {
		this.primaryUI.dispose();
		this.secondaryUI?.dispose();
	}
}

class NoopTargetUI implements ITargetUI {
	async show(): Promise<undefined> {
		return undefined;
	}

	async refresh(): Promise<void> {
		// Intentionally empty when all UI modes are disabled
	}

	dispose(): void {
		// Nothing to dispose
	}
}

/**
 * Factory for creating the appropriate UI implementation.
 * This makes it trivial to add new UI modes.
 */
export function createTargetUI(): ITargetUI {
	const config = getConfig();
	const quickPickUI = config.showQuickPick ? new QuickPickUI() : undefined;
	const treeViewUI = config.showTreeView ? new TreeViewUI() : undefined;

	if (quickPickUI && treeViewUI) {
		return new CompositeTargetUI(quickPickUI, treeViewUI);
	}

	if (quickPickUI) {
		return quickPickUI;
	}

	if (treeViewUI) {
		return treeViewUI;
	}

	return new NoopTargetUI();
}
