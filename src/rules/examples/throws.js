import logging from '../../lib/logger.js';

const logger = logging('rule:throws');

/**
 * @typedef ThrowsConfig
 * @property {String} message The message to throw
 */

const throwsExample = {
    /**
     * Generates a linting function from a config
     * @param {ThrowsConfig} config
     */
    generate(config) {
        return function (reporter) {
            logger.debug('Called', config);
            reporter.warn('This will throw now');
            throw new Error(config.message);
        };
    },
};

export default throwsExample;
