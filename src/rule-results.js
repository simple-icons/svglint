const inspect = require("util").inspect;
inspect.styles.string = "blue";
inspect.styles.number = "grey";
inspect.styles.boolean = "grey";
inspect.styles.regexp = "magenta";
const chalk = require("chalk");

class RuleResult extends Error {
    /**
     * The result of a rule run.
     * The message is a string to display to the user, which describes the failure.
     * If it includes data that should be colorized, put that data in the data object,
     *   and insert the key in the message using the format {key}.
     * For instance, RuleResult("{str} is colorized", {str: "This"}) will colorize
     *   the word "This", but not the rest.
     * @param {String} message  The message to display.
     * @param {Object} [data]  The data to colorize and insert into message
     */
    constructor(message, data) {
        super(message);

        this.name = this.constructor.name;
        this.message = message;
        this.data = data || {};
    }

    /** Returns the result as a colorized string */
    stringify() {
        return this.color(
            this.message.replace(
                /{([^}]+)\}/g,
                (match, key) => {
                    if (this.data.hasOwnProperty(key)) {
                        return inspect(this.data[key], false, 2, true);
                    }
                    return match;
                }
            )
        );
    }

    toString() {
        return this.message.replace(
            /{([^}]+)\}/g,
            (match, key) => {
                if (this.data.hasOwnProperty(key)) {
                    return inspect(this.data[key], false, 2, false);
                }
                return match;
            }
        );
    }

    /** Colorizes some arguments */
    color(...args) {
        return chalk.reset.apply(chalk, args);
    }
}

class LintWarning extends RuleResult {
    color(...args) {
        let str = args[0];
        return str.replace(
            /^[0-9a-zA-Z]+:/,
            v => chalk.yellow(v)
        ).replace(
            /\n.+/,
            v => chalk.dim.gray(v)
        );
    }
}
class LintError extends RuleResult {
    color(...args) {
        let str = args[0];
        return str.replace(
            /^[0-9a-zA-Z]+:/,
            v => chalk.red(v)
        ).replace(
            /\n.+/,
            v => chalk.dim.gray(v)
        );
    }
}

module.exports = {
    LintWarning,
    LintError
};
