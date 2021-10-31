/**
 * @fileoverview Turns a rule name into a module import.
 * Can be extended to use a cache if we have to do heavier processing when
 *   loading a rule.
 * Currently NodeJS' import cache is just fine.
 */
import path from "path";

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
 * @returns {RuleModule} The function exported by the rule if found.
 */
function ruleLoader(ruleName, dir="../rules") {
    const fileName = ruleName.endsWith(".js")
        ? ruleName
        : ruleName + ".js";
    const isExternal = ruleName.includes("/");
    return require(isExternal
        ? "svglint-plugin-" + ruleName
        : path.join(dir, fileName));
}
export default ruleLoader;
