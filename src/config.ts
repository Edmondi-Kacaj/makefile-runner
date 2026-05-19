import * as vscode from 'vscode';

export interface ExtensionConfig {
	makefilePaths: string[];
	excludePaths: string[];
	autoRefresh: boolean;
	groupBy: 'none' | 'workspace' | 'makefile';
	showPrivateTargets: boolean;
	terminalReuse: boolean;
	defaultMakefileTemplate?: unknown;
	showQuickPick: boolean;
	showTreeView: boolean;
	debug: boolean;
}

const SECTION = 'makefileRunner';

export function getConfig(scope?: vscode.ConfigurationScope): ExtensionConfig {
	const configuration = vscode.workspace.getConfiguration(SECTION, scope);
	const legacyGroupByWorkspace = configuration.get<boolean>('groupByWorkspace', false);
	const groupBy = configuration.get<'none' | 'workspace' | 'makefile'>(
		'groupBy',
		legacyGroupByWorkspace ? 'workspace' : 'none',
	);

	return {
		makefilePaths: configuration.get<string[]>('makefilePaths', []),
		excludePaths: configuration.get<string[]>('excludePaths', []),
		autoRefresh: configuration.get<boolean>('autoRefresh', true),
		groupBy,
		showPrivateTargets: configuration.get<boolean>('showPrivateTargets', false),
		terminalReuse: configuration.get<boolean>('terminalReuse', true),
		defaultMakefileTemplate: configuration.get<unknown>('defaultMakefileTemplate'),
		showQuickPick: configuration.get<boolean>('showQuickPick', true),
		showTreeView: configuration.get<boolean>('showTreeView', false),
		debug: configuration.get<boolean>('debug', false),
	};
}

export function isConfigChanged(event: vscode.ConfigurationChangeEvent): boolean {
	return event.affectsConfiguration(SECTION);
}
