import path = require("path");
import { lintFile, lintSource } from "../src/svglint";

process.on("unhandledRejection", error => {
    console.error(error);
});

const svg = "<svg></svg>";

describe(".lintSource()", function() {
    it("should succeed with empty config", async function(done) {
        const result = await lintSource(svg, {});
        result.on("done", () => {
            expect(result.state).toBe(result.STATES.success);
            done();
        });
    });

    it("should succeed with empty SVG", async function(done) {
        const result = await lintSource(svg, {});
        result.on("done", () => {
            expect(result.state).toBe(result.STATES.success);
            done();
        });
    });

    it("should succeed with empty first line", async function(done) {
        const result = await lintSource("\n" + svg, {});
        result.on("done", () => {
            expect(result.state).toBe(result.STATES.success);
            done();
        });
    });

    it("should throw with malformed SVG", async function() {
        expect(lintSource("<svg<path", {})).rejects.toBeInstanceOf(Error);
    });
});

describe(".lintFile()", function() {
    it("should resolve with empty SVG", async function() {
        const linting = await lintFile(
            path.join(__dirname, "./svgs/empty.svg"),
            {}
        );
        linting.on("done", () => {
            expect(linting.state).toBe(linting.STATES.success);
        });
    });

    it("should resolve with relative path", async function() {
        const linting = await lintFile("./test/svgs/empty.svg", {});
        linting.on("done", () => {
            expect(linting.state).toBe(linting.STATES.success);
        });
    });

    it("should resolve with absolute path", async function() {
        const linting = await lintFile(
            path.join(__dirname, "./svgs/empty.svg"),
            {}
        );
        linting.on("done", () => {
            expect(linting.state).toBe(linting.STATES.success);
        });
    });
});
