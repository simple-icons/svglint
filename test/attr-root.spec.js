const expect = require("expect");
const SVGLint = require("../src/svglint");

process.on("unhandledRejection", error => {
    console.error(error); // eslint-disable-line no-console
});

/**
 * ### `attr/root`

Specifies the attributes on the root `<svg>` object. Specified as a map with keys mapping to the wanted values. Supported value types are `Array<String>|String|Boolean`.

Default functionality acts as a blacklist. If the key `rule::whitelist` is set to `true`, it will instead act as a whitelist.

```javascript
{
    role: ["img", "progressbar"], // role must be one of ["img","progressbar"]
    viewBox: "0 0 24 24",         // viewBox must be "0 0 24 24"
    xmlns: true,                  // xmlns must be set
    width: false,                 // width must not be set
    "rule::whitelist": true       // no other attributes can be set
}
```
 */

const testSVG = `<svg role="img" viewBox="0 0 24 24" xmlns="z" foo="bar">
    <g></g>
</svg>`;
const testConfig = {
    role: ["img", "progressbar"], // role must be one of ["img","progressbar"]
    viewBox: "0 0 24 24",         // viewBox must be "0 0 24 24"
    xmlns: true,                  // xmlns must be set
    width: false,                 // width must not be set
    // "rule::whitelist": true       // no other attributes can be set
};

describe("Rule attr/root", function(){
    it("should succeed without config", function(done){
        const linter = new SVGLint({
            rules: {
                "attr/root": undefined
            }
        });
        linter.lint(testSVG)
            .then(value => expect(value).toBe(true))
            .then(() => done())
            .catch(done);
    });
    it("should succeed with a matching config", async function(){
        const linter = new SVGLint({
            rules: {
                "attr/root": testConfig
            }
        });

        const value = await linter.lint(testSVG);
        expect(value).toBe(true);
    });

    it("should fail with non-matching array", async function(){
        return testFails({
            role: ["progressbar", "foo"]
        });
    });
    it("should fail with non-matching string", function(){
        return testFails({
            viewBox: "0 0 16 16"
        });
    });
    it("should fail with missing required attr", function(){
        return testFails({
            baz: true
        });
    });
    it("should fail with forbidden attr", function(){
        return testFails({
            foo: false
        });
    });
    it("should fail with forbidden attr", function(){
        return testFails({
            foo: false
        });
    });
    it("should fail with extra attr when whitelisting", function(){
        return testFails({
            "rule::whitelist": true
        });
    });
});

async function testFails(config) {
    config = {
        rules: {
            "attr/root": Object.assign({},
                testConfig,
                config
            )
        }
    };
    const linter = new SVGLint(config);
    let value;
    try {
        value = await linter.lint(testSVG);
    } catch (e) {
        // eslint-disable-line no-empty
    }
    expect(value).toBe(undefined);
}
