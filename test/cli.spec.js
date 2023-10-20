import fs from "fs";
import path from "path";
import process from "process";

import { execa } from "execa";
import expect from "expect";

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

const VALID_SVG = path.resolve("./test/svgs/attr.test.svg");
const INVALID_SVG = path.resolve("./test/svgs/elm.test.svg");

/**
 * Run the CLI with a given list of arguments
 * @param {String[]} args The list of args
 * @param {String} cwd The working directory
 * @returns {Promise<Object>} The CLI output
 */
async function execCliWith(args, cwd=process.cwd(), input=null) {
    try {
        return await execa(
            path.resolve("./bin/cli.js"),
            args,
            {cwd: path.resolve(cwd), input},
        );
    } catch (error) {
        return error;
    }
}

describe("CLI", function(){
    it("should succeed with --version", async function(){
        const { failed, stdout } = await execCliWith(["--version"]);
        expect(failed).toBeFalsy();
        expect(stdout).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
    });

    it("should succeed with --help", async function(){
        const { failed, stdout } = await execCliWith(["--help"]);
        expect(failed).toBeFalsy();
        expect(stdout).toNotEqual("");
    });

    it("should succeed with a valid SVG", async function(){
        const { failed } = await execCliWith([VALID_SVG]);
        expect(failed).toBeFalsy();
    });

    it("should fail with an invalid SVG", async function(){
        const { failed, exitCode } = await execCliWith([INVALID_SVG], "test/projects/with-config");
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(1);
    });

    it("should succeed with a valid SVG on stdin", async function(){
        const { failed } = await execCliWith(["--stdin"], process.cwd(), fs.readFileSync(VALID_SVG));
        expect(failed).toBeFalsy();
    });

    it("should fail with an invalid SVG on stdin", async function(){
        const { failed, exitCode } = await execCliWith(["--stdin"], "test/projects/with-config", fs.readFileSync(INVALID_SVG));
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(1);
    });
});

describe("Configuration files", function() {
    let configFile, filename, projectPath;
    it("should fail with an non-existent configuration file", async function(){
        const { failed, exitCode } = await execCliWith(
            ["--config", "./this/file/does/not-exist.js"]
        );
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(4);
    });

    it("should fail with a broken configuration file", async function(){
        const { failed, exitCode } = await execCliWith(
            ["--config", "./test/projects/broken/broken-svglint-config.js"]
        );
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(4);
    });

    it("should succeed passing an existent file path to --config", async function() {
        projectPath = "test/projects/esm/foo/";
        filename = "custom-svglint-config.js";
        const { failed, stdout } = await execCliWith(
            [VALID_SVG, "--config", path.join( projectPath, filename ), "--debug"]
        );
        configFile = path.join( projectPath, filename ).replace( /\\/g, "\\\\" );
        expect(failed).toBeFalsy();
        expect(stdout.replace( /\r?\n/g, "" )).toMatch( new RegExp( `Using configuration file: (.*?)${configFile}`) );
    });

    it("should succeed with an ESM .js config in a ESM project with type=module", async function() {
        projectPath = "test/projects/esm/foo/";
        filename = ".svglintrc.js";
        const { failed, stdout } = await execCliWith([VALID_SVG, "--debug"], projectPath);
        configFile = path.join( projectPath, filename ).replace( /\\/g, "\\\\" );
        expect(failed).toBeFalsy();
        expect(stdout.replace( /\r?\n/g, "" )).toMatch( new RegExp( `Using configuration file: (.*?)${configFile}`) );
    });

    it("should succeed with an CJS .js config in a CJS project with type=commonjs", async function() {
        projectPath = "test/projects/cjs/bar/";
        filename = ".svglintrc.js";
        const { failed, stdout } = await execCliWith([VALID_SVG, "--debug"], projectPath);
        configFile = path.join( projectPath, filename ).replace( /\\/g, "\\\\" );
        expect(failed).toBeFalsy();
        expect(stdout.replace( /\r?\n/g, "" )).toMatch( new RegExp( `Using configuration file: (.*?)${configFile}`) );
    });

    it("should succeed with a ESM .mjs config in a CJS project with type=commonjs", async function() {
        projectPath = "test/projects/cjs/foo/";
        filename = ".svglintrc.mjs";
        const { failed, stdout } = await execCliWith([VALID_SVG, "--debug"], projectPath);
        expect(failed).toBeFalsy();
        configFile = path.join( projectPath, filename ).replace( /\\/g, "\\\\" );
        expect(stdout.replace( /\r?\n/g, "" )).toMatch( new RegExp( `Using configuration file: (.*?)${configFile}`) );
    });

    it("should succeed with a CJS .cjs config in a ESM project with type=module", async function() {
        projectPath = "test/projects/esm/bar/";
        filename = ".svglintrc.cjs";
        const { failed, stdout } = await execCliWith([VALID_SVG, "--debug"], projectPath);
        expect(failed).toBeFalsy();
        configFile = path.join( projectPath, filename ).replace( /\\/g, "\\\\" );
        expect(stdout.replace( /\r?\n/g, "" )).toMatch( new RegExp( `Using configuration file: (.*?)${configFile}`) );
    });

    it("should succeed in a nested folder inside a project with a root config file", async function() {
        projectPath = "test/projects/cjs/bar/";
        filename = ".svglintrc.js";
        const { failed, stdout } = await execCliWith([VALID_SVG, "--debug"], path.join(projectPath, "a/b/c"));
        expect(failed).toBeFalsy();
        configFile = path.join( projectPath, filename ).replace( /\\/g, "\\\\" );
        expect(stdout.replace( /\r?\n/g, "" )).toMatch( new RegExp( `Using configuration file: (.*?)${configFile}`) );
    });

    it("should succeed in a project without a config file", async function () {
        const { stdout } = await execCliWith([VALID_SVG], "test/projects/without-config");
        expect(stdout).toNotMatch("Failed to lint");
    });
});
