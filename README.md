# Makefile Target Runner

A lightweight, fast VS Code extension that instantly discovers and runs Makefile targets with a searchable Quick Pick interface. Perfect for teams using Makefiles to automate builds, tests, deployments, and dev workflows.

## What It Does

Makefile Target Runner eliminates the need to memorize or search for build targets. Open the Quick Pick with a keyboard shortcut, search for your target, and run it—all without leaving VS Code.

**Example workflow:**
- Press `Ctrl+Alt+M` (or `Cmd+Alt+M` on Mac)
- Type "test" to filter targets
- Select `npm test` or `make test`
- Watch the target execute in VS Code's integrated terminal

## Key Features

- **⚡ Lightning-fast discovery:** In-memory caching of parsed Makefile targets
- **🔍 Smart search:** Quick Pick lets you find targets by name instantly
- **📁 Multi-workspace support:** Works seamlessly with multi-root workspaces; optionally group targets by folder
- **🔄 Live watching:** Automatically refreshes when Makefiles change (configurable)
- **🛠️ Create Makefiles:** Quick command to generate a default Makefile if none exists
- **⚙️ Highly configurable:** Additional paths, custom templates, debug mode, and more

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| **Makefile: Run Target** | `Ctrl+Alt+M` / `Cmd+Alt+M` | Open Quick Pick to select and run a target |
| **Makefile: Refresh Targets** | `Ctrl+Alt+Shift+M` / `Cmd+Alt+Shift+M` | Manually refresh the cached target list |
| **Makefile: Create Default Makefile** | `Ctrl+Alt+N` / `Cmd+Alt+N` | Generate a default Makefile in your workspace |

## How It Works

1. **Discovery:** On activation, the extension scans your workspace for Makefiles in common locations (root, `build/`, `scripts/`, etc.)
2. **Parsing:** Each Makefile is parsed to extract runnable targets (ignoring comments, `define` blocks, and non-runnable rules)
3. **Caching:** Targets are stored in memory for instant lookup via Quick Pick
4. **Watching:** File changes trigger automatic cache invalidation and refresh
5. **Execution:** When you select a target, it runs in VS Code's integrated terminal

### Fallback Workflow

If no Makefile is found:
- The extension prompts you to create a default Makefile, or
- Select an existing Makefile and add it to your extension settings

## Usage

### Run a Target

1. Press `Ctrl+Alt+M` (Windows/Linux) or `Cmd+Alt+M` (Mac)
2. The Quick Pick menu opens showing all discovered targets
3. Type to filter targets by name
4. Select a target and press Enter—it runs in the terminal

### Manage Makefiles

**Create a new default Makefile:**
- Press `Ctrl+Alt+N` / `Cmd+Alt+N`
- A Makefile with sample `build`, `test`, and `clean` targets is created

**Add custom Makefile paths:**
- See [Extension Settings](#extension-settings) below

**Refresh targets manually:**
- Press `Ctrl+Alt+Shift+M` / `Cmd+Alt+Shift+M` if auto-refresh is disabled

## Extension Settings

Configure these settings in VS Code (`settings.json` or UI):

- **`makefileTargetRunner.makefilePaths`** (`string[]`, default: `[]`)  
  Additional Makefile paths or glob patterns to search (e.g., `["./build/Makefile", "**/Makefile.custom"]`)

- **`makefileTargetRunner.autoRefresh`** (`boolean`, default: `true`)  
  Automatically refresh cached targets when Makefiles change on disk

- **`makefileTargetRunner.groupByWorkspace`** (`boolean`, default: `false`)  
  Group Quick Pick entries by workspace folder name (useful for multi-root workspaces)

- **`makefileTargetRunner.defaultMakefileTemplate`** (`string | object`)  
  Custom template for generated Makefiles. Either a raw string or object of target names to commands:
  ```json
  {
    "build": "npm run build",
    "test": "npm test",
    "deploy": "npm run deploy"
  }
  ```

- **`makefileTargetRunner.showQuickPick`** (`boolean`, default: `true`)  
  Show or hide the Quick Pick command and keybinding used to select targets

- **`makefileTargetRunner.showTreeView`** (`boolean`, default: `false`)  
  Show or hide the Makefile Targets tree view in the sidebar

- **`makefileTargetRunner.debug`** (`boolean`, default: `false`)  
  Enable verbose logging in VS Code's Extension Host output for troubleshooting

## Tips & Best Practices

- **Makefile placement:** Keep Makefiles in your workspace root or common build directories for automatic discovery
- **Target naming:** Use descriptive, lowercase target names for better searchability (e.g., `build-web`, `test-unit`, `deploy-prod`)
- **Large workspaces:** First-time discovery may take a moment; subsequent lookups use the cache for speed
- **Multi-root setups:** Enable `groupByWorkspace` to see folder names next to targets
- **Custom paths:** Use glob patterns in `makefileTargetRunner.makefilePaths` to include Makefiles outside standard locations

## Troubleshooting

**Extension not finding Makefiles:**
- Check that Makefiles are in standard locations or add paths via settings
- Run `Makefile: Refresh Targets` to manually re-scan
- Enable `makefileTargetRunner.debug` and check the Extension Host output

**Commands not appearing in Quick Pick:**
- Ensure targets use standard Makefile syntax (not `.PHONY` only, but actual target definitions)
- Verify the Makefile has valid syntax and is readable

**Performance issues on large workspaces:**
- Consider narrowing search paths in `makefileTargetRunner.makefilePaths`
- Disable `autoRefresh` if you have many files and don't need live updates

## License

MIT