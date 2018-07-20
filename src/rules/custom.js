const logger = require("../lib/logger")("rule:elm");

/**
 * @typedef {Function} CustomConfig
 * The function will be executed as if though it was a rule.
 */

module.exports = {
    /**
     * Generates a linting function from a config
     * @param {CustomConfig} config 
     */
    generate(config) {
        /**
         * Performs the linting according to the previously passed config.
         * @param {Reporter} reporter The reporter to report warnings/errors to
         * @param {Cheerio} $ A cheerio representation of the document
         * @param {AST} ast The underlying AST representation of the document.
         *                  This should be given to Reporter when warning/erroring with a node.
         */
        return function CustomRule(reporter, $, ast) {
            logger.debug("Called", config);
            return config(reporter, $, ast);
        };
    }
};
