/**
 * @fileoverview The SVG -> AST parser.
 * This handles turning an SVG source into an AST representing it.
 * It uses htmlparser2 to parse the source, which it gathers from either
 *   a string or a file.
 */
import Parser from "htmlparser2";
import fs from "fs";
import path from "path";
import process from "process";

/**
 * Parses an SVG source into an AST
 * @param {String} source The source to parse
 * @returns {AST} The parsed AST
 */
export function parseSource(source) {
    return normalizeAST(
        sourceToAST(source),
        source
    );
}

/**
 * Clones an AST by re-parsing it's source
 * @param {AST} ast The AST to clone
 * @returns {AST} The cloned AST
 */
export function clone(ast) {
    // @ts-ignore
    return parseSource(ast.source);
}

/**
 * Parses the content of a file into an AST
 * @param {String} file The path of the file in question
 * @returns {Promise<AST>} The parsed AST
 */
export function parseFile(file) {
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
                try { return res(parseSource(data)); }
                catch (e) { return rej(e); }
            }
        );
    });
}

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
 * @typedef ASTShape
 * @property {String} source The source that generated the AST
 * 
 * @typedef {Node[] & ASTShape} AST
 * An AST representing an SVG document (or a list of children).
 */

/**
 * Parses an SVG source code into an AST.
 * @param {String} source 
 * @returns {AST} The parsed AST
 */
function sourceToAST(source) {
    // @ts-ignore
    const outp = Parser.parseDOM(source, {
        withStartIndices: true,
        withEndIndices: true,
        xmlMode: true,
    });
    return outp;
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
    while ((columnNum = source.lastIndexOf("\n", columnNum - 1)) !== -1 && columnNum > 0) {
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
