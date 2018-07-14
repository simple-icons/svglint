const chalk = require("chalk");
const nodeUtil = require("util");
const utils = require("../util");

const COLUMNS = process.stdout.columns || 80;
const MSG_META = Object.freeze({
    "debug": Object.freeze({
        symbol: "d",
        color: chalk.gray.dim.bold,
    }),
    "log": Object.freeze({
        symbol: "i",
        color: chalk.blue.bold,
    }),
    "warn": Object.freeze({
        symbol: "!",
        color: chalk.yellow.bold,
    }),
    "error": Object.freeze({
        symbol: "x",
        color: chalk.red.bold,
    })
});

/**
 * Stringifies a list of data into a colorized single line
 * @param {Array} args The data to stringify
 */
function stringifyArgs(args=[]) {
    return args.map(
        v => (
            typeof v === "string"
                ? v
                : nodeUtil.inspect(v, { colors: true, depth: 3 })
        ).replace(/^Error: /, "")
    ).join(" ");
}

/**
 * A display for a log history.
 */
module.exports = class Log {
    /** @param {CliHistory} logHistory */
    constructor(logHistory) { this.logs = logHistory; }
    toString() {
        return this.logs.messages.map(msg => {
            const meta = MSG_META[msg.type];
            const prefix = msg.prefix
                ? `[${meta.symbol}|${msg.prefix}]`
                : `(${meta.symbol})`;
            const message = stringifyArgs(msg.args);
            return meta.color(prefix) + " "
                + utils.chunkString(message, COLUMNS - prefix.length - 1)
                    .join("\n" + " ".repeat(msg.prefix ? 0 : 4));
        }).join("\n");
    }
};
