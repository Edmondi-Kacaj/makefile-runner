import * as vscode from 'vscode';

export type UiMode = 'quickPick' | 'treeView';

export interface ExtensionConfig {
	makefilePaths: string[];
	autoRefresh: boolean;
	groupByWorkspace: boolean;
	defaultMakefileTemplate?: unknown;
	uiMode: UiMode;
	debug: boolean;
}

const SECTION = 'makefileTargetRunner';

export function getConfig(scope?: vscode.ConfigurationScope): ExtensionConfig {
	const configuration = vscode.workspace.getConfiguration(SECTION, scope);
	const uiModeValue = configuration.get<string>('uiMode', 'quickPick');

	return {
		makefilePaths: configuration.get<string[]>('makefilePaths', []),
		autoRefresh: configuration.get<boolean>('autoRefresh', true),
		groupByWorkspace: configuration.get<boolean>('groupByWorkspace', false),
		defaultMakefileTemplate: configuration.get<unknown>('defaultMakefileTemplate'),
		uiMode: uiModeValue === 'treeView' ? 'treeView' : 'quickPick',
		debug: configuration.get<boolean>('debug', false),
	};
}

export function isConfigChanged(event: vscode.ConfigurationChangeEvent): boolean {
	return event.affectsConfiguration(SECTION);
}
