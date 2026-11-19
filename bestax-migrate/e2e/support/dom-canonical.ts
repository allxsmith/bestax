/**
 * A parsed DOM as comparable lines, for the suites that hold rendered markup
 * to the HTML it came from.
 *
 * What may differ without changing the page is normalized away: attribute
 * order, a class list's order, how a style is spelled, a boolean attribute's
 * value, comments (a JSX comment renders nothing), and whitespace, which is
 * laid out by the converter's own rule, so a space the emitter lost or
 * invented shows up as a difference. Give both sides the same `displayOf`.
 */

import { find, html, svg } from 'property-information';
import {
  childrenOf,
  isComment,
  isElement,
  isText,
  type Element,
  type ParentNode,
} from '../../src/sources/_shared/html/parse.js';
import { applied, readStyle } from '../../src/sources/_shared/html/style.js';
import {
  layoutWhitespace,
  type DisplayOf,
} from '../../src/sources/_shared/html/whitespace.js';

const SVG = 'http://www.w3.org/2000/svg';

/** Comments out, and the texts they separated joined. */
function stripComments(parent: ParentNode): void {
  const nodes = childrenOf(parent);
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (isComment(node)) nodes.splice(i, 1);
    else if (isElement(node)) stripComments(node);
  }
  for (let i = nodes.length - 1; i > 0; i--) {
    const [before, after] = [nodes[i - 1], nodes[i]];
    if (isText(before) && isText(after)) {
      before.value += after.value;
      nodes.splice(i, 1);
    }
  }
}

function attributes(element: Element): string[] {
  const schema = element.namespaceURI === SVG ? svg : html;
  const out: string[] = [];
  for (const attr of element.attrs) {
    const name = attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name;
    let value = attr.value;
    if (name === 'class') {
      value = [...new Set(value.split(/[ \t\n\f\r]+/).filter(Boolean))]
        .sort()
        .join(' ');
    } else if (name === 'style') {
      // A priority is kept, so a page that has one fails here: the converter
      // hands that back rather than writing it.
      const declarations = [...applied(readStyle(value).declarations).values()];
      if (declarations.length === 0) continue;
      value = declarations
        .map(
          ({ property, value: given, important }) =>
            `${property}: ${given}${important ? ' !important' : ''}`
        )
        .sort()
        .join('; ');
    } else {
      const info = find(schema, name);
      const on =
        info.boolean ||
        (info.overloadedBoolean &&
          (value === '' || value.toLowerCase() === info.attribute));
      if (on) value = '';
    }
    out.push(`${name}=${JSON.stringify(value)}`);
  }
  return out.sort();
}

/** The DOM under `root` as lines, one element or text run to a line. */
export function canonical(root: ParentNode, displayOf?: DisplayOf): string {
  stripComments(root);
  const layout = layoutWhitespace(root, displayOf);
  const lines: string[] = [];
  const visit = (parent: ParentNode, depth: number) => {
    let text = '';
    const flush = () => {
      if (text !== '')
        lines.push(`${'  '.repeat(depth)}${JSON.stringify(text)}`);
      text = '';
    };
    for (const piece of layout.get(parent) ?? []) {
      if (piece.kind === 'word' || piece.kind === 'exact') {
        text += piece.text;
      } else if (piece.kind === 'space') {
        if (piece.kept) text += ' ';
      } else if (isElement(piece.node)) {
        flush();
        const element = piece.node;
        lines.push(
          `${'  '.repeat(depth)}<${[element.tagName, ...attributes(element)].join(' ')}>`
        );
        visit(element, depth + 1);
      }
    }
    flush();
  };
  visit(root, 0);
  return lines.join('\n');
}

/**
 * The image preloads React's server renderer puts before the markup, one per
 * `<img>`: React's own, and no part of the page.
 */
export function dropPreloads(root: ParentNode): void {
  const nodes = childrenOf(root);
  const preload = (node: (typeof nodes)[number]) =>
    isElement(node) &&
    node.tagName === 'link' &&
    node.attrs.some(attr => attr.name === 'rel' && attr.value === 'preload');
  while (nodes.length > 0 && preload(nodes[0])) nodes.shift();
}
