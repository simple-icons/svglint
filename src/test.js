const svglint = require("./svglint");
const Logger = require("./lib/logger");
Logger.setLevel(Logger.LEVELS.debug);

svglint.lintSource("<svg><path></path></svg>", {
    rules: {
        elms: {
            method: "warn",
            message: "This is a message with a related element",
            selector: "path",
        }
    }
})
