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
  html as spec,
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
  /**
   * Whether a browser reads the document in quirks mode (no doctype, or an
   * old one), where class and id selectors ignore ASCII case. A fragment is
   * read as in no-quirks mode.
   */
  quirks: boolean;
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

/** An attribute's value as written, by its unprefixed name. */
export function attributeOf(
  element: Element,
  name: string
): string | undefined {
  return element.attrs.find(attr => attr.name === name && !attr.prefix)?.value;
}

/** An element's classes, split on HTML's whitespace. */
export function classesOf(element: Element): string[] {
  return (attributeOf(element, 'class') ?? '')
    .split(/[ \t\n\f\r]+/)
    .filter(Boolean);
}

function find(nodes: ChildNode[], tag: string): Element | undefined {
  return nodes.find(
    (node): node is Element => isElement(node) && node.tagName === tag
  );
}

export function parseHtml(source: string): ParsedHtml {
  const errors: HtmlParseError[] = [];
  const options = {
    sourceCodeLocationInfo: true,
    scriptingEnabled: false,
    onParseError: (error: ParserError) => {
      errors.push({
        code: error.code,
        line: error.startLine,
        col: error.startCol,
      });
    },
  };
  if (!isDocument(source)) {
    return {
      kind: 'fragment',
      root: parseFragment(source, options),
      head: [],
      htmlAttributes: [],
      bodyAttributes: [],
      outsideComments: [],
      errors,
      quirks: false,
    };
  }
  const document = parse(source, options);
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
    quirks: document.mode === spec.DOCUMENT_MODE.QUIRKS,
  };
}
