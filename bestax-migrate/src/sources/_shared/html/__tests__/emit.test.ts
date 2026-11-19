import { parse } from '@babel/parser';
import { emitJsx, type EmitOptions } from '../emit.js';
import { parseHtml } from '../parse.js';
import { defaultDisplayOf } from '../whitespace.js';

function emit(source: string, options?: EmitOptions) {
  return emitJsx(parseHtml(source).root, options);
}

function code(source: string, options?: EmitOptions): string {
  return emit(source, options).code;
}

const lines = (...text: string[]) => text.join('\n');

describe('emitJsx', () => {
  it('writes a lone element as it is', () => {
    expect(code('<div class="box">Hi</div>')).toBe(
      '<div className="box">Hi</div>'
    );
  });

  it('wraps several in a fragment, with its tags on lines of their own', () => {
    expect(code('<p>a</p>\n<p>b</p>')).toBe(
      lines('<>', '  <p>a</p>', '  <p>b</p>', '</>')
    );
    expect(code('<p>a</p><p>b</p>')).toBe(
      lines('<>', '  <p>a</p><p>b</p>', '</>')
    );
    expect(code('  Hello  ')).toBe(lines('<>', '  Hello', '</>'));
    expect(code('<!-- only a comment -->')).toBe(
      lines('<>', '  {/* only a comment */}', '</>')
    );
    expect(code('  ')).toBe('<></>');
  });

  it('closes void and empty elements itself', () => {
    expect(
      code(
        '<div><br><img src="a.png"><span></span><i class="fa fa-x"> </i></div>'
      )
    ).toBe(
      '<div><br /><img src="a.png" /><span /><i className="fa fa-x" /></div>'
    );
  });

  it('follows the source onto its lines, a blank line included', () => {
    expect(
      code(
        lines(
          '<section class="section">',
          '  <h1 class="title">A</h1>',
          '',
          '',
          '  <p>B</p>',
          '</section>'
        )
      )
    ).toBe(
      lines(
        '<section className="section">',
        '  <h1 className="title">A</h1>',
        '',
        '  <p>B</p>',
        '</section>'
      )
    );
  });

  it('writes a space that renders at a line break as {" "}', () => {
    expect(code('<p><a>a</a>\n<a>b</a></p>')).toBe(
      lines('<p>', '  <a>a</a>{" "}', '  <a>b</a>', '</p>')
    );
    expect(code('<p><span>a</span><b>\n  y</b></p>')).toBe(
      lines('<p><span>a</span><b>{" "}', '    y', '  </b></p>')
    );
  });

  it('lets JSX join two texts across a line break', () => {
    expect(code('<p>Lorem ipsum\n     dolor sit</p>')).toBe(
      lines('<p>', '  Lorem ipsum', '  dolor sit', '</p>')
    );
  });

  it('keeps a space on the same line where the source had one', () => {
    expect(code('<p><a>a</a> <a>b</a> and <b>c</b>.</p>')).toBe(
      '<p><a>a</a> <a>b</a> and <b>c</b>.</p>'
    );
  });

  it('moves a space at the edge of a text out to its own {" "}', () => {
    expect(code('<p><span>x</span><b> a\n  b </b>c</p>')).toBe(
      lines('<p><span>x</span><b>{" "}', '    a', '    b{" "}', '  </b>c</p>')
    );
  });

  it('drops what renders nothing without changing the lines', () => {
    expect(code(lines('<ul>', '  <li>a</li>', '  <li>b</li>', '</ul>'))).toBe(
      lines('<ul>', '  <li>a</li>', '  <li>b</li>', '</ul>')
    );
  });

  it('puts the attributes on lines of their own when the source did', () => {
    expect(
      code(
        lines(
          '<a role="button" class="navbar-burger"',
          '   data-target="menu">',
          '  <span></span>',
          '</a>'
        )
      )
    ).toBe(
      lines(
        '<a',
        '  role="button"',
        '  className="navbar-burger"',
        '  data-target="menu"',
        '>',
        '  <span />',
        '</a>'
      )
    );
    expect(code('<img\n  src="a.png"\n  alt="A">')).toBe(
      lines('<img', '  src="a.png"', '  alt="A"', '/>')
    );
  });

  it('writes comments as JSX comments', () => {
    expect(
      code(
        lines(
          '<div>',
          '  <!-- one -->',
          '  <p>x<!--inline-->y</p>',
          '  <!--',
          '    two',
          '      lines',
          '  -->',
          '</div>'
        )
      )
    ).toBe(
      lines(
        '<div>',
        '  {/* one */}',
        '  <p>x{/* inline */}y</p>',
        '  {/*',
        '    two',
        '      lines',
        '  */}',
        '</div>'
      )
    );
  });

  it('drops conditional comments and reports them', () => {
    const emitted = emit(
      lines(
        '<div>',
        '  <!--[if lt IE 9]><script src="shiv.js"></script><![endif]-->',
        '  <!--[if !IE]><!--><p>modern</p><!--<![endif]-->',
        '</div>'
      )
    );
    expect(emitted.code).toBe(lines('<div>', '  <p>modern</p>', '</div>'));
    expect(emitted.reported).toEqual([
      { kind: 'conditional-comment', token: 'comment', line: 2 },
      { kind: 'conditional-comment', token: 'comment', line: 3 },
      { kind: 'conditional-comment', token: 'comment', line: 3 },
    ]);
  });

  it('gives a line break the space a dropped comment left beside it', () => {
    expect(code('<p><b>a <!--[if lt IE 9]>x<![endif]-->\n</b>c</p>')).toBe(
      lines('<p><b>', '    a{" "}', '  </b>c</p>')
    );
    expect(code('<p><i>a</i> <!--[if IE]>x<![endif]-->\n<i>b</i></p>')).toBe(
      lines('<p>', '  <i>a</i>{" "}', '  <i>b</i>', '</p>')
    );
  });

  it('escapes text the way JSX reads it', () => {
    expect(code('<p>a &lt; b &amp;&amp; {c} &gt; d&nbsp;&amp;copy;</p>')).toBe(
      '<p>a &lt; b && {"{"}c{"}"} &gt; d&nbsp;&amp;copy;</p>'
    );
  });

  it('writes preformatted text exactly', () => {
    expect(code('<pre>\nline 1\n  line `2`</pre>')).toBe(
      lines('<pre>{`line 1', '  line \\`2\\``}</pre>')
    );
    expect(code('<pre>  x  <b> y </b></pre>')).toBe(
      '<pre>  x  <b> y </b></pre>'
    );
    expect(code('<p><span style="white-space: pre">a   b</span></p>')).toBe(
      '<p><span style={{ whiteSpace: "pre" }}>a   b</span></p>'
    );
  });

  it("writes a script's and a stylesheet's text as a template literal", () => {
    expect(code('<script>if (a < b) { go(`x`); }</script>')).toBe(
      '<script>{`if (a < b) { go(\\`x\\`); }`}</script>'
    );
    expect(code('<style>\n  .a { color: red }\n</style>')).toBe(
      lines('<style>{`', '  .a { color: red }', '`}</style>')
    );
    expect(code('<script src="app.js"></script>')).toBe(
      '<script src="app.js" />'
    );
  });

  it("writes a textarea's text as its default, and closes it", () => {
    expect(code('<textarea class="textarea">Hello\nthere</textarea>')).toBe(
      '<textarea className="textarea" defaultValue={"Hello\\nthere"} />'
    );
  });

  it("keeps SVG's casing", () => {
    expect(
      code(
        '<svg viewbox="0 0 24 24"><defs><lineargradient id="g"></lineargradient><clippath id="c"></clippath></defs><foreignobject><p>x</p></foreignobject></svg>'
      )
    ).toBe(
      '<svg viewBox="0 0 24 24"><defs><linearGradient id="g" /><clipPath id="c" /></defs><foreignObject><p>x</p></foreignObject></svg>'
    );
  });

  it('writes and reports what is not plain HTML', () => {
    const emitted = emit(
      lines(
        '<div>',
        '  <template><li>x</li></template>',
        '  <my-widget size="2"></my-widget>',
        '  <center>old</center>',
        '  <blink>older</blink>',
        '  <foo>unknown</foo>',
        '</div>'
      )
    );
    expect(emitted.code).toBe(
      lines(
        '<div>',
        '  <template><li>x</li></template>',
        '  <my-widget size="2" />',
        '  <center>old</center>',
        '  <blink>older</blink>{" "}',
        '  <foo>unknown</foo>',
        '</div>'
      )
    );
    expect(emitted.reported).toEqual([
      { kind: 'template', token: 'template', line: 2 },
      { kind: 'custom-element', token: 'my-widget', line: 3 },
      { kind: 'obsolete-element', token: 'center', line: 4 },
      { kind: 'obsolete-element', token: 'blink', line: 5 },
      { kind: 'unknown-element', token: 'foo', line: 6 },
    ]);
  });

  it("writes the children of a tag JSX can't name in its place", () => {
    const emitted = emit('<div><foo.bar>x <b>y</b></foo.bar></div>');
    expect(emitted.code).toBe('<div>x <b>y</b></div>');
    expect(emitted.reported).toEqual([
      { kind: 'element-name', token: 'foo.bar', line: 1 },
    ]);
    // Its children join the text around it, a space before them included.
    expect(code('<p>a <foo.bar>\nb</foo.bar></p>')).toBe(
      lines('<p>', '  a', '  b', '</p>')
    );
  });

  it('reports an attribute on the line it is on', () => {
    const emitted = emit(
      lines('<button class="button"', '        onclick="go()">Go</button>')
    );
    expect(emitted.code).toBe('<button className="button">Go</button>');
    expect(emitted.reported).toEqual([
      {
        kind: 'event-handler',
        token: 'onclick',
        attribute: 'onclick',
        detail: 'go()',
        prop: 'onClick',
        line: 2,
      },
    ]);
  });

  it('maps each emitted line back to its HTML line', () => {
    const emitted = emit(
      lines(
        '<section>',
        '  <div class="box">',
        '    <pre>a',
        'b</pre>',
        '  </div>',
        '  <table><tr><td>1</td></tr></table>',
        '</section>',
        '<p>end</p>'
      )
    );
    expect(emitted.code).toBe(
      lines(
        '<>',
        '  <section>',
        '    <div className="box">',
        '      <pre>{`a',
        'b`}</pre>',
        '    </div>',
        '    <table><tbody><tr><td>1</td></tr></tbody></table>',
        '  </section>',
        '  <p>end</p>',
        '</>'
      )
    );
    const map = emitted.code
      .split('\n')
      .map((_line, index) => emitted.htmlLineOf(index + 1));
    expect(map).toEqual([null, 1, 2, 3, 4, 5, 6, 7, 8, null]);
    expect(emitted.htmlLineOf(99)).toBeNull();
  });

  it('takes displays from the hook it is given', () => {
    const source = lines(
      '<div class="navbar-brand">',
      '  <a class="navbar-item">',
      '    <img src="logo.png">',
      '  </a>',
      '  <a class="navbar-item">Home</a>',
      '</div>'
    );
    // Inline by the UA stylesheet, the first link ends in a space that
    // renders, and the run after it collapses into that.
    expect(code(source)).toBe(
      lines(
        '<div className="navbar-brand">',
        '  <a className="navbar-item">',
        '    <img src="logo.png" />{" "}',
        '  </a>',
        '  <a className="navbar-item">Home</a>',
        '</div>'
      )
    );
    expect(
      code(source, {
        displayOf: element =>
          element.tagName === 'a' ? 'flex' : defaultDisplayOf(element),
      })
    ).toBe(
      lines(
        '<div className="navbar-brand">',
        '  <a className="navbar-item">',
        '    <img src="logo.png" />',
        '  </a>',
        '  <a className="navbar-item">Home</a>',
        '</div>'
      )
    );
  });

  it('indents every line it can, and no line of a template literal', () => {
    expect(
      code('<div>\n  <pre>a\n  b</pre>\n\n  <p>c</p>\n</div>', { indent: 2 })
    ).toBe(
      lines(
        '    <div>',
        '      <pre>{`a',
        '  b`}</pre>',
        '',
        '      <p>c</p>',
        '    </div>'
      )
    );
  });

  it('writes code the JSX parser reads', () => {
    const emitted = emit(
      lines(
        '<!DOCTYPE html><html><body>',
        '<nav class="navbar" aria-label="main">',
        '  <a class="navbar-item" href="/?a=1&amp;b=2" title="&quot;quoted&quot;">Home &raquo;</a>',
        '  <!-- a */ comment -->',
        '  <span>{{ template }}</span> <b>a</b>',
        '  <pre>`${x}` \\ </pre>',
        '  <svg><path d="M0 0"/></svg>',
        '  <select multiple><option selected>a</option></select>',
        '</nav>',
        '</body></html>'
      )
    );
    expect(() =>
      parse(emitted.code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      })
    ).not.toThrow();
  });
});
