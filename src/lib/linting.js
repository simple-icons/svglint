/**
 * @fileoverview The main linting file.
 * This is the object responsible for the actual linting of each file.
 * Each instance represents a single file being linted, including results and
 *   current state.
 * It receives the parsed AST and rules from ../svglint.js, and then runs each
 *   rule and gathers the results.
 */
import {EventEmitter} from 'node:events';
import path from 'node:path';
import process from 'node:process';
import * as cheerio from 'cheerio';
import logging from './logger.js';
import * as parse from './parse.js';
import Reporter from './reporter.js';

/** @typedef {import("./parse.js").AST} AST */
/** @typedef {import("./parse.js").Node} Node */
/** @typedef {import("../svglint.js").NormalizedRules} NormalizedRules */
/** @typedef {import("../svglint.js").Fixtures} Fixtures */
/** @typedef {import("../svglint.js").FixturesConfig} FixturesConfig */

const STATES = Object.freeze({
	ignored: 'ignored',
	linting: 'linting',
	success: 'success',
	warn: 'warn',
	error: 'error',
});

/**
 * Represents a single file that is being linted.
 * Contains the status and potential result of the linting.
 * @event rule Emitted when a rule is finished
 * @event done Emitted when the linting is done
 */
class Linting extends EventEmitter {
	/**
	 * Creates and starts a new linting.
	 * @param {String} file The file to lint
	 * @param {AST} ast The AST of the file
	 * @param {NormalizedRules} rules The rules to lint by
	 * @param {FixturesConfig} fixturesLoader The fixtures loader
	 */
	constructor(file, ast, rules, fixturesLoader) {
		super();
		/** The AST of the file */
		this.ast = ast;
		/** The rules we use for linting */
		this.rules = rules;
		/** Fixtures for the linting */
		this.fixturesLoader = fixturesLoader;
		/** The path to the file */
		this.path = file;
		/** The current state of the linting */
		this.state = STATES.linting;
		/** If false, the linting has at least one rule that threw when executing */
		this.valid = true;
		/** The name used for logging/human consumption */
		this.name = file ? path.relative(process.cwd(), file) : 'API';
		/** The Reporters for each rule we've linted
		 * @type Object<string,Reporter|Reporter[]> */
		this.results = {};
		/** The logger used to show debugs */
		this.logger = logging(`lint:${this.name}`);
	}

	/**
	 * Starts the linting.
	 * Errors from rules are safely caught and logged as exceptions from the rule.
	 */
	lint() {
		this.state = STATES.linting;

		// Keep track of when every rule has finished
		const ruleNames = Object.keys(this.rules);
		if (ruleNames.length === 0) {
			this.logger.debug('No rules to lint, finishing');
			this.state = STATES.success;
			Promise.resolve().then(() => this.emit('done'));
			return;
		}

		this._maybeLoadFixtures((fixtures) => {
			this.logger.debug('Started linting');
			this.logger.debug('  Rules:', ruleNames);

			this.activeRules = ruleNames.length;

			// Start every rule
			for (const ruleName of ruleNames) {
				const ast = parse.clone(this.ast);
				const $ = cheerio
					.load('<root></root>', {xmlMode: true})('root')
					// @ts-ignore
					.append(ast);

				/** @type {Function|Function[]} */
				const rule = this.rules[ruleName];
				if (Array.isArray(rule)) {
					/** @type {Reporter[]} */
					const results = [];
					let activeRules = rule.length;
					for (const [i, r] of rule.entries()) {
						this._executeRule(
							r,
							`${ruleName}-${i + 1}`,
							$,
							ast,
							fixtures,
							(result) => {
								results[i] = result;
								if (--activeRules <= 0) {
									this._onRuleFinish(ruleName, results);
								}
							},
						);
					}

					if (rule.length === 0) {
						Promise.resolve().then(() => {
							this._onRuleFinish(ruleName, this._generateReporter(ruleName));
						});
						this.logger.debug(
							'Rule had no configs',
							logging.colorize(ruleName),
						);
					}
				} else {
					this._executeRule(rule, ruleName, $, ast, fixtures, (result) => {
						this._onRuleFinish(ruleName, result);
					});
				}
			}
		});
	}

