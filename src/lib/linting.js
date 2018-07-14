/**
 * @fileoverview The main linting file.
 * This is the object responsible for the actual linting of each file.
 * Each instance represents a single file being linted, including results and
 *   current state.
 * It receives the parsed AST and rules from ../svglint.js, and then runs each
 *   rule and gathers the results.
 */
const EventEmitter = require("events").EventEmitter;
const path = require("path");
const Reporter = require("./reporter");
const logger = require("./logger");

const STATES = Object.freeze({
    "ignored": "ignored",
    "linting": "linting",
    "success": "success",
    "warn":    "warn",
    "error":   "error",
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
     * @param {NormalizedRules} rules The rules that represent 
     */
    constructor(file, ast, rules) {
        super();
        this.ast = ast;
        this.rules = rules;
        this.path = file;
        this.state = STATES.linting;
        this.name = file
            ? path.relative(process.cwd(), file)
            : "API";
        /** @type Object<string,Reporter> */
        this.results = {};

        this.lint();
        // TODO: add reporter
    }

    /**
     * Starts the linting.
     * Errors from rules are safely caught and logged as exceptions from the rule.
     */
    lint() {
        this.state = STATES.linting;

        // keep track of when every rule has finished
        const rules = Object.keys(this.rules);
        this.activeRules = rules.length;

        logger.debug(`[lint:${this.name}]`, "Started linting");
        logger.debug(`[lint:${this.name}]`, "  Rules:", rules);

        // start every rule
        rules.forEach(ruleName => {
            // gather results from the rule through a reporter
            const reporter = this._generateReporter(ruleName);
            const onDone = () => {
                this._onRuleFinish(ruleName, reporter);
            };

            // execute the rule, potentially waiting for async rules
            // also handles catching errors from the rule
            Promise.resolve()
                .then(() => this.rules[ruleName](reporter))
                .catch(e => reporter.exception(e))
                .then(onDone);
        });
    }

    /**
     * Handles a rule finishing.
     * @param {String} ruleName The name of the rule that just finished
     * @param {Reporter} reporter The reporter containing rule results
     * @emits rule
     * @private
     */
    _onRuleFinish(ruleName, reporter) {
        logger.debug(`[lint:${this.name}]`, "Rule finished", logger.colorize(ruleName));
        this.emit("rule", {
            name: ruleName,
            reporter,
        });
        this.results[ruleName] = reporter;

        --this.activeRules;
        if (this.activeRules === 0) {
            this.state = this._calculateState();
            logger.debug(`[lint:${this.name}]`, "Linting finished", logger.colorize(this.state));
            this.emit("done");
        }
    }

    /**
     * Calculates the current state from this.results.
     * @returns One of the valid states
     */
    _calculateState() {
        let state = STATES.success;
        for (let k in this.results) {
            const result = this.results[k];
            if (result.errors.length) { return STATES.error; }
            if (result.warns.length || state === STATES.warn) {
                state = STATES.warn;
            }
        }
        return state;
    }

    /**
     * Generates a Reporter for use with this file.
     * Remember to call .done() on it.
     * @param {String} ruleName The name of the rule that this reporter is used for
     * @private
     */
    _generateReporter(ruleName) {
        return new Reporter(ruleName);
    }
}
Linting.STATES = STATES;

module.exports = Linting;
