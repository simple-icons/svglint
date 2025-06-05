import logging from '../lib/logger.js';

const logger = logging('rule:custom');

/** @typedef {import('cheerio').Cheerio<import('domhandler').Document>} Cheerio */
/** @typedef {import("../lib/reporter.js")} Reporter */
/** @typedef {import("../lib/parse.js").AST} AST */
/** @typedef {import("../lib/parse.js").Node} Node */
/** @typedef {{ filepath: string, fixtures: any }} Info */

/**
 * @callback CustomRule
 * @param {Reporter} reporter The reporter to report to
 * @param {Cheerio} $ A cheerio representation of the document
 * @param {AST} ast The AST of the document, which we should pass to reporter
 * @param {Info} info Info related to the current file being linted
 */
/**
 * @typedef {CustomRule} CustomConfig
 * The function will be executed as if though it was a rule.
 */

const custom = {
	/**
	 * Generates a linting function from a config
	 * @param {CustomConfig} config
	 */
	generate(config) {
		/**
		 * Performs the linting according to the previously passed config.
		 * @param {Reporter} reporter The reporter to report warnings/errors to
		 * @param {Cheerio} $ A cheerio representation of the document
		 * @param {AST} ast The underlying AST representation of the document.
		 *                  This should be given to Reporter when warning/erroring with a node.
		 * @param {Info} info Info related to the current file being linted.
		 */
		return function (reporter, $, ast, info) {
			logger.debug('Called', config);
			return config(reporter, $, ast, info);
		};
	},
};

export default custom;
