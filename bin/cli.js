#!/usr/bin/env node
/**
 * @fileoverview The CLI that is executed from a terminal.
 * Acts as an interface to the JS API
 */
const path = require("path");
const GUI = new (require("../src/cli/gui"));
const Logger = require("../src/lib/logger");
const SVGLint = require("../src/svglint");
// @ts-ignore
const meta = require("../package.json");
const { getConfigurationFile } = require("../src/cli/config");
const meow = require("meow");
const chalk = require("chalk");

const logger = Logger("");
// Pretty logs all errors, then exits
console.error = logger.error.bind(logger); // used by meow's loud reject
process.on("uncaughtException", err => {
    logger.error(err);
    GUI.finish();
    process.exit(1);
});

// Generates the CLI binding using meow
const cli = meow({
    description: meta.description,
    version: meta.version,
    help: `
        ${chalk.yellow("Usage:")}
            ${chalk.bold("svglint")} [--config config.js] [--ci] [--debug] ${chalk.bold("file1.svg file2.svg")}
        
        ${chalk.yellow("Options:")}
            ${chalk.bold("--help")}        Display this help text
            ${chalk.bold("--version")}     Show the current SVGLint version
            ${chalk.bold("--config, -c")}  Specify the config file. Defaults to '.svglintrc.js'
            ${chalk.bold("--debug,  -d")}  Show debug logs
            ${chalk.bold("--ci, -C")}      Only output to stdout once, when linting is finished`,
    flags: {
        config: { type: "string", alias: "c", },
        debug: { type: "boolean", alias: "d" },
        ci: { type: "boolean", alias: "C" }
    }
});

/** CLI main function */
(async function(){
    if (cli.flags.debug) {
        Logger.setLevel(Logger.LEVELS.debug);
    }
    GUI.setCI(cli.flags.ci);
    const files = cli.input.map(v => path.resolve(process.cwd(), v));

    // load the config
    let configObj;
    try {
        const configFile = await getConfigurationFile(cli.flags.config);
        configObj = require(configFile);
    } catch (e) {
        logger.error(`Failed to parse config: ${e.message}`);
        GUI.finish();
        process.exit(1);
    }

    /** @type {Promise<Linting>[]} */
    const lintingPromises = [];

    files.forEach(filePath => {
        lintingPromises.push(
            SVGLint.lintFile(filePath, configObj)
                .catch(e => {
                    logger.error("Failed to lint file", filePath, e.message);
                })
        );
    });

    let hasErrors = false;
    let activeLintings = lintingPromises.length;
    const onLintingDone = () => {
        --activeLintings;
        if (activeLintings <= 0) {
            GUI.finish();
            process.exit(hasErrors ? 1 : 0);
        }
    };
    Promise.all(lintingPromises)
        .then(lintings => {
            lintings.forEach(linting => {
                if (!linting) {
                    onLintingDone();
                    return;
                }
                GUI.addLinting(linting);
                linting.on("done", () => {
                    if (linting.state === linting.STATES.error) {
                        hasErrors = true;
                    }
                    onLintingDone();
                });
            });
        });
})();
