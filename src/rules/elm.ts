import Reporter from "../lib/reporter";
import { AST } from "../lib/parse";
import Logger from "../lib/logger";
const logger = Logger("rule:elm");

import type { Cheerio, CheerioElement } from "../types";

/**
 * The key is used as selector. The value has the following meanings:
 * - `{Boolean}` If true the selector must be matched. If false the selector must not be matched.
 * - `{Number}` The number of elements the selector must resolve to. Must be exact.
 * - `{Array<Number>}` The number of elements the selector resolves to must be between the first and the second number.
 *
 * Note that if an element is disallowed by one rule, but allowed by another, it will be allowed.
 * This allows you to do e.g. `{ "title": false, "svg > title": true }`.
 */
export type Config = {
    [selector: string]: boolean | number | number[];
};

type RuleElmResult = {
    elm: CheerioElement | null;
    message: string;
};
type RuleExecution = {
    allowed: RuleElmResult[];
    disallowed: RuleElmResult[];
};

/**
 * Workflow:
 * 1. Find all { allowed: [], disallowed: [] }
 * 2. Filter .disallowed by not in .allowed
 * 3. If .disallowed.length, fail
 *
 * Rules act like this:
 * - {true} If found, put in allowed
 * - {false} If found, put in disallowed
 * - {Number} If exact match, put all in allowed. If not, put all in disallowed.
 * - {Array<Number>} If match, put all in allowed. If not, put all in disallowed.
 *
 * This means that e.g. `{ "b": 2, "a > b": true}` with "<b/><b/><a><b/><b/></a>"
 * will fail, which is something to keep in mind.
 */

function executeRule(
    selector: string,
    config: boolean | number | number[],
    $: Cheerio
) {
    const outp: RuleExecution = {
        allowed: [],
        disallowed: [],
    };

    const matches: RuleElmResult[] = $.find(selector)
        .toArray()
        .map(elm => ({ elm, message: "" }));
    let allowed: boolean | null = null;
    let message: string = "";
    switch (typeof config) {
        case "boolean":
            if (config) {
                allowed = true;
                if (!matches.length) {
                    outp.disallowed.push({
                        elm: null,
                        message: `Expected '${selector}', none found`,
                    });
                }
            } else {
                allowed = false;
                message = "Element disallowed";
            }
            break;
        case "number":
            if (matches.length === config) {
                allowed = true;
            } else {
                allowed = false;
                message = `Found ${matches.length} elements for '${selector}', expected ${config}`;
                if (!matches.length) {
                    matches.push({ elm: null, message: "" });
                }
            }
            break;
        default:
            if (
                config instanceof Array &&
                config.length === 2 &&
                typeof config[0] === "number" &&
                typeof config[1] === "number"
            ) {
                if (
                    matches.length >= config[0] &&
                    matches.length <= config[1]
                ) {
                    allowed = true;
                } else {
                    outp.disallowed.push({
                        elm: null,
                        message: `Found ${matches.length} elements for '${selector}', expected between ${config[0]} and ${config[1]}`,
                    });
                }
            } else {
                throw `Unknown config type '${typeof config}' (${JSON.stringify(
                    config
                )})`;
            }
    }

    if (allowed === true) {
        outp.allowed = outp.allowed.concat(matches);
    } else if (allowed === false) {
        outp.disallowed = outp.disallowed.concat(
            matches.map(match => {
                match.message = message;
                return match;
            })
        );
    }
    return outp;
}

export default function generate(config: Config) {
    /**
     * Performs the linting according to the previously passed config.
     * @param reporter The reporter to report warnings/errors to
     * @param $ A cheerio representation of the document
     * @param ast The underlying AST representation of the document. This should be given to Reporter when warning/erroring with a node.
     */
    return function ElmRule(reporter: Reporter, $: Cheerio, ast: AST) {
        logger.debug("Called", config);
        // gather the result of every execution
        const executions = Object.keys(config)
            .map(selector => {
                try {
                    return executeRule(selector, config[selector], $);
                } catch (e) {
                    if (e instanceof Error) {
                        reporter.exception(e);
                    } else {
                        reporter.warn(
                            `Rule '${selector}' failed to lint: ${e}`
                        );
                    }
                    return null;
                }
            })
            .filter(v => v);
        // then filter out the disallowed elms that are allowed elsewhere
        const allowedElms: CheerioElement[] = [];
        const disallowed: RuleElmResult[] = [];
        // first gather the allowed elms
        executions.forEach(execution => {
            if (!execution) {
                return;
            }
            allowedElms.push(
                ...(execution.allowed
                    .map(result => result.elm)
                    .filter(v => v) as CheerioElement[])
            );
        });
        // the filter the disallowed elms by whether they are allowed elsewhere
        executions.forEach(execution => {
            if (!execution) {
                return;
            }
            disallowed.push(
                ...execution.disallowed.filter(
                    result =>
                        allowedElms.indexOf(result.elm as CheerioElement) === -1
                )
            );
        });
        // finally report all the remaining disallowed elms
        disallowed.forEach(result => {
            reporter.error(result.message, result.elm, ast);
        });
    };
}
