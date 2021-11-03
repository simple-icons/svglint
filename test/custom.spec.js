import chalk from "chalk";
import util from "util";

import SVGLint from "../src/svglint.js";

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

/**
 * ### `custom`

Specifies a custom rule.
Used as a quick-and-dirty way of adding rules when you don't want to write an 
entire NPM package.

```javascript
[function(reporter, $, ast) {
    reporter.error(
        "This will fail at <svg>",
        $.find("svg")[0],
        ast
    );
}, function(reporter, $, ast) {
    reporter.warn(
        "This will warn at <svg>",
        $.find("svg")[0],
        ast
    );
}, function(reporter, $, ast) {
    // this will succeed
}, function(reporter, $, ast) {
    // this does async work, then succeeds
    return new Promise(res => {
        setTimeout(() => res(), 1000);
    });
}]
```
 */

const testSVG = `<svg role="img" viewBox="0 0 24 24">
    <g id="foo">
        <path d="bar"></path>
    </g>
    <g></g>
    <circle></circle>
</svg>`;

function inspect(obj) {
    return chalk.reset(util.inspect(obj, false, 3, true));
}

/**
 * Tests that a config succeeds when ran
 * @param {Config} config The config to test
 * @param {String} [svg=testSVG] The SVG to lint
 * @returns {Promise<void>} Throws if linting fails
 */
function testSucceeds(config, svg=testSVG) {
    const _config = {
        rules: { custom: config },
    };
    return new Promise(async (res, rej) => {
        const linting = await SVGLint.lintSource(svg, _config);
        linting.on("done", () => {
            if (linting.state === linting.STATES.success) {
                res();
            } else {
                rej(new Error(`Linting failed (${linting.state}):
        ${inspect(config)}`));
            }
        });
    });
}
/**
 * Tests that a config fails when ran
 * @param {Config} config The config to test
 * @param {String} svg The SVG to lint
 * @returns {Promise<void>} Throws if the linting doesn't fail
 */
function testFails(config, svg=testSVG) {
    const _config = {
        rules: { custom: config },
    };
    return new Promise(async (res, rej) => {
        const linting = await SVGLint.lintSource(svg, _config);
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

describe("Rule: custom", function(){
    it("should succeed without config", function(){
        return testSucceeds([]);
    });

    it("should succeed with a void function", function(){
        return testSucceeds([
            () => {}
        ]);
    });
    it("should succeed with an async void function", function(){
        return testSucceeds([
            () => new Promise(res => {
                setTimeout(() => res(), 250);
            })
        ]);
    });
    it("should fail with an exception inside function", function(){
        return testFails([
            () => {
                throw new Error("Foo");
            }
        ]);
    });
    it("should fail with an erroring function", function(){
        return testFails([
            (reporter, $, ast) => {
                reporter.error(
                    "Fails",
                    $.find("svg")[0],
                    ast
                );
            }
        ]);
    });
    it("should fail with an async erroring function", function(){
        return testFails([
            (reporter, $, ast) => new Promise(res => {
                setTimeout(() => {
                    reporter.error(
                        "Fails",
                        $.find("svg")[0],
                        ast
                    );
                    res();
                }, 250);
            })
        ]);
    });
});
