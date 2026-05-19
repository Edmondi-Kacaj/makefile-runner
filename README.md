# Makefile Target Runner

Makefile Target Runner is a lightweight VS Code extension focused on one workflow: quickly finding and running Makefile targets from a searchable Quick Pick.

## Features

- In-memory caching of parsed Makefile targets for fast command execution.
- Automatic Makefile discovery in workspace roots and subdirectories.
- Multi-root workspace support with optional grouping in Quick Pick.
- File watching with debounced cache invalidation and refresh.
- Manual refresh command for deterministic updates.
- Friendly fallback flow when no Makefile is found:
1. Create a default Makefile.
2. Select an existing Makefile and add it to settings.

## Commands

- `Makefile: Run Target` (`makefileTargetRunner.quickPick`)
- `Makefile: Refresh Targets` (`makefileTargetRunner.refreshTargets`)
- `Makefile: Create Default Makefile` (`makefileTargetRunner.createDefaultMakefile`)

## Extension Settings

- `makefileTargetRunner.makefilePaths` (`string[]`, default: `[]`)
Additional Makefile paths or glob patterns to include in discovery.

- `makefileTargetRunner.autoRefresh` (`boolean`, default: `true`)
Automatically refresh cached targets when watched Makefiles change.

- `makefileTargetRunner.groupByWorkspace` (`boolean`, default: `false`)
Group Quick Pick targets by workspace folder name.

- `makefileTargetRunner.defaultMakefileTemplate` (`string | Record<string, string>`)
Template used when creating a Makefile from the fallback flow.

- `makefileTargetRunner.uiMode` (`"quickPick" | "treeView"`, default: `"quickPick"`)
Current implementation uses Quick Pick. `treeView` is reserved for future support.

- `makefileTargetRunner.debug` (`boolean`, default: `false`)
Enables debug logging in the extension host.

## Notes

- Parsing is intentionally conservative and targets standard Makefile target syntax.
- On very large workspaces, discovery may take longer on first load, then become fast via cache reuse.

## Build, Package, and Local Install

This extension is not published to the VS Code Marketplace yet. You can build and install it locally.

### Prerequisites

- Node.js 22+
- npm
- `@vscode/vsce` installed globally:

```bash
npm install -g @vscode/vsce
```

### Build

```bash
npm install
npm run compile
```

### Package (`.vsix`)

```bash
vsce package
```

This creates a file like:

- `makefile-target-runner-0.0.1.vsix`

### Install from Local File

```bash
code --install-extension makefile-target-runner-0.0.1.vsix
```

You can also install from VS Code UI:

1. Open Extensions view.
2. Click the `...` menu.
3. Select `Install from VSIX...`.
4. Pick the generated `.vsix` file.

## License

MIT