const util = require("util");
const chalk = require("chalk");
const logUpdate = require("log-update");
const FileReporter = require("./reporter");
const { chunkString } = require("./util");
const STATES = FileReporter.STATES;

// @ts-ignore
const columns = process.stdout.columns || 80;
const separator = (str="") => {
    const halfLength = str ?
        Math.floor((columns-str.length)/2)
        : Math.floor(columns/2);
    const half = " ".repeat(halfLength);
    str = chalk.bold.underline(str);
    return `${half}${str}${half}`;
};
separator.toString = separator;

const MSG_META = {
    "unknown": {
        symbol: "?",
        color: chalk.gray,
    },
    "success": {
        symbol: "✓",
        color: chalk.green,
        prefix: "[Success]",
    },
    "debug": {
        symbol: "d",
        color: chalk.gray,
        prefix: "[Debug]"
    },
    "info": {
        symbol: "i",
        color: chalk.blue,
        prefix: "[Info]",
    },
    "warning": {
        symbol: "!",
        color: chalk.yellow,
        prefix: "[Warn]",
    },
    "error": {
        symbol: "x",
        color: chalk.red,
        prefix: "[Error]"
    }
};

class Log {
    constructor() {
        this.state = {
            logs: [], /** @type {Array<String>} */
            fileReporters: [],
            frame: 0,
        };
        this._cachedRender = "";
        this.debugging = false;
        this.PREFIX_LENGTH = 8;
        this.SPINNER = [
            "   ",
            ".  ",
            ".. ",
            "...",
            " ..",
            "  .",
        ];
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
        return this.state.fileReporters.some(
            reporter => reporter.getStatus() === STATES.unknown
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
            this.state.fileReporters.length ? separator("FILES") : "",
            ...this.renderFiles(this.state.fileReporters)
        ].filter(Boolean).join("\n");
    }

    /** Forces an update */
    forceUpdate() {
        const rendered = this.render();
        this._cachedRender = rendered;
        this.output(rendered);
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
     * Formats some files for logging
     * @param {Object[]} fileReporters
     * @returns {Array<String>}
     */
    renderFiles(fileReporters) {
        return fileReporters.map(reporter => {
            const { status, messages } = reporter.getState();
            let meta;
            switch (status) {
                case STATES.success:
                    meta = MSG_META.success;
                    break;
                case STATES.warning:
                    meta = MSG_META.warning;
                    break;
                case STATES.error:
                    meta = MSG_META.error;
                    break;
                default:
                    meta = MSG_META.unknown;
                    break;
            }

            let outp = meta.color(`[${meta.symbol}] ${reporter.name}`);
            if (status === STATES.unknown) {
                outp += " " + this.getSpinner();
            } else if (status !== STATES.success) {
                const messages = reporter.getMessages();
                const padding = "\n    ";

                outp += padding+chunkString(
                    messages.map(
                        this.stringifyMessage.bind(this)
                    ).filter(Boolean).join("\n"),
                    columns-(padding.length-1)
                ).join(padding);
            }
            return outp;
        });
    }

    /**
     * Stringifies a message from a reporter
     */
    stringifyMessage(msg) {
        if (!msg || (msg.type === STATES.success
            && (!msg.args || !msg.args.length))) {
            return null;
        }

        let meta;
        switch (msg.type) {
            case STATES.success:
                meta = MSG_META.success;
                break;
            case STATES.warning:
                meta = MSG_META.warning;
                break;
            case STATES.error:
                meta = MSG_META.error;
                break;
            default:
                meta = MSG_META.unknown;
        }

        return `${meta.color(msg.rule)} ${this.stringifyArgs(msg.args)}`;
    }

    /**
     * Stringifies a list of data into a colorized single line
     */
    stringifyArgs(args) {
        return args.map(
            v => (
                typeof v === "string"
                    ? v
                    : util.inspect(v, { colors: true, depth: 3 })
            ).replace(/^Error: /, "")
        ).join(" ");
    }

    /**
     * Gets an object which handles logging for a single file
     * @param {String} filePath The path to log for
     */
    getFileReporter(filePath) {
        const reporter = new FileReporter(filePath);
        this.setState({
            fileReporters: [...this.state.fileReporters, reporter]
        });
        return reporter;
    }

    /**
     * Formats some arguments for logging
     * @returns {String}
     */
    formatLog(...args) {
        const stringified = this.stringifyArgs(args);
        
        // split string into column sized chunks
        // then indent them to the prefix length
        return chunkString(stringified, columns-this.PREFIX_LENGTH)
            .map((v,i) => " ".repeat(i?this.PREFIX_LENGTH-1:0)+v)
            .join("\n");
    }

    /** Gets a colored and padded prefix */
    getPrefix(metaObj) {
        return metaObj.color(
            metaObj.prefix.padEnd(this.PREFIX_LENGTH, " ")
        );
    }

    /** Gets the current frame of the spinner */
    getSpinner() {
        return this.SPINNER[this.state.frame % this.SPINNER.length];
    }

    /** Logs a debug message */
    debug(...args) {
        if (this.debugging) {
            this.setState({
                logs: [
                    ...this.state.logs,
                    this.getPrefix(MSG_META.debug)+this.formatLog.apply(this, args)
                ]
            });
        }
    }
    /** Logs an informational message */
    log(...args) {
        this.setState({
            logs: [
                ...this.state.logs,
                this.getPrefix(MSG_META.info)+this.formatLog.apply(this, args)
            ]
        });
    }
    /** Logs a warning message */
    warn(...args) {
        this.setState({
            logs: [
                ...this.state.logs,
                this.getPrefix(MSG_META.warning)+this.formatLog.apply(this, args)
            ]
        });
    }
    /** Logs an error message */
    error(...args) {
        this.setState({
            logs: [
                ...this.state.logs,
                this.getPrefix(MSG_META.error)+this.formatLog.apply(this, args)
            ]
        });
    }
}



module.exports = new Log();
