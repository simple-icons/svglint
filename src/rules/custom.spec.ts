import chalk from "chalk";
import { lintSource, lintFile } from "../svglint";
import { inspect } from "../../test/shared";
import { Config } from "./custom";

process.on("unhandledRejection", (error) => {
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

function testSucceeds(config?: Config | Config[], svg = testSVG) {
    const _config = {
        rules: { custom: config },
    };
    return new Promise(async (res, rej) => {
        const linting = await lintSource(svg, _config);
        linting.on("done", () => {
            if (linting.state === linting.STATES.success) {
                res();
            } else {
                rej(
                    new Error(`Linting failed (${linting.state}):
        ${inspect(config)}`)
                );
            }
        });
    });
}

function testFails(config?: Config | Config[], svg = testSVG) {
    const _config = {
        rules: { custom: config },
    };
    return new Promise(async (res, rej) => {
        const linting = await lintSource(svg, _config);
        linting.on("done", () => {
            if (linting.state === linting.STATES.error) {
                res();
            } else {
                rej(
                    new Error(`Linting did not fail (${linting.state}):
        ${inspect(_config)}`)
                );
            }
        });
    });
}

describe("Rule: custom", function () {
    it("should succeed without config", function () {
        return testSucceeds([]);
    });

    it("should succeed with a void function", function () {
        // tslint:disable-next-line:no-empty
        return testSucceeds([() => {}]);
    });
    it("should succeed with an async void function", function () {
        return testSucceeds([
            () =>
                new Promise((res) => {
                    setTimeout(() => res(), 250);
                }),
        ]);
    });
    it("should fail with an erroring function", function () {
        return testFails([
            (reporter, $, ast) => {
                reporter.error("Fails", $.find("svg")[0], ast);
            },
        ]);
    });
    it("should fail with an async erroring function", function () {
        return testFails([
            (reporter, $, ast) =>
                new Promise((res) => {
                    setTimeout(() => {
                        reporter.error("Fails", $.find("svg")[0], ast);
                        res();
                    }, 250);
                }),
        ]);
    });
});
