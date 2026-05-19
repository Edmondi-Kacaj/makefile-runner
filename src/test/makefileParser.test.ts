import * as assert from 'node:assert/strict';
import { parseMakefile } from '../makefileParser';

suite('parseMakefile', () => {
	test('extracts runnable targets and preserves order', () => {
		const content = [
			'# comment',
			'.PHONY: build test clean',
			'build test: deps',
			'\t@echo "run"',
			'clean: ; @echo "clean"',
		].join('\n');

		const result = parseMakefile(content);

		assert.deepEqual(result.targets, ['build', 'test', 'clean']);
	});

	test('ignores variable assignments and special targets', () => {
		const content = [
			'VERSION := 1.0.0',
			'all: build',
			'$(BIN):',
			'.DEFAULT_GOAL: all',
			'deploy-prod: all',
		].join('\n');

		const result = parseMakefile(content);

		assert.deepEqual(result.targets, ['all', 'deploy-prod']);
	});

	test('ignores targets inside define blocks', () => {
		const content = [
			'define SCRIPT',
			'not-a-target:',
			'endef',
			'real-target: deps',
		].join('\n');

		const result = parseMakefile(content);

		assert.deepEqual(result.targets, ['real-target']);
	});
});