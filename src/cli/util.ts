/**
 * @fileoverview Utilities for the CLI.
 */
import chalk from "chalk";
import ansiRegex = require("ansi-regex");

export const COLUMNS = process.stdout.columns || 80;
export const MSG_META = Object.freeze({
    // logs
    debug: Object.freeze({
        symbol: "d",
        color: chalk.gray.dim.bold,
    }),
    log: Object.freeze({
        symbol: "i",
        color: chalk.blue.bold,
    }),

    // lintings
    linting: Object.freeze({
        symbol: null,
        color: chalk.gray.dim,
    }),
    success: Object.freeze({
        symbol: "✓",
        color: chalk.green.bold,
    }),
    warn: Object.freeze({
        symbol: "!",
        color: chalk.yellow.bold,
    }),
    error: Object.freeze({
        symbol: "x",
        color: chalk.red.bold,
    }),
    exception: Object.freeze({
        symbol: "!!!",
        color: chalk.bgRed.bold,
    }),
});

/**
 * Splits a string into N sized chunks.
 * Newlines also indicates a chunk end.
 * Handles ANSI color codes correctly (does not count them towards length)
 * @param str The string to chunk
 * @param N The length to chunk into
 */
export function chunkString(str: string, N: Number): string[] {
    const outp = [] as string[];
    const zerolengthMatchers = [ansiRegex()];
    let current = "";
    let currentLen = 0; // have to use separate variable because we include some characters in the string while not counting them for length
    for (let i = 0, l = str.length; i < l; ++i) {
        // we split at newlines or when we've reached the given length
        if (str[i] === "\n" || currentLen === N) {
            outp.push(current);
            current = "";
            currentLen = 0;
        }
        // we don't add newlines to our outp string, as each line is represented by an entry in the array
        if (str[i] === "\n") {
            continue;
        }
        // some characters are 0-length, e.g. ANSI color codes, which we don't count towards string length
        let blacklisted = false;
        for (let regex of zerolengthMatchers) {
            const tester = new RegExp("^" + regex.source);
            const match = tester.exec(str.slice(i));
            if (match) {
                i += match[0].length - 1;
                current += match[0];
                blacklisted = true;
                break;
            }
        }
        if (blacklisted) {
            continue;
        }

        // if it's just a normal character, append it and continue
        current += str[i];
        ++currentLen;
    }
    if (current) {
        outp.push(current);
    }
    return outp;
}
