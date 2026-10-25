/**
 * HTML source → the DOM a browser builds from it, by parse5.
 *
 * A page is parsed as a document and a partial as a fragment, so a partial
 * gains no `<html>`/`<head>`/`<body>` and a document keeps what the parser
 * moves into its head. Either way the caller gets the content of the body,
 * which is what becomes JSX, and the rest separately: the head's children,
 * the `<html>` and `<body>` attributes, and the comments outside both.
 *
 * Scripting is off, as it is for a page with JavaScript disabled: a
 * `<noscript>` holds markup rather than text, which is what it means to
 * someone reading the page.
 */

import {
  parse,
  parseFragment,
  type DefaultTreeAdapterMap,
  type ParserError,
  type Token,
} from 'parse5';

export type Node = DefaultTreeAdapterMap['node'];
export type ParentNode = DefaultTreeAdapterMap['parentNode'];
export type ChildNode = DefaultTreeAdapterMap['childNode'];
export type Element = DefaultTreeAdapterMap['element'];
export type Template = DefaultTreeAdapterMap['template'];
export type TextNode = DefaultTreeAdapterMap['textNode'];
export type CommentNode = DefaultTreeAdapterMap['commentNode'];
export type Attribute = Token.Attribute;

export interface HtmlParseError {
  /** parse5's code for it, from the HTML spec (`missing-end-tag-name`). */
  code: string;
  line: number;
  col: number;
  /**
   * For a `duplicate-attribute` on an element's start tag, which attribute
   * it is. Absent where the tag made no element (an end tag, a second
   * `<body>`), or the name can't be read back out of the source.
   */
  attribute?: DuplicateAttribute;
}

/**
 * An attribute a start tag writes twice. A browser keeps the first and drops
 * the rest, so `kept` is what the element has and `dropped` is the copy this
 * error is about, each as the page writes it (`placeholder="Email"`).
 */
export interface DuplicateAttribute {
  /** The name, lowercased as the parser reads it. */
  name: string;
  kept: string;
  dropped: string;
}

export interface ParsedHtml {
  kind: 'document' | 'fragment';
  /**
   * What holds the content: the `<body>` of a document, or the fragment.
   * Its children are the content; its attributes are the body's.
   */
  root: Element | DefaultTreeAdapterMap['documentFragment'];
  head: ChildNode[];
  htmlAttributes: Attribute[];
  bodyAttributes: Attribute[];
  /**
   * Comments a document has outside its head and body, before `<html>` or
   * after `</body>`, where a credit or licence notice often sits.
   */
  outsideComments: CommentNode[];
  errors: HtmlParseError[];
}

/**
 * The tags that make HTML a document rather than a partial, wherever they
 * sit outside a comment. `<head` is not `<header`.
 */
const DOCUMENT_MARKER = /<(?:!doctype|html|head|body)(?=[\s/>])/i;

/** Whether parse5 should read this source as a whole document. */
export function isDocument(source: string): boolean {
  return DOCUMENT_MARKER.test(source.replace(/<!--[\s\S]*?(?:-->|$)/g, ''));
}

export function isElement(node: Node): node is Element {
  return 'tagName' in node;
}

export function isText(node: Node): node is TextNode {
  return node.nodeName === '#text';
}

export function isComment(node: Node): node is CommentNode {
  return node.nodeName === '#comment';
}

/** An element's children, or a `<template>`'s content, which holds them. */
export function childrenOf(node: ParentNode): ChildNode[] {
  return node.nodeName === 'template'
    ? (node as Template).content.childNodes
    : node.childNodes;
}

function find(nodes: ChildNode[], tag: string): Element | undefined {
  return nodes.find(
    (node): node is Element => isElement(node) && node.tagName === tag
  );
}

/** The element whose start tag holds `offset`, anywhere under `node`. */
function elementAt(node: ParentNode, offset: number): Element | undefined {
  for (const child of childrenOf(node)) {
    if (!isElement(child)) continue;
    const tag = child.sourceCodeLocation?.startTag;
    if (tag && tag.startOffset < offset && offset < tag.endOffset) {
      return child;
    }
    const inside = elementAt(child, offset);
    if (inside) return inside;
  }
  return undefined;
}

