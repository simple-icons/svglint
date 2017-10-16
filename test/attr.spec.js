const expect = require("expect");
const SVGLint = require("../src/svglint");

process.on("unhandledRejection", error => {
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

const testSVG = `<svg role="img" viewBox="0 0 24 24" xmlns="z" foo="bar">
    <g></g>
</svg>`;
const testConfig = {
    role: ["img", "progressbar"], // role must be one of ["img","progressbar"]
    viewBox: "0 0 24 24",         // viewBox must be "0 0 24 24"
    xmlns: true,                  // xmlns must be set
    width: false,                 // width must not be set
    // "rule::whitelist": true       // no other attributes can be set
    "rule::selector": "svg"
};

describe("Rule attr", function(){
    it("should succeed without config", function(done){
        const linter = new SVGLint({
            rules: {
                "attr": undefined
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
                "attr": testConfig
            }
        });

        const value = await linter.lint(testSVG);
        expect(value).toBe(true);
    });
    it("should succeed with multiple configs", async function(){
        const linter = new SVGLint({
            rules: {
                "attr": [
                    testConfig,
                    { foo: false, "rule::selector": "g" }
                ]
            }
        });

        const value = await linter.lint(testSVG);
        expect(value).toBe(true);
    });

    it("should fail with one failing out of multiple configs", async function(){
        const linter = new SVGLint({
            rules: {
                "attr": [
                    testConfig,
                    { foo: true, "rule::selector": "g" }
                ]
            }
        });

        let value;
        try {
            value = await linter.lint(testSVG);
        } catch (e) {
            // eslint-disable-line no-empty
        }
        expect(value).toBe(undefined);
    });
    it("should fail with non-matching array", function(){
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
            "attr": Object.assign({},
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
