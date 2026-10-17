/**
 * An HTML page or partial, parsed into the DOM a browser would build from it.
 *
 * parse5 implements the HTML standard's parser, so the tree here is the one
 * the page's own visitors got: `<p>`s closed where a browser closes them, a
 * `<tbody>` inside every table, stray tags dropped. Converting that tree,
 * rather than the text as written, is what lets the JSX render the same DOM.
 *
 * A whole document goes through `parse()`, and its `<body>` is what becomes
 * JSX. A partial (a page part a site generator includes) goes through
 * `parseFragment()` in a `<body>`'s context, the way a browser would read it
 * there, so a leading `<style>` or `<link>` stays where it was written
 * instead of moving into a `<head>` the partial never had.
 */

import {
  defaultTreeAdapter,
  html,
  parse,
  parseFragment,
  type DefaultTreeAdapterTypes,
  type ParserError,
} from 'parse5';

export type HtmlNode = DefaultTreeAdapterTypes.Node;
export type HtmlChild = DefaultTreeAdapterTypes.ChildNode;
export type HtmlParent = DefaultTreeAdapterTypes.ParentNode;
export type HtmlElement = DefaultTreeAdapterTypes.Element;
export type HtmlText = DefaultTreeAdapterTypes.TextNode;
export type HtmlComment = DefaultTreeAdapterTypes.CommentNode;
export type HtmlTemplate = DefaultTreeAdapterTypes.Template;

export const NS = html.NS;

/** A parse error parse5 reported, by its code (`duplicate-attribute`). */
export interface HtmlParseError {
  readonly code: string;
  readonly line: number;
}

export interface ParsedHtml {
  /** A whole document, read by `parse()`, or a partial, by `parseFragment()`. */
  readonly kind: 'document' | 'fragment';
  /** The document's `<html>`, which a partial has none of. */
  readonly html?: HtmlElement;
  /** The document's `<head>`. */
  readonly head?: HtmlElement;
  /** What becomes the JSX: the document's `<body>`, or the partial itself. */
  readonly body: HtmlParent;
  readonly errors: readonly HtmlParseError[];
}

/**
 * Text that starts a document: a doctype, or an `<html>`, `<head>` or
 * `<body>` tag, after any whitespace and comments. `\s` covers a byte
 * order mark too.
 */
const DOCUMENT_START =
  /^(?:\s|<!--[\s\S]*?-->)*<(?:!doctype|html|head|body)[\s/>]/i;

/** Whether the text is a whole document rather than a partial. */
export function looksLikeDocument(source: string): boolean {
  return DOCUMENT_START.test(source);
}

function childElement(
  parent: HtmlParent | undefined,
  tag: string
): HtmlElement | undefined {
  return parent?.childNodes.find(
    (child): child is HtmlElement => isElement(child) && child.tagName === tag
  );
}

export function isElement(node: HtmlNode): node is HtmlElement {
  return 'tagName' in node;
}

export function isText(node: HtmlNode): node is HtmlText {
  return node.nodeName === '#text';
}

export function isComment(node: HtmlNode): node is HtmlComment {
  return node.nodeName === '#comment';
}

/** An element's children; a `<template>`'s are in its content. */
export function childrenOf(parent: HtmlParent): HtmlChild[] {
  return parent.nodeName === 'template' && 'content' in parent
    ? (parent as HtmlTemplate).content.childNodes
    : parent.childNodes;
}

/** An attribute's value by its name as written (`xlink:href`), if it has one. */
export function attributeOf(
  element: HtmlElement,
  name: string
): string | undefined {
  return element.attrs.find(
    attr => (attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name) === name
  )?.value;
}

/**
 * Parse a page or a partial. Which one it is comes from the text unless
 * `kind` says.
 */
export function parseHtml(
  source: string,
  kind: 'document' | 'fragment' = looksLikeDocument(source)
    ? 'document'
    : 'fragment'
): ParsedHtml {
  const errors: HtmlParseError[] = [];
  const options = {
    sourceCodeLocationInfo: true,
    onParseError: (error: ParserError) =>
      errors.push({ code: error.code, line: error.startLine }),
  };
  if (kind === 'fragment') {
    const context = defaultTreeAdapter.createElement('body', NS.HTML, []);
    return {
      kind,
      body: parseFragment(context, source, options),
      errors,
    };
  }
  const document = parse(source, options);
  const root = childElement(document, 'html');
  return {
    kind,
    html: root,
    head: childElement(root, 'head'),
    // A frameset page has no body, and nothing in it becomes JSX.
    body:
      childElement(root, 'body') ?? defaultTreeAdapter.createDocumentFragment(),
    errors,
  };
}
