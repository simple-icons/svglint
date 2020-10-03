import Logger from "../../lib/logger";
import Reporter from "../../lib/reporter";
import { AST } from "../../lib/parse";
const logger = Logger("rule:elms");

export type Config = {
    // The method to call on reporter
    method: "error" | "warn";
    // The message to warn/error with
    message: string;
    // Selector to find the element we want to warn/error with.
    selector: string;
};

export default function generate(config: Config) {
    /**
     * Performs the linting according to the previously passed config.
     * @param reporter The reporter to report warnings/errors to
     * @param $ A cheerio representation of the document
     * @param ast The underlying AST representation of the document.
     *                  This should be given to Reporter when warning/erroring with a node.
     */
    return function ElmsRule(reporter: Reporter, $: CheerioAPI, ast: AST) {
        logger.debug("Called", config);
        const elm = $(config.selector)[0];
        reporter[config.method](config.message, elm, ast);
    };
}
