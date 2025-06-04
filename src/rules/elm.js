import logging from '../lib/logger.js';

const logger = logging('rule:elm');

/** @typedef {import('cheerio').Cheerio<import('domhandler').Document>} Cheerio */
/** @typedef {import("../lib/reporter.js")} Reporter */
/** @typedef {import("../lib/parse.js").AST} AST */
/** @typedef {import("../lib/parse.js").Node} Node */

/**
 * @typedef {Object<string,Boolean|Number|Array<Number>>} ElmConfig
 * The key is used as selector. The value has the following meanings:
 * - `{Boolean}` If true the selector must be matched. If false the selector must not be matched.
 * - `{Number}` The number of elements the selector must resolve to. Must be exact.
 * - `{Array<Number>}` The number of elements the selector resolves to must be between the first and the second number.
 *
 * Note that if an element is disallowed by one rule, but allowed by another, it will be allowed.
 * This allows you to do e.g. `{ "title": false, "svg > title": true }`.
 */
/**
 * @typedef RuleElmResult
 * @property {Node} [elm] The element the result relates to
 * @property {String} message The message the result is described by
 */
/**
 * @typedef RuleExecution
 * @property {RuleElmResult[]} allowed The elements allowed by the rule
 * @property {RuleElmResult[]} disallowed The elements disallowed by the rule
 */

/**
 * Workflow:
 * 1. Find all { allowed: [], disallowed: [] }
 * 2. Filter .disallowed by not in .allowed
 * 3. If .disallowed.length, fail
 *
 * Rules act like this:
 * - {true} If found, put in allowed
 * - {false} If found, put in disallowed
 * - {Number} If exact match, put all in allowed. If not, put all in disallowed.
 * - {Array<Number>} If match, put all in allowed. If not, put all in disallowed.
 *
 * This means that e.g. `{ "b": 2, "a > b": true}` with "<b/><b/><a><b/><b/></a>"
 * will fail, which is something to keep in mind.
 */

/**
 * Executes a rule, returning the RuleExecution.
 * @param {String} selector The selector of the rule
 * @param {Boolean|Number|Array<Number>} config The config of the rule
 * @param {Cheerio} $ The cheerio representation of the document
 */
function executeRule(selector, config, $) {
	/** @type {RuleExecution} */
	const outp = {
		allowed: [],
		disallowed: [],
	};
	/** @type {RuleElmResult[]} */
	const matches = $.find(selector)
		.toArray()
		.map((elm) => ({elm, message: ''}));
	let allowed = null;
	let message = null;
	switch (typeof config) {
		case 'boolean': {
			if (config) {
				allowed = true;
				if (matches.length === 0) {
					outp.disallowed.push({
						elm: null,
						message: `Expected '${selector}', none found`,
					});
				}
			} else {
				allowed = false;
				message = 'Element disallowed';
			}

			break;
		}

		case 'number': {
			if (matches.length === config) {
				allowed = true;
			} else {
				allowed = false;
				message = `Found ${matches.length} elements for '${selector}', expected ${config}`;
				if (matches.length === 0) {
					matches.push({elm: null, message: ''});
				}
			}

			break;
		}

		default: {
			if (
				Array.isArray(config) &&
				config.length === 2 &&
				typeof config[0] === 'number' &&
				typeof config[1] === 'number'
			) {
				if (matches.length >= config[0] && matches.length <= config[1]) {
					allowed = true;
				} else {
					outp.disallowed.push({
						elm: null,
						message: `Found ${matches.length} elements for '${selector}', expected between ${config[0]} and ${config[1]}`,
					});
				}
			} else {
				// eslint-disable-next-line no-throw-literal
				throw `Unknown config type '${typeof config}' (${JSON.stringify(config)})`;
			}
		}
	}

	if (allowed === true) {
		// eslint-disable-next-line unicorn/prefer-spread
		outp.allowed = outp.allowed.concat(matches);
	} else if (allowed === false) {
		// eslint-disable-next-line unicorn/prefer-spread
		outp.disallowed = outp.disallowed.concat(
			matches.map((match) => {
				match.message = message;
				return match;
			}),
		);
	}

	return outp;
}

const elm = {
	/**
	 * Generates a linting function from a config
	 * @param {ElmConfig} config
	 */
	generate(config) {
		/**
		 * Performs the linting according to the previously passed config.
		 * @param {Reporter} reporter The reporter to report warnings/errors to
		 * @param {Cheerio} $ A cheerio representation of the document
		 * @param {AST} ast The underlying AST representation of the document.
		 *                  This should be given to Reporter when warning/erroring with a node.
		 */
		return function (reporter, $, ast) {
			logger.debug('Called', config);
			// Gather the result of every execution
			const executions = Object.keys(config)
				.map((selector) => {
					try {
						return executeRule(selector, config[selector], $);
					} catch (error) {
						if (error instanceof Error) {
							reporter.exception(error);
						} else {
							reporter.warn(`Rule '${selector}' failed to lint: ${error}`);
						}

						return null;
					}
				})
				.filter(Boolean);
			// Then filter out the disallowed elms that are allowed elsewhere
			/** @type {Node[]} */
			const allowedElms = [];
			/** @type {RuleElmResult[]} */
			const disallowed = [];
			// First gather the allowed elms
			for (const execution of executions) {
				allowedElms.push(...execution.allowed.map((result) => result.elm));
			}

			// The filter the disallowed elms by whether they are allowed elsewhere
			for (const execution of executions) {
				disallowed.push(
					...execution.disallowed.filter(
						(result) => !allowedElms.includes(result.elm),
					),
				);
			}

			// Finally report all the remaining disallowed elms
			for (const result of disallowed) {
				reporter.error(result.message, result.elm, ast);
			}
		};
	},
};

export default elm;
