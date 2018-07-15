const path = require("path");
const GUI = new (require("../src/cli/gui"));
const Logger = require("../src/lib/logger");
// Logger.setLevel(Logger.LEVELS.debug);
const SVGLint = require("../src/svglint");

const logger = Logger("");
/** Pretty logs all errors, then exits */
console.error = logger.error.bind(logger); // used by meow's loud reject
process.on("uncaughtException", err => {
    logger.error(err);
    process.exit(1);
});
SVGLint.lintFile(path.join(process.cwd(), "test/svgs/empty.svg"), {
    rules: {
        fails: {},
        doesntFailBecauseRemoved: {},
        identity: [{
            method: "error",
            message: "This fails spectacularly",
        }, {
            method: "warn",
            message: "This only warns",
        }],
        async: {
            method: "warn",
            message: "This is delayed",
            wait: 5,
        },
        throws: {
            message: `This indicates that the rule failed to execute. It is a very long message that will wrap to multiple lines, and will be cut up and indented to match the rule indentation.
It also contains newlines.`            ,
        }
    }
}).then(linting => GUI.addLinting(linting));
SVGLint.lintFile(path.join(process.cwd(), "test/svgs/attr.fail.svg"), {
    rules: {
        async: {
            wait: 3,
        }
    }
}).then(linting => GUI.addLinting(linting));

SVGLint.lintFile(path.join(process.cwd(), "test/svgs/attr.fail.svg"), {
    rules: {
        identity: {
            method: "warn",
        }
    }
}).then(linting => GUI.addLinting(linting));
