import { readStyle, styleKey, styleObject } from '../style.js';

describe('styleKey', () => {
  it.each([
    ['color', 'color'],
    ['margin-top', 'marginTop'],
    ['BACKGROUND-COLOR', 'backgroundColor'],
    ['-ms-transform', 'msTransform'],
    ['-webkit-transition', 'WebkitTransition'],
    ['-moz-user-select', 'MozUserSelect'],
    ['-o-transition', 'OTransition'],
    ['--main-color', '--main-color'],
    ['--Case-Kept', '--Case-Kept'],
    ['float', 'float'],
    ['grid-column-2', 'gridColumn2'],
  ])('%s is %s', (property, key) => {
    expect(styleKey(property)).toBe(key);
  });
});

describe('styleObject', () => {
  it('writes each declaration as a property, in order', () => {
    expect(styleObject('margin-top: 1rem; color:red;').code).toBe(
      '{ marginTop: "1rem", color: "red" }'
    );
  });

  it('quotes a key that is not an identifier', () => {
    expect(styleObject('--gap: 2px; -webkit-box-shadow: none').code).toBe(
      '{ "--gap": "2px", WebkitBoxShadow: "none" }'
    );
  });

  it('reads past what hides a semicolon or a colon', () => {
    expect(
      styleObject(
        'background: url("a;b.png") no-repeat; content: \'x:y;\'; ' +
          'background-image: url(data:image/png;base64,AAA=)'
      ).code
    ).toBe(
      '{ background: "url(\\"a;b.png\\") no-repeat", content: "\'x:y;\'", ' +
        'backgroundImage: "url(data:image/png;base64,AAA=)" }'
    );
  });

  it('drops comments, which separate tokens', () => {
    expect(styleObject('/* lead */ margin: 1px/**/2px; /* tail */').code).toBe(
      '{ margin: "1px 2px" }'
    );
  });

  it('collapses whitespace outside strings only', () => {
    expect(
      styleObject('font-family:\n    "Fira  Code",\n    monospace').code
    ).toBe('{ fontFamily: "\\"Fira  Code\\", monospace" }');
  });

  it('keeps the last of a repeated property, where it was written', () => {
    expect(
      styleObject('display: -webkit-box; color: red; display: flex').code
    ).toBe('{ color: "red", display: "flex" }');
  });

  it('writes nothing for an empty style', () => {
    expect(styleObject('  ;  ')).toEqual({ code: null, issues: [] });
  });

  it('reports a declaration React would drop its priority from', () => {
    expect(
      styleObject('color: red !important; margin: 0 ! IMPORTANT; top: 0')
    ).toEqual({
      code: '{ top: "0" }',
      issues: [
        {
          kind: 'style-important',
          token: 'color',
          detail: 'color: red !important',
        },
        {
          kind: 'style-important',
          token: 'margin',
          detail: 'margin: 0 ! IMPORTANT',
        },
      ],
    });
    expect(styleObject('color: red !important').code).toBeNull();
  });

  it.each([
    'color: "red',
    'background: url(a.png',
    'color: red)',
    'color: red /* open',
    'color red',
    'color:',
    ': red',
    '1color: red',
    'col or: red',
    'color: !important',
  ])('reports %j as unreadable, and writes none of it', text => {
    expect(styleObject(text)).toEqual({
      code: null,
      issues: [{ kind: 'style', detail: text }],
    });
  });
});

describe('readStyle', () => {
  it('reads declarations with their priority, properties lowercased', () => {
    expect(readStyle('DISPLAY: Flex; --X: 1 !important')).toEqual([
      {
        property: 'display',
        value: 'Flex',
        important: false,
        text: 'DISPLAY: Flex',
      },
      {
        property: '--X',
        value: '1',
        important: true,
        text: '--X: 1 !important',
      },
    ]);
  });

  it('is null for a style it cannot read', () => {
    expect(readStyle('color')).toBeNull();
  });
});
