module.exports = {
    rules: {
        "attr": {
            role: ["img", "progressbar"],
            viewBox: "0 0 24 24",
            xmlns: true,
            width: false,
            "rule::whitelist": true,
            "rule::selector": "svg"
        },
        "elm": {
            "svg": true,         // the root svg element must exist
            "svg > title": true, // the title element must exist inside the root element
            "g": 2,              // exactly 2 groups must exist
            "g > path": [0,2],   // up to two paths can be in each group
            "*": false,          // nothing else can exist
        }
    }
}
