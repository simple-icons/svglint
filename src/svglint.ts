/**
 * @fileoverview The SVGLint entry file.
 * This is the publicly exposed JS API, which the CLI also uses.
 * It exposes .lintSource() and .lintFile().
 * Main responsibility is handling the consumer<->Linting communication,
 *   and converting the user-provided config into an object of rules.
 */

import Linting from "./lib/linting";
import loadRule, { RuleModule } from "./lib/rule-loader";
import { AST, parseFile, parseSource } from "./lib/parse";
import Logger from "./lib/logger";
import { Rule, RulesConfig } from "./types";
const logger = Logger("");

export type NormalizedRules = { [k: string]: Rule | Rule[] };

/** An array of strings, each of which is a blob that represents files to ignore. If any blob matches a file, the file is not linted. */
type IgnoreList = string[];

export type Config = {
    rules?: RulesConfig;
    ignore?: IgnoreList;
};
type NormalizedConfig = {
    rules: NormalizedRules;
    ignore: IgnoreList;
};

const DEFAULT_CONFIG: Config = Object.freeze({
    useSvglintRc: true,
    rules: { valid: true },
    ignore: [],
});

/**
 * Normalizes a user-provided RulesConfig into a NormalizedRules.
 * Figures out which rules should be kept, and calls their generator with the
 *   user-provided config. The returned function is the actual linting func.
 */
function normalizeRules(rulesConfig: RulesConfig): NormalizedRules {
    const outp: NormalizedRules = {};
    (Object.keys(rulesConfig) as (keyof RulesConfig)[])
        // make sure no disabled rules are allowed in
        .filter((k) => rulesConfig[k] !== false)
        // then convert each rule config into a rule func
        .forEach((ruleName) => {
            let loadedRule: RuleModule;
            try {
                loadedRule = loadRule(ruleName);
            } catch (e) {
                logger.warn(`Unknown rule "${ruleName}".`);
                return;
            }

            // handle the case where there are multiple configs for a single rule
            const config = rulesConfig[ruleName];
            if (config instanceof Array) {
                // @ts-ignore
                outp[ruleName] = config.map((config) => loadedRule(config));
            } else {
                // @ts-ignore
                outp[ruleName] = loadedRule(config);
            }
        });
    return outp;
}

/** Normalizes a user-provided config to make sure it has every property we need. Also handles merging with defaults. */
function normalizeConfig(config?: Config): NormalizedConfig {
    const defaulted = Object.assign({}, DEFAULT_CONFIG, config);
    defaulted.rules = Object.assign(
        {},
        DEFAULT_CONFIG.rules,
        config ? config.rules : {}
    );
    const outp: NormalizedConfig = {
        rules: normalizeRules(defaulted.rules),
        ignore: defaulted.ignore || [],
    };
    return outp;
}

/**
 * The main function. Lints the provided AST using the user-provided config.
 */
function lint(file: string, ast: AST, config?: Config): Linting {
    if (!ast.length && ast.source.trim() !== "") {
        throw new Error(`Unable to parse SVG from ${file || "API"}:
${ast.source}`);
    }
    const conf = normalizeConfig(config);
    return new Linting(file, ast, conf.rules);
}

/**
 * Lints a single SVG string.
 * The function returns before the Linting is finished.
 * You should listen to Linting.on("done") to wait for the result.
 */
export async function lintSource(source: string, config?: Config) {
    const ast = await parseSource(source);
    return lint("", ast, config);
}

/**
 * Lints a single file.
 * The returned Promise resolves before the Linting is finished.
 * You should listen to Linting.on("done") to wait for the result.
 * @param {String} file The file path to lint
 * @param {Config} config The config to lint by
 * @returns {Promise<Linting>} Resolves to the Linting that represents the result
 */
export async function lintFile(file: string, config?: Config) {
    const ast = await parseFile(file);
    return lint(file, ast, config);
}
