module.exports = {
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
};
