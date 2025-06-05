#!/usr/bin/env node
/**
 * @fileoverview The CLI that is executed from a terminal.
 * Acts as an interface to the JS API
 */
import path from 'node:path';
import process from 'node:process';
import {glob} from 'glob';
import meow from 'meow';
import {loadConfigurationFile} from '../src/cli/config.js';
import GUI from '../src/cli/gui.js';
import {chalk} from '../src/cli/util.js';
import logging from '../src/lib/logger.js';
import SVGLint, {normalizeConfig} from '../src/svglint.js';

// @ts-ignore

const logger = logging('');

const EXIT_CODES = Object.freeze({
	success: 0,
	violations: 1,
	unexpected: 2,
	interrupted: 3,
	configuration: 4,
});

// Used by meow's loud reject

console.error = logger.error.bind(logger);

// Pretty logs all errors, then exits
process.on('uncaughtException', (error) => {
	logger.error(error);
	process.exit(EXIT_CODES.unexpected);
});

// Handle SIGINT
process.on('SIGINT', () => {
	process.exit(EXIT_CODES.interrupted);
});

// Generates the CLI binding using meow
const cli = meow(
	`
        ${chalk.yellow('Usage:')}
            ${chalk.bold('svglint')} [--config config.js] [--ci] [--debug] ${chalk.bold('file1.svg file2.svg')}
            ${chalk.bold('svglint')} --stdin [--config config.js] [--no-summary] [--ci] [--debug] < ${chalk.bold('file1.svg')}

        ${chalk.yellow('Options:')}
            ${chalk.bold('--help')}        Display this help text
            ${chalk.bold('--version')}     Show the current SVGLint version
            ${chalk.bold('--config, -c')}  Specify the config file. Defaults to '.svglintrc.js'
            ${chalk.bold('--debug,  -d')}  Show debug logs
            ${chalk.bold('--ci, -C')}      Only output to stdout once, when linting is finished
            ${chalk.bold('--stdin')}       Read an SVG from stdin
            ${chalk.bold('--summary')}     Print the summary at the end (default)`,
	{
		importMeta: import.meta,
		flags: {
			config: {type: 'string', shortFlag: 'c'},
			debug: {type: 'boolean', shortFlag: 'd'},
			ci: {type: 'boolean', shortFlag: 'C'},
			stdin: {type: 'boolean'},
			summary: {type: 'boolean', default: true},
		},
	},
);

const gui = new GUI({printSummary: cli.flags.summary});

process.on('exit', () => {
	gui.finish();
});

/** CLI main function */
// eslint-disable-next-line unicorn/prefer-top-level-await
(async function () {
	if (cli.flags.debug) {
		logging.setLevel(logging.LEVELS.debug);
	}

	gui.setCI(cli.flags.ci);

	// Load the config
	let configObject;
	try {
		configObject = await loadConfigurationFile(cli.flags.config);
		if (configObject === null) {
			logger.debug('No configuration file found');
			if (cli.flags.config) {
				logger.error('Configuration file not found');
				process.exit(EXIT_CODES.configuration);
			} else {
				configObject = {};
			}
		} else if (configObject === undefined) {
			logger.error(
				'Default export missing from configuration file (use `export default {...}` or `module.exports = {...}`)',
			);
			process.exit(EXIT_CODES.configuration);
		}
	} catch (error) {
		logger.error(`Failed to parse config: ${error.stack}`);
		process.exit(EXIT_CODES.configuration);
	}

	if (cli.flags.stdin) {
		// Lint what's provided on stdin
		const chunks = [];

		process.stdin.on('readable', () => {
			let chunk;
			while ((chunk = process.stdin.read()) !== null) {
				chunks.push(chunk);
			}
		});

		process.stdin.on('end', async () => {
			const source = chunks.join('');
			const normalizedConfig = await normalizeConfig(configObject);
			SVGLint.lintSourceWithNormalizedConfig(source, normalizedConfig)
				.then((linting) => {
					// Handle case where linting failed (e.g. invalid file)
					if (!linting) {
						process.exit(EXIT_CODES.success);
					}

					// Otherwise add it to GUI and wait for it to finish
					gui.addLinting(linting);
					linting.on('done', () => {
						if (linting.state === linting.STATES.error) {
							process.exit(EXIT_CODES.violations);
						} else {
							process.exit(EXIT_CODES.success);
						}
					});
					linting.lint();
				})
				.catch((error) => {
					logger.error('Failed to lint\n', error);
				});
		});
	} else {
		// Lint all the CLI specified files
		const ignore = configObject.ignore || [];
		delete configObject.ignore; // Remove ignore from config to avoid passing it to SVGLint
		const files = cli.input
			.flatMap((v) => glob.sync(v, {ignore}))
			.map((v) => path.resolve(process.cwd(), v));

		// Keep track so we know when every linting has finished
		let hasErrors = false;
		let activeLintings = files.length;
		const onLintingDone = () => {
			--activeLintings;
			logger.debug('Linting done,', activeLintings, 'to go');
			if (activeLintings <= 0) {
				process.exit(hasErrors ? EXIT_CODES.violations : EXIT_CODES.success);
			}
		};

		const normalizedConfig = await normalizeConfig(configObject);
		for (const filePath of files) {
			SVGLint.lintFileWithNormalizedConfig(filePath, normalizedConfig)
				.then((linting) => {
					// Handle case where linting failed (e.g. invalid file)
					if (!linting) {
						onLintingDone();
						return;
					}

					// Otherwise add it to GUI and wait for it to finish
					gui.addLinting(linting);
					linting.on('done', () => {
						if (linting.state === linting.STATES.error) {
							hasErrors = true;
						}

						onLintingDone();
					});
					linting.lint();
				})
				.catch((error) => {
					logger.error('Failed to lint file', filePath, '\n', error);
				});
		}
	}
})();
