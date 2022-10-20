import { execa } from "execa";
import expect from "expect";

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

/**
 * Run the CLI with a given list of arguments
 * @param {String[]} args The list of args
 * @returns {Promise<Object>} The CLI output
 */
async function execCliWith(args) {
    try {
        return await execa("./bin/cli.js", args);
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
        const validSvg = "./test/svgs/attr.test.svg";
        const { failed } = await execCliWith([validSvg]);
        expect(failed).toBeFalsy();
    });

    it("should fail with an invalid SVG", async function(){
        const invalidSvg = "./test/svgs/elm.test.svg";
        const { failed, exitCode } = await execCliWith([invalidSvg]);
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(1);
    });

    it("should fail with an non-existent configuration file", async function(){
        const { failed, exitCode } = await execCliWith([
            "--config", "./this/file/does/not-exist.js"
        ]);
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(3);
    });

    it("should fail with an invalid configuration file", async function(){
        const { failed, exitCode } = await execCliWith([
            "--config", "./test/configs/invalid-svglint-config.js"
        ]);
        expect(failed).toBeTruthy();
        expect(exitCode).toBe(4);
    });
});
