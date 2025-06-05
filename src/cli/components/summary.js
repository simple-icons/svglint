import {MSG_META, chalk} from '../util.js';

/** @typedef {import("../../lib/linting.js")} Linting */

/**
 * A summary of all lintings.
 */
export default class Summary {
	constructor() {
		this.lintings = [];
	}

	/** Adds a linting to the summary.
	 * @param {Linting} linting */
	addLinting(linting) {
		this.lintings.push(linting);
	}

	/** Gets the number of Listings with the given state
	 * @param {"linting"|"success"|"warn"|"error"} state The state to look for
	 */
	getNumberWithState(state) {
		return this.lintings.filter(
			(linting) => linting.state === linting.STATES[state],
		).length;
	}

	toString() {
		const active = this.getNumberWithState('linting');
		const successes = this.getNumberWithState('success');
		const warns = this.getNumberWithState('warn');
		const errors = this.getNumberWithState('error');

		return [
			active
				? MSG_META.linting.color.bold(`? ${active} lintings in progress.`)
				: null,
			successes
				? MSG_META.success.color.bold(
						`${MSG_META.success.symbol} ${successes} valid files.`,
					)
				: null,
			warns
				? MSG_META.warn.color.bold(
						`${MSG_META.warn.symbol} ${warns} files with warnings.`,
					)
				: null,
			errors
				? MSG_META.error.color.bold(
						`${MSG_META.error.symbol} ${errors} invalid files.`,
					)
				: null,
			active + successes + warns + errors === 0
				? chalk.gray.dim('- No files linted')
				: null,
		]
			.filter(Boolean)
			.join('\n');
	}
}
