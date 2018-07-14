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
const Spinner = require("./components/spinner");
const Log = require("./components/log");

module.exports = class GUI {
    constructor() {
        /** The Lintings we are currently showing.
         * @type {Linting[]} */
        this.lintings = [];

        // subscribe to global logs
        Logger.setCLI(true);
        logHistory.on("msg", () => this.update());

        // generate one-shot components
        this.$titles = {
            log: new Separator("Log"),
            lints: new Separator("Files"),
        };
        this.$log = new Log(logHistory);
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
        logUpdate(outp.join("\n"));
    }

    /**
     * Adds a Linting to the GUI.
     * This means that the result of the linting will be shown by the GUI.
     * @param {Linting} linting The linting to show
     */
    addLinting(linting) {
        this.lintings.push(linting);
    }
};
