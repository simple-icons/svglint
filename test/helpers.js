import {inspect as nodeInspect} from 'node:util';
import {chalk} from '../src/cli/util.js';
import SVGLint from '../src/svglint.js';

/** @typedef {import('../src/svglint.js').Config} Config */

function inspect(object) {
	return chalk.reset(nodeInspect(object, false, 3, true));
}

/**
 * Factory function to create a test that succeeds
 * @param {String} svg The SVG to lint
 * @param {any} ruleNameOrConfig Rule name or raw config to test
 * @returns {(Object) => Promise<void>}
 */
export function testSucceedsFactory(svg, ruleNameOrConfig) {
	/**
	 * Tests that a config succeeds when ran
	 * @param {Object} ruleConfig The rule config to test when ruleNameOrConfig is a string
	 * @returns {Promise<void>} Throws if linting fails
	 */
	return async (ruleConfig) =>
		// eslint-disable-next-line no-async-promise-executor
		new Promise(async (resolve, reject) => {
			/** @type {Config} */
			const config =
				typeof ruleNameOrConfig === 'string'
					? {rules: {[ruleNameOrConfig]: ruleConfig}}
					: ruleNameOrConfig;
			const linting = await SVGLint.lintSource(svg, config);

			linting.on('done', () => {
				if (linting.state === linting.STATES.success) {
					resolve();
				} else {
					reject(
						new Error(`Linting failed (${linting.state}): ${inspect(config)}`),
					);
				}
			});

			linting.lint();
		});
}

/**
 * Factory function to create a test that fails
 * @param {String} svg The SVG to lint
 * @param {any} ruleNameOrConfig Rule name or raw config to test
 * @returns {(Object) => Promise<void>}
 */
export function testFailsFactory(svg, ruleNameOrConfig) {
	/**
	 * Tests that a config fails when ran
	 * @param {Object} ruleConfig The rule config to test when ruleNameOrConfig is a string
	 * @returns {Promise<void>} Throws if the linting doesn't fail
	 */
	return async (ruleConfig) =>
		// eslint-disable-next-line no-async-promise-executor
		new Promise(async (resolve, reject) => {
			/** @type {Config} */
			const config =
				typeof ruleNameOrConfig === 'string'
					? {rules: {[ruleNameOrConfig]: ruleConfig}}
					: ruleNameOrConfig;
			const linting = await SVGLint.lintSource(svg, config);

			linting.on('done', () => {
				if (linting.state === linting.STATES.error) {
					resolve();
				} else {
					reject(
						new Error(
							`Linting did not fail (${linting.state}): ${inspect(config)}`,
						),
					);
				}
			});

			linting.lint();
		});
}
