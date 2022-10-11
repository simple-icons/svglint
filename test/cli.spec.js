import path from "path";

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
async function execCliWith(args, cwd=process.cwd()) {
    try {
        return await execa(
            path.resolve("./bin/cli.js"),
            args,
            {cwd: path.resolve(cwd)},
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
        const { failed, exitCode } = await execCliWith([INVALID_SVG]);
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(1);
    });
});

describe("Configuration", function() {
    it("should fail passing an unexistent file path to --config", async function() {
        const { failed, exitCode } = await execCliWith(
            [VALID_SVG, "--config", "./this/file/does/not-exist.js"],
        );
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(1);
    });

    it("should succeed passing an existent file path to --config", async function() {
        const { failed } = await execCliWith(
            [VALID_SVG, "--config", "test/projects/esm/foo/custom-svglint-config.js"]);
        expect(failed).toBeFalsy();
    });

    it("should succeed with an ESM .js config in a ESM project with type=module", async function() {
        const { failed } = await execCliWith([VALID_SVG], "test/projects/esm/foo");
        expect(failed).toBeFalsy();
    });

    it("should succeed with an CJS .js config in a CJS project with type=commonjs", async function() {
        const { failed } = await execCliWith([VALID_SVG], "test/projects/cjs/bar");
        expect(failed).toBeFalsy();
    });

    it("should succeed with a ESM .mjs config in a CJS project with type=commonjs", async function() {
        const { failed } = await execCliWith([VALID_SVG], "test/projects/cjs/foo");
        expect(failed).toBeFalsy();
    });

    it("should succeed with a CJS .cjs config in a ESM project with type=module", async function() {
        const { failed } = await execCliWith([VALID_SVG], "test/projects/esm/bar");
        expect(failed).toBeFalsy();
    });
});
