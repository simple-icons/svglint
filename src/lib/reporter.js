/**
 * @fileoverview The object that rules use to report errors, warnings and messages.
 */
import {EventEmitter} from 'node:events';
import {chalk} from '../cli/util.js';
import logging from './logger.js';

/** @typedef {import('cheerio').Cheerio<import('domhandler').Document>} Cheerio */
/** @typedef {import("./parse.js").AST} AST */
/** @typedef {import("./parse.js").Node} Node */

/**
 * @typedef {Object} Result
 * @property {String} message The message as a single string, suitable for human consumption
 * @property {String} reason The message as a single string
 * @property {"error"|"warn"|"exception"} type The type of result
 * @property {String} [stacktrace] If Result is related to a node, a human-suitable string showing the related part of the file
 * @property {number} [line] If Result is related to a node, the related line in the file
 * @property {number} [column] If Result is related to a node, the related column in the file
 * @property {any[]} _message The original message, as given by the rule
 * @property {Node} [_node] If Result is related to a node, the related node
 * @property {AST} [_ast] If Result is related to a node, the related AST
 */

/**
 * Generates a Result from the arguments given to .error()/.warn()/.log().
 * Mostly involves formatting the message that should be shown when logged.
 * @param {any[]|any} message The message of the result, in console.log format
 * @param {"error"|"warn"|"exception"} type The type of message
 * @param {Node|Cheerio} [node] If the error is related to a node, the related node
 * @param {AST} [ast] If the error is related to a node, the related AST
 * @returns {Result}
 */
function generateResult(message, type, node, ast) {
	const _message = Array.isArray(message) ? message : [message];
	const outp = {
		message,
		reason: message,
		_message,
		_node: node,
		_ast: ast,
		type,
	};
	if (message instanceof Error) {
		outp.message = message.stack || message.toString();
		outp.reason = message.toString();
	}

	if (node) {
		// @ts-ignore
		outp.message += `\n  At node ${chalk.bold('<' + node.name + '>')} (${node.lineNum}:${node.columnNum})`;
		outp.reason += ' at node <' + node.name + '>';
		outp.line = node.lineNum;
		outp.column = node.columnNum;
	}

	// @ts-ignore
	return outp;
}

/**
 * The Reporter class is used by rules to report errors, warnings and exceptions.
 * It collects the messages and provides a way to access them.
 * @extends EventEmitter
 * @interface Reporter
 * @property {String} name The name of this reporter
 */
class Reporter extends EventEmitter {
	/**
	 * @param {String} name The name of this reporter
	 */
	constructor(name) {
		super();
		this.name = name;
		this.logger = logging(`rprt:${this.name}`);
		/** @type {Result[]} */
		this.messages = [];

		this.hasExceptions = false;
		this.hasWarns = false;
		this.hasErrors = false;
	}

	/**
	 * Reports that an exception occurred during rule processing.
	 * This doesn't change the current linting result, but is important to show
	 *   to users as it indicates that the linting result cannot be trusted.
	 * @param {Error} e The exception that occurred.
	 */
	exception(event) {
		this.logger.debug('Exception reported:', event);
		this.emit('exception', event);
		this.hasExceptions = true;
		this.messages.push(generateResult(event, 'exception'));
	}

	/**
	 * Reports that an error was found during linting.
	 * @param {any[]|any} message The message of the result, in console.log format
	 * @param {Node|Cheerio} [node] If the error is related to a node, the related node
	 * @param {AST} [ast] If the error is related to a node, the AST of the file
	 */
	error(message, node, ast) {
		this.logger.debug(
			'Error reported:',
			JSON.stringify(message),
			Boolean(node),
		);
		const result = generateResult(message, 'error', node, ast);
		this.hasErrors = true;
		this.messages.push(result);
	}

	/**
	 * Reports that a warning was found during linting.
	 * @param {any[]|any} message The message of the result, in console.log format
	 * @param {Node|Cheerio} [node] If the warning is related to a node, the related node
	 * @param {AST} [ast] If the warning is related to a node, the AST of the file
	 */
	warn(message, node, ast) {
		this.logger.debug('Warn reported:', JSON.stringify(message), Boolean(node));
		const result = generateResult(message, 'warn', node, ast);
		this.hasWarns = true;
		this.messages.push(result);
	}
}
export default Reporter;