	/**
	 * Handles a rule finishing.
	 * @param {String} ruleName The name of the rule that just finished
	 * @param {Reporter|Reporter[]} reporter The reporter containing rule results
	 * @emits rule
	 * @private
	 */
	_onRuleFinish(ruleName, reporter) {
		this.logger.debug('Rule finished', logging.colorize(ruleName));
		this.emit('rule', {
			name: ruleName,
			result: reporter,
		});
		this.results[ruleName] = reporter;

		--this.activeRules;
		if (this.activeRules === 0) {
			this.state = this._calculateState();
			this.logger.debug(
				'Linting finished with status',
				logging.colorize(this.state),
			);
			this.emit('done');
		}
	}

	/**
	 * Calculates the current state from this.results.
	 * @returns One of the valid states
	 */
	_calculateState() {
		let state = STATES.success;
		// eslint-disable-next-line guard-for-in
		for (const k in this.results) {
			const result = this.results[k];
			if (Array.isArray(result)) {
				if (result.some((item) => item.hasErrors || item.hasExceptions)) {
					return STATES.error;
				}

				if (result.some((item) => item.hasWarns)) {
					state = STATES.warn;
				}
			} else {
				if (result.hasErrors || result.hasExceptions) {
					return STATES.error;
				}

				if (result.hasWarns) {
					state = STATES.warn;
				}
			}
		}

		return state;
	}

	/**
	 * Generates a Reporter for use with this file.
	 * Remember to call .done() on it.
	 * @param {String} ruleName The name of the rule that this reporter is used for
	 * @returns {Reporter} The generated reporter
	 * @private
	 */
	_generateReporter(ruleName) {
		const reporter = new Reporter(ruleName);
		reporter.once('exception', () => {
			this.valid = false;
		});
		return reporter;
	}

	/**
	 * Executes a rule function.
	 * @param {Function} rule The loaded rule
	 * @param {String} reporterName The name to give the reporter
	 * @param {$} $ The cheerio instance to use for the rule
	 * @param {AST} ast The AST to use for the rule
	 * @param {any} fixtures The fixtures to use for the rule
	 * @param {() => Reporter} onDone Function to call once the rule is done
	 */
	// eslint-disable-next-line max-params
	_executeRule(rule, reporterName, $, ast, fixtures, onDone) {
		// Gather results from the rule through a reporter
		const reporter = this._generateReporter(reporterName);
		// Execute the rule, potentially waiting for async rules
		// also handles catching errors from the rule
		const injected = {filepath: this.path};
		if (fixtures !== undefined) {
			// If fixtures are provided, inject them into the rule.
			// Note that fixtures are mutable. Rules should not mutate them.
			injected.fixtures = fixtures;
		}

		Promise.resolve()
			.then(() => rule(reporter, $, ast, injected))
			.catch((error) => reporter.exception(error))
			.then(() => onDone(reporter));
	}

	/**
	 * Maybe loads fixtures for the linting.
	 * @param {() => Fixtures|undefined} onDone
	 */
	_maybeLoadFixtures(onDone) {
		if (this.fixturesLoader) {
			this.logger.debug('Resolving fixtures for linting');
			const ast = parse.clone(this.ast);
			const $ = cheerio
				.load('<root></root>', {xmlMode: true})('root')
				// @ts-ignore
				.append(ast);

			// Resolve fixtures
			const reporter = this._generateReporter('fixtures');
			Promise.resolve()
				.then(() =>
					this.fixturesLoader(reporter, $, ast, {filepath: this.path}),
				)
				.catch((error) => reporter.exception(error))
				.then((fixtures) => {
					if (reporter.hasErrors || reporter.hasExceptions) {
						this.state = STATES.error;
						this.logger.debug(
							'Fixtures rule aborted execution with status',
							logging.colorize(this.state),
						);
						this.emit('done');
					} else {
						if (reporter.hasWarns) {
							this.state = STATES.warn;
						}

						onDone(fixtures);
					}
				});
		} else {
			this.logger.debug('No fixtures loader detected');
			onDone(undefined);
		}
	}
}

// eslint-disable-next-line no-multi-assign
Linting.STATES = Linting.prototype.STATES = STATES;

export default Linting;
