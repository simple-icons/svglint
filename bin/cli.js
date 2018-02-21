#!/usr/bin/env node
"use strict";

const meow = require("meow");
const chalk = require("chalk");
const path = require("path");
const meta = require("../package.json");

const Linter = require("../src/svglint");
const log = require("../src/log");
const config = require("../src/config");

// eslint-disable-next-line no-console
console.error = log.error.bind(log); // used by meow's loud reject
const cli = meow({
    description: meta.description,
    version: meta.version,
    help: `
        ${chalk.yellow("Usage:")}
            ${chalk.bold("svglint")} [--config config.json] [--debug] ${chalk.bold("file1.svg file2.svg")}
        
        ${chalk.yellow("Options:")}
            ${chalk.bold("--help")}        Display this help text
            ${chalk.bold("--version")}     Show the current SVGLint version
            ${chalk.bold("--config, -c")}  Specify the config file. Defaults to 'svglint.json'
            ${chalk.bold("--debug,  -d")}  Show debug logs
 `,
    flags: {
        config: { type: "string", alias: "c", },
        debug: { type: "boolean", alias: "d" }
    }
});

/** CLI main function */
(async function(){
    log.debugging = cli.flags.debug;
    const files = cli.input.map(v => path.resolve(process.cwd(), v));
    const configFile = await config.getConfigurationFile(cli.flags.config);

    // load the config
    let configObj;
    try {
        configObj = require(configFile);
    } catch (e) {
        throw new Error(`Failed to parse config: ${e.message}`);
    }

    const linter = new Linter(configObj);
    files.forEach(filePath => {
        linter.lint(filePath, log);
    });

    if (!files.length) {
        console.log("No files detected");
    }
})();

/** Pretty logs all errors, then exits */
process.on("uncaughtException", err => {
    log.error(err);
    process.exit(1);
});
