import * as vscode from 'vscode';
import { CacheManager, TargetEntry } from '../cacheManager.js';
import { getConfig } from '../config.js';
import { FileWatcherManager, FileChangeEvent } from '../fileWatcher.js';
import { createLogger } from '../logger.js';

/**
 * Orchestrates Makefile discovery, caching, watching, and lifecycle.
 * This is the single source of truth for all business logic.
 */
export class MakefileService {
	private cacheManager: CacheManager;
	private watcher: FileWatcherManager;
	private logger: ReturnType<typeof createLogger>;

	private onTargetsChangedEmitter = new vscode.EventEmitter<TargetEntry[]>();
	readonly onTargetsChanged = this.onTargetsChangedEmitter.event;

	constructor() {
		this.logger = createLogger(() => getConfig().debug);
		this.cacheManager = new CacheManager(this.logger);
		this.watcher = new FileWatcherManager(this.logger, (events) => {
			void this.handleMakefileEvents(events);
		});
	}

	/**
	 * Initialize the service: setup watchers and perform initial discovery.
	 */
	async initialize(): Promise<void> {
		this.watcher.rebuild(getConfig());
		await this.refreshDiscovery();
	}

	/**
	 * Ensure workspace is open and Makefiles are discovered.
	 */
	async ensureReady(): Promise<boolean> {
		if (!vscode.workspace.workspaceFolders?.length) {
			vscode.window.showWarningMessage('Open a workspace folder to run Makefile targets.');
			return false;
		}

		await this.refreshDiscovery();
		if (!this.cacheManager.hasMakefiles()) {
			return false;
		}

		return true;
	}

	/**
	 * Get all discovered targets.
	 */
	async getTargets(): Promise<TargetEntry[]> {
		return this.cacheManager.getAllTargets();
	}

	/**
	 * Check if any Makefiles exist.
	 */
	hasMakefiles(): boolean {
		return this.cacheManager.hasMakefiles();
	}

	/**
	 * Refresh discovery and emit change event.
	 */
	async refreshDiscovery(force = false): Promise<void> {
		await this.cacheManager.refreshDiscovery(getConfig());
		const targets = await this.cacheManager.getAllTargets();
		this.onTargetsChangedEmitter.fire(targets);
	}

	/**
	 * Invalidate cache and refresh on config change.
	 */
	async onConfigChanged(): Promise<void> {
		this.cacheManager.invalidateAll();
		this.watcher.rebuild(getConfig());
		await this.refreshDiscovery();
	}

	/**
	 * Rebuild watcher on workspace folders change.
	 */
	async onWorkspaceFoldersChanged(): Promise<void> {
		this.cacheManager.invalidateAll();
		await this.refreshDiscovery();
		this.watcher.rebuild(getConfig());
	}

	/**
	 * Handle file change events from watcher.
	 */
	private async handleMakefileEvents(events: FileChangeEvent[]): Promise<void> {
		const config = getConfig();
		if (!config.autoRefresh) {
			return;
		}

		for (const event of events) {
			if (event.type === 'delete') {
				this.cacheManager.removeMakefile(event.uri);
				continue;
			}

			if (event.type === 'create') {
				this.cacheManager.addMakefile(event.uri);
			}

			this.cacheManager.invalidateMakefile(event.uri);
		}

		const targets = await this.cacheManager.getAllTargets();
		this.onTargetsChangedEmitter.fire(targets);
	}

	/**
	 * Clean up resources.
	 */
	dispose(): void {
		this.watcher.dispose();
		this.onTargetsChangedEmitter.dispose();
	}
}

export const makefileService = new MakefileService();
