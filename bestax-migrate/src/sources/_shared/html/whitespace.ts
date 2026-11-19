/**
 * Which whitespace in an HTML tree renders, decided the way CSS lays it out.
 *
 * JSX has whitespace rules of its own, and they are not CSS's: it keeps a
 * space between two tags on one line and drops every run with a line break
 * in it. So the emitter needs to know, for each run of whitespace in the
 * HTML, whether it renders at all. Inside `<pre>`, `<textarea>` and
 * `<listing>`, under an inline `white-space` that preserves it, and in a
 * script or a stylesheet, every character is kept exactly. Elsewhere a run
 * is one space, and it renders nothing:
 *
 *   - at the start or end of a line: the start or end of a block container,
 *     or beside a block-level box or a `<br>`, seen through inline elements;
 *   - right after another space, which it collapses into;
 *   - inside a flex or grid container, a `<select>`, `<head>` or `<html>`,
 *     where every child is a box of its own, so a text's edges are line
 *     edges too;
 *   - between the shapes of an SVG or MathML drawing, outside its text.
 *
 * A table, its rows, groups, cells and captions are block-level boxes and
 * block containers, so a run between two of them renders nothing (the first
 * rule). Inline content in a table, which only CSS can put there, sits in an
 * anonymous cell, and a run inside it renders as it does in any block.
 *
 * Comments and `display: none` boxes render nothing, so a run is judged by
 * what is beside them. An element's display comes from `displayOf`; the
 * default reads an inline `style` and then the HTML UA stylesheet, which is
 * where it stops: a page's own CSS can change any display, and the honest
 * limit is that this reads no CSS file.
 */

import {
  childrenOf,
  isComment,
  isElement,
  isText,
  type CommentNode,
  type Element,
  type ParentNode,
  type TextNode,
} from './parse.js';
import { applied, readStyle } from './style.js';

/** An element's CSS `display`, or undefined when the hook can't tell. */
export type DisplayOf = (element: Element) => string | undefined;

export type Piece =
  /** An element or a comment, in its place. */
  | { kind: 'node'; node: Element | CommentNode }
  /** A run of text with no whitespace in it. */
  | { kind: 'word'; text: string; line: number | null }
  /**
   * A run of whitespace: one space when `kept`, nothing otherwise.
   * `newlines` counts the line breaks it had, for the emitter's layout.
   */
  | { kind: 'space'; kept: boolean; newlines: number; line: number | null }
  /** Preformatted text, every character of which renders. */
  | { kind: 'exact'; text: string; line: number | null };

const HTML = 'http://www.w3.org/1999/xhtml';

/** ASCII whitespace, the only kind CSS collapses (not `&nbsp;`). */
const RUNS = /[ \t\n\f\r]+|[^ \t\n\f\r]+/g;
const BLANK = /^[ \t\n\f\r]/;

/**
 * Elements whose text is kept exactly: preformatted by the UA stylesheet, or
 * raw text (a script, a stylesheet), which isn't text to lay out at all.
 */
const PREFORMATTED = new Set([
  'pre',
  'textarea',
  'listing',
  'xmp',
  'plaintext',
  'script',
  'style',
  'iframe',
  'noembed',
  'noframes',
]);

/** Elements whose children are each a box, whatever their display. */
const BOXES_ONLY = new Set(['select', 'datalist', 'optgroup', 'head', 'html']);

/** Foreign elements that hold text, which flows as it does in HTML. */
const FOREIGN_TEXT = new Set([
  'text',
  'tspan',
  'textPath',
  'title',
  'desc',
  'mi',
  'mn',
  'mo',
  'ms',
  'mtext',
]);
const FOREIGN_INLINE_TEXT = new Set(['tspan', 'textPath']);

/** Tags the UA stylesheet hides. */
const UA_NONE = new Set([
  'area',
  'base',
  'basefont',
  'datalist',
  'head',
  'link',
  'meta',
  'noembed',
  'noframes',
  'noscript',
  'param',
  'rp',
  'script',
  'style',
  'template',
  'title',
]);

