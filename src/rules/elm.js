const cheerio = require("cheerio");

function checkMatch(nodes, value, config, selector, $, reporter) {
    if (value === true) {
        if (nodes.length !== 0) { return true; }
        reporter.error(
            "Element required for selector", `"${selector}"`
        );
        return;
    }
    if (typeof value === "number") {
        if (nodes.length === value) { return true; }
        reporter.error(
            "Expected", value, "elements, found", nodes.length, "for selector", `"${selector}"`
        );
        return;
    }
    if (value instanceof Array) {
        if (nodes.length >= value[0] && nodes.length <= value[1]) { return true; }
        reporter.error(
            "Expected between", value[0], "and", value[0], "elements, found", nodes.length, "for selector", `"${selector}"`
        );
        return;
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
        reporter.error(
            "Expected no elements, found", nonAllowedNodes.length, "for selector", `"${selector}"`, `
  ${nonAllowedNodes.map(
        (i, node) => cheerio.html(cheerio(node).empty())
    ).toArray().join("\n  ")}`
        );
        return;
    }
}

module.exports = function elmGenerator(config={}) {
    // the actual rule function
    return function($, reporter) {
        const outp = [];
        Object.keys(config).forEach(
            selector => {
                const nodes = $(selector);
                const val = config[selector];

                const match = checkMatch(nodes, val, config, selector, $, reporter);
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
