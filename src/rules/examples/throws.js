import Logger from "../../lib/logger.js";
const logger = Logger("rule:throws");

/**
 * @typedef ThrowsConfig
 * @property {String} message The message to throw
 */

export default {
    /**
     * Generates a linting function from a config
     * @param {ThrowsConfig} config
     */
    generate(config) {
        return function ThrowsRule(reporter) {
            logger.debug("Called", config);
            reporter.warn("This will throw now");
            throw new Error(config.message);
        };
    }
};
