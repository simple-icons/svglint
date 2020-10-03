/**
 * @fileoverview Exposes the logger we should use for displaying info.
 * If called using the JS API, this will be `console` with prefixes.
 * If called using the CLI, this will be our own custom logger.
 */

import chalk from "chalk";
import { inspect } from "util";
import { EventEmitter } from "events";

const COLORS = Object.freeze({
    debug: chalk.dim.gray,
    log: chalk.blue,
    warn: chalk.yellow,
    error: chalk.red,
});
export enum LEVELS {
    debug = 0,
    log,
    warn,
    error,
}

// WrappedConsole is used to collect a history of logs, and emit them as events
class WrappedConsole extends EventEmitter {
    // the messages that have been emitted so far
    messages: { prefix: string; args: any[]; level: LEVELS }[] = [];
    // indicates whether our logger is outputting to our CLI GUI
    isCLI = false;
    // indicates the minimum level that we'll actually log
    thresholdLevel = LEVELS.log;

    constructor() {
        super();
    }

    performLog(prefix: string, args: any[], level: LEVELS) {
        if (level < this.thresholdLevel) {
            return;
        }

        // if we don't have a CLI, just log (with color)
        if (!this.isCLI) {
            const levelName = LEVELS[level] as keyof typeof LEVELS;
            const color = COLORS[levelName] || ((v: string) => v);
            console[levelName].apply(console, [color(`[${prefix}]`, ...args)]);
            return;
        }

        const msg = {
            prefix: prefix.replace(/^SVGLint ?/, ""),
            args,
            level,
        };
        this.messages.push(msg);
        this.emit("msg", msg);
    }

    setCLI(value: boolean) {
        this.isCLI = value;
    }

    setLevel(value: LEVELS) {
        this.thresholdLevel = value;
    }
}

export const logger = new WrappedConsole();

export function setCLI(value: boolean) {
    logger.setCLI(value);
}

export function setLevel(value: LEVELS) {
    logger.setLevel(value);
}

export function colorize(value: any) {
    return inspect(value, true, 2, true);
}

export default function consoleGenerator(prefix: string = "") {
    prefix = `SVGLint ${prefix ? " " + prefix : ""}`;
    const generator = (level: LEVELS) => (...args: any[]) => {
        logger.performLog(prefix, args, level);
    };

    return {
        debug: generator(LEVELS.debug),
        log: generator(LEVELS.log),
        warn: generator(LEVELS.warn),
        error: generator(LEVELS.error),
    };
}
