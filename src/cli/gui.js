/**
 * @fileoverview The CLI GUI.
 * Handles formatting the state of a (multifile) linting in a human-friendly way.
 * Expects a terminal to be present as process.stdout.
 */
const logUpdate = require("log-update");
const Logger = require("../lib/logger");
const logHistory = Logger.cliConsole;

const Separator = require("./components/separator");
const Log = require("./components/log");
const LintingDisplay = require("./components/linting");
const Summary = require("./components/summary");

module.exports = class GUI {
    constructor() {
        // subscribe to global logs
        Logger.setCLI(true);
        logHistory.on("msg", () => this.update());

        /** If true, we should only write to stdout once */
        this.ci = false;

        // generate one-shot components
        this.$titles = {
            log: new Separator("Log"),
            lints: new Separator("Files"),
            summary: new Separator("Summary"),
        };
        this.$log = new Log(logHistory);
        this.$summary = new Summary();
        /** @type {Linting[]} */
        this.$lintings = [];
    }

    /**
     * Called when the linting is finished and we should finish up.
     */
    finish() {
        if (this.ci) {
            console.log(this.render());
        } else {
            this.update();
        }
    }

    /**
     * Re-renders the GUI.
     * Should be called any time anything has changed.
     */
    update() {
        if (this.ci) { return; }
        logUpdate(this.render());

        // animate if we should
        if (this.shouldAnimate()) {
            clearTimeout(this._animTimeout);
            this._animTimeout = setTimeout(() => this.update(), 100);
        }
    }

    /**
     * Returns the string that represents the GUI.
     * This string can be logged directly to console.
     */
    render() {
        const outp = [];
        if (logHistory.messages.length) {
            outp.push(
                "",
                this.$titles.log,
                this.$log
            );
        }
        if (this.$lintings.length) {
            outp.push(
                "",
                this.$titles.lints,
                this.$lintings
                    .join("\n"),
            );
        }
        outp.push(
            "",
            this.$titles.summary,
            this.$summary
        );
        if (outp[0] === "") { outp.shift(); }
        return outp.join("\n");
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
        this.$summary.addLinting(linting);
        linting.on("rule", () => this.update());
        linting.on("done", () => this.update());
    }

    /**
     * Sets whether we should only output to stdout once.
     * @param {Boolean} value If true, enable CI mode
     */
    setCI(value) {
        this.ci = value;
    }
};
