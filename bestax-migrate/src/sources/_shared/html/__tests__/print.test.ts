import { htmlToJsx, rootInside, type HtmlToJsxOptions } from '../convert.js';

/** The JSX for a body holding `body`. */
function jsx(body: string, options: HtmlToJsxOptions = {}): string | null {
  return htmlToJsx(`<!DOCTYPE html><body>${body}</body>`, options).jsx;
}

const lines = (...all: string[]) => all.join('\n');

describe('the JSX root', () => {
  it('is null for a body with nothing in it', () => {
    expect(jsx('')).toBeNull();
    expect(jsx('\n  \n')).toBeNull();
  });

  it('is one element alone, and a fragment around anything else', () => {
    expect(jsx('<p>a</p>')).toBe('<p>a</p>');
    expect(jsx('<p>a</p><p>b</p>')).toBe(
      lines('<>', '  <p>a</p>', '  <p>b</p>', '</>')
    );
    expect(jsx('text')).toBe(lines('<>', '  text', '</>'));
    expect(jsx('<!-- c --><p>a</p>')).toBe(
      lines('<>', '  {/* c */}', '  <p>a</p>', '</>')
    );
  });

  it('starts every line with the indent asked for', () => {
    expect(jsx('<p>a</p><p>b</p>', { indent: '    ' })).toBe(
      lines('    <>', '      <p>a</p>', '      <p>b</p>', '    </>')
    );
  });

  it('reads the text as the caller says, a partial keeping its edge spaces', () => {
    expect(htmlToJsx(' <b>x</b> ', { kind: 'fragment' }).jsx).toBe(
      lines('<>', '  {" "}', '  <b>x</b>', '  {" "}', '</>')
    );
    expect(
      htmlToJsx('<!DOCTYPE html> <b>x</b> ', { kind: 'fragment' }).jsx
    ).toBe(lines('<>', '  {" "}', '  <b>x</b>', '  {" "}', '</>'));
    expect(rootInside('document')).toBe('lines');
    expect(rootInside('fragment')).toBe('inline');
  });
});

describe('elements', () => {
  it('self-closes a void element and an empty one', () => {
    expect(jsx('<p><br><img src="a.png"><span></span></p>')).toBe(
      '<p><br /><img src="a.png" /><span /></p>'
    );
  });

  it('prints one that fits on a line on one, with its spaces as written', () => {
    expect(jsx('<p><b>a</b> <i>b</i> c</p>')).toBe(
      '<p><b>a</b> <i>b</i> c</p>'
    );
  });

  it('breaks one that doesn\'t fit, writing an end space as {" "}', () => {
    expect(jsx('<p>Hello <b>world</b> again</p>', { width: 20 })).toBe(
      lines(
        '<p>',
        '  Hello',
        '  {" "}',
        '  <b>world</b>',
        '  {" "}',
        '  again',
        '</p>'
      )
    );
  });

  it('breaks the attributes of a tag too wide for its line', () => {
    expect(jsx('<p class="aaaa" id="bbbb">x</p>', { width: 20 })).toBe(
      lines('<p', '  className="aaaa"', '  id="bbbb"', '>', '  x', '</p>')
    );
    expect(jsx('<input class="aaaa" id="bbbb">', { width: 20 })).toBe(
      lines('<input', '  className="aaaa"', '  id="bbbb"', '/>')
    );
  });

  it('breaks a style object too wide for its line', () => {
    expect(
      jsx('<p style="margin-top: 2px; color: red">x</p>', { width: 30 })
    ).toBe(
      lines(
        '<p',
        '  style={{',
        '    marginTop: "2px",',
        '    color: "red",',
        '  }}',
        '>',
        '  x',
        '</p>'
      )
    );
  });

  it("prints a textarea's text as its defaultValue, with no children", () => {
    expect(jsx('<textarea>x</textarea>')).toBe('<textarea defaultValue="x" />');
  });

  it("prints a template's content as its children", () => {
    expect(jsx('<div><template><p>x</p></template></div>')).toBe(
      '<div><template><p>x</p></template></div>'
    );
  });
});

