import { parseStyle, styleKey, styleValues } from '../style.js';

describe('parseStyle', () => {
  it('reads each declaration, trimmed, with or without a last semicolon', () => {
    expect(parseStyle(' color : red;margin-top: 2px ;').declarations).toEqual([
      { property: 'color', value: 'red', important: false },
      { property: 'margin-top', value: '2px', important: false },
    ]);
    expect(parseStyle('color: red').declarations).toHaveLength(1);
  });

  it('lowercases a property, except a custom one', () => {
    expect(
      parseStyle('COLOR: Red; --Brand-Color: #F00').declarations.map(
        declaration => [declaration.property, declaration.value]
      )
    ).toEqual([
      ['color', 'Red'],
      ['--Brand-Color', '#F00'],
    ]);
  });

  it('keeps a semicolon or colon inside quotes or parentheses', () => {
    expect(
      parseStyle(
        `background: url("data:image/png;base64,AA"); content: 'a;b'; ` +
          `background-image: url(data:x;y); font-family: "a\\"; b"`
      ).declarations.map(declaration => declaration.value)
    ).toEqual([
      'url("data:image/png;base64,AA")',
      "'a;b'",
      'url(data:x;y)',
      '"a\\"; b"',
    ]);
  });

  it('drops comments, and an unclosed one runs to the end', () => {
    expect(
      parseStyle('/* a; b: c */ color: /* x */ red; /* open').declarations
    ).toEqual([{ property: 'color', value: 'red', important: false }]);
  });

  it('marks a declaration `!important`, without it in the value', () => {
    expect(parseStyle('color: red ! IMPORTANT').declarations).toEqual([
      { property: 'color', value: 'red', important: true },
    ]);
  });

  it('returns what is not a declaration, as written', () => {
    expect(
      parseStyle('color; : red; margin:; 2px: x; color: blue; ;  ').invalid
    ).toEqual(['color', ': red', 'margin:', '2px: x']);
  });
});

describe('styleKey', () => {
  it.each([
    ['margin-top', 'marginTop'],
    ['color', 'color'],
    ['border-top-left-radius', 'borderTopLeftRadius'],
    ['-webkit-transition', 'WebkitTransition'],
    ['-moz-appearance', 'MozAppearance'],
    ['-ms-transform', 'msTransform'],
    ['--brand-color', '--brand-color'],
  ])('%s is %s', (property, key) => {
    expect(styleKey(property)).toBe(key);
  });
});

describe('styleValues', () => {
  it('gives every value a style sets for a property, lowercased', () => {
    expect(
      styleValues('display: Block; color: red; display: flex', 'display')
    ).toEqual(['block', 'flex']);
    expect(styleValues('color: red', 'display')).toEqual([]);
    expect(styleValues(undefined, 'display')).toEqual([]);
  });
});
