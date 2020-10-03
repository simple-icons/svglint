/**
 * @fileoverview The main linting file.
 * This is the object responsible for the actual linting of each file.
 * Each instance represents a single file being linted, including results and
 *   current state.
 * It receives the parsed AST and rules from ../svglint.js, and then runs each
 *   rule and gathers the results.
 */

import { EventEmitter } from "events";
import path = require("path");
import cheerio from "cheerio";

import { Rule, Cheerio } from "../types";
import { clone, AST } from "./parse";
import Reporter from "./reporter";
import Logger, { colorize } from "./logger";
import { NormalizedRules } from "../svglint";

export enum STATES {
    ignored,
    linting,
    success,
    warn,
    error,
}

/**
 * Represents a single file that is being linted.
 * Contains the status and potential result of the linting.
 * @event rule Emitted when a rule is finished
 * @event done Emitted when the linting is done
 */
export default class Linting extends EventEmitter {
    // The AST of the file
    ast: AST;
    // The rules we use for linting
    rules: NormalizedRules;
    // The path to the file
    path: string;
    // The current state of the linting
    state: STATES = STATES.linting;
    // Added so non-TS users can compare to enum
    STATES = STATES;
    // If false, the linting has at least one rule that threw when executing
    valid: boolean = true;
    // The name used for logging/human consumption
    name: string;
    // The Reporters for each rule we've linted
    results: { [k: string]: Reporter | Reporter[] } = {};
    // The logger used to show debugs
    logger: ReturnType<typeof Logger>;

    activeRules: number = 0;

    /** Creates and starts a new linting. */
    constructor(file: string, ast: AST, rules: NormalizedRules) {
        super();

        this.ast = ast;
        this.rules = rules;
        this.path = file;
        this.name = file ? path.relative(process.cwd(), file) : "API";
        this.logger = Logger(`lint:${this.name}`);

        this.lint();
    }

    on(event: string | symbol, cb: (...args: any[]) => void) {
        super.on(event, cb);
        if (event === "done" && this.state !== STATES.linting) {
            cb();
        }
        return this;
    }

    /**
     * Starts the linting.
     * Errors from rules are safely caught and logged as exceptions from the rule.
     */
    lint() {
        this.state = STATES.linting;

        // keep track of when every rule has finished
        const ruleNames = Object.keys(this.rules);
        if (ruleNames.length === 0) {
            this.logger.debug("No rules to lint, finishing");
            this.state = STATES.success;
            Promise.resolve().then(() => this.emit("done"));
            return;
        }
        this.activeRules = ruleNames.length;

        this.logger.debug("Started linting");
        this.logger.debug("  Rules:", ruleNames);

        // start every rule
        ruleNames.forEach(async ruleName => {
            const ast = await clone(this.ast);
            const cheerioParsed = cheerio
                .load("<root></root>", { xmlMode: true })("root")
                .append((ast as unknown) as Cheerio);

            /** Executes a rule function. */
            const execute = (
                rule: Rule,
                reporterName: string,
                onDone: (reporter: Reporter) => void
            ) => {
                // gather results from the rule through a reporter
                const reporter = this._generateReporter(reporterName);
                // execute the rule, potentially waiting for async rules
                // also handles catching errors from the rule
                Promise.resolve()
                    .then(() => rule(reporter, cheerioParsed, ast))
                    .catch(e => reporter.exception(e))
                    .then(() => onDone(reporter));
            };

            const rule: Rule | Rule[] = this.rules[ruleName];
            if (rule instanceof Array) {
                const results: Reporter[] = [];
                let activeRules = rule.length;
                rule.forEach((r, i) => {
                    execute(r, `${ruleName}-${i + 1}`, result => {
                        results[i] = result;
                        if (--activeRules <= 0) {
                            this._onRuleFinish(ruleName, results);
                        }
                    });
                });
                if (rule.length === 0) {
                    Promise.resolve().then(() => {
                        this._onRuleFinish(
                            ruleName,
                            this._generateReporter(ruleName)
                        );
                    });
                    this.logger.debug(
                        "Rule had no configs",
                        colorize(ruleName)
                    );
                }
            } else {
                execute(rule, ruleName, result => {
                    this._onRuleFinish(ruleName, result);
                });
            }
        });
    }

    /** Handles a rule finishing. */
    _onRuleFinish(ruleName: string, reporter: Reporter | Reporter[]) {
        this.logger.debug("Rule finished", colorize(ruleName));
        this.emit("rule", {
            name: ruleName,
            result: reporter,
        });
        this.results[ruleName] = reporter;

        --this.activeRules;
        if (this.activeRules === 0) {
            this.state = this._calculateState();
            this.logger.debug(
                "Linting finished with status",
                colorize(this.state)
            );
            this.emit("done");
        }
    }

    /** Calculates the current state from this.results. */
    _calculateState() {
        let state = STATES.success;
        for (let k in this.results) {
            const result = this.results[k];
            if (result instanceof Array) {
                if (result.some(res => res.hasErrors)) {
                    return STATES.error;
                }
                if (result.some(res => res.hasWarns)) {
                    state = STATES.warn;
                }
            } else {
                if (result.hasErrors) {
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
     */
    _generateReporter(ruleName: string) {
        const reporter = new Reporter(ruleName);
        reporter.once("exception", () => {
            this.valid = false;
        });
        return reporter;
    }
}
