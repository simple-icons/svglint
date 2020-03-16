import chalk from "chalk";
import { MSG_META } from "../util";

import type { GuiComponent } from "../types";

// TODO: remove once linting has been rewritten to TS
type Linting = any;
/** @typedef {import("../../lib/linting.js")} Linting */

/** A summary of all lintings. */
export default class Summary implements GuiComponent {
    lintings: Linting[];

    constructor() {
        this.lintings = [];
    }

    /** Adds a linting to the summary.  */
    addLinting(linting: Linting) {
        this.lintings.push(linting);
    }

    /** Gets the number of Listings with the given state */
    getNumberWithState(state: "linting"|"success"|"warn"|"error") {
        return this.lintings.filter(
            linting => linting.state === linting.STATES[state]
        ).length;
    }

    toString() {
        const active = this.getNumberWithState("linting");
        const successes = this.getNumberWithState("success");
        const warns = this.getNumberWithState("warn");
        const errors = this.getNumberWithState("error");

        return [
            active ? MSG_META.linting.color.bold(`? ${active} lintings in progress.`) : null,
            successes ? MSG_META.success.color.bold(`${MSG_META.success.symbol} ${successes} valid files.`) : null,
            warns ? MSG_META.warn.color.bold(`${MSG_META.warn.symbol} ${warns} files with warnings.`) : null,
            errors ? MSG_META.error.color.bold(`${MSG_META.error.symbol} ${errors} invalid files.`) : null,
            (active + successes + warns + errors) ? null : chalk.gray.dim("- No files linted"),
        ].filter(v => v).join("\n");
    }
};
