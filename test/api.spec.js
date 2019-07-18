const expect = require("expect");
const path = require("path");
const SVGLint = require("../src/svglint");

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

const svg = "<svg></svg>";

describe(".lintSource()", function() {
    it("should succeed with empty config", function(done) {
        const result = SVGLint.lintSource(svg, {});
        result.on("done", () => {
            expect(result.state).toBe(result.STATES.success);
            done();
        });
    });

    it("should succeed with empty SVG", function(done) {
        const result = SVGLint.lintSource(svg, {});
        result.on("done", () => {
            expect(result.state).toBe(result.STATES.success);
            done();
        });
    });

    it("should succeed with empty first line", function(done) {
        const result = SVGLint.lintSource("\n" + svg, {});
        result.on("done", () => {
            expect(result.state).toBe(result.STATES.success);
            done();
        });
    });

    it("should throw with malformed SVG", function() {
        expect(() => {
            SVGLint.lintSource("<svg<path", {});
        }).toThrow();
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
});
