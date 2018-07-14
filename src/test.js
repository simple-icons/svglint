const svglint = require("./svglint");
const Logger = require("./lib/logger");
Logger.setLevel(Logger.LEVELS.debug);
const linting = svglint.lintSource(`<svg xmlns="a">
<g>
    <path></path>
    <path></path>
</g>
<g></g>
<circle></circle>
</svg>`,
    {
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
                method: "warn",
                message: "This isn't so bad",
                wait: 5,
            },
        }
    }
);

console.log(linting);
linting.on("rule", function(rule){
    console.log("Linting emitted rule", rule.name, rule.reporter);
    console.log()
});
linting.once("done", () => {
    console.log(`Linting done
  State: ${linting.state}`);
});
