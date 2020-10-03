import type Reporter from "./lib/reporter";
import type { AST } from "./lib/parse";
import CheerioAPI from "cheerio";

import type { Config as AttrConfig } from "./rules/attr";
import type { Config as CustomConfig } from "./rules/custom";
import type { Config as ElmConfig } from "./rules/elm";
import type { Config as ValidConfig } from "./rules/valid";

// TODO: remove once @types/cheerio is updated to export this directly
export type Cheerio = ReturnType<typeof CheerioAPI.root>;
export type CheerioElement = Parameters<typeof CheerioAPI.contains>[0];

export type Rule = (
    reporter: Reporter,
    $: typeof CheerioAPI | Cheerio,
    ast: AST
) => Promise<void> | void;

/**
 * An object with each key representing a rule name, and each value representing a rule config.
 * If a value is set to `false`, then the rule is disabled (useful for e.g. overwriting presets).
 */
export type RulesConfig = {
    attr?: false | AttrConfig | AttrConfig[],
    custom?: false | CustomConfig | CustomConfig[],
    elm?: false | ElmConfig | ElmConfig[],
    valid?: false | ValidConfig | ValidConfig[]
};