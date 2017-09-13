#!/usr/bin/env node
"use strict";

const meow = require("meow");
const chalk = require("chalk");
const path = require("path");

const Linter = require("../src/svglint");
const log = require("../src/log");
const config = require("../src/config");

// eslint-disable-next-line no-console
console.error = log.error.bind(log); // used by meow's loud reject
const cli = meow({
    help: `
        ${chalk.yellow("Usage:")}
            ${chalk.dim.gray("$")} ${chalk.bold("svglint")} [--config config.json] [--debug] ${chalk.bold("file1.svg file2.svg")}
        
        ${chalk.yellow("Options:")}
            ${chalk.bold("--config, -c")}  Specify the config file. Defaults to 'svglint.json'
            ${chalk.bold("--debug,  -d")}  Show debug logs`,
    version: "1.0.0"
}, {
    alias: {
        c: "config",
        h: "help",
        v: "version",
        d: "debug"
    }
});

/** CLI main function */
(async function(){
    log.debugging = cli.flags.debug || true;
    const files = cli.input.map(v => path.resolve(process.cwd(), v));
    const configFile = await config.getConfigurationFile();

    // load the config
    let configObj;
    try {
        configObj = require(configFile);
    } catch (e) {
        throw new Error(`Failed to parse config: ${e.message}`);
    }

    const linter = new Linter(configObj);
    files.forEach(filePath => {
        const displayPath = path.relative(process.cwd(), filePath);
        log.file(displayPath, undefined); // show the file as processing
        linter.lint(filePath, result => { // lint it
            log.file(displayPath, result); // show the result
        });
    });
})();

/** Pretty logs all errors, then exits */
process.on("uncaughtException", err => {
    log.error(err);
    process.exit(1);
});
