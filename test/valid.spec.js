import util from "util";

import SVGLint from "../src/svglint.js";
import { chalk } from "../src/cli/util.js";

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
 * @param {Object} [config] The config to test
 * @returns {Promise<void>} Throws if linting fails
 */
async function testSucceeds(svg, config=undefined) {
    const linting = await SVGLint.lintSource(svg, config);
    linting.on("done", () => {
        if (linting.state !== linting.STATES.success) {
            throw new Error(`Linting failed (${linting.state}),: ${inspect(config)}`);
        }
    });
}
/**
 * Tests that a config fails when ran
 * @param {String} svg The SVG to lint
 * @param {Object} [config] The config to test
 * @returns {Promise<void>} Throws if the linting doesn't fail
 */
async function testFails(svg, config=undefined) {
    const linting = await SVGLint.lintSource(svg, config);
    linting.on("done", () => {
        if (linting.state !== linting.STATES.error) {
            throw new Error(`Linting did not fail (${linting.state}): ${inspect(config)}`);
        }
    });
}

describe("Rule: valid", function(){
    it("should succeed by default for a valid SVG", function(){
        return testSucceeds(`<svg role="img" viewBox="0 0 24 24">
            <g id="foo">
                <path d="bar"></path>
            </g>
            <g></g>
            <circle></circle>
        </svg>`, { rules: {} });
    });
    it("should fail by default for an invalid SVG", function(){
        return testFails(`<svg viewBox="0 0 24 24" role="img">
          <title>BadOne icon</title>
          <path "M20.013 10.726l.001-.028A6.346"/>
        </svg>`, { rules: {} });
    });

    it("should succeed when enabled for a valid SVG", function(){
        return testSucceeds(`<svg role="img" viewBox="0 0 24 24">
            <g id="foo">
                <path d="bar"></path>
            </g>
            <g></g>
            <circle></circle>
        </svg>`, { rules: { valid: true } });
    });
    it("should fail when enabled for an invalid SVG", function(){
        return testFails(`<svg viewBox="0 0 24 24" role="img">
          <title>BadOne icon</title>
          <path "M20.013 10.726l.001-.028A6.346"/>
        </svg>`, { rules: { valid: true } });
    });

    it("should succeed when disabled for a valid SVG", function(){
        return testSucceeds(`<svg role="img" viewBox="0 0 24 24">
            <g id="foo">
                <path d="bar"></path>
            </g>
            <g></g>
            <circle></circle>
        </svg>`, { rules: { valid: false } });
    });
    it("should succeed when disabled for an invalid SVG", function(){
        return testSucceeds(`<svg viewBox="0 0 24 24" role="img">
          <title>BadOne icon</title>
          <path "M20.013 10.726l.001-.028A6.346"/>
        </svg>`, { rules: { valid: false } });
    });
});
