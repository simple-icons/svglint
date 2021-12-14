/**
 * @fileoverview Turns a rule name into a module import.
 * Can be extended to use a cache if we have to do heavier processing when
 *   loading a rule.
 * Currently NodeJS' import cache is just fine.
 */
import path from "path";
import { fileURLToPath } from "url";

/**
 * @typedef RuleModule
 * @property {Function} generate When given a config, returns a linting function
 */

/**
 * Finds and imports a rule from its name.
 * If the rule is named in the format "a/b" then the rule will be loaded from
 *   the package "svglint-plugin-a/b".
 * If the rule name does not contain a slash then it will be loaded from the
 *   built-in SVGLint rules.
 * @param {String} ruleName The name of the rule
 * @param {String} [dir] The dir to load the rules from if not from a package
 * @returns {Promise<RuleModule>} Resolves to the function exported by the rule if found.
 */
async function ruleLoader(ruleName, dir="../rules") {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const fileName = ruleName.endsWith(".js")
        ? ruleName
        : ruleName + ".js";
    const isExternal = ruleName.includes("/");
    const importPath = isExternal
        ? "svglint-plugin-" + ruleName
        : `file://${path.resolve(__dirname, dir, fileName)}`;
    const module = await import(importPath);
    return module.default;
}
export default ruleLoader;
