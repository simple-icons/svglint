import process from 'node:process';
import {chalk} from '../util.js';

const columns = process.stdout.columns || 80;

/**
 * A separator between sections.
 * Optionally includes a title which will be displayed centered in the separator.
 */
export default class Separator {
	constructor(title = '') {
		this.title = title;
	}

	toString() {
		const padding = chalk.gray.dim(
			'-'.repeat(Math.floor((columns - this.title.length - 2) / 2)),
		);
		return `${padding} ${chalk.bold.underline(this.title)} ${padding}`;
	}
}