/** What may sit just before an attribute's name in a start tag. */
const BEFORE_NAME = /[\t\n\f\r /"']/;

/**
 * The value written after an attribute's name, if any: `="a"`, `='a'`, `=a`,
 * with the whitespace the tokenizer allows around the `=`.
 */
const VALUE_AFTER_NAME =
  /[\t\n\f\r ]*=[\t\n\f\r ]*(?:"[^"]*"?|'[^']*'?|[^\t\n\f\r >]*)/y;

const asciiLower = (text: string): string =>
  text.replace(/[A-Z]/g, letter => letter.toLowerCase());

/**
 * An attribute as the page writes it, from where its name starts. Read from
 * the source rather than parse5's end offset, which stops at the name when
 * the next attribute follows a quoted value with no space between them.
 */
function writtenAt(source: string, start: number, name: string): string {
  VALUE_AFTER_NAME.lastIndex = start + name.length;
  const end = VALUE_AFTER_NAME.exec(source)
    ? VALUE_AFTER_NAME.lastIndex
    : start + name.length;
  return source.slice(start, end).trimEnd();
}

/**
 * Which attribute a `duplicate-attribute` error is about. parse5 reports it
 * where the second copy's name ends, and the tag keeps only the first copy,
 * whose name and place it records; so the name is the longest of the
 * element's that the source spells just before the error.
 */
function duplicateAt(
  source: string,
  tree: ParentNode,
  offset: number
): DuplicateAttribute | undefined {
  const attrs = elementAt(tree, offset)?.sourceCodeLocation?.attrs ?? {};
  const name = Object.keys(attrs)
    .filter(
      key =>
        asciiLower(source.slice(offset - key.length, offset)) === key &&
        BEFORE_NAME.test(source.charAt(offset - key.length - 1))
    )
    .sort((a, b) => b.length - a.length)[0];
  if (name === undefined) return undefined;
  return {
    name,
    kept: writtenAt(source, attrs[name].startOffset, name),
    dropped: writtenAt(source, offset - name.length, name),
  };
}

export function parseHtml(source: string): ParsedHtml {
  const errors: HtmlParseError[] = [];
  const offsets: number[] = [];
  const options = {
    sourceCodeLocationInfo: true,
    scriptingEnabled: false,
    onParseError: (error: ParserError) => {
      errors.push({
        code: error.code,
        line: error.startLine,
        col: error.startCol,
      });
      offsets.push(error.startOffset);
    },
  };
  // Each duplicate is named once the tree is built, since its element is.
  const nameDuplicates = (tree: ParentNode) => {
    errors.forEach((error, index) => {
      if (error.code !== 'duplicate-attribute') return;
      const attribute = duplicateAt(source, tree, offsets[index]);
      if (attribute) error.attribute = attribute;
    });
  };
  if (!isDocument(source)) {
    const fragment = parseFragment(source, options);
    nameDuplicates(fragment);
    return {
      kind: 'fragment',
      root: fragment,
      head: [],
      htmlAttributes: [],
      bodyAttributes: [],
      outsideComments: [],
      errors,
    };
  }
  const document = parse(source, options);
  nameDuplicates(document);
  // The parser always builds `<html>`, and inside it `<head>` and `<body>`
  // (a `<frameset>` page has no body, and gets an empty one here).
  const html = find(document.childNodes, 'html')!;
  const head = find(html.childNodes, 'head');
  const body = find(html.childNodes, 'body');
  const outsideComments = [...document.childNodes, ...html.childNodes].filter(
    isComment
  );
  return {
    kind: 'document',
    root: body ?? {
      nodeName: '#document-fragment',
      childNodes: [],
    },
    head: head?.childNodes ?? [],
    htmlAttributes: html.attrs,
    bodyAttributes: body?.attrs ?? [],
    outsideComments,
    errors,
  };
}
