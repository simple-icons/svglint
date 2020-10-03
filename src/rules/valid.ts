import Reporter from "../lib/reporter";
import { AST } from "../lib/parse";
import { validate } from "fast-xml-parser";
import Logger from "../lib/logger";
const logger = Logger("rule:valid");

export type Config = boolean;

/**
 * Workflow:
 * 1. Validate the SVG using fast-xml-parser
 * 2. If the SVG is not valid, report an error
 */
export default function generate(enabled: Config) {
    /**
     * Performs the linting according to the previously passed config.
     * @param {Reporter} reporter The reporter to report warnings/errors to
     * @param {Cheerio} $ A cheerio representation of the document
     * @param {AST} ast The underlying AST representation of the document.
     *                  This should be given to Reporter when warning/erroring with a node.
     */
    return function ValidRule(reporter: Reporter, $: Cheerio, ast: AST) {
        logger.debug("Called", enabled);
        if (!enabled) {
            return;
        }
        if (!ast.source) {
            logger.debug("Encountered empty SVG. Considering valid");
            return;
        }
        const result = validate(ast.source);
        if (result !== true) {
            reporter.error(result.err.msg, null, ast);
        }
    };
}
