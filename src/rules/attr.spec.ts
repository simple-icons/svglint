import chalk from "chalk";
import { lintFile, lintSource } from "../svglint";
import { Config } from "./attr";
import { inspect } from "../../test/shared";

process.on("unhandledRejection", (error) => {
    console.error(error); // eslint-disable-line no-console
});

/**
 * ### `attr`

Specifies the attributes on the elements that match the selector. 
Specified as a map with keys mapping to the wanted values. Supported value types are `Array<String>|String|Boolean`.  
The selector is given in key `rule::selector`. It defaults to `"*"`.

Default functionality acts as a blacklist. If the key `rule::whitelist` is set to `true`, it will instead act as a whitelist.

```javascript
[{
    role: ["img", "progressbar"], // role must be one of ["img","progressbar"]
    viewBox: "0 0 24 24",         // viewBox must be "0 0 24 24"
    xmlns: true,                  // xmlns must be set
    width: false,                 // width must not be set
    "rule::whitelist": true,      // no other attributes can be set
    "rule::selector": "svg",      // check attributes on the root svg object
}, {
    "rule::whitelist": true,      // ban all attributes
    "rule::selector": "title",    // on all title elements
}, {
    stroke: false,                // ban strokes on all elements
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

function testSucceeds(config: Config, svg = testSVG) {
    const _config = {
        rules: { attr: config },
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

function testFails(config: Config, svg = testSVG) {
    const _config = {
        rules: { attr: config },
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

describe("Rule: attr", function () {
    it("should succeed without config", function () {
        return testSucceeds({});
    });

    it("should succeed with a required attribute", function () {
        return testSucceeds({
            role: true,
            "rule::selector": "svg",
        });
    });
    it("should fail without a required attribute", function () {
        return testFails({
            id: true,
            "rule::selector": "g",
        });
    });

    it("should succeed without a disallowed attribute", function () {
        return testSucceeds({
            foo: false,
            "rule::selector": "svg",
        });
    });
    it("should fail with a disallowed attribute", function () {
        return testFails({
            role: false,
            "rule::selector": "svg",
        });
    });

    it("should succeed with a valid value when given array", function () {
        return testSucceeds({
            role: ["img", "progressbar"],
            "rule::selector": "svg",
        });
    });
    it("should fail with an invalid value when given array", function () {
        return testFails({
            role: ["foo", "bar"],
            "rule::selector": "svg",
        });
    });

    it("should succeed with a valid value when given regex", function () {
        return testSucceeds({
            role: /^im.$/,
            "rule::selector": "svg",
        });
    });
    it("should fail with an invalid value when given regex", function () {
        return testFails({
            role: /^.im$/,
            "rule::selector": "svg",
        });
    });
    it("should fail with a non-existant attribute when given regex", function () {
        return testFails({
            foo: /^img$/,
            "rule::selector": "svg",
        });
    });

    it("should default to wildcard selector", function () {
        return testFails({
            id: false,
        });
    });
    it("should succeed with non-found banned attribute on all elements", function () {
        return testSucceeds({
            foobar: false,
        });
    });
    it("should fail with found banned attribute on all elements", function () {
        return testFails({
            viewBox: false,
        });
    });

    it("should succeed in whitelist-mode when all attributes are allowed", function () {
        return testSucceeds({
            role: ["img", "progressbar"],
            viewBox: true,
            "rule::selector": "svg",
            "rule::whitelist": true,
        });
    });
    it("should fail in whitelist-mode when not all attributes are allowed", function () {
        return testFails({
            role: ["img", "progressbar"],
            viewBox: true,
            id: "foo",
            "rule::selector": "svg",
            "rule::whitelist": true,
        });
    });
    it("should succeed in whitelist-mode without attributes", function () {
        return testSucceeds({
            "rule::selector": "circle",
            "rule::whitelist": true,
        });
    });
    it("should fail in whitelist-mode with attributes", function () {
        return testFails({
            "rule::selector": "svg",
            "rule::whitelist": true,
        });
    });
});
