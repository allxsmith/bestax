/**
 * How a box lays out, as far as the whitespace beside and inside it goes.
 *
 * CSS renders a run of whitespace as nothing at the start or end of a line,
 * and a box that sits on lines of its own starts and ends them. So whether a
 * space in the page renders depends on the display of the boxes around it,
 * and the converter drops one only when every display the box could have
 * says it renders nothing.
 *
 * A box's display comes from its tag's default here, from the HTML
 * standard's rendering section, and from the element's own `style`. A
 * library's classes change it too (Bulma's `.buttons` is a flex box), and a
 * caller passes what it knows of those through `HtmlToJsxOptions.display`.
 * Author CSS the converter cannot see is the honest limit: a stylesheet that
 * makes a `<div>` inline, gives a class `white-space: pre`, or puts generated
 * content where a line starts would make a dropped space visible.
 */

import { attributeOf, NS, type HtmlElement } from './parse.js';
import { styleValues } from './style.js';

export interface Display {
  /**
   * How it sits among its siblings: `block` when it always starts and ends
   * lines of its own, in flow. Anything that might not (an inline box, an
   * inline-block, a float, an absolutely positioned box) is `inline`.
   */
  readonly outside: 'block' | 'inline';
  /**
   * How it lays out what is inside it: `items` when each child is a box of
   * its own and a run of whitespace between them renders nothing (flex,
   * grid, a table's rows), `lines` when its content flows in lines that start
   * and end at its edges (a block container, an inline-block), and `inline`
   * when its content is part of the line around it.
   */
  readonly inside: 'items' | 'lines' | 'inline';
  /**
   * Whether it renders a box: always, in some states only (`hidden`, or a
   * class a script toggles), or never (`<script>`).
   */
  readonly shown: 'always' | 'sometimes' | 'never';
}

/**
 * The display a caller's library gives an element, given the one its tag
 * gives it. The seam for a library's classes.
 */
export type DisplayOf = (element: HtmlElement, byTag: Display) => Display;

export const BLOCK: Display = {
  outside: 'block',
  inside: 'lines',
  shown: 'always',
};
export const INLINE: Display = {
  outside: 'inline',
  inside: 'inline',
  shown: 'always',
};
export const INLINE_BLOCK: Display = {
  outside: 'inline',
  inside: 'lines',
  shown: 'always',
};
export const FLEX: Display = {
  outside: 'block',
  inside: 'items',
  shown: 'always',
};
export const INLINE_FLEX: Display = {
  outside: 'inline',
  inside: 'items',
  shown: 'always',
};
/**
 * No box at all. Its layout is the strongest there is, so `weakest` with it
 * keeps the other display's layout and only marks the box as sometimes shown.
 */
export const NONE: Display = {
  outside: 'block',
  inside: 'items',
  shown: 'never',
};
/**
 * A float or an absolutely positioned box: out of flow, so it starts no line
 * of its own whatever its display, and the line around it runs on past it.
 */
export const OUT_OF_FLOW: Display = {
  outside: 'inline',
  inside: 'items',
  shown: 'always',
};

const INSIDE_ORDER: ReadonlyArray<Display['inside']> = [
  'inline',
  'lines',
  'items',
];

/**
 * What holds for a box whichever of `displays` it has: `block` only if it is
 * block in every one it is shown with, the weakest `inside` of those, and
 * `sometimes` shown unless every one agrees.
 */
export function weakest(...displays: readonly Display[]): Display {
  const shown = displays.filter(display => display.shown !== 'never');
  const visibility = new Set(displays.map(display => display.shown));
  return {
    outside: shown.every(display => display.outside === 'block')
      ? 'block'
      : 'inline',
    inside:
      INSIDE_ORDER[
        Math.min(
          INSIDE_ORDER.length - 1,
          ...shown.map(display => INSIDE_ORDER.indexOf(display.inside))
        )
      ],
    shown: visibility.size === 1 ? displays[0].shown : 'sometimes',
  };
}

/** The display each CSS `display` keyword gives a box. */
const CSS_DISPLAY: Readonly<Record<string, Display>> = {
  block: BLOCK,
  'flow-root': BLOCK,
  'list-item': BLOCK,
  'table-cell': BLOCK,
  'table-caption': BLOCK,
  flex: FLEX,
  grid: FLEX,
  table: FLEX,
  'table-row-group': FLEX,
  'table-header-group': FLEX,
  'table-footer-group': FLEX,
  'table-row': FLEX,
  'table-column-group': FLEX,
  'inline-block': INLINE_BLOCK,
  'inline-flex': INLINE_FLEX,
  'inline-grid': INLINE_FLEX,
  'inline-table': INLINE_FLEX,
  inline: INLINE,
  none: NONE,
};

