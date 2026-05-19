import * as vscode from 'vscode';
import * as path from 'path';
import { ExtensionConfig } from './config';
import { Logger } from './logger';
import { parseMakefile } from './makefileParser';

export interface TargetEntry {
	target: string;
	makefileUri: vscode.Uri;
	workspaceFolder?: vscode.WorkspaceFolder;
	relativeMakefilePath: string;
}

interface CacheEntry {
	targets: string[];
}

const DEFAULT_DISCOVERY_GLOB = '**/{Makefile,makefile,GNUmakefile}';
const DEFAULT_EXCLUDE_GLOB = '**/{.git,node_modules,dist,out,build}/**';

export class CacheManager {
	private readonly parseCache = new Map<string, CacheEntry>();
	private readonly discoveredMakefiles = new Map<string, vscode.Uri>();

	constructor(private readonly logger: Logger) {}

	public async refreshDiscovery(config: ExtensionConfig): Promise<void> {
		const discovered = await discoverMakefiles(config, this.logger);
		this.discoveredMakefiles.clear();

		for (const uri of discovered) {
			this.discoveredMakefiles.set(uri.toString(), uri);
		}

		for (const key of this.parseCache.keys()) {
			if (!this.discoveredMakefiles.has(key)) {
				this.parseCache.delete(key);
			}
		}

		this.logger.debug(`Discovery refreshed. ${this.discoveredMakefiles.size} Makefile(s) indexed.`);
	}

	public invalidateMakefile(uri: vscode.Uri): void {
		this.parseCache.delete(uri.toString());
	}

	public removeMakefile(uri: vscode.Uri): void {
		const key = uri.toString();
		this.discoveredMakefiles.delete(key);
		this.parseCache.delete(key);
	}

	public addMakefile(uri: vscode.Uri): void {
		this.discoveredMakefiles.set(uri.toString(), uri);
	}

	public invalidateAll(): void {
		this.parseCache.clear();
	}

	public hasMakefiles(): boolean {
		return this.discoveredMakefiles.size > 0;
	}

	public async getAllTargets(): Promise<TargetEntry[]> {
		const entries: TargetEntry[] = [];

		for (const uri of this.discoveredMakefiles.values()) {
			const targets = await this.getTargetsForMakefile(uri);
			const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
			const relativeMakefilePath = workspaceFolder
				? vscode.workspace.asRelativePath(uri, false)
				: uri.fsPath;

			for (const target of targets) {
				entries.push({
					target,
					makefileUri: uri,
					workspaceFolder,
					relativeMakefilePath,
				});
			}
		}

		return entries;
	}

	private async getTargetsForMakefile(uri: vscode.Uri): Promise<string[]> {
		const cacheKey = uri.toString();
		const cached = this.parseCache.get(cacheKey);
		if (cached) {
			return cached.targets;
		}

		let content: string;
		try {
			const bytes = await vscode.workspace.fs.readFile(uri);
			content = new TextDecoder().decode(bytes);
		} catch (error) {
			this.logger.warn(`Failed to read Makefile ${uri.fsPath}: ${error}`);
			return [];
		}

		try {
			const parsed = parseMakefile(content);
			this.parseCache.set(cacheKey, { targets: parsed.targets });
			return parsed.targets;
		} catch (error) {
			this.logger.warn(`Failed to parse Makefile ${uri.fsPath}: ${error}`);
			return [];
		}
	}
}

async function discoverMakefiles(config: ExtensionConfig, logger: Logger): Promise<vscode.Uri[]> {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders || folders.length === 0) {
		return [];
	}

	const discovered = new Map<string, vscode.Uri>();

	for (const folder of folders) {
		const discoveredUris = await vscode.workspace.findFiles(
			new vscode.RelativePattern(folder, DEFAULT_DISCOVERY_GLOB),
			DEFAULT_EXCLUDE_GLOB,
		);

		for (const uri of discoveredUris) {
			discovered.set(uri.toString(), uri);
		}

		for (const configuredPath of config.makefilePaths) {
			for (const uri of await resolveConfiguredPath(folder, configuredPath)) {
				discovered.set(uri.toString(), uri);
			}
		}
	}

	logger.debug(`Discovered ${discovered.size} Makefile(s) across workspace folders.`);
	return Array.from(discovered.values());
}

async function resolveConfiguredPath(
	folder: vscode.WorkspaceFolder,
	configuredPath: string,
): Promise<vscode.Uri[]> {
	if (!configuredPath.trim()) {
		return [];
	}

	if (path.isAbsolute(configuredPath)) {
		const absoluteUri = vscode.Uri.file(configuredPath);
		try {
			await vscode.workspace.fs.stat(absoluteUri);
			return [absoluteUri];
		} catch {
			return [];
		}
	}

	return vscode.workspace.findFiles(new vscode.RelativePattern(folder, configuredPath), undefined);
}
