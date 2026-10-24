import {
  childrenOf,
  isDocument,
  isElement,
  parseHtml,
  type ChildNode,
  type Element,
} from '../parse.js';

function tags(nodes: ChildNode[]): string[] {
  return nodes.filter(isElement).map(node => node.tagName);
}

describe('isDocument', () => {
  it.each([
    '<!DOCTYPE html><p>x</p>',
    '<!doctype html>',
    '<html lang="en">',
    '<HTML>',
    '<head><title>x</title></head>',
    '<body class="x">',
    '<body>',
    '<head/>',
  ])('reads %j as a document', source => {
    expect(isDocument(source)).toBe(true);
  });

  it.each([
    '<div class="box">x</div>',
    '<header class="hero-head"></header>',
    '<html-viewer></html-viewer>',
    '<bodyguard>',
    '<!-- <!DOCTYPE html> a commented-out page --><div></div>',
    '<!-- <body> unclosed',
  ])('reads %j as a partial', source => {
    expect(isDocument(source)).toBe(false);
  });
});

describe('parseHtml', () => {
  it('reads a page as a document, with the body as the root', () => {
    const parsed = parseHtml(
      [
        '<!-- Template by someone, MIT -->',
        '<!DOCTYPE html>',
        '<html lang="en" class="has-navbar-fixed-top">',
        '<head><meta charset="utf-8"><title>Login</title></head>',
        '<body class="has-background-light">',
        '  <section class="section"></section>',
        '</body>',
        '</html>',
        '<!-- after the end -->',
      ].join('\n')
    );
    expect(parsed.kind).toBe('document');
    expect((parsed.root as Element).tagName).toBe('body');
    expect(tags(childrenOf(parsed.root))).toEqual(['section']);
    expect(tags(parsed.head)).toEqual(['meta', 'title']);
    expect(parsed.htmlAttributes).toEqual([
      { name: 'lang', value: 'en' },
      { name: 'class', value: 'has-navbar-fixed-top' },
    ]);
    expect(parsed.bodyAttributes).toEqual([
      { name: 'class', value: 'has-background-light' },
    ]);
    expect(parsed.outsideComments.map(comment => comment.data)).toEqual([
      ' Template by someone, MIT ',
      ' after the end ',
    ]);
    expect(parsed.errors).toEqual([]);
  });

  it('moves what belongs in the head there, as a browser does', () => {
    const parsed = parseHtml(
      '<!DOCTYPE html><title>x</title><link rel="stylesheet" href="a.css"><div>y</div>'
    );
    expect(tags(parsed.head)).toEqual(['title', 'link']);
    expect(tags(childrenOf(parsed.root))).toEqual(['div']);
  });

  it('reads a partial as a fragment, keeping table parts where they are', () => {
    const parsed = parseHtml('<tr><td>1</td></tr>\n<div class="box"></div>');
    expect(parsed.kind).toBe('fragment');
    expect(parsed.root.nodeName).toBe('#document-fragment');
    expect(tags(childrenOf(parsed.root))).toEqual(['tr', 'div']);
    expect(parsed.head).toEqual([]);
    expect(parsed.htmlAttributes).toEqual([]);
    expect(parsed.bodyAttributes).toEqual([]);
  });

  it('builds the DOM a browser would, implied elements included', () => {
    const parsed = parseHtml('<table><tr><td>1</td></tr></table><p>a<p>b');
    const [table, first, second] = childrenOf(parsed.root).filter(isElement);
    expect(tags(table.childNodes)).toEqual(['tbody']);
    expect(first.tagName).toBe('p');
    expect(second.tagName).toBe('p');
  });

  it('records where every node came from', () => {
    const parsed = parseHtml('<div>\n  <span class="x">y</span>\n</div>');
    const div = childrenOf(parsed.root).filter(isElement)[0];
    const span = div.childNodes.filter(isElement)[0];
    expect(div.sourceCodeLocation?.startLine).toBe(1);
    expect(span.sourceCodeLocation?.startLine).toBe(2);
    expect(span.sourceCodeLocation?.attrs?.class.startLine).toBe(2);
    expect(div.sourceCodeLocation?.endTag?.startLine).toBe(3);
  });

  it('reads a noscript as markup, as a page without JavaScript shows it', () => {
    const parsed = parseHtml('<noscript><img src="pixel.gif"></noscript>');
    const noscript = childrenOf(parsed.root).filter(isElement)[0];
    expect(tags(noscript.childNodes)).toEqual(['img']);
  });

  it('reports parse errors with their codes and lines', () => {
    const parsed = parseHtml(
      '<div>\n  a < b\n  <p class="a" class="b">x</p>\n</div>'
    );
    expect(parsed.errors).toEqual([
      { code: 'invalid-first-character-of-tag-name', line: 2, col: 6 },
      {
        code: 'duplicate-attribute',
        line: 3,
        col: 21,
        attribute: { name: 'class', kept: 'class="a"', dropped: 'class="b"' },
      },
    ]);
  });

  it('names a duplicate attribute, as the page writes each copy', () => {
    const duplicates = (source: string) =>
      parseHtml(source)
        .errors.filter(error => error.code === 'duplicate-attribute')
        .map(error => error.attribute);
    // Every way a value is written, and none.
    expect(
      duplicates(
        `<input a="1" a='2' b=3 b c\n  = "4" c = x data-a=5 a=6 data-a>`
      )
    ).toEqual([
      { name: 'a', kept: 'a="1"', dropped: "a='2'" },
      { name: 'b', kept: 'b=3', dropped: 'b' },
      { name: 'c', kept: 'c\n  = "4"', dropped: 'c = x' },
      { name: 'a', kept: 'a="1"', dropped: 'a=6' },
      { name: 'data-a', kept: 'data-a=5', dropped: 'data-a' },
    ]);
    // The name as the parser reads it, each copy as written; parse5's own
    // end for the first copy stops at its name when no space follows it.
    expect(duplicates('<svg viewBox="0 1" VIEWBOX="2"></svg>')).toEqual([
      { name: 'viewbox', kept: 'viewBox="0 1"', dropped: 'VIEWBOX="2"' },
    ]);
    expect(duplicates('<p a="1"a=2>x</p>')).toEqual([
      { name: 'a', kept: 'a="1"', dropped: 'a=2' },
    ]);
    // On a document's own tags, in its head, and in a template.
    expect(
      duplicates(
        '<!DOCTYPE html><html lang=en lang=fr><head><meta name=a name=b></head>' +
          '<body class=a class=b><template><li id=c id=d></li></template></body></html>'
      )
    ).toEqual([
      { name: 'lang', kept: 'lang=en', dropped: 'lang=fr' },
      { name: 'name', kept: 'name=a', dropped: 'name=b' },
      { name: 'class', kept: 'class=a', dropped: 'class=b' },
      { name: 'id', kept: 'id=c', dropped: 'id=d' },
    ]);
  });

  it('leaves a duplicate unnamed where the tag made no element', () => {
    // An end tag, a second `<body>` (whose attributes join the first's), and
    // a tag the file ends inside.
    for (const source of [
      '<p>x</p a a>',
      '<!DOCTYPE html><body><p>x</p><body id=c id=d></body>',
      '<p>x</p><input a=1 a',
    ]) {
      const duplicate = parseHtml(source).errors.find(
        error => error.code === 'duplicate-attribute'
      );
      expect(duplicate).toBeDefined();
      expect(duplicate?.attribute).toBeUndefined();
    }
  });

  it('gives a frameset page an empty body', () => {
    const parsed = parseHtml(
      '<!DOCTYPE html><html><frameset><frame src="a.html"></frameset></html>'
    );
    expect(childrenOf(parsed.root)).toEqual([]);
    expect(parsed.bodyAttributes).toEqual([]);
  });

  it('reads a template through its content', () => {
    const parsed = parseHtml('<template><li>x</li></template>');
    const template = childrenOf(parsed.root).filter(isElement)[0];
    expect(template.childNodes).toEqual([]);
    expect(tags(childrenOf(template))).toEqual(['li']);
  });
});
