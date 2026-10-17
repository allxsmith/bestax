import { serialize } from 'parse5';
import { rootInside } from '../convert.js';
import { displayOf, FLEX, type DisplayOf } from '../display.js';
import { attributeOf, parseHtml } from '../parse.js';
import { collapseWhitespace } from '../whitespace.js';

/** A page's body, collapsed and serialised. */
function collapsed(
  source: string,
  kind: 'document' | 'fragment' = 'document',
  library?: DisplayOf
): string {
  const parsed = parseHtml(source, kind);
  collapseWhitespace(parsed.body, rootInside(parsed.kind), element =>
    displayOf(element, library)
  );
  return serialize(parsed.body);
}

describe('collapseWhitespace', () => {
  it('makes each run of whitespace one space', () => {
    expect(collapsed('<p>a  \n\t b</p>')).toBe('<p>a b</p>');
  });

  it('drops the whitespace beside a block', () => {
    expect(collapsed('<div>\n  <p>a</p>\n  <p>b</p>\n</div>')).toBe(
      '<div><p>a</p><p>b</p></div>'
    );
  });

  it('keeps one space between inline boxes', () => {
    expect(collapsed('<p><b>a</b>  \n <i>b</i></p>')).toBe(
      '<p><b>a</b> <i>b</i></p>'
    );
    expect(collapsed('<p><button>a</button> <img src="x"></p>')).toBe(
      '<p><button>a</button> <img src="x"></p>'
    );
  });

  it('trims a text where a line starts or ends', () => {
    expect(collapsed('<p>\n  Hello <b>you</b> there\n</p>')).toBe(
      '<p>Hello <b>you</b> there</p>'
    );
    expect(collapsed('<div>a <p>b</p> c</div>')).toBe('<div>a<p>b</p>c</div>');
  });

  it('keeps the spaces at the edges of an inline box', () => {
    expect(collapsed('<p>a<span> b </span>c</p>')).toBe(
      '<p>a<span> b </span>c</p>'
    );
  });

  it('treats each child of a table or a flex box as a box of its own', () => {
    expect(collapsed('<table>\n <tr>\n  <td> x </td>\n </tr>\n</table>')).toBe(
      '<table><tbody><tr><td>x</td></tr></tbody></table>'
    );
    const flex: DisplayOf = (element, byTag) =>
      attributeOf(element, 'class') === 'row' ? FLEX : byTag;
    expect(
      collapsed(
        '<span class="row"> <b>a</b> text <b>b</b> </span>',
        'document',
        flex
      )
    ).toBe('<span class="row"><b>a</b>text<b>b</b></span>');
  });

  it("lets an element's own style only weaken its display", () => {
    // A class marked `!important` could still beat the style, so a style
    // that makes a block a flex box keeps it a block for this.
    expect(
      collapsed(
        '<div style="display: flex"> <span>a</span> text <span>b</span> </div>'
      )
    ).toBe(
      '<div style="display: flex"><span>a</span> text <span>b</span></div>'
    );
    expect(collapsed('<div style="display: inline"> a </div> b')).toBe(
      '<div style="display: inline"> a </div> b'
    );
  });

  it('reaches past comments, whitespace and boxes that never render', () => {
    expect(
      collapsed('<div>a <!-- c --> <script></script> <p>b</p></div>')
    ).toBe('<div>a<!-- c --><script></script><p>b</p></div>');
  });

  it('takes no box that is only sometimes shown as the edge of a line', () => {
    expect(collapsed('<div>a <div hidden>b</div> c</div>')).toBe(
      '<div>a <div hidden="">b</div> c</div>'
    );
  });

  it('asks the caller about a library class', () => {
    const library: DisplayOf = (element, byTag) =>
      attributeOf(element, 'class') === 'row' ? FLEX : byTag;
    expect(
      collapsed(
        '<span class="row"> <b>a</b> <b>b</b> </span>',
        'document',
        library
      )
    ).toBe('<span class="row"><b>a</b><b>b</b></span>');
    expect(collapsed('<span class="other"> <b>a</b> <b>b</b> </span>')).toBe(
      '<span class="other"> <b>a</b> <b>b</b> </span>'
    );
  });

  it.each([
    ['<pre>  a\n    b </pre>'],
    ['<textarea>  a  \n</textarea>'],
    ['<p style="white-space: pre-line">  a  </p>'],
    ['<p style="white-space-collapse: preserve"> a  b </p>'],
    ['<svg><text xml:space="preserve">  a  </text></svg>'],
    ['<div><template> <p> a </p> </template></div>'],
  ])('leaves the whitespace in %s as written', source => {
    expect(collapsed(source)).toBe(source);
  });

  it('collapses inside a style that wraps nothing but still collapses', () => {
    expect(collapsed('<p style="white-space: nowrap">  a   b  </p>')).toBe(
      '<p style="white-space: nowrap">a b</p>'
    );
  });

  it('keeps the spaces at the edges of a partial, which may sit mid-line', () => {
    expect(collapsed(' a <b>x</b>\n', 'fragment')).toBe(' a <b>x</b> ');
    expect(collapsed('\n<p>x</p>\n', 'fragment')).toBe('<p>x</p>');
  });

  it("starts and ends a line at a document body's edges", () => {
    expect(collapsed('<!DOCTYPE html><body>\n  text  \n</body>')).toBe('text');
  });
});
