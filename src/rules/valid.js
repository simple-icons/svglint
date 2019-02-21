const logger = require("../lib/logger")("rule:attr");
const xmlParser = require("fast-xml-parser");

/** @typedef {import("../lib/reporter.js")} Reporter */
/** @typedef {import("../lib/parse.js").AST} AST */
/** @typedef {import("../lib/parse.js").Node} Node */

/**
* Workflow:
* 1. Validate the SVG using fast-xml-parser
* 2. If the SVG is not valid, report an error
*/

module.exports = {
    /**
     * Generates a linting function from a config
     * @param {boolean} config
     */
    generate(enabled) {
        /**
         * Performs the linting according to the previously passed config.
         * @param {Reporter} reporter The reporter to report warnings/errors to
         * @param {Cheerio} $ A cheerio representation of the document
         * @param {AST} ast The underlying AST representation of the document.
         *                  This should be given to Reporter when warning/erroring with a node.
         */
        return function ValidRule(reporter, $, ast) {
            logger.debug("Called", enabled);
            if (!enabled) {
                return;
            }
            console.log('hoi', enabled)
            const result = xmlParser.validate(ast.source);
            if (result !== true) {
                reporter.error(result.err.msg, ast[0], ast);
            }
        };
    }
};