describe('values', () => {
  it('writes each kind of prop value', () => {
    expect(
      jsx(
        '<select multiple><option selected>a</option><option value="b" selected>B</option></select>'
      )
    ).toBe(
      lines(
        '<select multiple defaultValue={["a", "b"]}>',
        '  <option>a</option>',
        '  <option value="b">B</option>',
        '</select>'
      )
    );
    expect(jsx('<input disabled tabindex="1" style="--brand: red">')).toBe(
      '<input disabled tabIndex={1} style={{ "--brand": "red" }} />'
    );
  });

  it('makes a string an expression when JSX would read it otherwise', () => {
    expect(jsx(`<p title='say "hi"'>x</p>`)).toBe(
      '<p title={"say \\"hi\\""}>x</p>'
    );
    expect(jsx('<p title="a &amp;copy; b">x</p>')).toBe(
      '<p title={"a &copy; b"}>x</p>'
    );
    expect(jsx('<p title="a\nb">x</p>')).toBe('<p title={"a\\nb"}>x</p>');
    expect(jsx('<a href="?a=1&amp;b=2">x</a>')).toBe(
      '<a href="?a=1&b=2">x</a>'
    );
  });
});

describe('text', () => {
  it('escapes what JSX reads as syntax', () => {
    expect(
      jsx('<p>a &lt; b &gt; c {d} &amp;amp; e &amp; f &amp;#38; g</p>')
    ).toBe('<p>a &lt; b &gt; c &#123;d&#125; &amp;amp; e & f &amp;#38; g</p>');
  });

  it('writes as entities the spaces TypeScript would trim', () => {
    expect(jsx('<p>&nbsp;a&#x3000;b&#x2028;c&#xfeff;&#x0c;</p>')).toBe(
      '<p>&nbsp;a&#x3000;b&#x2028;c&#xfeff;&#xc;</p>'
    );
  });

  it('wraps a long text at its spaces', () => {
    expect(jsx('<p>one two three four five</p>', { width: 12 })).toBe(
      lines('<p>', '  one two', '  three four', '  five', '</p>')
    );
  });

  it('writes a text JSX would change as a string', () => {
    expect(jsx('<pre>a\n\tb  c</pre>')).toBe('<pre>{"a\\n\\tb  c"}</pre>');
    expect(jsx('<pre>a b</pre>')).toBe('<pre>a b</pre>');
    expect(jsx('<pre>a  b</pre>', { width: 10 })).toBe(
      lines('<pre>', '  {"a  b"}', '</pre>')
    );
  });
});

describe('comments', () => {
  it('writes a comment as a JSX one, which cannot hold its end', () => {
    expect(jsx('<p>a<!-- note */ here -->b</p>')).toBe(
      '<p>a{/* note *\\/ here */}b</p>'
    );
    expect(jsx('<p>a<!---->b<!--\n\n-->c</p>')).toBe(
      '<p>a{/*  */}b{/*  */}c</p>'
    );
  });

  it('writes a comment of several lines dedented, on lines of its own', () => {
    expect(
      jsx('<div><!-- one\n      <p>two</p>\n\n        three\n    --></div>')
    ).toBe(
      lines(
        '<div>',
        '  {/*',
        '    one',
        '    <p>two</p>',
        '',
        '      three',
        '  */}',
        '</div>'
      )
    );
  });
});

describe('what is left out', () => {
  it('leaves out a script, a noscript and a tag JSX cannot spell', () => {
    const result = htmlToJsx(
      '<!DOCTYPE html><body><p>a</p><script>go()</script>' +
        '<noscript><p>n</p></noscript><x.y>z</x.y>' +
        '<svg><script>go()</script></svg></body>'
    );
    expect(result.jsx).toBe(lines('<>', '  <p>a</p>', '  <svg />', '</>'));
    expect(result.notes.map(note => note.reason)).toEqual([
      'script',
      'noscript',
      'element-name',
      'script',
    ]);
  });

  it("writes the caller's comment for a note, where the thing left out was or above the element", () => {
    const result = htmlToJsx(
      '<!DOCTYPE html><body><a onclick="go()">a</a><script>go()</script></body>',
      { comment: note => `TODO ${note.reason}` }
    );
    expect(result.jsx).toBe(
      lines(
        '<>',
        '  {/* TODO event-handler */}',
        '  <a>a</a>',
        '  {/* TODO script */}',
        '</>'
      )
    );
  });

  it('reports each note once, in reading order', () => {
    const result = htmlToJsx(
      '<!DOCTYPE html><body>\n<script></script>\n<div>\n<p>\n<a onclick="b">y</a>\n</p>\n</div>\n<script></script>\n</body>'
    );
    expect(result.notes.map(note => [note.reason, note.line])).toEqual([
      ['script', 2],
      ['event-handler', 5],
      ['script', 8],
    ]);
  });
});
