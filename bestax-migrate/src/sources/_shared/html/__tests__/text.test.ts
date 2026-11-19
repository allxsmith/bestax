import {
  attributeValue,
  isConditionalComment,
  jsString,
  jsxComment,
  jsxText,
  templateLiteral,
} from '../text.js';

const NBSP = String.fromCodePoint(0xa0);
const SHY = String.fromCodePoint(0xad);
const ZWSP = String.fromCodePoint(0x200b);
const LINE_SEPARATOR = String.fromCodePoint(0x2028);

describe('jsxText', () => {
  it('leaves plain text alone', () => {
    expect(jsxText('Hello, world! "quoted" \'single\' a/b')).toBe(
      'Hello, world! "quoted" \'single\' a/b'
    );
  });

  it('writes braces as expressions and angle brackets as entities', () => {
    expect(jsxText('{a} < b > c')).toBe('{"{"}a{"}"} &lt; b &gt; c');
  });

  it('escapes an ampersand only where JSX would read an entity', () => {
    expect(jsxText('Tom & Jerry, AT&T')).toBe('Tom & Jerry, AT&T');
    expect(jsxText('&amp; &copy; &#169; &#xA9; &bogus;')).toBe(
      '&amp;amp; &amp;copy; &amp;#169; &amp;#xA9; &amp;bogus;'
    );
  });

  it('writes invisible characters so the code shows them', () => {
    expect(jsxText(`a${NBSP}b${SHY}c${ZWSP}d`)).toBe('a&nbsp;b&shy;c&#x200B;d');
  });
});

describe('jsString', () => {
  it('is a double-quoted string with invisible characters escaped', () => {
    expect(jsString('say "hi"\n')).toBe('"say \\"hi\\"\\n"');
    expect(jsString(`a${NBSP}b${LINE_SEPARATOR}`)).toBe('"a\\u00A0b\\u2028"');
  });
});

describe('templateLiteral', () => {
  it('holds text exactly, line breaks included', () => {
    expect(templateLiteral('a\n  b')).toBe('`a\n  b`');
  });

  it('escapes what a template literal would read', () => {
    expect(templateLiteral('`${x}` \\n')).toBe('`\\`\\${x}\\` \\\\n`');
    expect(templateLiteral(`a${NBSP}\r`)).toBe('`a\\u00A0\\r`');
  });

  it('evaluates back to the same text', () => {
    const text = 'const s = `${a}\\n`;\n\tif (a < b) { c(); }\n';
    expect(new Function(`return ${templateLiteral(text)}`)()).toBe(text);
  });
});

describe('attributeValue', () => {
  it('quotes a value JSX reads back as written', () => {
    expect(attributeValue('main navigation')).toBe('"main navigation"');
    expect(attributeValue('?a=1&b=2')).toBe('"?a=1&b=2"');
    expect(attributeValue("it's {fine} <here>")).toBe('"it\'s {fine} <here>"');
  });

  it('writes the rest as a string expression', () => {
    expect(attributeValue('say "hi"')).toBe('{"say \\"hi\\""}');
    expect(attributeValue('&copy;')).toBe('{"&copy;"}');
    expect(attributeValue('C:\\path')).toBe('{"C:\\\\path"}');
    expect(attributeValue('two\nlines')).toBe('{"two\\nlines"}');
    expect(attributeValue(`a${NBSP}b`)).toBe('{"a\\u00A0b"}');
  });
});

describe('isConditionalComment', () => {
  it.each([
    '[if lt IE 9]><script src="x.js"></script><![endif]',
    ' [if IE]>x<![endif] ',
    '[if !IE]><!',
    '<![endif]',
  ])('reads %j as a conditional comment', data => {
    expect(isConditionalComment(data)).toBe(true);
  });

  it.each([' Navigation ', 'if this is ever true', '[note] keep this'])(
    'leaves %j alone',
    data => {
      expect(isConditionalComment(data)).toBe(false);
    }
  );
});

describe('jsxComment', () => {
  it('writes a one-line comment on one line', () => {
    expect(jsxComment(' Main navigation ')).toEqual([
      '{/* Main navigation */}',
    ]);
    expect(jsxComment('tight')).toEqual(['{/* tight */}']);
    expect(jsxComment('   ')).toEqual(['{/* */}']);
  });

  it('dedents a longer comment between delimiters of its own', () => {
    expect(
      jsxComment('\n      Credit: someone\n        indented\n\n      MIT\n    ')
    ).toEqual(['{/*', '  Credit: someone', '    indented', '', '  MIT', '*/}']);
  });

  it('escapes a comment end inside', () => {
    expect(jsxComment(' a */ b ')).toEqual(['{/* a *\\/ b */}']);
  });
});
