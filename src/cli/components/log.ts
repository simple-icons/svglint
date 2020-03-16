import nodeUtil = require("util");
import { MSG_META } from "../util";

import type { GuiComponent, LintingMessage } from "../types";
// TODO: remove once logger has been rewritten to TS
type CliHistory = any;
/** @typedef {import("../../lib/logger.js").CliConsole} CliHistory */

/** Stringifies a list of data into a colorized single line */
function stringifyArgs(args: any[] = []) {
    return args
        .map(v =>
            (typeof v === "string"
                ? v
                : nodeUtil.inspect(v, { colors: true, depth: 3 })
            ).replace(/^Error: /, "")
        )
        .join(" ");
}

/** A display for a log history. */
export default class Log implements GuiComponent {
    logs: CliHistory;
    constructor(logHistory: CliHistory) {
        this.logs = logHistory;
    }

    toString() {
        return this.logs.messages
            .map((msg: LintingMessage) => {
                const meta = MSG_META[msg.type];
                const prefix = msg.prefix
                    ? `[${meta.symbol}|${msg.prefix}]`
                    : `(${meta.symbol})`;
                const message = stringifyArgs(msg.args);
                return meta.color(prefix) + " " + message;
            })
            .join("\n");
    }
};
