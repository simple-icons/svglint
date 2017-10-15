const util = require("util");
const chalk = require("chalk");
const logUpdate = require("log-update");

const { LintError, LintWarning } = require("./rule-results.js");

const { chunkString } = require("./util.js");

// @ts-ignore
const columns = process.stdout.columns || 80;
const separator = (str="") => {
    const halfLength = str ?
        Math.floor((columns-str.length)/2)
        : Math.floor(columns/2);
    const half = chalk.gray(" ".repeat(halfLength));
    str = chalk.bold.underline(str);
    return `${half}${str}${half}`;
};
separator.toString = separator;

class Log {
    constructor() {
        this.state = {
            logs: [], /** @type {Array<String>} */
            files: {}, /** @type {Object<Array<Object>|Boolean>} */
            frame: 0,
        };
        this._cachedRender = "";
        this.debugging = false;
        this.PREFIX_LENGTH = 8;
        this.PREFIXES = {
            debug: chalk.gray("[Debug] "),
            info: chalk.blue("[Info]  "),
            warn: chalk.yellow("[Warn]  "),
            error: chalk.bgRed("[Error]")+" ",
        };
    }

    /**
     * Animates if we should animate, increasing frame count and rendering
     * Recalls self
     */
    tick() {
        if (this.shouldAnimate()) {
            this.setState({ frame: this.state.frame + 1 });

            clearTimeout(this.tickTimeout);
            this.tickTimeout = setTimeout(this.tick.bind(this), 120);
        }
    }

    shouldAnimate() {
        return Object.keys(this.state.files).some(
            k => this.state.files[k] === undefined
        );
    }

    /** Updates the actually displayed string in terminal */
    output(string) {
        logUpdate(string);
    }

    /** @returns {String} */
    render() {
        return [
            this.state.logs.length ? separator("LOG") : "",
            ...this.state.logs,
            Object.keys(this.state.files).length ? separator("FILES") : "",
            ...this.renderFiles(this.state.files)
        ].filter(Boolean).join("\n");
    }

    /** @param {Object} newState The new state to set - is shallow merged with current state */
    setState(newState) {
        this.state = Object.assign(this.state, newState);
        const rendered = this.render();
        if (rendered !== this._cachedRender) {
            this._cachedRender = rendered;
            this.output(rendered);
        }
    }

    /**
     * Updates a file log
     * @param {String} fileName  The file name to display
     * @param {Array<Object>|Boolean} [result]  The result to display
     */
    file(fileName, result) {
        const isAnimating = this.shouldAnimate();
        const newFiles = this.state.files;
        newFiles[fileName] = result;
        this.setState({ files: newFiles });
        if (this.shouldAnimate() && !isAnimating) {
            this.tick();
        }
    }

    /**
     * Formats some files for logging
     * @param {Object} files
     * @returns {Array<String>}
     */
    renderFiles(files) {
        return Object.keys(files).map(name => {
            const result = files[name];
            let meta;
            if (result === undefined) {
                meta = {
                    prefix: "?",
                    color: chalk.gray,
                };
            } else if (result === true) {
                meta = {
                    prefix: "✔",
                    color: chalk.green,
                };
            } else if (result.every(v => v instanceof LintWarning)) {
                meta = {
                    prefix: "⚠",
                    color: chalk.yellow,
                };
            } else if (result.some(v => v instanceof Error)) {
                meta = {
                    prefix: "✖",
                    color: chalk.red,
                };
            }

            let outp = `${meta.prefix} ${name}`;
            if (result === undefined) {
                const spinner = [
                    "   ",
                    ".  ",
                    ".. ",
                    "...",
                    " ..",
                    "  .",
                ];
                outp += " " + spinner[this.state.frame % spinner.length];
            } else if (result !== true) {
                const stringified =
                    result.map(v => v.stringify ? v.stringify(false) : ""+v)
                        .join("\n");
                const padding = "\n    ";

                outp += padding+chunkString(
                    stringified,
                    columns-(padding.length-1)
                ).join(padding);
            }
            return meta.color(outp);
        });
    }


    /**
     * Formats some arguments for logging
     * @returns {String}
     */
    formatLog(...args) {
        const stringified = args.map(
            v=>(
                typeof v === "string" ?
                    v 
                    : util.inspect(v, {colors: true, depth: 3})
            ).replace(/^Error: /,"")
        ).join(" ");
        
        // split string into column sized chunks
        // then indent them to the prefix length
        return chunkString(stringified, columns-this.PREFIX_LENGTH)
            .map((v,i) => " ".repeat(i?this.PREFIX_LENGTH-1:0)+v)
            .join("\n");
    }

    /** Logs a debug message */
    debug(...args) {
        if (this.debugging) {
            this.setState({
                logs: [
                    ...this.state.logs,
                    this.PREFIXES.debug+this.formatLog.apply(this, args)
                ]
            });
        }
    }
    /** Logs an informational message */
    log(...args) {
        this.setState({
            logs: [
                ...this.state.logs,
                this.PREFIXES.info+this.formatLog.apply(this, args)
            ]
        });
    }
    /** Logs a warning message */
    warn(...args) {
        this.setState({
            logs: [
                ...this.state.logs,
                this.PREFIXES.warn+this.formatLog.apply(this, args)
            ]
        });
    }
    /** Logs an error message */
    error(...args) {
        const msg = this.PREFIXES.error+this.formatLog.apply(this, args);
        this.setState({
            logs: [
                ...this.state.logs,
                msg
            ]
        });
    }
}

module.exports = new Log();
