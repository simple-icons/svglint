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

const wrappedConsole = Object.create(console);
const prefixRegexp = /^\[([^\s]+)\]$/;
["debug", "log", "warn", "error"].forEach(method => {
    const color = CONSOLE_COLORS[method]
        ? CONSOLE_COLORS[method]
        : v => v;
    
    wrappedConsole[method] = function() {
        let prefix = "[SVGLint";
        const args = [...arguments];
        // merge the two prefixes if given
        if (typeof args[0] === "string") {
            const prefixResult = prefixRegexp.exec(args[0]);
            if (prefixResult) {
                prefix = prefix + " " + prefixResult[1];
                args.shift();
            }
        }
        // eslint-disable-next-line no-console
        console[method].apply(console, [color(prefix + "]"), ...args]);
    };
});


module.exports = wrappedConsole;
module.exports.colorize = value => inspect(value, true, 2, true);
