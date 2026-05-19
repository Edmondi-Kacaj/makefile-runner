export interface ParseResult {
	targets: string[];
}

const VALID_TARGET_PATTERN = /^[A-Za-z0-9_./%+-]+$/;

export function parseMakefile(content: string): ParseResult {
	const targets: string[] = [];
	const seen = new Set<string>();
	const lines = content.split(/\r?\n/);
	let inDefineBlock = false;

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed.startsWith('define ')) {
			inDefineBlock = true;
			continue;
		}

		if (inDefineBlock) {
			if (trimmed === 'endef') {
				inDefineBlock = false;
			}
			continue;
		}

		if (!trimmed || trimmed.startsWith('#') || line.startsWith('\t')) {
			continue;
		}

		const match = line.match(/^([^\s:#][^:#]*)\s*:(?![=])/);
		if (!match) {
			continue;
		}

		const rawTargetSection = match[1].trim();
		const candidateTargets = rawTargetSection.split(/\s+/);

		for (const candidate of candidateTargets) {
			if (!isRunnableTarget(candidate) || seen.has(candidate)) {
				continue;
			}

			seen.add(candidate);
			targets.push(candidate);
		}
	}

	return { targets };
}

function isRunnableTarget(target: string): boolean {
	if (!target || target.startsWith('.') || target.includes('$(') || target.includes(')')) {
		return false;
	}

	return VALID_TARGET_PATTERN.test(target);
}
