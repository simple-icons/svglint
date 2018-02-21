const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const flatten = require("./util").flatten;
const transformRuleName = require("./util").transformRuleName;
const log = require("./log");

class SVGLint {
    constructor(config) {
        this.config = config;
    }

    /**
     * Gets the function responsible for executing a rule, given a rule object
     * @param {String} ruleName The name of the rule to get executor for
     * @returns {Function} The function that executes the rule
     */
    getRuleExecutor(ruleName) {
        const rulePath = path.join("rules/", transformRuleName(ruleName));
        try {
            return require(`./${rulePath}`);
        } catch (e) {
            e.message = `Couldn't load rule ${ruleName}: ${e.message}`;
            throw e;
        }
    }

    /**
     * Lints a file
     * @param {String} fileName Either the path to a file, or a string to lint
     * @param {Object} logger  The logger to use for logging, or undefined if no log
     * @returns {Promise<Boolean|Object>} Resolves to `true` or a {String[]} of errors
     */
    async lint(fileName, logger=undefined) {
        log.debug("Linting", fileName);
        const fileReporter = logger.getFileReporter(fileName);
        const file = await this.getFile(fileName);
        let ast;
        try {
            ast = cheerio.load(file, { xmlMode: true });
        } catch (e) {
            e.message = `SVG parsing error: ${e.message}`;
            throw e;
        }

        // execute each rule
        const promises = Object.keys(this.config.rules)
            .map(
                async name => {
                    log.debug("Executing rule", name);
                    const executor = this.getRuleExecutor(name);
                    let configs = this.config.rules[name];
                    // normalize our config to an array, even if there is only 1 config
                    if (!(configs instanceof Array)) { configs = [configs]; }

                    const reporter = fileReporter.getRuleReporter(name);
                    const result = Promise.all(
                        configs.map(
                            async config => {
                                return await executor(config)(ast, reporter);
                            }
                        )
                    );
                    return result;
                }
            );
        
        // wait for each result to come in, and then return
        Promise.all(promises)
            .then(results => {
                const errors = flatten(results).filter(v => v !== true);
                if (errors.length) {
                    return errors;
                }
                return true;
            });
    }

    /**
     * Calls a callback with the content of a file
     * Can also handle being given the content of the file
     */
    getFile(file) {
        return new Promise(res => {
            log.debug("Loading file", file);
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
