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
    return await execa("./bin/cli.js", args);
}

describe("CLI", function(){
    it("should succeed with --version", async function(){
        const { failed, stdout } = await execCliWith(["--version"]);
        expect(failed).toBeFalsy();
        expect(stdout).toMatch(/[0-9]+\.[0-9]+\.[0-9]+/);
    });

    it("should succeed with --help", async function(){
        const { failed, stdout } = await execCliWith(["--help"]);
        expect(failed).toBeFalsy();
        expect(stdout).toNotEqual("");
    });
});
