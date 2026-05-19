export interface Logger {
	debug(message: string): void;
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
}

export function createLogger(isDebugEnabled: () => boolean): Logger {
	return {
		debug(message: string) {
			if (isDebugEnabled()) {
				console.debug(`[makefile-target-runner] ${message}`);
			}
		},
		info(message: string) {
			console.info(`[makefile-target-runner] ${message}`);
		},
		warn(message: string) {
			console.warn(`[makefile-target-runner] ${message}`);
		},
		error(message: string) {
			console.error(`[makefile-target-runner] ${message}`);
		},
	};
}
