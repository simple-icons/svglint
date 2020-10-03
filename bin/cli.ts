#!/usr/bin/env node
/**
 * @fileoverview The CLI that is executed from a terminal.
 * Acts as an interface to the JS API
 */
import path from "path";
import Gui from "../src/cli/gui";
import LoggerGenerator, { setLevel, LEVELS } from "../src/lib/logger";
import { lintFile, Config } from "../src/svglint";
import meta from "../package.json";
import { getConfigurationFile } from "../src/cli/config";
import meow from "meow";
import chalk from "chalk";
import glob from "glob";

const logger = LoggerGenerator("");
const GUI = new Gui();

// Pretty logs all errors, then exits
console.error = logger.error.bind(logger); // used by meow's loud reject
process.on("uncaughtException", err => {
    logger.error(err);
    process.exit(1);
});

// Generates the CLI binding using meow
const cli = meow({
    description: meta.description,
    version: meta.version,
    help: `
        ${chalk.yellow("Usage:")}
            ${chalk.bold(
                "svglint"
            )} [--config config.js] [--ci] [--debug] ${chalk.bold(
        "file1.svg file2.svg"
    )}

        ${chalk.yellow("Options:")}
            ${chalk.bold("--help")}        Display this help text
            ${chalk.bold("--version")}     Show the current SVGLint version
            ${chalk.bold(
                "--config, -c"
            )}  Specify the config file. Defaults to '.svglintrc.js'
            ${chalk.bold("--debug,  -d")}  Show debug logs
            ${chalk.bold(
                "--ci, -C"
            )}      Only output to stdout once, when linting is finished`,
    flags: {
        config: { type: "string", alias: "c" },
        debug: { type: "boolean", alias: "d" },
        ci: { type: "boolean", alias: "C" },
    },
});

process.on("exit", () => {
    GUI.finish();
});

/** CLI main function */
(async function() {
    if (cli.flags.debug) {
        setLevel(LEVELS.debug);
    }
    GUI.setCI(cli.flags.ci);
    const files = cli.input
        .map(v => glob.sync(v))
        .reduce((a, v) => a.concat(v), [])
        .map(v => path.resolve(process.cwd(), v));

    // load the config
    let configObj: Config = {};
    try {
        const configFile = await getConfigurationFile(cli.flags.config);
        if (typeof configFile === "string") {
            configObj = require(configFile);
        }
    } catch (e) {
        logger.error(`Failed to parse config: ${e.message}`);
        process.exit(1);
    }

    // lint all the files
    // also keep track so we know when every linting has finished
    let hasErrors = false;
    let activeLintings = files.length;
    const onLintingDone = () => {
        --activeLintings;
        logger.debug("Linting done,", activeLintings, "to go");
        if (activeLintings <= 0) {
            process.exit(hasErrors ? 1 : 0);
        }
    };
    files.forEach(filePath => {
        lintFile(filePath, configObj)
            .then(linting => {
                // handle case where linting failed (e.g. invalid file)
                if (!linting) {
                    onLintingDone();
                    return;
                }

                // otherwise add it to GUI and wait for it to finish
                GUI.addLinting(linting);
                linting.on("done", () => {
                    if (linting.state === linting.STATES.error) {
                        hasErrors = true;
                    }
                    onLintingDone();
                });
            })
            .catch(e => {
                logger.error("Failed to lint file", filePath, "\n", e);
            });
    });
})();
