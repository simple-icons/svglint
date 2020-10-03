import chalk from "chalk";
import { chunkString, MSG_META, COLUMNS } from "../util";
import stripAnsi = require("strip-ansi");

import type { GuiComponent } from "../types";
import Spinner from "./spinner";

import Reporter, { Result, TYPES } from "../../lib/reporter";
import Linting from "../../lib/linting";

/**
 * Turns a results object into a flat array of Reporters, in a stable-sorted manner.
 * @param results The results from the Linting
 */
export function flattenReporters(results: {
    [k: string]: Reporter | Reporter[];
}) {
    const outp = [] as Reporter[];
    Object.keys(results)
        .sort()
        .forEach(reporterName => {
            const reporter = results[reporterName];
            const reporters = reporter instanceof Array ? reporter : [reporter];
            outp.push(...reporters);
        });
    return outp;
}

/**
 * A display for a single linting.
 */
export default class LintingDisplay implements GuiComponent {
    linting: Linting;
    $spinner: GuiComponent;

    constructor(linting: Linting) {
        this.linting = linting;
        this.$spinner = new Spinner();
    }

    /** Checks whether we should actively animate for the spinner. */
    shouldAnimate(): boolean {
        return this.linting.state === this.linting.STATES.linting;
    }

    /** Returns the string representing the header of the linting display */
    renderHeader(): string {
        const linting = this.linting;
        let symbol: string = "";
        type states = keyof typeof linting.STATES;
        for (let state of Object.keys(MSG_META) as states[]) {
            if (state === "ignored") { continue; }
            if (linting.state === linting.STATES[state]) {
                const meta = MSG_META[state];
                symbol = meta.color(
                    state === "linting"
                        ? this.$spinner.toString()
                        : meta.symbol
                );
            }
        }
        return symbol + " " + chalk.bold.underline(linting.name);
    }

    /** Returns the string representing all of our reporters */
    renderReporters(): string {
        const outp = flattenReporters(this.linting.results)
            .map(reporter => new ReporterDisplay(reporter))
            .filter(display => display.shouldDisplay())
            .join("\n");
        
        if (outp.length) {
            return "\n" + outp;
        }
        return "";
    }

    toString(): string {
        return this.renderHeader() + this.renderReporters();
    }
};

class ReporterDisplay implements GuiComponent {
    reporter: Reporter;
    constructor(reporter: Reporter) {
        this.reporter = reporter;
    }

    shouldDisplay(): boolean {
        return !!this.reporter.messages.length;
    }

    /** Formats a specific message into a string we'd like to display */
    formatMsg(msg: Result) {
        const type = msg.type;
        const meta = MSG_META[TYPES[type] as keyof typeof TYPES];
        const prefix = `  ${meta.color(
            meta.symbol + " " + this.reporter.name
        )}${
            msg._node
                ? chalk.gray.dim(` ${msg._node.lineNum}:${msg._node.columnNum}`)
                : ""
        } `;
        const prefixLength = stripAnsi(prefix).length;
        return (
            prefix +
            chunkString(
                (msg.message || "").toString() || "",
                COLUMNS - prefixLength - 1
            ).join("\n" + " ".repeat(prefixLength))
        );
    }

    toString() {
        const msgs = this.reporter.messages.map((msg: Result) => this.formatMsg(msg));
        return msgs.join("\n");
    }
}
