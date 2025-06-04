import stripAnsi from 'strip-ansi';
import {COLUMNS, MSG_META, chalk, chunkString} from '../util.js';
import Spinner from './spinner.js';

/** @typedef {import("../../lib/reporter.js")} Reporter */
/** @typedef {import("../../lib/linting.js")} Linting */

/**
 * Turns a results object into a flat array of Reporters, in a stable-sorted manner.
 * @param {Object<string,Reporter|Reporter[]>} results The results from the Linting
 * @returns {Reporter[]}
 */
function flattenReporters(results) {
	const outp = [];
	for (const reporterName of Object.keys(results).sort()) {
		const reporter = results[reporterName];
		const reporters = Array.isArray(reporter) ? reporter : [reporter];
		outp.push(...reporters);
	}

	return outp;
}

/**
 * A display for a single linting.
 */
export default class LintingDisplay {
	/** @param {Linting} linting */
	constructor(linting) {
		this.linting = linting;
		this.$spinner = new Spinner();
	}

	/**
	 * Returns whether we should actively animate for the spinner.
	 * @returns {Boolean}
	 */
	shouldAnimate() {
		return this.linting.state === this.linting.STATES.linting;
	}

	/**
	 * Returns the string representing the header of the linting display
	 * @returns {String}
	 */
	renderHeader() {
		const {linting} = this;
		let symbol;
		for (const state of Object.keys(MSG_META)) {
			if (linting.state === linting.STATES[state]) {
				const meta = MSG_META[state];
				symbol = meta.color(state === 'linting' ? this.$spinner : meta.symbol);
			}
		}

		return symbol + ' ' + chalk.bold.underline(linting.name);
	}

	/**
	 * Returns the string representing all of our reporters
	 * @returns {String}
	 */
	renderReporters() {
		const outp = flattenReporters(this.linting.results)
			.map((reporter) => new ReporterDisplay(reporter))
			.filter((display) => display.shouldDisplay())
			.join('\n');
		if (outp.length > 0) {
			return '\n' + outp;
		}

		return '';
	}

	toString() {
		return this.renderHeader() + this.renderReporters();
	}
}

class ReporterDisplay {
	constructor(reporter) {
		this.reporter = reporter;
	}

	shouldDisplay() {
		return this.reporter.messages.length > 0;
	}

	formatMsg(message) {
		const meta = MSG_META[message.type];
		const prefix = `  ${meta.color(meta.symbol + ' ' + this.reporter.name)}${
			message._node
				? chalk.gray.dim(` ${message._node.lineNum}:${message._node.columnNum}`)
				: ''
		} `;
		const prefixLength = stripAnsi(prefix).length;
		return (
			prefix +
			chunkString(
				(message.message || '').toString() || '',
				COLUMNS - prefixLength - 1,
			).join('\n' + ' '.repeat(prefixLength))
		);
	}

	toString() {
		const msgs = this.reporter.messages.map((message) =>
			this.formatMsg(message),
		);
		return msgs.join('\n');
	}
}
