import nodeUtil from "util";
import { MSG_META, supportsColor } from "../util.js";

/** @typedef {import("../../lib/logger.js").CliConsole} CliHistory */

/**
 * Stringifies a list of data into a colorized single line
 * @param {Array} args The data to stringify
 */
function stringifyArgs(args=[]) {
    return args.map(
        v => (
            typeof v === "string"
                ? v
                : nodeUtil.inspect(v, { colors: supportsColor, depth: 3 })
        ).replace(/^Error: /, "")
    ).join(" ");
}

/**
 * A display for a log history.
 */
export default class Log {
    /** @param {CliHistory} logHistory */
    constructor(logHistory) { this.logs = logHistory; }
    toString() {
        return this.logs.messages.map(msg => {
            const meta = MSG_META[msg.type];
            const prefix = msg.prefix
                ? `[${meta.symbol}|${msg.prefix}]`
                : `(${meta.symbol})`;
            const message = stringifyArgs(msg.args);
            return (supportsColor ? meta.color(prefix) : prefix) + " "
                + message;
        }).join("\n");
    }
}
