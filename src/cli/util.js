/**
 * @fileoverview Utilities for the CLI.
 */
import process from "process";
import { Chalk, supportsColor as chalkSupportsColor } from "chalk";
import ansiRegex from "ansi-regex";

const supportsColor = chalkSupportsColor &&
    !("NO_COLOR" in process.env) &&
    !("SVGLINT_NO_COLOR" in process.env);

let chalk = supportsColor ? new Chalk() : new Chalk({level: 0});

const COLUMNS = process.stdout.columns || 80;
const MSG_META = Object.freeze({
    // logs
    "debug": Object.freeze({
        symbol: "d",
        color: chalk.gray.dim.bold,
    }),
    "log": Object.freeze({
        symbol: "i",
        color: chalk.blue.bold,
    }),

    // lintings
    "linting": Object.freeze({
        symbol: null,
        color: chalk.gray.dim,
    }),
    "success": Object.freeze({
        symbol: "✓",
        color: chalk.green.bold,
    }),
    "warn": Object.freeze({
        symbol: "!",
        color: chalk.yellow.bold,
    }),
    "error": Object.freeze({
        symbol: "x",
        color: chalk.red.bold,
    }),
    "exception": Object.freeze({
        symbol: "!!!",
        color: chalk.bgRed.bold,
    }),
});

export {
    chalk,
    chunkString,
    supportsColor,
    MSG_META,
    COLUMNS,
};

/**
 * Splits a string into N sized chunks.
 * Newlines also indicates a chunk end.
 * Handles ANSI color codes correctly (does not count them towards length)
 * @param {String} str  The string to chunk
 * @param {Number} N    The length to chunk into
 * @returns {Array<String>}
 */
function chunkString(str, N) {
    const outp = [];
    const blacklist = [ansiRegex()];
    let tmp = ""; let tmpLen = 0;
    for (let i = 0, l = str.length; i < l; ++i) {
        if (str[i] === "\n"        // split at newlines
            || tmpLen === N) { // and at length
            outp.push(tmp);
            tmp = "";
            tmpLen = 0;
        }
        if (str[i] === "\n") { // don't add newlines to our outp str
            continue;
        }
        let blacklisted = false;
        for (let regex of blacklist) { // skip blacklist matches
            const tester = new RegExp("^"+regex.source);
            const match = tester.exec(str.slice(i));
            if (match) {
                i += match[0].length - 1;
                tmp += match[0];
                blacklisted = true;
                break;
            }
        }
        if (blacklisted) { continue; }

        tmp += str[i];
        ++tmpLen;
    }
    if (tmp) { outp.push(tmp); }
    return outp;
}
