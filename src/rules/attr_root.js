const { LintError } = require("../rule-results");
const { str_expected } = require("../util");

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
        if (value !== "" && value !== undefined) {
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

module.exports = function rootAttrGenerator(config={}) {
    const allowUndefined = !config["rule::whitelist"];

    // the actual linting function
    return function(ast) {
        const attrResults = Object.keys(ast.attr || {})
            .map(attr => {
                if (config[attr] === undefined) {
                    return allowUndefined
                        ||
                        new LintError(`Failed on "${attr}"; unexpected attributes not allowed`);
                }

                const result = testAttr(ast.attr[attr], config[attr]);
                if (result === true) {
                    return true;
                }

                return new LintError(
                    `Failed on "${attr}"; ${str_expected(config[attr])} {expected}`,
                    { expected: config[attr] }
                );
            });
        
        // also check for missing attributes
        const missing = Object.keys(config)
            .filter(k => config[k] === true)
            .map(k => {
                if (ast.attr && ast.attr[k] === undefined) {
                    return new LintError(
                        `Failed on "${k}": ${str_expected(config[k])}`
                    );
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
    };
};
