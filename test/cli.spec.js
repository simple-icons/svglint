import { spawn } from "child_process";
import path from "path";
import ansiRegex from "ansi-regex";
import expect from "expect";

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

async function execCliWith(args, env) {
    const argv = [path.resolve("./bin/cli.js")];
    if (!args.includes("--version") && !args.includes("--help")) {
        argv.push(...["--colors", "--ci"]);
    }
    argv.push([...args]);

    return await new Promise(function(resolve){
        const child = spawn(
            "node",
            argv,
            {
                stdio: [0, "pipe", "pipe"],
                env,
            }
        );

        const stdoutChunks = [], stderrChunks = [];
        let stdout, stderr;
        child.on("exit", (code) => {
            resolve({
                stdout,
                stderr,
                failed: code != 0,
                exitCode: code,
            });
        });

        child.stdio[1].on("data", (data) => {
            stdoutChunks.push(data.toString());
        });
        child.stdio[1].on("end", () => {
            stdout = stdoutChunks.join("");
        });

        child.stdio[2].on("data", (data) => {
            stderrChunks.push(data.toString());
        });
        child.stdio[2].on("end", () => {
            stderr = stderrChunks.join("");
        });
    });
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

    it("colors in output passing '--colors' option", async function(){
        const svg = "./test/svgs/elm.test.svg";
        const { stdout } = await execCliWith([svg]);
        expect(ansiRegex().test(stdout)).toBeTruthy();
    });

    it("no colors in output passing '--no-colors' option", async function(){
        const svg = "./test/svgs/elm.test.svg";
        const { stdout } = await execCliWith([svg, "--no-colors"]);
        expect(ansiRegex().test(stdout)).toBeTruthy();
    });

    it("no colors in output with NO_COLOR environment variable", async function(){
        const svg = "./test/svgs/elm.test.svg";
        const { stdout } = await execCliWith([svg], {NO_COLOR: 1});
        expect(ansiRegex().test(stdout)).toBeFalsy();
    });

    it("no colors in output with SVGLINT_NO_COLOR environment variable", async function(){
        const svg = "./test/svgs/elm.test.svg";
        const { stdout } = await execCliWith([svg], {SVGLINT_NO_COLOR: 1});
        expect(ansiRegex().test(stdout)).toBeFalsy();
    });
});
