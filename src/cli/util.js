/**
 * @fileoverview Utilities for the CLI.
 */
import process from 'node:process';
import ansiRegex from 'ansi-regex';
// eslint-disable-next-line unicorn/import-style
import {Chalk, supportsColor as chalkSupportsColor} from 'chalk';

const supportsColor =
	chalkSupportsColor &&
	!('NO_COLOR' in process.env) &&
	!('SVGLINT_NO_COLOR' in process.env);

const chalk = supportsColor ? new Chalk() : new Chalk({level: 0});

const COLUMNS = process.stdout.columns || 80;
const MSG_META = Object.freeze({
	// Logs
	debug: Object.freeze({
		symbol: 'd',
		color: chalk.gray.dim.bold,
	}),
	log: Object.freeze({
		symbol: 'i',
		color: chalk.blue.bold,
	}),

	// Lintings
	linting: Object.freeze({
		symbol: null,
		color: chalk.gray.dim,
	}),
	success: Object.freeze({
		symbol: '✓',
		color: chalk.green.bold,
	}),
	warn: Object.freeze({
		symbol: '!',
		color: chalk.yellow.bold,
	}),
	error: Object.freeze({
		symbol: 'x',
		color: chalk.red.bold,
	}),
	exception: Object.freeze({
		symbol: '!!!',
		color: chalk.bgRed.bold,
	}),
});

export {chalk, chunkString, supportsColor, MSG_META, COLUMNS};

/**
 * Splits a string into N sized chunks.
 * Newlines also indicates a chunk end.
 * Handles ANSI color codes correctly (does not count them towards length)
 * @param {String} str  The string to chunk
 * @param {Number} N    The length to chunk into
 * @returns {Array<String>}
 */
function chunkString(string_, N) {
	const outp = [];
	const exclude = [ansiRegex()];
	let temporary = '';
	let temporaryLength = 0;
	for (let i = 0, l = string_.length; i < l; ++i) {
		if (
			string_[i] === '\n' || // Split at newlines
			temporaryLength === N
		) {
			// And at length
			outp.push(temporary);
			temporary = '';
			temporaryLength = 0;
		}

		if (string_[i] === '\n') {
			// Don't add newlines to our outp str
			continue;
		}

		let excluded = false;
		for (const regex of exclude) {
			// Skip excluded matches
			const tester = new RegExp('^' + regex.source);
			const match = tester.exec(string_.slice(i));
			if (match) {
				i += match[0].length - 1;
				temporary += match[0];
				excluded = true;
				break;
			}
		}

		if (excluded) {
			continue;
		}

		temporary += string_[i];
		++temporaryLength;
	}

	if (temporary) {
		outp.push(temporary);
	}

	return outp;
}