/**
 * The display a CSS `display` value gives a box. A value the table doesn't
 * know (`contents`, `ruby`, the two-keyword forms) is read as inline, which
 * keeps every space beside and inside the box.
 */
export function cssDisplay(value: string): Display {
  const keyword = value
    .replace(/!\s*important\s*$/i, '')
    .trim()
    .toLowerCase();
  return Object.hasOwn(CSS_DISPLAY, keyword) ? CSS_DISPLAY[keyword] : INLINE;
}

/**
 * The HTML standard's default display for each tag (its rendering section),
 * for the tags whose default is not inline.
 */
const TAG_DISPLAY: Readonly<Record<string, Display>> = {
  ...Object.fromEntries(
    [
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
    ].map(tag => [tag, NONE])
  ),
  ...Object.fromEntries(
    [
      'address',
      'article',
      'aside',
      'blockquote',
      'body',
      'caption',
      'center',
      'dd',
      'details',
      'dialog',
      'dir',
      'div',
      'dl',
      'dt',
      'fieldset',
      'figcaption',
      'figure',
      'footer',
      'form',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'header',
      'hgroup',
      'hr',
      'html',
      'legend',
      'li',
      'listing',
      'main',
      'menu',
      'nav',
      'ol',
      'option',
      'p',
      'plaintext',
      'pre',
      'search',
      'section',
      'td',
      'th',
      'ul',
      'xmp',
    ].map(tag => [tag, BLOCK])
  ),
  ...Object.fromEntries(
    ['colgroup', 'optgroup', 'table', 'tbody', 'tfoot', 'thead', 'tr'].map(
      tag => [tag, FLEX]
    )
  ),
  button: INLINE_BLOCK,
  select: INLINE_FLEX,
  // A list item whose marker sits inside it, so a space after the marker
  // may render: its edges keep their spaces.
  summary: { ...BLOCK, inside: 'inline' },
};

/**
 * SVG elements that render text. Every other one renders none, so the
 * whitespace between them renders nothing either.
 */
const SVG_TEXT = new Set(['a', 'text', 'textPath', 'tspan']);
/** SVG elements that render nothing of their own. */
const SVG_HIDDEN = new Set(['desc', 'metadata', 'script', 'style', 'title']);

function svgDisplay(element: HtmlElement): Display {
  const tag = element.tagName;
  if (SVG_HIDDEN.has(tag)) return NONE;
  if (SVG_TEXT.has(tag)) return INLINE;
  if (tag === 'foreignObject') return BLOCK;
  // The outermost `<svg>` sits in the HTML around it as an inline image does.
  const parent = element.parentNode;
  return parent && 'namespaceURI' in parent && parent.namespaceURI === NS.SVG
    ? FLEX
    : INLINE_FLEX;
}

/** The display an element's tag and attributes give it. */
export function tagDisplay(element: HtmlElement): Display {
  if (element.namespaceURI === NS.SVG) return svgDisplay(element);
  if (element.namespaceURI !== NS.HTML) return INLINE;
  const tag = element.tagName;
  if (
    tag === 'input' &&
    attributeOf(element, 'type')?.toLowerCase() === 'hidden'
  ) {
    return NONE;
  }
  const byTag = Object.hasOwn(TAG_DISPLAY, tag) ? TAG_DISPLAY[tag] : INLINE;
  if (byTag.shown === 'never') return byTag;
  const hidden =
    attributeOf(element, 'hidden') !== undefined ||
    (tag === 'dialog' && attributeOf(element, 'open') === undefined);
  return hidden ? weakest(byTag, NONE) : byTag;
}

/**
 * An element's display: its tag's, then whatever the caller's library says,
 * weakened by anything its own `style` sets (a `display`, a float, an
 * absolute or fixed position). The style beats the tag and most classes,
 * but a class marked `!important` beats the style, so the style can only
 * weaken what the rest says.
 */
export function displayOf(element: HtmlElement, library?: DisplayOf): Display {
  const byTag = tagDisplay(element);
  if (byTag.shown === 'never') return byTag;
  const style = attributeOf(element, 'style');
  return weakest(
    library ? library(element, byTag) : byTag,
    ...styleValues(style, 'display').map(cssDisplay),
    ...styleValues(style, 'float')
      .filter(value => !/^none\b/.test(value))
      .map(() => OUT_OF_FLOW),
    ...styleValues(style, 'position')
      .filter(value => /^(?:absolute|fixed)\b/.test(value))
      .map(() => OUT_OF_FLOW)
  );
}
