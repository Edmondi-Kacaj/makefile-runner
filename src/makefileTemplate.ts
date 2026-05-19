export function buildDefaultMakefileTemplate(templateValue: unknown): string {
	if (typeof templateValue === 'string' && templateValue.trim()) {
		return normalizeTrailingNewline(templateValue);
	}

	if (isTemplateObject(templateValue)) {
		const sections = Object.entries(templateValue)
			.filter(([, command]) => typeof command === 'string' && command.trim())
			.map(([target, command]) => `${target}:\n\t${command}`);

		if (sections.length > 0) {
			return normalizeTrailingNewline(sections.join('\n\n'));
		}
	}

	return [
		'.PHONY: build test clean',
		'',
		'build:',
		'\t@echo "Build step"',
		'',
		'test:',
		'\t@echo "Test step"',
		'',
		'clean:',
		'\t@echo "Clean step"',
		'',
	].join('\n');
}

function isTemplateObject(value: unknown): value is Record<string, string> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeTrailingNewline(value: string): string {
	return value.endsWith('\n') ? value : `${value}\n`;
}
