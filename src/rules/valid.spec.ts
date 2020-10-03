import chalk from "chalk";
import { lintSource, lintFile } from "../svglint";
import { inspect } from "../../test/shared";
import { Config } from "../svglint";

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

/**
 * ### `valid`

Requires that the SVG is valid XML.
 */

function testSucceeds(svg: string, config?: Config) {
    return new Promise(async (res, rej) => {
        const linting = await lintSource(svg, config);
        linting.on("done", () => {
            if (linting.state === linting.STATES.success) {
                res();
            } else {
                rej(
                    new Error(`Linting failed (${linting.state}),:
        ${inspect(config)}`)
                );
            }
        });
    });
}

function testFails(svg: string, config?: Config) {
    return new Promise(async (res, rej) => {
        const linting = await lintSource(svg, config);
        linting.on("done", () => {
            if (linting.state === linting.STATES.error) {
                res();
            } else {
                rej(
                    new Error(`Linting did not fail (${linting.state}):
        ${inspect(config)}`)
                );
            }
        });
    });
}

describe("Rule: valid", function() {
    it("should succeed by default for a valid SVG", function() {
        return testSucceeds(
            `<svg role="img" viewBox="0 0 24 24">
            <g id="foo">
                <path d="bar"></path>
            </g>
            <g></g>
            <circle></circle>
        </svg>`,
            { rules: {} }
        );
    });
    it("should fail by default for an invalid SVG", function() {
        return testFails(
            `<svg viewBox="0 0 24 24" role="img">
          <title>BadOne icon</title>
          <path "M20.013 10.726l.001-.028A6.346"/>
        </svg>`,
            { rules: {} }
        );
    });

    it("should succeed when enabled for a valid SVG", function() {
        return testSucceeds(
            `<svg role="img" viewBox="0 0 24 24">
            <g id="foo">
                <path d="bar"></path>
            </g>
            <g></g>
            <circle></circle>
        </svg>`,
            { rules: { valid: true } }
        );
    });
    it("should fail when enabled for an invalid SVG", function() {
        return testFails(
            `<svg viewBox="0 0 24 24" role="img">
          <title>BadOne icon</title>
          <path "M20.013 10.726l.001-.028A6.346"/>
        </svg>`,
            { rules: { valid: true } }
        );
    });

    it("should succeed when disabled for a valid SVG", function() {
        return testSucceeds(
            `<svg role="img" viewBox="0 0 24 24">
            <g id="foo">
                <path d="bar"></path>
            </g>
            <g></g>
            <circle></circle>
        </svg>`,
            { rules: { valid: false } }
        );
    });
    it("should succeed when disabled for an invalid SVG", function() {
        return testSucceeds(
            `<svg viewBox="0 0 24 24" role="img">
          <title>BadOne icon</title>
          <path "M20.013 10.726l.001-.028A6.346"/>
        </svg>`,
            { rules: { valid: false } }
        );
    });
});
