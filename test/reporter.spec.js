import expect from "expect";
import { chalk } from "../src/cli/util.js";
import SVGLint from "../src/svglint.js";

async function lint(source, rules) {
    const linting = await SVGLint.lintSource(source, { rules });
    return new Promise(resolve => {
        linting.on("done", () => {
            resolve(linting.results);
        });
    });
}

describe("Reporter", function() {
    it("should report result without node", async function() {
        const results = await lint(
            "<svg><title></title></svg>",
            { elm: { "svg > foobar": true } }
        );
        expect(results.elm.messages).toMatchObject([{
            message: "Expected 'svg > foobar', none found",
            reason: "Expected 'svg > foobar', none found",
            type: "error"
        }]);
    });

    it("should report results with node", async function() {
        const results = await lint(
            `<svg>
               <g>
                 <path />
                 <path />
               </g>
               <g></g>
             </svg>`,
            { elm: { "g > path": false } }
        );
        expect(results.elm.messages).toMatchObject([{
            message: `Element disallowed\n  At node ${chalk.bold("<path>")} (2:17)`,
            reason: "Element disallowed at node <path>",
            type: "error",
            line: 2,
            column: 17
        }, {
            message: `Element disallowed\n  At node ${chalk.bold("<path>")} (3:17)`,
            reason: "Element disallowed at node <path>",
            type: "error",
            line: 3,
            column: 17
        }]);
    });

    it("should report result from exception", async function() {
        const results = await lint("<svg></svg>", {
            custom: [
                () => {
                    throw new Error("Foo");
                }
            ]
        });
        expect(results.custom[0].messages).toMatchObject([{
            message: expect.stringMatching(/^Error: Foo\n {4}at lint\.custom/),
            reason: "Error: Foo",
            type: "exception"
        }]);
    });
});
