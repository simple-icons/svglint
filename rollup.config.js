import dynamicImportVars from "@rollup/plugin-dynamic-import-vars";

const pkg = require("./package.json");

export default {
    input: "./src/svglint.js",
    output: {
        exports: "auto",
        file: "./src/svglint.cjs",
        format: "cjs",
        inlineDynamicImports: true,
    },
    external: [
        "events",
        "fs",
        "path",
        "util",
        "url",
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [
        dynamicImportVars({
            warnOnError: true, // Disables errors caused by dynamic import of plugins
        })
    ]
};
