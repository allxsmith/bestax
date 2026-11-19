import {
  childrenOf,
  isComment,
  isElement,
  parseHtml,
  type Element,
  type ParentNode,
} from '../parse.js';
import {
  defaultDisplayOf,
  inlineStyleDisplay,
  layoutWhitespace,
  uaDisplay,
  type DisplayOf,
  type Piece,
} from '../whitespace.js';

/**
 * The tree as the layout leaves it: a kept space is `_`, a dropped one is
 * nothing, preformatted text is quoted, and a comment is `<!>`.
 */
function shape(source: string, displayOf?: DisplayOf): string {
  const parsed = parseHtml(source);
  const layout = layoutWhitespace(parsed.root, displayOf);
  const show = (parent: ParentNode): string =>
    (layout.get(parent) ?? [])
      .map(piece => {
        if (piece.kind === 'word') return piece.text;
        if (piece.kind === 'space') return piece.kept ? '_' : '';
        if (piece.kind === 'exact') return JSON.stringify(piece.text);
        if (isComment(piece.node)) return '<!>';
        const tag = piece.node.tagName;
        return `<${tag}>${show(piece.node)}</${tag}>`;
      })
      .join('');
  return show(parsed.root);
}

function firstElement(source: string): Element {
  return childrenOf(parseHtml(source).root).filter(isElement)[0];
}

describe('layoutWhitespace', () => {
  it('drops whitespace at the start and end of a block, and collapses the rest', () => {
    expect(
      shape('<div>\n  <p>\n    Hello   <b>world</b>!\n  </p>\n</div>')
    ).toBe('<div><p>Hello_<b>world</b>!</p></div>');
  });

  it('keeps a run between inline elements, with or without a line break', () => {
    expect(shape('<p><a>a</a>\n  <a>b</a> <a>c</a></p>')).toBe(
      '<p><a>a</a>_<a>b</a>_<a>c</a></p>'
    );
  });

  it('drops a run beside a block-level sibling', () => {
    expect(shape('<div><span>a</span> <p>b</p> <span>c</span></div>')).toBe(
      '<div><span>a</span><p>b</p><span>c</span></div>'
    );
    expect(shape('<ul>\n  <li>a</li>\n  <li>b</li>\n</ul>')).toBe(
      '<ul><li>a</li><li>b</li></ul>'
    );
  });

  it('drops a run at either side of a line break', () => {
    expect(shape('<p>one <br>\n  two</p>')).toBe('<p>one<br></br>two</p>');
  });

  it('collapses a space into the one before it, across inline edges', () => {
    expect(shape('<p>Hello <b> world</b></p>')).toBe(
      '<p>Hello_<b>world</b></p>'
    );
    expect(shape('<p><b>a </b> b</p>')).toBe('<p><b>a_</b>b</p>');
  });

  it('carries the start and end of a line into an inline element', () => {
    expect(shape('<div>\n  <a>\n    <img>\n  </a>\n</div>')).toBe(
      '<div><a><img></img></a></div>'
    );
    expect(shape('<p>x <a>\n  y\n</a></p>')).toBe('<p>x_<a>y</a></p>');
  });

  it('keeps the space after an empty inline element, which may show a glyph', () => {
    expect(shape('<p><i class="fa"></i> Home</p>')).toBe('<p><i></i>_Home</p>');
    expect(shape('<p>Go <i></i> now</p>')).toBe('<p>Go_<i></i>_now</p>');
  });

  it('keeps the runs beside an inline-block, and trims inside it', () => {
    expect(shape('<p>a <button> Save </button> b</p>')).toBe(
      '<p>a_<button>Save</button>_b</p>'
    );
  });

  it('lays a flex or grid container out as boxes', () => {
    expect(shape('<div style="display: flex"> a <span>b</span> c </div>')).toBe(
      '<div>a<span>b</span>c</div>'
    );
    expect(
      shape(
        '<p>x <span style="display: inline grid"> <i>a</i> <i>b</i> </span> y</p>'
      )
    ).toBe('<p>x_<span><i>a</i><i>b</i></span>_y</p>');
  });

  it("drops a table's whitespace outside its cells", () => {
    expect(
      shape(
        '<table>\n  <tr>\n    <td> 1 </td>\n    <td>2</td>\n  </tr>\n</table>'
      )
    ).toBe('<table><tbody><tr><td>1</td><td>2</td></tr></tbody></table>');
  });

  it('drops a run between the parts of a CSS table, not between its inline content', () => {
    expect(
      shape('<div style="display: table"><span>a</span> <span>b</span></div>')
    ).toBe('<div><span>a</span>_<span>b</span></div>');
    expect(
      shape(
        '<div style="display: table-row">\n  <span style="display: table-cell">a</span>\n  <span style="display: table-cell">b</span>\n</div>'
      )
    ).toBe('<div><span>a</span><span>b</span></div>');
    expect(
      shape(
        '<div style="display: table"> x <i>y</i> <div style="display: table-cell">c</div> z </div>'
      )
    ).toBe('<div>x_<i>y</i><div>c</div>z</div>');
    expect(
      shape('<p>a <span style="display: inline-table"> b </span> c</p>')
    ).toBe('<p>a_<span>b</span>_c</p>');
  });

  it("drops a select's whitespace, and trims its options", () => {
    expect(
      shape(
        '<select>\n  <option> One </option>\n  <optgroup>\n    <option>Two</option>\n  </optgroup>\n</select>'
      )
    ).toBe(
      '<select><option>One</option><optgroup><option>Two</option></optgroup></select>'
    );
  });

  it('keeps preformatted text exactly, inside every element in it', () => {
    expect(shape('<pre>  a\n  <b> b </b>\n</pre>')).toBe(
      '<pre>"  a\\n  "<b>" b "</b>"\\n"</pre>'
    );
    expect(
      shape('<p><span style="white-space: pre-wrap">  x  </span></p>')
    ).toBe('<p><span>"  x  "</span></p>');
    expect(shape('<p><span style="white-space: nowrap">  x  </span></p>')).toBe(
      '<p><span>x</span></p>'
    );
  });

  it("keeps a script's or a stylesheet's text exactly", () => {
    expect(shape('<p>a <script>if (a)  b()</script> b</p>')).toBe(
      '<p>a_<script>"if (a)  b()"</script>b</p>'
    );
    expect(shape('<style>\n  a { color: red }\n</style>')).toBe(
      '<style>"\\n  a { color: red }\\n"</style>'
    );
  });

  it('reads a display past a declaration CSS skips, and by its priority', () => {
    expect(
      shape('<p>a <span style="display: none; *zoom: 1">x</span> b</p>')
    ).toBe('<p>a_<span>x</span>b</p>');
    expect(
      shape(
        '<p>a <span style="display: none !important; display: inline">x</span> b</p>'
      )
    ).toBe('<p>a_<span>x</span>b</p>');
  });

  it('looks past comments and hidden elements, which render nothing', () => {
    expect(shape('<div>\n  <!-- c -->\n  <p>x</p>\n</div>')).toBe(
      '<div><!><p>x</p></div>'
    );
    expect(shape('<p>a <span hidden>x</span> b</p>')).toBe(
      '<p>a_<span>x</span>b</p>'
    );
  });

  it('drops the whitespace between the shapes of a drawing, not in its text', () => {
    expect(
      shape(
        '<svg>\n  <g>\n    <text> Hi  <tspan>there </tspan> </text>\n  </g>\n</svg>'
      )
    ).toBe('<svg><g><text>Hi_<tspan>there</tspan></text></g></svg>');
    expect(
      shape('<svg><foreignObject>\n  <p>x <b>y</b></p>\n</foreignObject></svg>')
    ).toBe('<svg><foreignObject><p>x_<b>y</b></p></foreignObject></svg>');
    expect(shape('<p>a <svg></svg> b</p>')).toBe('<p>a_<svg></svg>_b</p>');
  });

  it("lays out MathML's tokens as text and the rest as boxes", () => {
    expect(shape('<math>\n  <mi> x </mi>\n  <mo>+</mo>\n</math>')).toBe(
      '<math><mi>x</mi><mo>+</mo></math>'
    );
  });

  it('keeps a no-break space, which CSS does not collapse', () => {
    expect(shape('<p>&nbsp; a</p>')).toBe(
      `<p>${String.fromCodePoint(0xa0)}_a</p>`
    );
  });

  it('lays the root out as a block', () => {
    expect(shape('  Hello  <b>x</b>  ')).toBe('Hello_<b>x</b>');
  });

  it('takes displays from the hook it is given', () => {
    const navbarItem: DisplayOf = element =>
      element.attrs.some(attr => attr.name === 'class')
        ? 'flex'
        : defaultDisplayOf(element);
    const source =
      '<div><a class="navbar-item">\n  <span>x</span>\n</a> <a class="navbar-item">y</a></div>';
    expect(shape(source)).toBe('<div><a><span>x</span>_</a><a>y</a></div>');
    expect(shape(source, navbarItem)).toBe(
      '<div><a><span>x</span></a><a>y</a></div>'
    );
  });

  it('records the line each run starts on', () => {
    const parsed = parseHtml('<p>one\n  two <b>three</b></p>');
    const p = childrenOf(parsed.root).filter(isElement)[0];
    const pieces = layoutWhitespace(parsed.root).get(p) as Piece[];
    expect(
      pieces.map(piece => (piece.kind === 'node' ? 'node' : piece.line))
    ).toEqual([1, 1, 2, 2, 'node']);
  });
});

