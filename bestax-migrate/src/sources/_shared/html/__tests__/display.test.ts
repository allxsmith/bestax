import {
  BLOCK,
  cssDisplay,
  displayOf,
  FLEX,
  INLINE,
  INLINE_BLOCK,
  INLINE_FLEX,
  NONE,
  OUT_OF_FLOW,
  tagDisplay,
  weakest,
  type Display,
} from '../display.js';
import { isElement, parseHtml, type HtmlElement } from '../parse.js';

/** Every element in a partial, in document order. */
function elements(source: string): HtmlElement[] {
  const found: HtmlElement[] = [];
  const walk = (nodes: readonly object[]) => {
    for (const node of nodes as HtmlElement[]) {
      if (!isElement(node)) continue;
      found.push(node);
      walk(node.childNodes);
    }
  };
  walk(parseHtml(source, 'fragment').body.childNodes);
  return found;
}

const first = (source: string) => elements(source)[0];

describe('weakest', () => {
  it('is block only when every display is', () => {
    expect(weakest(BLOCK, FLEX).outside).toBe('block');
    expect(weakest(BLOCK, INLINE_BLOCK).outside).toBe('inline');
  });

  it('takes the weakest inside: inline, then lines, then items', () => {
    expect(weakest(FLEX, BLOCK).inside).toBe('lines');
    expect(weakest(FLEX, INLINE_FLEX).inside).toBe('items');
    expect(weakest(BLOCK, INLINE).inside).toBe('inline');
  });

  it('leaves a display that is never shown out of the layout, and marks the box sometimes shown', () => {
    expect(weakest(FLEX, NONE)).toEqual({ ...FLEX, shown: 'sometimes' });
    expect(weakest(NONE, NONE)).toEqual(NONE);
    expect(weakest(INLINE, { ...BLOCK, shown: 'sometimes' })).toEqual({
      ...INLINE,
      shown: 'sometimes',
    });
  });

  it('says an out-of-flow box starts no line, and nothing else', () => {
    expect(weakest(FLEX, OUT_OF_FLOW)).toEqual(INLINE_FLEX);
  });
});

describe('cssDisplay', () => {
  it.each<[string, Display]>([
    ['block', BLOCK],
    ['flow-root', BLOCK],
    ['list-item', BLOCK],
    ['table-cell', BLOCK],
    ['flex', FLEX],
    ['grid', FLEX],
    ['table', FLEX],
    ['table-row', FLEX],
    ['inline-block', INLINE_BLOCK],
    ['inline-flex', INLINE_FLEX],
    ['inline-grid', INLINE_FLEX],
    ['inline', INLINE],
    ['none', NONE],
    ['Flex !important', FLEX],
    ['contents', INLINE],
    ['block flex', INLINE],
  ])('reads %j', (value, display) => {
    expect(cssDisplay(value)).toEqual(display);
  });
});

describe('tagDisplay', () => {
  it.each<[string, Display]>([
    ['<div></div>', BLOCK],
    ['<p></p>', BLOCK],
    ['<section></section>', BLOCK],
    ['<li></li>', BLOCK],
    ['<span></span>', INLINE],
    ['<a></a>', INLINE],
    ['<img>', INLINE],
    ['<my-element></my-element>', INLINE],
    ['<button></button>', INLINE_BLOCK],
    ['<select></select>', INLINE_FLEX],
    ['<table></table>', FLEX],
    ['<ul></ul>', BLOCK],
    ['<script></script>', NONE],
    ['<template></template>', NONE],
    ['<input type="Hidden">', NONE],
    ['<input type="text">', INLINE],
    ['<summary></summary>', { ...BLOCK, inside: 'inline' }],
    ['<div hidden></div>', { ...BLOCK, shown: 'sometimes' }],
    ['<dialog></dialog>', { ...BLOCK, shown: 'sometimes' }],
    ['<dialog open></dialog>', BLOCK],
  ])('gives %s its default', (source, display) => {
    expect(tagDisplay(first(source))).toEqual(display);
  });

  it("gives a table's parts theirs", () => {
    const [table, tbody, tr, td] = elements(
      '<table><tr><td>x</td></tr></table>'
    );
    expect([table, tbody, tr, td].map(tagDisplay)).toEqual([
      FLEX,
      FLEX,
      FLEX,
      BLOCK,
    ]);
  });

  it('reads SVG as images and text, and MathML as inline', () => {
    const [svg, g, path, text, tspan, title, foreign] = elements(
      '<svg><g><path></path><text>a<tspan>b</tspan></text></g>' +
        '<title>t</title><foreignObject></foreignObject></svg>'
    );
    expect(tagDisplay(svg)).toEqual(INLINE_FLEX);
    expect(tagDisplay(g)).toEqual(FLEX);
    expect(tagDisplay(path)).toEqual(FLEX);
    expect(tagDisplay(text)).toEqual(INLINE);
    expect(tagDisplay(tspan)).toEqual(INLINE);
    expect(tagDisplay(title)).toEqual(NONE);
    expect(tagDisplay(foreign)).toEqual(BLOCK);
    expect(tagDisplay(first('<math><mi>x</mi></math>'))).toEqual(INLINE);
  });
});

describe('displayOf', () => {
  it("asks the caller's library, given the tag's display", () => {
    const seen: Display[] = [];
    const display = displayOf(first('<a class="button"></a>'), (_el, byTag) => {
      seen.push(byTag);
      return INLINE_FLEX;
    });
    expect(seen).toEqual([INLINE]);
    expect(display).toEqual(INLINE_FLEX);
  });

  it('never asks about an element that never renders', () => {
    let asked = 0;
    const library = () => {
      asked += 1;
      return FLEX;
    };
    expect(displayOf(first('<script class="x"></script>'), library)).toEqual(
      NONE
    );
    expect(asked).toBe(0);
  });

  it('weakens it by what the element sets in its own style', () => {
    expect(displayOf(first('<div style="display: inline"></div>'))).toEqual(
      INLINE
    );
    expect(displayOf(first('<span style="display: block"></span>'))).toEqual(
      INLINE
    );
    expect(displayOf(first('<div style="display: none"></div>'))).toEqual({
      ...BLOCK,
      shown: 'sometimes',
    });
    expect(displayOf(first('<div style="float: left"></div>'))).toEqual({
      ...BLOCK,
      outside: 'inline',
    });
    expect(displayOf(first('<div style="float: none"></div>'))).toEqual(BLOCK);
    expect(displayOf(first('<div style="position: absolute"></div>'))).toEqual({
      ...BLOCK,
      outside: 'inline',
    });
    expect(displayOf(first('<div style="position: relative"></div>'))).toEqual(
      BLOCK
    );
  });
});
