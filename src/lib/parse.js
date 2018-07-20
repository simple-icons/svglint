/**
 * @fileoverview The SVG -> AST parser.
 * This handles turning an SVG source into an AST representing it.
 * It uses htmlparser2 to parse the source, which it gathers from either
 *   a string or a file.
 */
const Parser = require("htmlparser2");
const fs = require("fs");
const path = require("path");

module.exports = {
    /**
     * Clones an AST by re-parsing it's source
     * @param {AST} ast The AST to clone
     * @returns {AST} The cloned AST
     */
    clone(ast) {
        // @ts-ignore
        return module.exports.parseSource(ast.source);
    },

    /**
     * Parses an SVG source into an AST
     * @param {String} source The source to parse
     * @returns {AST} The parsed AST
     */
    parseSource(source) {
        return normalizeAST(
            sourceToAST(source),
            source
        );
    },

    /**
     * Parses the content of a file into an AST
     * @param {String} file The path of the file in question
     * @returns {Promise<AST>} The parsed AST
     */
    parseFile(file) {
        const filePath = path.isAbsolute(file)
            ? file
            : path.join(process.cwd(), file);
        return new Promise((res, rej) => {
            fs.readFile(
                filePath,
                "utf8",
                (err, data) => {
                    if (err) {
                        return rej(err);
                    }
                    try { return res(module.exports.parseSource(data)); }
                    catch (e) { return rej(e); }
                }
            );
        });
    }
};

/**
 * @typedef {Object<string,string>} Attributes
 */
/**
 * @typedef Node
 * @property {String} type The type of node
 * @property {Node} next The next sibling
 * @property {Node} prev The previous sibling
 * @property {Node} parent The parent of the node
 * @property {Number} startIndex The string index at which the element starts
 * @property {Number} endIndex The string index at which the element ends
 * @property {Number} lineNum The line number at which the element starts
 * @property {Number} columnNum The index in the line at which the element starts
 * 
 * @property {Attributes} [attribs] An object of attributes on the Node
 * @property {AST} [children] The children of the Node
 * @property {String} [data] If type==="text", the content of the Node
 * @property {String} [name] If type!=="text", the tag name
 */
/**
 * @typedef {Node[]} AST
 * @property {String} source The source that generated the AST
 * An AST representing an SVG document (or a list of children).
 */

/**
 * Parses an SVG source code into an AST.
 * @param {String} source 
 * @returns {AST} The parsed AST
 */
function sourceToAST(source) {
    // @ts-ignore
    return Parser.parseDOM(source, {
        withStartIndices: true,
        withEndIndices: true,
        xmlMode: true,
    });
}

/**
 * Normalizes a Node to the format we want.
 * Currently translates the startIndex to a line number+index.
 * == MODIFIES THE NODE IN-PLACE! ==
 * @param {Node} node The node to normalize
 * @param {String} source The string the AST was generated from
 */
function normalizeNode(node, source) {
    // calculate the distance from node start to line start
    const lineStart = (
        source.lastIndexOf("\n", node.startIndex + 
            // make sure newline text nodes are set to start on the proper line
            ((node.type === "text" && node.data.startsWith("\n")) ? -1 : 0))
    ) + 1;
    node.columnNum = node.startIndex - lineStart;

    // calculate the line number
    let numLines = 0;
    let columnNum = lineStart;
    while ((columnNum = source.lastIndexOf("\n", columnNum - 1)) !== -1) {
        ++numLines;
    }
    node.lineNum = numLines;
    return node;
}

/**
 * Normalizes the AST returned by htmlparser2 to the format we want.
 * Currently translates the startIndex to a line number+index.
 * == MODIFIES THE AST IN-PLACE! ==
 * @param {AST} ast The AST to normalize
 * @param {String} source The source the AST was generated from
 * @returns {AST} The normalized AST
 */
function normalizeAST(ast, source) {
    const handleNode = node => {
        normalizeNode(node, source);
        if (node.children) {
            node.children.forEach(handleNode);
        }
    };
    ast.forEach(handleNode);
    // @ts-ignore
    ast.source = source;
    return ast;
}
