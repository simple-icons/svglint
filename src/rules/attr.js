import Logger from "../lib/logger.js";
const logger = Logger("rule:attr");

/** @typedef {import("../lib/reporter.js")} Reporter */
/** @typedef {import("../lib/parse.js").AST} AST */
/** @typedef {import("../lib/parse.js").Node} Node */

/**
 * @typedef {Object<string,string|string[]|boolean|RegExp>} AttrConfig
 * The key represents the attribute name. The value has the following meanings:  
 * - `{Boolean}` If true, the attr must exist. If false, it must not exist.  
 * - `{String}` The attr value must match this exactly. It must also exist.
 * - `{RegExp}` The attr value must match the regex.
 * - `{Array<String>}` The attr value must be one of these. It must also exist.
 * 
 * The following special configs are allowed:
 * - `{ "rule::selector": {String} }` Default "*". The matching elements must fulfill the other configs.
 * - `{ "rule::whitelist": {Boolean} }` Default `false`. If true, no other attributes can exist than those specified by the other configs.
 */

/**
 * Workflow:
 * 1. Find all elements matching the selector.
 * 2. For each element:
 *   - Go through every rule in the config
 *     - If their attribute must exist, check that it does
 *   - Go through every attribute on the element
 *     - If it has a config:
 *       - If allowed, remove it from the attr list
 *       - If disallowed, error and remove it from the attr list
 *   - If whitelist is true, error if there are attributes left
 */

const SPECIAL_ATTRIBS = ["rule::selector", "rule::whitelist"];

/**
 * Executes on a single element.
 * @param {Cheerio} $elm The cheerio element to execute on
 * @param {AttrConfig} config The config to execute
 * @param {Reporter} reporter The rule reporter
 * @param {AST} ast The AST we are executing on
 */
function executeOnElm($elm, config, reporter, ast) {
    // @ts-ignore
    const attrs = Object.assign({}, $elm.attribs);
    // check that all attributes that must exist do so
    Object.keys(config).forEach(
        attrib => {
            // do nothing with special configs
            if (SPECIAL_ATTRIBS.includes(attrib)) { return; }
            // if it must exist
            const conf = config[attrib];
            if (conf === true 
                    || conf instanceof Array
                    || typeof conf === "string"
                    || conf instanceof RegExp) {
                if (attrs[attrib] === undefined) {
                    reporter.error(
                        `Expected attribute '${attrib}', didn't find it`,
                        $elm,
                        ast
                    );
                }
            }
        }
    );
    // check that all configs are met
    Object.keys(attrs).forEach(
        attrib => {
            const value = attrs[attrib];
            const expected = config[attrib];
            let handled = false;
            // check each type
            switch (typeof expected) {
                case "boolean":
                    handled = true;
                    if (expected === false) {
                        reporter.error(
                            `Attribute '${attrib}' is disallowed`,
                            $elm,
                            ast
                        );
                    }
                    break;
                case "string":
                    handled = true;
                    if (value !== expected) {
                        reporter.error(
                            `Expected attribute '${attrib}' to be "${expected}", was "${value}"`,
                            $elm,
                            ast
                        );
                    }
                    break;
                case "object":
                    if (expected instanceof Array) {
                        handled = true;
                        if (!expected.includes(value)) {
                            reporter.error(
                                `Expected attribute '${attrib}' to be one of ${
                                    JSON.stringify(expected)
                                }, was "${value}"`,
                                $elm,
                                ast
                            );
                        }
                    } else if (expected instanceof RegExp) {
                        handled = true;
                        if (!expected.test(value)) {
                            reporter.error(
                                `Expected attribute '${attrib}' to match ${expected}, was "${value}"`,
                                $elm,
                                ast
                            );
                        }
                    } else {
                        reporter.warn(
                            `Unknown config for attribute '${attrib}' (${
                                JSON.stringify(expected)
                            }), ignoring`,
                            $elm,
                            ast
                        );
                    }
                    break;
            }

            // if we handled the attribute (i.e. we had a config for it)
            // then remove it from our attribute list
            if (handled) {
                delete attrs[attrib];
            }
        }
    );

    if (config["rule::whitelist"]) {
        const remaining = Object.keys(attrs);
        if (remaining.length) {
            reporter.error(
                `Found extra attributes ${JSON.stringify(remaining)} with whitelisting enabled`,
                $elm,
                ast
            );
        }
    }
}

export default {
    /**
     * Generates a linting function from a config
     * @param {AttrConfig} config 
     */
    generate(config) {
        /**
         * Performs the linting according to the previously passed config.
         * @param {Reporter} reporter The reporter to report warnings/errors to
         * @param {Cheerio} $ A cheerio representation of the document
         * @param {AST} ast The underlying AST representation of the document.
         *                  This should be given to Reporter when warning/erroring with a node.
         */
        return function AttrRule(reporter, $, ast) {
            logger.debug("Called", config);

            // find all elements that match the selector and execute on them
            const selector = config["rule::selector"] || "*";
            const $elms = $.find(selector).toArray();
            logger.debug("Found elms for selector", selector, $elms.length);
            $elms.forEach($elm => executeOnElm($elm, config, reporter, ast));
        };
    }
};
