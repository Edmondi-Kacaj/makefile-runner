import { TargetEntry } from '../cacheManager';

/**
 * Contract for any UI implementation (Quick Pick, Tree View, etc.)
 */
export interface ITargetUI {
	/**
	 * Show the UI and return the selected target.
	 */
	show(targets: TargetEntry[]): Promise<TargetEntry | undefined>;

	/**
	 * Update UI with new targets.
	 */
	refresh(targets: TargetEntry[]): Promise<void>;

	/**
	 * Clean up resources.
	 */
	dispose(): void;
}
