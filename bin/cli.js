const GUI = new (require("../src/cli/gui"));
const Logger = require("../src/lib/logger");
Logger.setLevel(Logger.LEVELS.debug);
const SVGLint = require("../src/svglint");

SVGLint.lintSource("<svg><path></path></svg>", {
    rules: {
        fails: {},
        doesntFailBecauseRemoved: {},
        identity: [{
            method: "error",
            message: "This fails spectacularly",
        }, {
            method: "warn",
            message: "This only warns",
        }, {
            method: "log",
            message: "This is simply a log",
        }],
        async: {
            method: "log",
            message: "This is delayed",
            wait: 5,
        },
    }
});