describe('uaDisplay', () => {
  it.each([
    ['<div></div>', 'block'],
    ['<span></span>', 'inline'],
    ['<li></li>', 'list-item'],
    ['<table></table>', 'table'],
    ['<button></button>', 'inline-block'],
    ['<my-element></my-element>', 'inline'],
    ['<script></script>', 'none'],
    ['<div hidden></div>', 'none'],
    ['<div hidden="until-found"></div>', 'block'],
    ['<input type="HIDDEN">', 'none'],
    ['<input type="text">', 'inline-block'],
    ['<dialog></dialog>', 'none'],
    ['<dialog open></dialog>', 'block'],
  ])('%s is %s', (source, display) => {
    expect(uaDisplay(firstElement(source))).toBe(display);
  });

  it('has nothing to say about an SVG element', () => {
    expect(uaDisplay(firstElement('<svg></svg>'))).toBeUndefined();
  });
});

describe('inlineStyleDisplay and defaultDisplayOf', () => {
  it('reads the last display a style attribute gives', () => {
    const element = firstElement(
      '<span style="display: block; color: red; DISPLAY: Inline-Flex"></span>'
    );
    expect(inlineStyleDisplay(element)).toBe('inline-flex');
    expect(defaultDisplayOf(element)).toBe('inline-flex');
  });

  it('falls back to the UA stylesheet when the style has no display CSS reads', () => {
    expect(
      defaultDisplayOf(firstElement('<div style="display: -webkit-box"></div>'))
    ).toBe('block');
    expect(
      defaultDisplayOf(firstElement('<div style="color: red"></div>'))
    ).toBe('block');
    expect(defaultDisplayOf(firstElement('<div style="display"></div>'))).toBe(
      'block'
    );
  });
});
