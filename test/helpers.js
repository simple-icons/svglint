import util from 'node:util';
import {chalk} from '../src/cli/util.js';
import SVGLint from '../src/svglint.js';

function inspect(object) {
    return chalk.reset(util.inspect(object, false, 3, true));
}

export function testSucceedsFactory(svg, ruleNameOrConfig) {
    /**
     * Tests that a config succeeds when ran
     * @param {Config} config The config to test
     * @param {String} [svg=testSVG] The SVG to lint
     * @returns {Promise<void>} Throws if linting fails
     */
    return async (config) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const _config =
                typeof ruleNameOrConfig === 'string'
                    ? {rules: {[ruleNameOrConfig]: config}}
                    : ruleNameOrConfig;
            const linting = await SVGLint.lintSource(svg, _config);

            // TODO: there is a race condition here. The this.lint() method
            // of the Linting class is called in the constructor, so it's possible
            // that the linting is already done before we call the on('done')
            // event listener. Removing the next condition will make some `valid`
            // rules tests fail.
            if (linting.state === linting.STATES.success) {
                resolve();
            } else if (linting.state !== linting.STATES.linting) {
                reject(
                    new Error(
                        `Linting failed (${linting.state}): ${inspect(config)}`,
                    ),
                );
            }

            linting.on('done', () => {
                if (linting.state === linting.STATES.success) {
                    resolve();
                } else {
                    reject(
                        new Error(
                            `Linting failed (${linting.state}): ${inspect(config)}`,
                        ),
                    );
                }
            });
        });
    };
}

export function testFailsFactory(svg, ruleNameOrConfig) {
    /**
     * Tests that a config fails when ran
     * @param {Config} config The config to test
     * @param {String} svg The SVG to lint
     * @returns {Promise<void>} Throws if the linting doesn't fail
     */
    return async (config) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const _config =
                typeof ruleNameOrConfig === 'string'
                    ? {rules: {[ruleNameOrConfig]: config}}
                    : ruleNameOrConfig;
            const linting = await SVGLint.lintSource(svg, _config);

            // TODO: Same that the TODO explained at testSucceedsFactory
            if (linting.state === linting.STATES.error) {
                resolve();
            } else if (linting.state !== linting.STATES.linting) {
                reject(
                    new Error(
                        `Linting did not fail (${linting.state}): ${inspect(_config)}`,
                    ),
                );
            }

            linting.on('done', () => {
                if (linting.state === linting.STATES.error) {
                    resolve();
                } else {
                    reject(
                        new Error(
                            `Linting did not fail (${linting.state}): ${inspect(_config)}`,
                        ),
                    );
                }
            });
        });
    };
}
