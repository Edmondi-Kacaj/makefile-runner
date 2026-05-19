# Change Log

All notable changes to the "makefile-target-runner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.0] - 2026-05-19

### Added

- Hierarchical Makefile command panel.
- New configuration options: `groupBy`, `showPrivateTargets`, `terminalReuse`.
- Support for excluding folders during Makefile discovery.
- Reuse terminal for running targets.

### Fixed

- Resolved non-clickable tree view items.
- Corrected terminal path issues for Makefiles in subdirectories.

## [0.1.0] - 2026-05-19

### Added

- Command to run discovered Makefile targets from a searchable Quick Pick.
- Command to refresh discovered Makefile targets.
- Command to create a default Makefile from a configurable template.
- Automatic Makefile discovery with multi-root workspace support.
- File watching and cache invalidation for live target updates.
- Extension configuration for discovery paths, UI behavior, templates, and debug logging.
- Keyboard shortcuts for run, refresh, and create-default-makefile commands.
- Unit tests for Makefile parsing and template generation.