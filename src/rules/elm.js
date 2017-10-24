const cheerio = require("cheerio");
const { LintError } = require("../rule-results");

function checkMatch(nodes, value, config, selector, $) {
    if (value === true) {
        if (nodes.length !== 0) { return true; }
        return new LintError("Element required for selector {selector}", { selector });
    }
    if (typeof value === "number") {
        if (nodes.length === value) { return true; }
        return new LintError(
            "Expected {value} elements, found {num}, for selector {selector}",
            {
                value,
                num: nodes.length,
                selector
            }
        );
    }
    if (value instanceof Array) {
        if (nodes.length >= value[0] && nodes.length <= value[1]) { return true; }
        return new LintError(
            "Expected between {min} and {max} elements, found {num}, for selector {selector}",
            {
                min: value[0],
                max: value[0],
                num: nodes.length,
                selector
            }
        );
    }
    if (value === false) {
        // check that at least one node isn't allowed by other rules
        const nonAllowedNodes = nodes.filter(
            (i, node) => {
                let allowed = false;
                for (let selector in config) {
                    if (!config.hasOwnProperty(selector)) { continue; }
                    const val = config[selector];
                    if (val === false) { continue; }
                    if ($(selector).is(node)) {
                        allowed = true;
                        break;
                    }
                }
                return !allowed;
            }
        );

        if (!nonAllowedNodes.length) { return true; }
        return new LintError(
            "Expected no elements, found {num}, for selector {selector}\n{elms}",
            {
                num: nonAllowedNodes.length,
                selector,
                elms: nonAllowedNodes.map(
                    (i, node) => {
                        cheerio(node).empty();
                        return cheerio.html(node);
                    }
                ).toArray().join("\n")
            }
        );
    }
}

module.exports = function elmGenerator(config={}) {
    // the actual rule function
    return function($) {
        const outp = [];
        Object.keys(config).forEach(
            selector => {
                const nodes = $(selector);
                const val = config[selector];

                const match = checkMatch(nodes, val, config, selector, $);
                if (match !== true) {
                    outp.push(match);
                }
            }
        );

        if (!outp.length) {
            return true;
        }
        return outp;
    };
};
