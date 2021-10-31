import Logger from "../lib/logger.js";
const logger = Logger("rule:elm");

/** @typedef {import("../lib/reporter.js")} Reporter */
/** @typedef {import("../lib/parse.js").AST} AST */
/** @typedef {import("../lib/parse.js").Node} Node */

/**
 * @callback CustomRule
 * @param {Reporter} reporter The reporter to report to
 * @param {Cheerio} $ A cheerio representation of the document
 * @param {AST} ast The AST of the document, which we should pass to reporter
 */
/**
 * @typedef {CustomRule} CustomConfig
 * The function will be executed as if though it was a rule.
 */

export default {
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
