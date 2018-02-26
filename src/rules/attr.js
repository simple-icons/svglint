const { str_expected, flatten } = require("../util");
const log = require("../log");

function testAttr(value, expected) {
    // handle arrays (must be one of)
    if (expected instanceof Array) {
        // at least one value in the expected array must match
        return expected.map(exp => testAttr(value, exp))
            .some(Boolean);
    }

    // handle booleans (must be set/must not be set)
    if (expected instanceof Boolean) {
        // if value is set, fail if expected === false
        if (value !== undefined) {
            return !!expected;
        // if value is not set, fail if expected === true
        } else {
            return !expected;
        }
    }

    // handle custom regexs
    if (expected instanceof RegExp) {
        return expected.test(value);
    }

    // handle custom functions
    if (expected instanceof Function) {
        return expected(value);
    }

    // handle booleans
    if (expected === true) {
        return !!value;
    }

    // handle other matches
    return value === expected;
}

module.exports = function attrGenerator(config={}) {
    const allowUndefined = !config["rule::whitelist"];
    const selector = config["rule::selector"] || "*";

    config = Object.assign({}, config);
    delete config["rule::whitelist"];
    delete config["rule::selector"];
    log.debug("[attr] Executing", config);

    // the actual linting function
    return function($, reporter) {
        const nodes = $(selector).toArray();
        const nodeResults = nodes.map(
            node => {
                const attrResults = Object.keys(node.attribs || {})
                    .map(attr => {
                        log.debug("[attr] Checking", attr, { actual: node.attribs[attr], expected: config[attr] });
                        if (config[attr] === undefined) {
                            if (!allowUndefined) {
                                reporter.error(
                                    `Unexpected attribute "${attr}"
  ${$.html($(node).empty())}`);
                            }
                            return;
                        }

                        const result = testAttr(node.attribs[attr], config[attr]);
                        if (result === true) {
                            return true;
                        }

                        reporter.error(
                            `Failed on attr "${attr}"; ${str_expected(config[attr])}`, config[attr], `
  ${$.html($(node).empty())}`
                        );
                    });
        
                // also check for missing attributes
                const missing = Object.keys(config)
                    .filter(k => config[k] === true)
                    .map(k => {
                        log.debug("[attr] Checking for missing", k);
                        if (node.attribs && node.attribs[k] === undefined) {
                            reporter.error(
                                `Missing attribute "${k}"
  ${$.html($(node).empty())}`
                            );
                            return;
                        }
                        return true;
                    })
                    .filter(Boolean);

                const results = attrResults.concat(missing);
                if (results.every(v => v === true)) {
                    return true;
                } else {
                    return results.filter(v => v !== true);
                }
            }
        );

        if (nodeResults.every(v => v === true)) {
            reporter.succeed();
            return;
        } else {
            return flatten(nodeResults.filter(v => v !== true));
        }
    };
};
