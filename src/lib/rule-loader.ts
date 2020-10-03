/**
 * @fileoverview Turns a rule name into a module import.
 * Can be extended to use a cache if we have to do heavier processing when
 *   loading a rule.
 * Currently NodeJS' import cache is just fine.
 */
import path = require("path");

import Attr, { Config as AttrConfig } from "../rules/attr";
import Custom, { Config as CustomConfig } from "../rules/custom";
import Elm, { Config as ElmConfig } from "../rules/elm";
import Valid, { Config as ValidConfig } from "../rules/valid";

export type RuleModule =
    | typeof Attr
    | typeof Custom
    | typeof Elm
    | typeof Valid;

export default function ruleLoader(name: "attr"): typeof Attr;
export default function ruleLoader(name: "custom"): typeof Custom;
export default function ruleLoader(name: "elm"): typeof Elm;
export default function ruleLoader(name: "valid"): typeof Valid;
export default function ruleLoader(
    name: "attr" | "custom" | "elm" | "valid"
): RuleModule;
export default function ruleLoader(name: string): any {
    switch (name) {
        case "attr":
            return Attr;
        case "custom":
            return Custom;
        case "elm":
            return Elm;
        case "valid":
            return Valid;
        default:
            throw new Error(`Unknown rule '${name}'`);
    }
}
