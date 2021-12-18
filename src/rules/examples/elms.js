import Logger from "../../lib/logger.js";
const logger = Logger("rule:elms");

/**
 * @typedef ElmsConfig
 * @property {"error"|"warn"} method The method to call on reporter
 * @property {String} message The message to warn/error with
 * @property {String} selector Selector to find the element we want to warn/error with.
 *                             The first of all matching elements will be used.
 */

export default {
    /**
     * Generates a linting function from a config
     * @param {ElmsConfig} config
     */
    generate(config) {
        /**
         * Performs the linting according to the previously passed config.
         * @param {Reporter} reporter The reporter to report warnings/errors to
         * @param {Cheerio} $ A cheerio representation of the document
         * @param {AST} ast The underlying AST representation of the document.
         *                  This should be given to Reporter when warning/erroring with a node.
         */
        return function ElmsRule(reporter, $, ast) {
            logger.debug("Called", config);
            const elm = $(config.selector)[0];
            reporter[config.method](config.message, elm, ast);
        };
    }
};
