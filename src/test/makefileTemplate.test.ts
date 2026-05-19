import * as assert from 'node:assert/strict';
import { buildDefaultMakefileTemplate } from '../makefileTemplate';

suite('buildDefaultMakefileTemplate', () => {
	test('uses default template when input is invalid', () => {
		const content = buildDefaultMakefileTemplate(undefined);

		assert.match(content, /^\.PHONY: build test clean/m);
		assert.match(content, /^build:\n\t@echo "Build step"/m);
		assert.match(content, /^test:\n\t@echo "Test step"/m);
		assert.match(content, /^clean:\n\t@echo "Clean step"/m);
	});

	test('returns provided string template and normalizes trailing newline', () => {
		const content = buildDefaultMakefileTemplate('hello:\n\t@echo "hi"');

		assert.equal(content, 'hello:\n\t@echo "hi"\n');
	});

	test('builds template from object entries and ignores empty commands', () => {
		const content = buildDefaultMakefileTemplate({
			build: '@echo "Build custom"',
			test: '   ',
			clean: '@echo "Clean custom"',
		});

		assert.equal(content, 'build:\n\t@echo "Build custom"\n\nclean:\n\t@echo "Clean custom"\n');
	});
});