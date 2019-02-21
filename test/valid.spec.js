const chalk = require("chalk");
const SVGLint = require("../src/svglint");
const util = require("util");

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

/**
 * ### `valid`

Requires that the SVG is valid XML.
 */

function inspect(obj) {
    return chalk.reset(util.inspect(obj, false, 3, true));
}

/**
 * Tests that a config succeeds when ran
 * @param {String} svg The SVG to lint
 * @returns {Promise<void>} Throws if linting fails
 */
function testSucceeds(svg) {
    const _config = {
        rules: { valid: true },
    };
    return new Promise((res, rej) => {
        const linting = SVGLint.lintSource(svg, _config);
        linting.on("done", () => {
            if (linting.state === linting.STATES.success) {
                res();
            } else {
                rej(new Error(`Linting failed (${linting.state}):
        ${inspect(_config)}`));
            }
        });
    });
}
/**
 * Tests that a config fails when ran
 * @param {String} svg The SVG to lint
 * @returns {Promise<void>} Throws if the linting doesn't fail
 */
function testFails(svg) {
    const _config = {
        rules: { valid: true },
    };
    return new Promise((res, rej) => {
        const linting = SVGLint.lintSource(svg, _config);
        linting.on("done", () => {
            if (linting.state === linting.STATES.error) {
                res();
            } else {
                rej(new Error(`Linting did not fail (${linting.state}):
        ${inspect(_config)}`));
            }
        });
    });
}

describe("Rule: valid", function(){
    it("should succeed without config", function(){
        return testSucceeds(`<svg role="img" viewBox="0 0 24 24">
            <g id="foo">
                <path d="bar"></path>
            </g>
            <g></g>
            <circle></circle>
        </svg>`);
    });
    it("should fail without a required attribute", function(){
        return testFails(`<svg viewBox="0 0 24 24" role="img">
          <title>BadOne icon</title>
          <path "M20.013 10.726l.001-.028A6.346"/>
        </svg>`);
    });
});
