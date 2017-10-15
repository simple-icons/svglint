const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const log = require("./log");
const transformRuleName = require("./util").transformRuleName;

class SVGLint {
    constructor(config) {
        this.config = config;
    }

    /**
     * Lints a file
     * @param {String} file  Either the path to a file, or a string to lint
     * @param {Function} [cb]  Callback - receives either `true` or an array of Error/Warning objects
     * @returns {Promise<Boolean|Object>} Resolves to `true` or rejects to an array of Error/Warning objects
     */
    lint(file, cb) {
        return new Promise((res, rej) => {
            const _cb = result => {
                if (cb) { cb(result); }
                if (result === true) {
                    res(result);
                } else {
                    rej(new Error(result.join("\n")));
                }
            };

            this.getFile(file)
                .then(data => {
                    let ast;
                    try {
                        ast = cheerio.load(data);
                    } catch (e) {
                        throw new Error(`SVG parsing error: ${e.message}`);
                    }

                    let errors = [];

                    // flatten our rule config into array of { rule: "foo", config: {...} }
                    let rules = [];
                    Object.keys(this.config.rules || {})
                        .forEach(ruleName => {
                            const config = this.config.rules[ruleName];
                            let configs;
                            if (config instanceof Array) {
                                configs = config;
                            } else {
                                configs = [config];
                            }

                            configs = configs.map(v => ({ rule: ruleName, config: v }));
                            rules = rules.concat(configs);
                        });

                    // populate errors
                    rules.forEach(ruleObj => {
                        const ruleName = ruleObj.rule;
                        const rulePath = path.join("rules/", transformRuleName(ruleName));
                        let rule;
                        try {
                            rule = require(`./${rulePath}`)(ruleObj.config);
                        } catch (e) {
                            return log.warn("Unknown rule (", rule, "). It will be ignored");
                        }

                        if (rule) {
                            let result = rule(ast);
                            if (result !== true) {
                                result.forEach(error => {
                                    error.message = `${ruleName}: ${error.message}`;
                                    errors.push(error);
                                });
                            }
                        }
                    });

                    // call callback
                    if (errors.length) {
                        _cb(errors);
                    } else {
                        _cb(true);
                    }
                }).catch(e => {
                    let fileName = file;
                    if (fileName.length > 27) {
                        fileName = `${file.substr(0, 13)}...${file.substr(-14)}`;
                    }
                    e.message = `Error in ${fileName}: ${e.message}`;
                    rej(e);
                    if (cb) { cb([e]); }
                });
        }).catch(e => { // make sure our error output is always an array
            if (e instanceof Array) {
                throw e;
            } else {
                throw [e];
            }
        })
    }

    /**
     * Calls a callback with the content of a file
     * Can also handle being given the content of the file
     */
    getFile(file) {
        return new Promise(res => {
            try {
                fs.readFile(
                    file,
                    "utf8",
                    (err, data) => {
                        if (err) {
                            return res(file);
                        }
                        return res(data);
                    }
                );
            } catch (e) {
                res(file);
            }
        });
    }
}
module.exports = SVGLint;