/** Tags the UA stylesheet gives a display other than `inline`. */
const UA_DISPLAY: Readonly<Record<string, string>> = {
  html: 'block',
  body: 'block',
  ...Object.fromEntries(
    [
      'address',
      'blockquote',
      'center',
      'dialog',
      'div',
      'figure',
      'figcaption',
      'footer',
      'form',
      'header',
      'hr',
      'legend',
      'listing',
      'main',
      'p',
      'plaintext',
      'pre',
      'search',
      'xmp',
      'article',
      'aside',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hgroup',
      'nav',
      'section',
      'dir',
      'dd',
      'dl',
      'dt',
      'menu',
      'ol',
      'ul',
      'fieldset',
      'details',
      'optgroup',
      'option',
      'frameset',
      'frame',
    ].map(tag => [tag, 'block'])
  ),
  li: 'list-item',
  summary: 'list-item',
  table: 'table',
  caption: 'table-caption',
  colgroup: 'table-column-group',
  col: 'table-column',
  thead: 'table-header-group',
  tbody: 'table-row-group',
  tfoot: 'table-footer-group',
  tr: 'table-row',
  td: 'table-cell',
  th: 'table-cell',
  input: 'inline-block',
  button: 'inline-block',
  select: 'inline-block',
  textarea: 'inline-block',
  meter: 'inline-block',
  progress: 'inline-block',
  marquee: 'inline-block',
  ruby: 'ruby',
  rt: 'ruby-text',
};

function attribute(element: Element, name: string): string | undefined {
  return element.attrs.find(attr => attr.name === name && !attr.prefix)?.value;
}

/**
 * The value an element's inline `style` gives a property, picked as the
 * written style object picks it (`style.ts`), so the two never disagree.
 */
function inlineStyle(element: Element, property: string): string | undefined {
  const style = attribute(element, 'style');
  if (style === undefined) return undefined;
  return applied(readStyle(style).declarations)
    .get(property)
    ?.value.toLowerCase();
}

/** The display an element's own `style` attribute gives it. */
export function inlineStyleDisplay(element: Element): string | undefined {
  return inlineStyle(element, 'display');
}

/**
 * The display the HTML spec's UA stylesheet gives an element: by its tag,
 * and `none` for what it hides by attribute (`[hidden]`, a hidden input, a
 * closed dialog). Undefined for an element in another namespace.
 */
export function uaDisplay(element: Element): string | undefined {
  if (element.namespaceURI !== HTML) return undefined;
  const tag = element.tagName;
  const hidden = attribute(element, 'hidden');
  if (hidden !== undefined && hidden.toLowerCase() !== 'until-found') {
    return 'none';
  }
  if (
    tag === 'input' &&
    attribute(element, 'type')?.toLowerCase() === 'hidden'
  ) {
    return 'none';
  }
  if (tag === 'dialog' && attribute(element, 'open') === undefined) {
    return 'none';
  }
  if (UA_NONE.has(tag)) return 'none';
  return UA_DISPLAY[tag] ?? 'inline';
}

/** The keywords a `display` value is made of. */
const DISPLAY_KEYWORDS =
  /^(?:none|contents|block|inline|run-in|flow|flow-root|table|flex|grid|ruby|list-item|inline-(?:block|table|flex|grid|list-item)|table-(?:row-group|header-group|footer-group|row|cell|column-group|column|caption)|ruby-(?:base|text|base-container|text-container))$/;

/**
 * An element's inline `display`, when it is one CSS reads; undefined when it
 * sets none, or one CSS ignores.
 */
export function validInlineDisplay(element: Element): string | undefined {
  const inline = inlineStyleDisplay(element);
  const valid =
    inline !== undefined &&
    inline.split(/\s+/).every(word => DISPLAY_KEYWORDS.test(word));
  return valid ? inline : undefined;
}

/**
 * An inline `display`, when it is one CSS reads (otherwise the declaration
 * is ignored), else the UA stylesheet's.
 */
