import * as path from 'path';
import * as vscode from 'vscode';
import { ExtensionConfig } from './config';
import { Logger } from './logger';

export type FileChangeType = 'create' | 'change' | 'delete';

export interface FileChangeEvent {
	type: FileChangeType;
	uri: vscode.Uri;
}

type ChangeHandler = (events: FileChangeEvent[]) => void;

const WATCHED_DEFAULT_GLOB = '**/{Makefile,makefile,GNUmakefile}';
const DEBOUNCE_MS = 250;

export class FileWatcherManager implements vscode.Disposable {
	private readonly disposables: vscode.Disposable[] = [];
	private readonly queuedEvents = new Map<string, FileChangeEvent>();
	private debounceTimer: NodeJS.Timeout | undefined;

	constructor(
		private readonly logger: Logger,
		private readonly onChange: ChangeHandler,
	) {}

	public rebuild(config: ExtensionConfig): void {
		this.clearWatchers();

		const folders = vscode.workspace.workspaceFolders;
		if (!folders || folders.length === 0) {
			return;
		}

		for (const folder of folders) {
			this.registerWatcher(new vscode.RelativePattern(folder, WATCHED_DEFAULT_GLOB));

			for (const configuredPath of config.makefilePaths) {
				if (!configuredPath.trim()) {
					continue;
				}

				const absolute = path.isAbsolute(configuredPath);
				if (absolute) {
					const dir = path.dirname(configuredPath);
					const base = path.basename(configuredPath);
					this.registerWatcher(new vscode.RelativePattern(vscode.Uri.file(dir), base));
					continue;
				}

				this.registerWatcher(new vscode.RelativePattern(folder, configuredPath));
			}
		}
	}

	public dispose(): void {
		this.clearWatchers();
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
	}

	private clearWatchers(): void {
		while (this.disposables.length > 0) {
			this.disposables.pop()?.dispose();
		}
	}

	private registerWatcher(pattern: vscode.GlobPattern): void {
		const watcher = vscode.workspace.createFileSystemWatcher(pattern);
		watcher.onDidCreate((uri) => this.queueEvent({ type: 'create', uri }), this, this.disposables);
		watcher.onDidChange((uri) => this.queueEvent({ type: 'change', uri }), this, this.disposables);
		watcher.onDidDelete((uri) => this.queueEvent({ type: 'delete', uri }), this, this.disposables);
		this.disposables.push(watcher);
	}

	private queueEvent(event: FileChangeEvent): void {
		this.queuedEvents.set(event.uri.toString(), event);

		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			const events = Array.from(this.queuedEvents.values());
			this.queuedEvents.clear();
			if (events.length > 0) {
				this.logger.debug(`Processing ${events.length} Makefile watcher event(s).`);
				this.onChange(events);
			}
		}, DEBOUNCE_MS);
	}
}
