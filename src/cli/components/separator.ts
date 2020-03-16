import chalk from "chalk";
import { COLUMNS } from "../util";

import type { GuiComponent } from "../types";

/**
 * A separator between sections.
 * Optionally includes a title which will be displayed centered in the separator.
 */
export default class Separator implements GuiComponent {
    title: string;
    constructor(title="") {
        this.title = title;
    }

    toString() {
        const padding = chalk.gray.dim("-".repeat(
            Math.floor((COLUMNS - this.title.length - 2) / 2)
        ));
        return `${padding} ${chalk.bold.underline(this.title)} ${padding}`;
    }
};
