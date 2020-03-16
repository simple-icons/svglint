/**
 * @fileoverview The CLI GUI.
 * Handles formatting the state of a (multifile) linting in a human-friendly way.
 * Expects a terminal to be present as process.stdout.
 */

import logUpdate = require("log-update");
import Logger from "../lib/logger";
const logHistory = Logger.cliConsole;

import Separator from "./components/separator";
import Log from "./components/log";
import LintingDisplay from "./components/linting";
import Summary from "./components/summary";

// TODO: replace once linting has been rewritten to TS
type Linting = any;
/** @typedef {import("../lib/linting.js")} Linting */

/** GUI is the human-friendly CLI interface that displays the status of a linting */
export default class GUI {
    isCI: boolean = false;
    $titles: { log: Separator; lints: Separator; summary: Separator };
    $log: Log;
    $summary: Summary;
    $lintings: LintingDisplay[];

    _lastUpdate: number = 0;
    _updateDebounce?: number;
    _animTimeout?: number;

    constructor() {
        // subscribe to global logs
        Logger.setCLI(true);
        logHistory.on("msg", () => this.update());

        // generate one-shot components
        this.$titles = {
            log: new Separator("Log"),
            lints: new Separator("Files"),
            summary: new Separator("Summary"),
        };
        this.$log = new Log(logHistory);
        this.$summary = new Summary();
        this.$lintings = [];
    }

    /** Called when the linting is finished and we should finish up. */
    finish() {
        if (this.isCI) {
            console.log(this.render());
        } else {
            this.update(true);
        }
    }

    /**
     * Re-renders the GUI.
     * Should be called any time anything has changed.
     * @param force If true, don't debounce
     */
    update(force = false) {
        if (this.isCI) {
            return;
        }
        clearTimeout(this._updateDebounce);
        this._lastUpdate = this._lastUpdate || 0;
        const cur = Date.now();
        const exceededTimeout = cur - this._lastUpdate > 50;
        if (exceededTimeout || force) {
            this._update();
        } else {
            this._updateDebounce = (setTimeout(
                () => this._update(),
                50
            ) as unknown) as number;
        }
    }

    /**
     * Actually re-renders the GUI, without debouncing.
     * Shouldn't be called by an external user, unless they know what they're doing.
     */
    _update() {
        this._lastUpdate = Date.now();
        logUpdate(this.render());

        // animate if we should
        if (this.shouldAnimate()) {
            clearTimeout(this._animTimeout);
            this._animTimeout = (setTimeout(
                () => this.update(),
                100
            ) as unknown) as number;
        }
    }

    /**
     * Returns the string that represents the GUI.
     * This string can be logged directly to console.
     */
    render() {
        const outp = [];
        // if we have log messages, add them at the start
        if (logHistory.messages.length) {
            outp.push("", this.$titles.log, this.$log);
        }
        // then add lintings that are currently running
        if (this.$lintings.length) {
            const $lintings = this.$lintings.filter(
                $linting =>
                    $linting.linting.state !== $linting.linting.STATES.success
            );
            if ($lintings.length) {
                outp.push("", this.$titles.lints, $lintings.join("\n"));
            }
        }
        // finally add summary
        outp.push("", this.$titles.summary, this.$summary);
        if (outp[0] === "") {
            outp.shift();
        }
        return outp.join("\n");
    }

    /** Returns whether we should animate actively (e.g. for a spinner) */
    shouldAnimate(): boolean {
        return this.$lintings.some($linting => $linting.shouldAnimate());
    }

    /**
     * Adds a Linting to the GUI.
     * This means that the result of the linting will be shown by the GUI.
     */
    addLinting(linting: Linting) {
        this.$lintings.push(new LintingDisplay(linting));
        this.$summary.addLinting(linting);
        linting.on("rule", () => this.update());
        linting.on("done", () => this.update());
    }

    /** Sets whether we should only output to stdout once. */
    setCI(value: boolean) {
        this.isCI = value;
    }
}
