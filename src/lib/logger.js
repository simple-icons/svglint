/**
 * @fileoverview Exposes the logger we should use for displaying info.
 * If called using the JS API, this will be `console` with methods prefixed.
 * If called using the CLI, this will be our own custom logger.
 */
const chalk = require("chalk");
const inspect = require("util").inspect;

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

module.exports = function(prefix) {
    prefix = "SVGLint" + (prefix ? " " + prefix : "");
    const logger = {};
    METHODS.forEach(method => {
        logger[method] = function(...args) {
            if (level > LEVELS[method]) { return; }
            if (isCLI) {
                // TODO: implement custom logger
            } else {
                wrappedConsole[method].call(wrappedConsole, prefix, args);
            }
        };
    });
    return logger;
};
module.exports.setCLI = value => { isCLI = value; };
module.exports.setLevel = value => { level = value; };
module.exports.LEVELS = LEVELS;
module.exports.colorize = value => inspect(value, true, 2, true);
