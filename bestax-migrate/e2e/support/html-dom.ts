/**
 * Compare a page's DOM with what React renders from its JSX.
 *
 * `canonicalDom` serialises a parsed tree the way `normalizeHtml` compares
 * renders (attributes and class tokens in order), plus the two differences
 * that are only spelling: comments are gone, since an HTML comment becomes a
 * JSX one, which renders nothing, and a `style` attribute is its
 * declarations, since React writes `color:red;margin-top:2px` however the
 * page spelled them.
 *
 * `laidOut` is the check on the converter's whitespace. It is a second,
 * independent reading of the same CSS rule: where the converter decides one
 * text node at a time from its siblings, this walks the page's text in
 * order, the way a browser fills lines, and keeps only the spaces that
 * render. A page and its collapsed tree must lay out the same.
 */

import { defaultTreeAdapter, parseFragment, serialize } from 'parse5';
import type { Display } from '../../src/sources/_shared/html/display.js';
import {
  childrenOf,
  isComment,
  isElement,
  isText,
  NS,
  type HtmlElement,
  type HtmlParent,
} from '../../src/sources/_shared/html/parse.js';
import { parseStyle } from '../../src/sources/_shared/html/style.js';
import { preservesWhitespace } from '../../src/sources/_shared/html/whitespace.js';
import { normalizeHtml } from './render-module.js';

/** Parse rendered markup the way a browser reads it into a `<body>`. */
export function parseBody(markup: string): HtmlParent {
  return parseFragment(
    defaultTreeAdapter.createElement('body', NS.HTML, []),
    markup
  );
}

function canonicalize(parent: HtmlParent): void {
  const children = childrenOf(parent);
  const kept = children.filter(child => !isComment(child));
  children.splice(0, children.length, ...kept);
  for (const child of kept) {
    if (!isElement(child)) continue;
    for (const attr of child.attrs) {
      if (attr.name !== 'style' || attr.prefix) continue;
      attr.value = parseStyle(attr.value)
        .declarations.map(
          declaration => `${declaration.property}:${declaration.value}`
        )
        .join(';');
    }
    // A style with nothing in it is no style; React writes none for it.
    child.attrs = child.attrs.filter(
      attr => attr.name !== 'style' || attr.prefix || attr.value !== ''
    );
    canonicalize(child);
  }
}

/** A tree's markup, comparable with another's. Changes the tree. */
export function canonicalDom(parent: HtmlParent): string {
  canonicalize(parent);
  return normalizeHtml(serialize(parent));
}

/** Elements that are content of their own, like a letter is. */
const REPLACED = new Set([
  'audio',
  'canvas',
  'embed',
  'iframe',
  'img',
  'input',
  'meter',
  'object',
  'progress',
  'select',
  'textarea',
  'video',
]);

/**
 * The page's text as a browser lays it out: each run of whitespace one
 * space, none at the start or end of a line, and none after another space
 * on the same line, with the tags around it. `state` picks whether a box
 * that is only sometimes shown is shown or hidden.
 */
export function laidOut(
  root: HtmlParent,
  inside: Display['inside'],
  displayOf: (element: HtmlElement) => Display,
  state: 'shown' | 'hidden'
): string {
  const out: string[] = [];
  let lineStart = true;
  // Where the last space went, while nothing visible has followed it.
  let pending = -1;
  const lineEdge = () => {
    if (pending !== -1) out[pending] = '';
    pending = -1;
    lineStart = true;
  };
  const visible = () => {
    pending = -1;
    lineStart = false;
  };
  const text = (value: string) => {
    for (const char of value.replace(/[ \t\n\r]+/g, ' ')) {
      if (char !== ' ') {
        out.push(char);
        visible();
      } else if (!lineStart && pending === -1) {
        pending = out.length;
        out.push(' ');
      }
    }
  };
  const walk = (parent: HtmlParent, layout: Display['inside']) => {
    if (layout !== 'inline') lineEdge();
    for (const child of childrenOf(parent)) {
      if (isText(child)) {
        text(child.value);
        continue;
      }
      if (!isElement(child)) continue;
      const box = displayOf(child);
      if (box.shown === 'never') continue;
      if (box.shown === 'sometimes' && state === 'hidden') continue;
      const tag = child.tagName;
      const ownLines = box.outside === 'block' || layout === 'items';
      if (ownLines) lineEdge();
      out.push(`<${tag}>`);
      if (preservesWhitespace(child)) {
        out.push(serialize(child));
        visible();
      } else if (tag === 'br') {
        lineEdge();
      } else if (ownLines) {
        walk(child, box.inside);
      } else if (box.inside !== 'inline' || REPLACED.has(tag)) {
        // An inline-block is one piece of the line it sits in, with lines
        // of its own inside.
        visible();
        const outer = { lineStart, pending };
        walk(child, box.inside);
        ({ lineStart, pending } = outer);
      } else {
        walk(child, 'inline');
      }
      out.push(`</${tag}>`);
      if (ownLines) lineEdge();
    }
    if (layout !== 'inline') lineEdge();
  };
  walk(root, inside);
  return out.join('');
}
