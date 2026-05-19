# Makefile Runner

A lightweight, fast VS Code extension that instantly discovers and runs Makefile targets with a searchable Quick Pick interface. Perfect for teams using Makefiles to automate builds, tests, deployments, and dev workflows.

## Features

- **Lightning-fast discovery**: In-memory caching of parsed Makefile targets.
- **Smart search**: Quickly find targets by name using Quick Pick.
- **Multi-workspace support**: Works seamlessly with multi-root workspaces.
- **Live watching**: Automatically refreshes when Makefiles change.
- **Create Makefiles**: Generate a default Makefile if none exists.
- **Highly configurable**: Customize paths, templates, and debug settings.

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| **Makefile: Run Target** | `Ctrl+Alt+M` / `Cmd+Alt+M` | Open Quick Pick to select and run a target. |
| **Makefile: Refresh Targets** | `Ctrl+Alt+Shift+M` / `Cmd+Alt+Shift+M` | Refresh the cached target list. |
| **Makefile: Create Default Makefile** | `Ctrl+Alt+N` / `Cmd+Alt+N` | Generate a default Makefile in your workspace. |

## How It Works

1. **Discovery**: Scans your workspace for Makefiles in common locations.
2. **Parsing**: Extracts runnable targets from Makefiles.
3. **Caching**: Stores targets in memory for instant lookup.
4. **Watching**: Automatically refreshes when Makefiles change.
5. **Execution**: Runs selected targets in VS Code's integrated terminal.

## Usage

### Run a Target

1. Press `Ctrl+Alt+M` (Windows/Linux) or `Cmd+Alt+M` (Mac).
2. Search for a target using Quick Pick.
3. Select the target to run it in the terminal.

### Refresh Targets

1. Press `Ctrl+Alt+Shift+M` (Windows/Linux) or `Cmd+Alt+Shift+M` (Mac).
2. The target list will refresh automatically.

### Create a Default Makefile

1. Press `Ctrl+Alt+N` (Windows/Linux) or `Cmd+Alt+N` (Mac).
2. A default Makefile will be created in your workspace.

## Configuration

Customize the extension using the following settings:

- `makefileRunner.discoveryPaths`: Additional paths to search for Makefiles.
- `makefileRunner.groupBy`: Group targets by folder or workspace.
- `makefileRunner.showPrivateTargets`: Include private targets in the list.
- `makefileRunner.terminalReuse`: Reuse the same terminal for running targets.

## License

This extension is licensed under the MIT License.