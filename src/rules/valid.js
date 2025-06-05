import {XMLValidator} from 'fast-xml-parser';
import logging from '../lib/logger.js';

const logger = logging('rule:valid');

/** @typedef {import('cheerio').Cheerio<import('domhandler').Document>} Cheerio */
/** @typedef {import("../lib/reporter.js")} Reporter */
/** @typedef {import("../lib/parse.js").AST} AST */
/** @typedef {import("../lib/parse.js").Node} Node */

/**
 * Workflow:
 * 1. Validate the SVG using fast-xml-parser
 * 2. If the SVG is not valid, report an error
 */

const valid = {
	/**
	 * Generates a linting function from a config
	 * @param {Boolean} config
	 */
	generate(enabled) {
		/**
		 * Performs the linting according to the previously passed config.
		 * @param {Reporter} reporter The reporter to report warnings/errors to
		 * @param {Cheerio} $ A cheerio representation of the document
		 * @param {AST} ast The underlying AST representation of the document.
		 *                  This should be given to Reporter when warning/erroring with a node.
		 */
		return function (reporter, $, ast) {
			logger.debug('Called', enabled);
			if (!enabled) {
				return;
			}

			if (!ast.source) {
				logger.debug('Encountered empty SVG. Considering valid');
				return;
			}

			const result = XMLValidator.validate(ast.source);
			if (result !== true) {
				reporter.error(result.err.msg, null, ast);
			}
		};
	},
};

export default valid;
