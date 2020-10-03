import Reporter from "../lib/reporter";
import { AST } from "../lib/parse";
import Logger from "../lib/logger";
const logger = Logger("rule:elm");

import type { Cheerio } from "../types";

type CustomRule = (reporter: Reporter, cheerio: Cheerio, ast: AST) => void;
export type Config = CustomRule;

export default function generate(config: Config) {
    /**
     * Performs the linting according to the previously passed config.
     * @param reporter The reporter to report warnings/errors to
     * @param $ A cheerio representation of the document
     * @param ast The underlying AST representation of the document. This should be given to Reporter when warning/erroring with a node.
     */
    return function CustomRule(reporter: Reporter, $: Cheerio, ast: AST) {
        logger.debug("Called", config);
        return config(reporter, $, ast);
    };
}
