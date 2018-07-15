/**
 * @fileoverview The object that rules use to report errors, warnings and messages.
 */
const EventEmitter = require("events").EventEmitter;
const chalk = require("chalk");
const Logger = require("./logger");

/**
 * @typedef {Object} Result
 * @property {String} message The message as a single string, suitable for human consumption
 * @property {"error"|"warn"|"exception"} type The type of result
 * @property {String} [stacktrace] If Result is related to a node, a human-suitable string showing the related part of the file
 * @property {any[]} _message The original message, as given by the rule
 * @property {Node} [_node] If Result is related to a node, the related node
 * @property {AST} [_ast] If Result is related to a node, the related AST
 */

/**
 * Generates a Result from the arguments given to .error()/.warn()/.log().
 * Mostly involves formatting the message that should be shown when logged.
 * @param {any[]|any} message The message of the result, in console.log format
 * @param {"error"|"warn"|"exception"} type The type of message
 * @param {Node} [node] If the error is related to a node, the related node
 * @param {AST} [ast] If the error is related to a node, the related AST
 * @returns {Result}
 */
function generateResult(message, type, node, ast) {
    const _message = message instanceof Array ? message : [message];
    const outp = {
        message: message,
        _message,
        _node: node,
        _ast: ast,
        type,
    };
    if (message instanceof Error) {
        outp.message = message.stack || message.toString();
    }
    if (node) {
        outp.message += `\n  At node ${chalk.bold("<"+node.name+">")} (${node.lineNum}:${node.lineIndex})`;
    }
    return outp;
}

class Reporter extends EventEmitter {
    /**
     * @param {String} name The name of this reporter
     */
    constructor(name) {
        super();
        this.name = name;
        this.logger = Logger(`rprt:${this.name}`);
        /** @type {Result[]} */
        this.messages = [];

        this.hasExceptions = false;
        this.hasWarns = false;
        this.hasErrors = false;
    }

    /**
     * Reports that an exception occured during rule processing.
     * This doesn't change the current linting result, but is important to show
     *   to users as it indicates that the linting result cannot be trusted.
     * @param {Error} e The exception that occured.
     */
    exception(e) {
        this.logger.debug("Exception reported:", e);
        this.emit("exception", e);
        this.hasExceptions = true;
        this.messages.push(generateResult(e, "exception"));
    }

    /**
     * Reports that an error was found during linting.
     * @param {any[]|any} message The message of the result, in console.log format
     * @param {Node} [node] If the error is related to a node, the related node
     * @param {AST} [ast] If the error is related to a node, the AST of the file
     */
    error(message, node, ast) {
        this.logger.debug("Error reported:", JSON.stringify(message), !!node);
        const result = generateResult(message, "error", node, ast);
        this.hasErrors = true;
        this.messages.push(result);
    }

    /**
     * Reports that a warning was found during linting.
     * @param {any[]|any} message The message of the result, in console.log format
     * @param {Node} [node] If the warning is related to a node, the related node
     * @param {AST} [ast] If the warning is related to a node, the AST of the file
     */
    warn(message, node, ast) {
        this.logger.debug("Warn reported:", JSON.stringify(message), !!node);
        const result = generateResult(message, "warn", node, ast);
        this.hasWarns = true;
        this.messages.push(result);
    }
}
module.exports = Reporter;
