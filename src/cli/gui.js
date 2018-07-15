/**
 * @fileoverview The CLI GUI.
 * Handles formatting the state of a (multifile) linting in a human-friendly way.
 * Expects a terminal to be present as process.stdout.
 */
const chalk = require("chalk");
const logUpdate = require("log-update");
const Logger = require("../lib/logger");
const logHistory = Logger.cliConsole;

const Separator = require("./components/separator");
const Log = require("./components/log");
const LintingDisplay = require("./components/linting");

module.exports = class GUI {
    constructor() {
        // subscribe to global logs
        Logger.setCLI(true);
        logHistory.on("msg", () => this.update());

        // generate one-shot components
        this.$titles = {
            log: new Separator("Log"),
            lints: new Separator("Files"),
        };
        this.$log = new Log(logHistory);
        /** @type {Linting[]} */
        this.$lintings = [];
    }

    /**
     * Re-renders the GUI.
     * Should be called any time anything has changed.
     */
    update() {
        const outp = [];
        if (logHistory.messages.length) {
            outp.push(this.$titles.log);
            outp.push(this.$log);
        }
        if (this.$lintings.length) {
            outp.push(this.$titles.lints);
            outp.push(...this.$lintings);
        }
        logUpdate(outp.join("\n"));

        // animate if we should
        if (this.shouldAnimate()) {
            clearTimeout(this._animTimeout);
            this._animTimeout = setTimeout(() => this.update(), 100);
        }
    }

    /**
     * Returns whether we should animate actively (e.g. for a spinner)
     * @returns {Boolean}
     */
    shouldAnimate() {
        return this.$lintings.some($linting => $linting.shouldAnimate());
    }

    /**
     * Adds a Linting to the GUI.
     * This means that the result of the linting will be shown by the GUI.
     * @param {Linting} linting The linting to show
     */
    addLinting(linting) {
        this.$lintings.push(new LintingDisplay(linting));
        linting.on("rule", () => this.update());
        linting.on("done", () => this.update());
    }
};
