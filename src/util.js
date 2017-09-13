/**
 * Splits a string into N sized chunks.
 * Newlines also indicates a chunk end.
 * @param {String} str  The string to chunk
 * @param {Number} N    The length to chunk into
 * @returns {Array<String>}
 */
function chunkString(str, N) {
    const outp = [];
    let tmp = "";
    for (let i = 0, l = str.length; i < l; ++i) {
        if (str[i] === "\n"        // split at newlines
            || tmp.length === N) { // and at length
            outp.push(tmp);
            tmp = "";
        }
        if (str[i] === "\n") {
            continue;
        }
        tmp += str[i];
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

module.exports = {
    chunkString,
    transformRuleName,
    str_expected,
};
