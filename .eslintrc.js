module.exports = {
    "env": {
        "node": true,
        "es6": true,
        "jasmine": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};
