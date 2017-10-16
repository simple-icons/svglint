const ansiRegex = require("ansi-regex");

/**
 * Splits a string into N sized chunks.
 * Newlines also indicates a chunk end.
 * Handles ANSI color codes correctly (does not count them towards length)
 * @param {String} str  The string to chunk
 * @param {Number} N    The length to chunk into
 * @returns {Array<String>}
 */
function chunkString(str, N) {
    const outp = [];
    const blacklist = [ansiRegex()];
    let tmp = ""; let tmpLen = 0;
    for (let i = 0, l = str.length; i < l; ++i) {
        if (str[i] === "\n"        // split at newlines
            || tmpLen === N) { // and at length
            outp.push(tmp);
            tmp = "";
            tmpLen = 0;
        }
        if (str[i] === "\n") { // don't add newlines to our outp str
            continue;
        }
        let blacklisted = false;
        for (let regex of blacklist) { // skip blacklist matches
            const tester = new RegExp("^"+regex.source);
            const match = tester.exec(str.slice(i));
            if (match) {
                i += match[0].length - 1;
                tmp += match[0];
                blacklisted = true;
                break;
            }
        }
        if (blacklisted) { continue; }

        tmp += str[i];
        ++tmpLen;
    }
    if (tmp) { outp.push(tmp); }
    return outp;
}

/**
 * Turns a user-friendly rule name into a file-friendly rule name
 * @param {String} rule  The rule name to transform
 * @return {String}  The transformed rule name
 */
function transformRuleName(rule) {
    return rule.replace(/\//g, "_");
}

/**
 * Returns the relevant version of "expected" for a value
 * Arrays: expected one of
 * RegExp: expected to match
 * Others: expected
 */
function str_expected(value) {
    if (value instanceof Array) {
        return "expected one of";
    }
    if (value instanceof RegExp) {
        return "expected to match";
    }
    if (value === true) {
        return "must be set";
    }
    return "expected";
}

/**
 * Flattens an array such that it consists solely of non-array elements
 * @param {Array} arr  The array to flatten
 * @returns {Array}  The flattened array
 */
function flatten(arr) {
    let outp = [];
    for (let i = 0; i < arr.length; ++i) {
        if (arr[i] instanceof Array) {
            outp = outp.concat(flatten(arr[i]));
        } else {
            outp.push(arr[i]);
        }
    }
    return outp;
}

module.exports = {
    chunkString,
    transformRuleName,
    str_expected,
    flatten,
};
