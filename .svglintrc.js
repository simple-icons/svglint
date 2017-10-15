module.exports = {
    rules: {
        "attr": {
            role: ["img", "progressbar"],
            viewBox: "0 0 24 24",
            xmlns: true,
            width: false,
            "rule::whitelist": true,
            "rule::selector": "svg"
        }
    }
}
