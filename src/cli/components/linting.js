const chalk = require("chalk");
const Linting = require("../../lib/linting");
const nodeUtil = require("util");
const utils = require("../util");

const Spinner = require("./spinner");

const COLUMNS = process.stdout.columns || 80;
const MSG_META = Object.freeze({
    "linting": Object.freeze({
        symbol: null,
        color: chalk.gray.dim,
    }),
    "success": Object.freeze({
        symbol: "✓",
        color: chalk.green.bold,
    }),
    "warn": Object.freeze({
        symbol: "!",
        color: chalk.yellow.bold,
    }),
    "error": Object.freeze({
        symbol: "x",
        color: chalk.red.bold,
    })
});

/**
 * A display for a single linting.
 */
module.exports = class LintingDisplay {
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
        const linting = this.linting;
        let symbol;
        for (let state of Object.keys(MSG_META)) {
            if (linting.state === linting.STATES[state]) {
                const meta = MSG_META[state];
                symbol = meta.color(state === "linting"
                    ? this.$spinner
                    : meta.symbol);
            }
        }
        return symbol + " " + chalk.bold(linting.name);
    }


    toString() {
        return this.renderHeader();
    }
};
