import {inspect} from 'node:util';
import {MSG_META, supportsColor} from '../util.js';

/** @typedef {import("../../lib/logger.js").CliConsole} CliHistory */

/**
 * Stringifies a list of data into a colorized single line
 * @param {Array} args The data to stringify
 */
function stringifyArguments(arguments_ = []) {
	return arguments_
		.map((v) =>
			(typeof v === 'string'
				? v
				: inspect(v, {colors: supportsColor, depth: 3})
			).replace(/^Error: /, ''),
		)
		.join(' ');
}

/**
 * A display for a log history.
 */
export default class Log {
	/** @param {CliHistory} logHistory */
	constructor(logHistory) {
		this.logs = logHistory;
	}

	toString() {
		return this.logs.messages
			.map((message_) => {
				const meta = MSG_META[message_.type];
				const prefix = message_.prefix
					? `[${meta.symbol}|${message_.prefix}]`
					: `(${meta.symbol})`;
				const message = stringifyArguments(message_.args);
				return (supportsColor ? meta.color(prefix) : prefix) + ' ' + message;
			})
			.join('\n');
	}
}
