/**
 * @fileoverview The SVG -> AST parser.
 * This handles turning an SVG source into an AST representing it.
 * It uses htmlparser2 to parse the source, which it gathers from either
 *   a string or a file.
 */

import { Parser } from "htmlparser2";
import { DomHandler } from "domhandler";
import fs = require("fs");
import path = require("path");

type Attributes = { [k: string]: string };
export type Node = {
    type: string;
    next: Node | null;
    prev: Node | null;
    parent: Node;
    startIndex: number | null;
    endIndex: number | null;
    lineNum: number;
    columnNum: number;

    attribs?: Attributes;
    children?: AST;
    data?: string; // if type==="text", the content of the Node
    name?: string; // if type!=="text", the tag name
};
export type AST = Node[] & { source: string };
type PartialNode = Omit<
    Node,
    "lineNum" | "columnNum" | "next" | "prev" | "parent" | "children"
> & {
    next: PartialNode | null;
    prev: PartialNode | null;
    parent: PartialNode | null;
    children?: PartialNode[];
};

/** Clones an AST by re-parsing it's source */
export function clone(ast: AST) {
    return parseSource(ast.source);
}

/** Parses an SVG source into an AST */
export async function parseSource(source: string) {
    return normalizeAST(await sourceToAST(source), source);
}

/** Parses the content of a file into an AST */
export function parseFile(file: string): Promise<AST> {
    const filePath = path.isAbsolute(file)
        ? file
        : path.join(process.cwd(), file);

    return new Promise((res, rej) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                return rej(err);
            }
            try {
                return res(parseSource(data));
            } catch (e) {
                return rej(e);
            }
        });
    });
}

/** Parses an SVG source code into an AST. */
async function sourceToAST(source: string): Promise<PartialNode[]> {
    return new Promise((res, rej) => {
        const handler = new DomHandler(
            (err, dom) => {
                if (err) {
                    return rej(err);
                }
                return res(dom);
            },
            {
                withStartIndices: true,
                withEndIndices: true,
            }
        );
        const parser = new Parser(handler, { xmlMode: true });
        parser.write(source);
        parser.end();
    });
}

/**
 * Normalizes a Node to the format we want.
 * Currently translates the startIndex to a line number+index.
 * == MODIFIES THE NODE IN-PLACE! ==
 */
function normalizeNode(node: PartialNode, source: string) {
    // calculate the distance from node start to line start
    const lineStart =
        source.lastIndexOf(
            "\n",
            (node.startIndex || 0) +
                // make sure newline text nodes are set to start on the proper line
                (node.type === "text" && node.data && node.data.startsWith("\n")
                    ? -1
                    : 0)
        ) + 1;
    (node as Node).columnNum = (node.startIndex || 0) - lineStart;

    // calculate the line number
    let numLines = 0;
    let columnNum = lineStart;
    while (
        (columnNum = source.lastIndexOf("\n", columnNum - 1)) !== -1 &&
        columnNum > 0
    ) {
        ++numLines;
    }
    (node as Node).lineNum = numLines;
    return node as Node;
}

/**
 * Normalizes the AST returned by htmlparser2 to the format we want.
 * Currently translates the startIndex to a line number+index.
 * == MODIFIES THE AST IN-PLACE! ==
 */
function normalizeAST(ast: PartialNode[], source: string) {
    const handleNode = (node: PartialNode) => {
        normalizeNode(node, source);
        if (node.children) {
            node.children.forEach(handleNode);
        }
    };
    ast.forEach(handleNode);
    (ast as AST).source = source;
    return ast as AST;
}
