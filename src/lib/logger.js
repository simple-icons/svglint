/**
 * @fileoverview Exposes the logger we should use for displaying info.
 * If called using the JS API, this will be `console` with prefixes.
 * If called using the CLI, this will be our own custom logger.
 */
import {EventEmitter} from 'node:events';
import {inspect} from 'node:util';
import {chalk, supportsColor} from '../cli/util.js';

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
const METHODS = ['debug', 'log', 'warn', 'error'];

// Logger-global variables
let isCLI = false;
let level = LEVELS.log;

// Create a prefixing & colorizing wrapper around console for use in non-CLIs
const wrappedConsole = Object.create(console);
for (const method of METHODS) {
	// eslint-disable-next-line unicorn/prefer-logical-operator-over-ternary
	const color = CONSOLE_COLORS[method] ? CONSOLE_COLORS[method] : (v) => v;
	wrappedConsole[method] = (prefix, arguments_) => {
		// eslint-disable-next-line no-useless-call, no-console
		console[method].apply(console, [color('[' + prefix + ']'), ...arguments_]);
	};
}

// Create a simple collector & emitter of messages for use in CLIs
class CliConsole extends EventEmitter {
	constructor() {
		super();
		/** The messages that have been emitted so far.
		 * @type {Array<{ prefix: String, args: Array, type: String }>} */
		this.messages = [];
		for (const method of METHODS) {
			this[method] = (prefix, arguments_) => {
				const message = {
					prefix: prefix.replace(/^SVGLint ?/, ''),
					args: arguments_,
					type: method,
				};
				this.messages.push(message);
				this.emit('msg', message);
			};
		}
	}
}
CliConsole.prototype.EVENTS = METHODS;
const cliConsole = new CliConsole();

const Logger = function (prefix) {
	prefix = 'SVGLint' + (prefix ? ' ' + prefix : '');
	const logger = {};
	for (const method of METHODS) {
		logger[method] = function (...arguments_) {
			if (level > LEVELS[method]) {
				return;
			}

			if (isCLI) {
				// eslint-disable-next-line no-useless-call
				cliConsole[method].call(cliConsole, prefix, arguments_);
			} else {
				// eslint-disable-next-line no-useless-call
				wrappedConsole[method].call(wrappedConsole, prefix, arguments_);
			}
		};
	}

	return logger;
};

Logger.cliConsole = cliConsole;
Logger.setCLI = (value) => {
	isCLI = value;
};

Logger.setLevel = (value) => {
	level = value;
};

Logger.LEVELS = LEVELS;
Logger.colorize = supportsColor
	? (value) => inspect(value, true, 2, true)
	: (value) => value;
export default Logger;
