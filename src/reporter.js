const EventEmitter = require("events").EventEmitter;
const path = require("path");
const STATES = {
    unknown: undefined,
    success: true,
    warning: "warn",
    error: "error"
};

/**
 * A reporter for a single file's linting
 * Emits messages of the format { type: <STATES>, args: any[] }
 */
class FileReporter extends EventEmitter {
    constructor(filePath) {
        super();
        this.name = path.relative(process.cwd(), filePath);
        this.rules = [];
        this.messages = [];
    }

    getState() {
        const STATES_ORDER = [
            STATES.success,
            STATES.unknown,
            STATES.warning,
            STATES.error
        ];
        let messages = [];
        let status = STATES.success;
        this.rules.forEach(rule => {
            messages = messages.concat(
                rule.getMessages()
            );
            const ruleStatus = rule.status;
            if (STATES_ORDER.indexOf(status) < STATES_ORDER.indexOf(ruleStatus)) {
                status = ruleStatus;
            }
        });

        return {
            status,
            messages
        };
    }

    getMessages() {
        return this.messages;
    }

    emitMsg(msg) {
        this.messages.push(msg);
        this.emit("msg", msg);
        switch (msg.type) {
            case STATES.success:
                this.emit("msg--success", msg);
                break;
            case STATES.warning:
                this.emit("msg--warning", msg);
                break;
            case STATES.error:
                this.emit("msg--error", msg);
                break;
        }
    }

    getRuleReporter(name) {
        const reporter = new RuleReporter(name);
        reporter.on("msg", this.emitMsg.bind(this));
        this.rules.push(reporter);
        return reporter;
    }
}

class RuleReporter extends EventEmitter {
    constructor(name) {
        super();
        this.name = name;
        this.messages = [];
        this.status = STATES.unknown;
    }

    succeed(...args) {
        if (this.status === STATES.unknown) {
            this.status = STATES.success;
        }
        let msg = undefined;
        if (args.length) {
            msg = {
                type: STATES.success,
                rule: this.name,
                args
            };
            this.messages.push(msg);
        }
        this.emit("msg", msg);
        this.emit("msg--success", msg);
    }

    warn(...args) {
        if (this.status !== STATES.error) {
            this.status = STATES.warning;
        }
        const msg = {
            type: STATES.warning,
            rule: this.name,
            args
        };
        this.messages.push(msg);
        this.emit("msg", msg);
        this.emit("msg--warning", msg);
    }

    error(...args) {
        this.status = STATES.error;
        const msg = {
            type: STATES.error,
            rule: this.name,
            args
        };
        this.messages.push(msg);
        this.emit("msg", msg);
        this.emit("msg--error", msg);
    }

    getMessages() {
        return this.messages;
    }
}

FileReporter.STATES = STATES;
module.exports = FileReporter;
