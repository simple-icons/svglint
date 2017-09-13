const fs = require("fs");
const path = require("path");
const xml = require("xmldoc");
const log = require("./log");
const transformRuleName = require("./util").transformRuleName;

class SVGLint {
    constructor(config) {
        this.config = config;
    }

    /**
     * Lints a file
     * @param {String} file  Either the path to a file, or a string to lint
     * @param {Function} [cb]  Callback - receives either `true` or an Error/Warning object
     * @returns {Promise<Boolean|Object>} Evaluates to either `true` or an Error/Warning object
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
                        ast = new xml.XmlDocument(data);
                    } catch (e) {
                        throw new Error(`SVG parsing error: ${e.message}`);
                    }

                    if (Object.keys(ast).length === 1 && ast.doctype === "") {
                        throw new Error("Invalid SVG");
                    }

                    let errors = [];

                    // populate errors
                    Object.keys(this.config.rules || {})
                        .forEach(ruleName => {
                            const rulePath = path.join("rules/", transformRuleName(ruleName));
                            let rule;
                            try {
                                rule = require(`./${rulePath}`)(this.config.rules[ruleName]);
                            } catch (e) {
                                return log.warn("Unknown rule (", rule, "). It will be ignored");
                            }

                            let result = rule(ast);
                            if (result !== true) {
                                result = result.forEach(error => {
                                    error.message = `${ruleName}: ${error.message}`;
                                    errors.push(error);
                                });
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
                });
        });
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
