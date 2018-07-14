const chalk = require("chalk");
const columns = process.stdout.columns || 80;

/**
 * A separator between sections.
 * Optionally includes a title which will be displayed centered in the separator.
 */
module.exports = class Separator {
    constructor(title="") { this.title = title; }
    toString() {
        const padding = " ".repeat(
            Math.floor((columns - this.title.length) / 2)
        );
        return `${padding}${chalk.bold.underline(this.title)}${padding}`;
    }
};
