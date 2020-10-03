import chalk from "chalk";
import { lintSource, lintFile } from "../svglint";
import { inspect } from "../../test/shared";
import { Config } from "./elm";

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

/**
 * ### `elm`

Specifies the elements that must/must not exist.  
Specified as a map with keys mapping to a value. Supported value types are `Array<Number>|Number|Boolean`.
The key is used as a selector.  
If the value is a boolean, it indicates whether the selector must be matched (`true`) or must not be matched (`false`).  
If the value is a number, it indicates that exactly that number of matches must be found.  
If the number is an array, it must have a length of 2, and indicates the range between which the number of matches must be.

If an element is permitted by one rule and rejected by another, it is overall permitted.

```javascript
{
    "svg": true,         // the root svg element must exist
    "svg > title": true, // the title element must exist inside the root element
    "g": 2,              // exactly 2 groups must exist
    "g > path": [0,2],   // up to two paths can exist
    "*": false,          // nothing else can exist
}
```
 */

const testSVG = `<svg>
    <title></title>
    <g>
        <path></path>
        <path></path>
    </g>
    <g></g>
</svg>`;

function testSucceeds(config: Config, svg = testSVG) {
    return new Promise(async (res, rej) => {
        const linting = await lintSource(svg, config);
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
        rules: { elm: config },
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

describe("Rule: elm", function() {
    it("should succeed without config", function() {
        return testSucceeds({});
    });

    it("should succeed with a required element", function() {
        return testSucceeds({
            "svg > title": true,
        });
    });
    it("should fail without a required element", function() {
        return testFails({
            "svg > foobar": true,
        });
    });

    it("should succeed without a disallowed element", function() {
        return testSucceeds({
            "g > foobar": false,
        });
    });
    it("should fail with a disallowed element", function() {
        return testFails({
            "g > path": false,
        });
    });

    it("should succeed with a found number of elements", function() {
        return testSucceeds({
            g: 2,
        });
    });
    it("should fail with an exceeded number of elements", function() {
        return testFails({
            g: 1,
        });
    });
    it("should fail with a too low number of elements", function() {
        return testFails({
            g: 3,
        });
    });

    it("should succeed with a found range of elements", function() {
        return Promise.all([
            testSucceeds({
                "g > path": [1, 2],
            }),
            testSucceeds(
                {
                    "g > path": [1, 2],
                },
                "<svg><g><path></path></g></svg>"
            ),
        ]);
    });
    it("should fail with an exceeded range of elements", function() {
        return testFails({
            "g > path": [0, 1],
        });
    });
    it("should fail with a too low range of elements", function() {
        return testFails({
            "g > path": [3, 5],
        });
    });

    it("should succeed when a disallowed element is allowed by another rule", function() {
        return Promise.all([
            testSucceeds({
                path: false,
                "g > path": true,
            }),
            testSucceeds({
                path: false,
                "g > path": 2,
            }),
            testSucceeds({
                path: false,
                "g > path": [1, 2],
            }),
        ]);
    });
});
