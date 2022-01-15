/**
 * @fileoverview Exposes the logger we should use for displaying info.
 * If called using the JS API, this will be `console` with prefixes.
 * If called using the CLI, this will be our own custom logger.
 */
import { inspect } from "util";
import { EventEmitter } from "events";
import { chalk, supportsColor } from "../cli/util.js";

const CONSOLE_COLORS = Object.freeze({
    debug: chalk.dim.gray,
    log: chalk.blue,
    warn: chalk.yellow,
    error: chalk.red,
});
const LEVELS = Object.freeze({
    debug: 0,
    log: 1,
    warn: 2,
    error: 3,
});
const METHODS = ["debug", "log", "warn", "error"];

// Logger-global variables
let isCLI = false;
let level = LEVELS.log;

// create a prefixing & colorizing wrapper around console for use in non-CLIs
const wrappedConsole = Object.create(console);
METHODS.forEach(method => {
    const color = CONSOLE_COLORS[method]
        ? CONSOLE_COLORS[method]
        : v => v;
    wrappedConsole[method] = (prefix, args) => {
        // eslint-disable-next-line no-console
        console[method].apply(console, [color("["+prefix+"]"), ...args]);
    };
});

// create a simple collector & emitter of messages for use in CLIs
class CliConsole extends EventEmitter {
    constructor() {
        super();
        /** The messages that have been emitted so far.
         * @type {Array<{ prefix: String, args: Array, type: String }>} */
        this.messages = [];
        METHODS.forEach(method => {
            this[method] = (prefix, args) => {
                const msg = {
                    prefix: prefix.replace(/^SVGLint ?/, ""),
                    args,
                    type: method,
                };
                this.messages.push(msg);
                this.emit("msg", msg);
            };
        });
    }
}
CliConsole.prototype.EVENTS = METHODS;
const cliConsole = new CliConsole();

const Logger = function(prefix) {
    prefix = "SVGLint" + (prefix ? " " + prefix : "");
    const logger = {};
    METHODS.forEach(method => {
        logger[method] = function(...args) {
            if (level > LEVELS[method]) { return; }
            if (isCLI) {
                cliConsole[method].call(cliConsole, prefix, args);
            } else {
                wrappedConsole[method].call(wrappedConsole, prefix, args);
            }
        };
    });
    return logger;
};
Logger.cliConsole = cliConsole;
Logger.setCLI = value => { isCLI = value; };
Logger.setLevel = value => { level = value; };
Logger.LEVELS = LEVELS;
Logger.colorize = supportsColor ?
    value => inspect(value, true, 2, true) : value => value;
export default Logger;
