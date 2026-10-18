import { applied, readStyle, styleKey, styleObject } from '../style.js';

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

  it('writes a priority it reports as dropped, which still wins its property', () => {
    expect(
      styleObject(
        'color: red !important; margin: 0 ! IMPORTANT; color: blue; top: 0'
      )
    ).toEqual({
      code: '{ color: "red", margin: "0", top: "0" }',
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
  });

  it.each([
    'color: "red',
    'background: url(a.png',
    'color: red)',
    'color red',
    'color:',
    ': red',
    '1color: red',
    'col or: red',
    '*zoom: 1',
    'color: !important',
  ])('skips %j and keeps the declarations beside it', declaration => {
    expect(styleObject(`top: 0; ${declaration}`)).toEqual({
      code: '{ top: "0" }',
      issues: [{ kind: 'style', detail: declaration }],
    });
  });

  it('keeps reading after a skipped declaration, as CSS does', () => {
    expect(styleObject('*zoom: 1; display: none; _height: ; left: 0')).toEqual({
      code: '{ display: "none", left: "0" }',
      issues: [
        { kind: 'style', detail: '*zoom: 1' },
        { kind: 'style', detail: '_height:' },
      ],
    });
  });

  it('lets a string or parenthesis left open take the rest of the style', () => {
    expect(styleObject('top: 0; background: url(a.png; color: red')).toEqual({
      code: '{ top: "0" }',
      issues: [{ kind: 'style', detail: 'background: url(a.png; color: red' }],
    });
  });

  it('reads up to a comment left open, which runs to the end', () => {
    expect(styleObject('color: red /* open; top: 0')).toEqual({
      code: '{ color: "red" }',
      issues: [],
    });
  });

  it('writes nothing when nothing could be read', () => {
    expect(styleObject('*zoom: 1').code).toBeNull();
  });
});

describe('readStyle', () => {
  it('reads declarations with their priority, properties lowercased', () => {
    expect(readStyle('DISPLAY: Flex; --X: 1 !important; color')).toEqual({
      declarations: [
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
      ],
      skipped: ['color'],
    });
  });
});

describe('applied', () => {
  it('picks an important declaration over any other, else the last', () => {
    const { declarations } = readStyle(
      'display: none !important; color: red; display: block; color: blue'
    );
    expect(
      [...applied(declarations)].map(([property, { value }]) => [
        property,
        value,
      ])
    ).toEqual([
      ['display', 'none'],
      ['color', 'blue'],
    ]);
  });
});
