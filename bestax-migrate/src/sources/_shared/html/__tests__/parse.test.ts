import {
  attributeOf,
  childrenOf,
  looksLikeDocument,
  parseHtml,
  type HtmlElement,
} from '../parse.js';

const names = (nodes: readonly { nodeName: string }[]) =>
  nodes.map(node => node.nodeName);

describe('looksLikeDocument', () => {
  it.each([
    ['<!DOCTYPE html><p>x</p>', true],
    ['<!doctype html>', true],
    ['  \n<html lang="en">', true],
    ['<!-- a comment -->\n<head><title>x</title></head>', true],
    [`${String.fromCharCode(0xfeff)}<body>`, true],
    ['<BODY class="x">', true],
    ['<header>x</header>', false],
    ['<htmlish>', false],
    ['<p>x</p>', false],
    ['text <b>x</b>', false],
  ])('reads %j as a document: %s', (source, expected) => {
    expect(looksLikeDocument(source)).toBe(expected);
  });
});

describe('parseHtml', () => {
  it('reads a document into its html, head and body', () => {
    const parsed = parseHtml(
      '<!DOCTYPE html><html lang="en"><head><title>T</title></head>' +
        '<body class="x"><p>Hi</p></body></html>'
    );
    expect(parsed.kind).toBe('document');
    expect(attributeOf(parsed.html!, 'lang')).toBe('en');
    expect(names(parsed.head!.childNodes)).toEqual(['title']);
    expect(attributeOf(parsed.body as HtmlElement, 'class')).toBe('x');
    expect(names(parsed.body.childNodes)).toEqual(['p']);
  });

  it('builds the DOM a browser would', () => {
    const parsed = parseHtml(
      '<!DOCTYPE html><p>One<p>Two<table><tr><td>x</td></tr></table>'
    );
    expect(names(parsed.body.childNodes)).toEqual(['p', 'p', 'table']);
    const table = parsed.body.childNodes[2] as HtmlElement;
    expect(names(table.childNodes)).toEqual(['tbody']);
  });

  it("reads a partial in a body's context, so a leading style stays put", () => {
    const parsed = parseHtml('<style>p {}</style><p>x</p>');
    expect(parsed.kind).toBe('fragment');
    expect(parsed.html).toBeUndefined();
    expect(parsed.head).toBeUndefined();
    expect(names(parsed.body.childNodes)).toEqual(['style', 'p']);
  });

  it('drops from a partial what a body would, such as a stray table row', () => {
    expect(names(parseHtml('<tr><td>x</td></tr>').body.childNodes)).toEqual([
      '#text',
    ]);
  });

  it('reads the text as the caller says', () => {
    expect(parseHtml('<p>x</p>', 'document').kind).toBe('document');
    expect(parseHtml('<!DOCTYPE html><p>x</p>', 'fragment').kind).toBe(
      'fragment'
    );
  });

  it('reports each parse error with its code and line', () => {
    const parsed = parseHtml('<!DOCTYPE html>\n<p>\n<div id="a" id="b"></div>');
    expect(parsed.errors).toContainEqual({
      code: 'duplicate-attribute',
      line: 3,
    });
  });

  it('gives a frameset page a body with nothing in it', () => {
    const parsed = parseHtml(
      '<!DOCTYPE html><frameset><frame src="a.html"></frameset>'
    );
    expect(parsed.body.childNodes).toEqual([]);
  });
});

describe('the tree helpers', () => {
  it("read a template's children from its content", () => {
    const template = parseHtml('<template><p>x</p></template>').body
      .childNodes[0] as HtmlElement;
    expect(template.childNodes).toEqual([]);
    expect(names(childrenOf(template))).toEqual(['p']);
  });

  it('read an attribute by the name it was written with', () => {
    const svg = parseHtml('<svg><use xlink:href="#a" href="#b"></use></svg>')
      .body.childNodes[0] as HtmlElement;
    const use = svg.childNodes[0] as HtmlElement;
    expect(attributeOf(use, 'xlink:href')).toBe('#a');
    expect(attributeOf(use, 'href')).toBe('#b');
    expect(attributeOf(use, 'title')).toBeUndefined();
  });
});
