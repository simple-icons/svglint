const expect = require("expect");
const SVGLint = require("../src/svglint");

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
    "g > path": [0,2],   // up to two paths can be in each group
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
const testConfig = {
    "svg": true,         // the root svg element must exist
    "svg > title": true, // the title element must exist inside the root element
    "g": 2,              // exactly 2 groups must exist
    "g > path": [0,2],   // up to two paths can be in each group
    "*": false,          // nothing else can exist
};

describe("Rule elm", function(){
    it("should succeed without config", function(done){
        const linter = new SVGLint({
            rules: {
                "elm": undefined
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
                "elm": testConfig
            }
        });

        const value = await linter.lint(testSVG);
        expect(value).toBe(true);
    });
    it("should succeed with multiple configs", async function(){
        const linter = new SVGLint({
            rules: {
                "elm": [
                    testConfig,
                    { "g > path": true }
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
                    { "g > path": false }
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
    it("should fail with matching blacklist", function(){
        return testFails({
            "g > path": false
        });
    });
    it("should fail with incorrect number", function(){
        return testFails({
            "g": 3
        });
    });
    it("should fail with missing required elm", function(){
        return testFails({
            "circle": true
        });
    });
    it("should fail with below range", function(){
        return testFails({
            "g > path": [3,4]
        });
    });
    it("should fail with above range", function(){
        return testFails({
            "g > path": [0,1]
        });
    });
});

async function testFails(config) {
    config = {
        rules: {
            "elm": Object.assign({},
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
