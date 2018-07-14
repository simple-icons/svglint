const svglint = require("./svglint");
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
            identity: {
                method: "error",
                message: "This fails spectacularly",
            }
        }
    }
);

console.log(linting);
linting.on("rule", function(){
    console.log("Linting emitted event", [...arguments]);
});
linting.once("done", () => {
    console.log(`Linting done
  State: ${linting.state}`);
});