export const defaultDisplayOf: DisplayOf = element =>
  validInlineDisplay(element) ?? uaDisplay(element);

/** How a box sits among its siblings. */
export type Outer = 'none' | 'block' | 'inline';

/**
 * How a box's content flows: on in its parent's lines (`inline`), in lines
 * of its own (`block`), or as boxes of its own, each child its own block
 * (`boxes`).
 */
export type Inner = 'inline' | 'block' | 'boxes';

interface Box {
  outer: Outer;
  inner: Inner;
  exact: boolean;
}

/** What a `display` value means for whitespace: how it sits, how it flows. */
export function boxOfDisplay(display: string | undefined): Omit<Box, 'exact'> {
  const words = (display ?? 'inline').trim().split(/\s+/);
  const has = (...names: string[]) => names.some(name => words.includes(name));
  if (has('none')) return { outer: 'none', inner: 'block' };
  const inline =
    has('inline') || words.some(word => word.startsWith('inline-'));
  const boxes = words.some(word => /(?:^|-)(?:flex|grid)$/.test(word));
  // A table and every part of one is a block among its siblings, and holds
  // its content in lines of its own.
  const table = words.some(word => /^(?:inline-)?table(?:-|$)/.test(word));
  const block =
    boxes ||
    table ||
    has('block', 'flow-root', 'list-item') ||
    words.some(word => word.startsWith('inline-'));
  return {
    outer: inline ? 'inline' : block ? 'block' : 'inline',
    inner: boxes ? 'boxes' : block ? 'block' : 'inline',
  };
}

function boxOf(element: Element, displayOf: DisplayOf): Box {
  const tag = element.tagName;
  if (element.namespaceURI !== HTML) {
    // An SVG or MathML root sits in HTML as an inline box; inside one, only
    // text elements hold text.
    const root = tag === 'svg' || tag === 'math';
    const display = root ? (displayOf(element) ?? 'inline') : undefined;
    const outer: Outer =
      display !== undefined
        ? boxOfDisplay(display).outer
        : FOREIGN_INLINE_TEXT.has(tag)
          ? 'inline'
          : 'block';
    const inner: Inner =
      tag === 'foreignObject'
        ? 'block'
        : FOREIGN_TEXT.has(tag)
          ? FOREIGN_INLINE_TEXT.has(tag)
            ? 'inline'
            : 'block'
          : 'boxes';
    return { outer, inner, exact: tag === 'style' || tag === 'script' };
  }
  const { outer, inner } = boxOfDisplay(displayOf(element));
  const space = inlineStyle(element, 'white-space');
  return {
    outer,
    inner: BOXES_ONLY.has(tag) ? 'boxes' : inner,
    exact:
      PREFORMATTED.has(tag) ||
      (space !== undefined && !/^(?:normal|nowrap)$/.test(space)),
  };
}

/**
 * What comes before a point on its line: its start, a space (which a space
 * after it collapses into), or something else.
 */
type Before = 'line' | 'space' | 'content';

interface Flow {
  before: Before;
  /** Whether the line ends where the content does. */
  endsLine: boolean;
}

const BLOCK_FLOW: Flow = { before: 'line', endsLine: true };

/** The line a text node's run starts on, `offset` characters in. */
function lineAt(node: TextNode, offset: number): number | null {
  const start = node.sourceCodeLocation?.startLine;
  if (start === undefined) return null;
  return start + (node.value.slice(0, offset).match(/\n/g)?.length ?? 0);
}

type Token =
  | { kind: 'node'; node: Element; box: Box }
  | { kind: 'comment'; node: CommentNode }
  | { kind: 'word'; text: string; line: number | null }
  | { kind: 'space'; text: string; line: number | null; dropped?: boolean };

