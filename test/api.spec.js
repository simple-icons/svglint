import { expect } from "expect";
import * as path from "path";
import process from "process";
import * as url from "url";

import SVGLint from "../src/svglint.js";

const currentFilePath = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(currentFilePath);

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

const svg = "<svg></svg>";

describe(".lintSource()", function() {
    it("should succeed without config", function(done) {
        SVGLint.lintSource(svg)
            .then(result => {
                result.on("done", () => {
                    expect(result.state).toBe(result.STATES.success);
                    done();
                });
            });
    });

    it("should succeed with empty config", function(done) {
        SVGLint.lintSource(svg, {})
            .then(result => {
                result.on("done", () => {
                    expect(result.state).toBe(result.STATES.success);
                    done();
                });
            });
    });

    it("should succeed with empty SVG", function(done) {
        SVGLint.lintSource(svg, {})
            .then(result => {
                result.on("done", () => {
                    expect(result.state).toBe(result.STATES.success);
                    done();
                });
            });
    });

    it("should succeed with empty first line", function(done) {
        SVGLint.lintSource("\n" + svg, {})
            .then(result => {
                result.on("done", () => {
                    expect(result.state).toBe(result.STATES.success);
                    done();
                });
            });
    });

    it("should throw with malformed SVG", function(done) {
        SVGLint.lintSource("<svg<path", {})
            .catch(() => done());
    });
});

describe(".lintFile()", function() {
    it("should resolve with empty SVG", function() {
        return SVGLint.lintFile(path.join(__dirname, "./svgs/empty.svg"), {})
            .then(linting => {
                linting.on("done", () => {
                    expect(linting.state).toBe(linting.STATES.success);
                });
            });
    });

    it("should resolve with relative path", function() {
        SVGLint.lintFile("./test/svgs/empty.svg", {})
            .then(linting => {
                linting.on("done", () => {
                    expect(linting.state).toBe(linting.STATES.success);
                });
            });
    });

    it("should resolve with absolute path", function() {
        return SVGLint.lintFile(path.join(__dirname, "./svgs/empty.svg"), {})
            .then(linting => {
                linting.on("done", () => {
                    expect(linting.state).toBe(linting.STATES.success);
                });
            });
    });

    it("should succeed without config", function() {
        return SVGLint.lintFile(path.join(__dirname, "./svgs/empty.svg"))
            .then(linting => {
                linting.on("done", () => {
                    expect(linting.state).toBe(linting.STATES.success);
                });
            });
    });

});
