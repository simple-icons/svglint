/**
 * @fileoverview The object that rules use to report errors, warnings and messages.
 */

import { EventEmitter } from "events";
import chalk from "chalk";
import Logger from "./logger";

import type {Cheerio} from "../types";

// TODO: replace on parser has been rewritten to TS
type AST = any;
type Node = any;

export enum TYPES {
    error,
    warn,
    exception,
}

export type Result = {
    // the message as a single string, suitable for human consumption
    message: string;
    // the original message, as given by the rule
    _message: any[];
    type: TYPES;
    // if Result is related to a node, a human-suitable string showing the related part of the file
    stacktrace?: string;
    // if Result is related to a node, the related node
    _node?: Node;
    // if Result is related to a node, the related AST
    _ast?: AST;
};

/**
 * Generates a Result from the arguments given to .error()/.warn()/.log().
 * Mostly involves formatting the message that should be shown when logged.
 * @param message The message of the result, in console.log format
 * @param type The type of message
 * @param node If the error is related to a node, the related node
 * @param ast If the error is related to a node, the related AST
 */
function generateResult(
    message: any | any[],
    type: TYPES,
    node?: Node | Cheerio,
    ast?: AST
) {
    const _message = message instanceof Array ? message : [message];
    const outp: Result = {
        message,
        _message,
        _node: node,
        _ast: ast,
        type,
    };
    if (message instanceof Error) {
        outp.message = message.stack || message.toString();
    }
    if (node) {
        outp.message += `\n  At node ${chalk.bold("<" + node.name + ">")} (${
            node.lineNum
        }:${node.columnNum})`;
    }
    return outp;
}

export default class Reporter extends EventEmitter {
    name: string;
    logger: ReturnType<typeof Logger>;
    messages: Result[] = [];

    hasExceptions: boolean = false;
    hasWarns: boolean = false;
    hasErrors: boolean = false;

    constructor(name: string) {
        super();
        this.name = name;
        this.logger = Logger(`rprt:${this.name}`);
    }

    /**
     * Reports that an exception occured during rule processing.
     * This doesn't change the current linting result, but is important to show
     *   to users as it indicates that the linting result cannot be trusted.
     */
    exception(e: Error) {
        this.logger.debug("Exception reported:", e);
        this.emit("exception", e);
        this.hasExceptions = true;
        this.messages.push(generateResult(e, TYPES.exception));
    }

    /**
     * Reports that an error was found during linting.
     * @param message The message of the result, in console.log format
     * @param node If the error is related to a node, the related node
     * @param ast If the error is related to a node, the AST of the file
     */
    error(message: any | any[], node?: Node | Cheerio, ast?: AST) {
        this.logger.debug("Error reported:", JSON.stringify(message), !!node);
        const result = generateResult(message, TYPES.error, node, ast);
        this.hasErrors = true;
        this.messages.push(result);
    }

    /**
     * Reports that a warning was found during linting.
     * @param message The message of the result, in console.log format
     * @param node If the warning is related to a node, the related node
     * @param ast If the warning is related to a node, the AST of the file
     */
    warn(message: any | any[], node?: Node | Cheerio, ast?: AST) {
        this.logger.debug("Warn reported:", JSON.stringify(message), !!node);
        const result = generateResult(message, TYPES.warn, node, ast);
        this.hasWarns = true;
        this.messages.push(result);
    }
}
