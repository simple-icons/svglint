#!/usr/bin/env node
/**
 * @fileoverview The CLI that is executed from a terminal.
 * Acts as an interface to the JS API
 */
import path from "path";
import process from "process";
import gui from "../src/cli/gui.js";
import Logger from "../src/lib/logger.js";
import SVGLint from "../src/svglint.js";
// @ts-ignore
import { loadConfigurationFile } from "../src/cli/config.js";
import meow from "meow";
import { chalk } from "../src/cli/util.js";
import glob from "glob";

const GUI = new gui();

const logger = Logger("");

const EXIT_CODES = Object.freeze({
    success: 0,
    violations: 1,
    unexpected: 2,
    interrupted: 3,
    configuration: 4,
});

// used by meow's loud reject
// eslint-disable-next-line no-console
console.error = logger.error.bind(logger);

// Pretty logs all errors, then exits
process.on("uncaughtException", err => {
    logger.error(err);
    process.exit(EXIT_CODES.unexpected);
});

// Handle SIGINT
process.on("SIGINT", () => {
    process.exit(EXIT_CODES.interrupted);
});

// Generates the CLI binding using meow
const cli = meow(`
        ${chalk.yellow("Usage:")}
            ${chalk.bold("svglint")} [--config config.js] [--ci] [--debug] ${chalk.bold("file1.svg file2.svg")}
            ${chalk.bold("svglint")} --stdin [--config config.js] [--ci] [--debug] < ${chalk.bold("file1.svg")}

        ${chalk.yellow("Options:")}
            ${chalk.bold("--help")}        Display this help text
            ${chalk.bold("--version")}     Show the current SVGLint version
            ${chalk.bold("--config, -c")}  Specify the config file. Defaults to '.svglintrc.js'
            ${chalk.bold("--debug,  -d")}  Show debug logs
            ${chalk.bold("--ci, -C")}      Only output to stdout once, when linting is finished
            ${chalk.bold("--stdin")}       Read an SVG from stdin`, {
    importMeta: import.meta,
    flags: {
        config: { type: "string", alias: "c", },
        debug: { type: "boolean", alias: "d" },
        ci: { type: "boolean", alias: "C" },
        stdin: { type: "boolean" }
    }
});

process.on("exit", () => {
    GUI.finish();
});

/** CLI main function */
(async function(){
    if (cli.flags.debug) {
        Logger.setLevel(Logger.LEVELS.debug);
    }
    GUI.setCI(cli.flags.ci);

    // load the config
    let configObj;
    try {
        configObj = await loadConfigurationFile(cli.flags.config);
        if (configObj === null) {
            logger.debug("No configuration file found");
            if (cli.flags.config) {
                logger.error("Configuration file not found");
                process.exit(EXIT_CODES.configuration);
            } else {
                configObj = {};
            }
        } else if (configObj === undefined) {
            logger.error("Default export missing from configuration file (use `export default {...}` or `module.exports = {...}`");
            process.exit(EXIT_CODES.configuration);
        }
    } catch (e) {
        logger.error(`Failed to parse config: ${e.stack}`);
        process.exit(EXIT_CODES.configuration);
    }

    if (cli.flags.stdin) {
        // lint what's provided on stdin
        const chunks = [];

        process.stdin.on("readable", () => {
            let chunk;
            while (null !== (chunk = process.stdin.read())) {
                chunks.push(chunk);
            }
        });

        process.stdin.on("end", () => {
            SVGLint.lintSource(chunks.join(""), configObj)
                .then(linting => {
                    // handle case where linting failed (e.g. invalid file)
                    if (!linting) {
                        process.exit(EXIT_CODES.success);
                    }

                    // otherwise add it to GUI and wait for it to finish
                    GUI.addLinting(linting);
                    linting.on("done", () => {
                        if (linting.state === linting.STATES.error) {
                            process.exit(EXIT_CODES.violations);
                        } else {
                            process.exit(EXIT_CODES.success);
                        }
                    });
                })
                .catch(e => {
                    logger.error("Failed to lint\n", e);
                });
        });
    } else {
        // lint all the CLI specified files
        const files = cli.input
            .map(v => glob.sync(v))
            .reduce((a, v) => a.concat(v), [])
            .map(v => path.resolve(process.cwd(), v));
        // keep track so we know when every linting has finished
        let hasErrors = false;
        let activeLintings = files.length;
        const onLintingDone = () => {
            --activeLintings;
            logger.debug("Linting done,", activeLintings, "to go");
            if (activeLintings <= 0) {
                process.exit(
                    hasErrors ? EXIT_CODES.violations : EXIT_CODES.success
                );
            }
        };
        files.forEach(filePath => {
            SVGLint.lintFile(filePath, configObj)
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
    }
})();