function tokensOf(
  parent: ParentNode,
  inner: Inner,
  displayOf: DisplayOf
): Token[] {
  const tokens: Token[] = [];
  for (const child of childrenOf(parent)) {
    if (isText(child)) {
      for (const match of child.value.matchAll(RUNS)) {
        const line = lineAt(child, match.index);
        tokens.push(
          BLANK.test(match[0])
            ? { kind: 'space', text: match[0], line }
            : { kind: 'word', text: match[0], line }
        );
      }
    } else if (isElement(child)) {
      const box = boxOf(child, displayOf);
      // Among boxes every child is one, and a `<br>` ends a line as a block
      // does, whatever its display says.
      if (
        box.outer === 'inline' &&
        (inner === 'boxes' || child.tagName === 'br')
      ) {
        box.outer = 'block';
      }
      tokens.push({ kind: 'node', node: child, box });
    } else if (isComment(child)) {
      tokens.push({ kind: 'comment', node: child });
    }
  }
  return tokens;
}

/**
 * Every element's and fragment's children as pieces, from `root` down.
 * `root` is laid out as a block container, as a page's body is.
 */
export function layoutWhitespace(
  root: ParentNode,
  displayOf: DisplayOf = defaultDisplayOf
): Map<ParentNode, Piece[]> {
  const out = new Map<ParentNode, Piece[]>();

  const exactly = (parent: ParentNode): void => {
    const pieces: Piece[] = [];
    for (const child of childrenOf(parent)) {
      if (isText(child)) {
        pieces.push({
          kind: 'exact',
          text: child.value,
          line: lineAt(child, 0),
        });
      } else if (isElement(child) || isComment(child)) {
        pieces.push({ kind: 'node', node: child });
        if (isElement(child)) exactly(child);
      }
    }
    out.set(parent, pieces);
  };

  /**
   * Lay out a parent's children. Returns what ends its content's line, or
   * null when nothing in it moved the line along.
   */
  const layout = (
    parent: ParentNode,
    inner: Inner,
    flow: Flow
  ): Before | null => {
    if (inner !== 'inline') flow = BLOCK_FLOW;
    const tokens = tokensOf(parent, inner, displayOf);

    // Right to left: a run is dropped when its line ends after it.
    const endsLine = new Map<Element, boolean>();
    let ending = flow.endsLine;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i];
      if (token.kind === 'word') {
        ending = false;
      } else if (token.kind === 'space') {
        token.dropped = ending;
      } else if (token.kind === 'node' && token.box.outer === 'block') {
        ending = true;
      } else if (token.kind === 'node' && token.box.outer === 'inline') {
        endsLine.set(token.node, ending);
        ending = false;
      }
    }

    // Left to right: and when its line starts before it, or a space does.
    const pieces: Piece[] = [];
    let before = flow.before;
    let moved = false;
    for (const token of tokens) {
      if (token.kind === 'word') {
        pieces.push(token);
        before = 'content';
        moved = true;
        continue;
      }
      if (token.kind === 'space') {
        const kept = !token.dropped && before === 'content';
        pieces.push({
          kind: 'space',
          kept,
          newlines: token.text.match(/\n/g)?.length ?? 0,
          line: token.line,
        });
        if (kept) {
          before = 'space';
          moved = true;
        }
        continue;
      }
      pieces.push({ kind: 'node', node: token.node });
      if (token.kind === 'comment') continue;
      const { node, box } = token;
      if (box.exact) {
        exactly(node);
      } else if (box.outer === 'inline' && box.inner === 'inline') {
        const after = layout(node, 'inline', {
          before,
          endsLine: endsLine.get(node)!,
        });
        // An inline element with nothing in it can still show something (an
        // icon font's glyph), so the line moves past it either way.
        before = after ?? 'content';
        moved = true;
        continue;
      } else {
        layout(node, box.inner, BLOCK_FLOW);
      }
      if (box.outer === 'block') {
        before = 'line';
        moved = true;
      } else if (box.outer === 'inline') {
        before = 'content';
        moved = true;
      }
    }
    out.set(parent, pieces);
    return moved ? before : null;
  };

  layout(root, 'block', BLOCK_FLOW);
  return out;
}
