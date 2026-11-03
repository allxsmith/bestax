// `_affix.scss` is all that fixes an Affix to its corner, so these compile it,
// with no prefix and under one, and read its rules. jsdom drops `env()`, so
// the compiled sheet is read as text: each rule's selector and declarations.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string, blockSpacing = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}'${blockSpacing && `, $block-spacing: ${blockSpacing}`});
     @use 'components/affix';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/** Each selector in the sheet with its declarations, merged across rules. */
function rulesOf(css: string): Map<string, Record<string, string>> {
  const rules = new Map<string, Record<string, string>>();
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, head, body] of plain.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const declarations: Record<string, string> = {};
    for (const declaration of body.split(';')) {
      const at = declaration.indexOf(':');
      if (at < 0) continue;
      declarations[declaration.slice(0, at).trim()] = declaration
        .slice(at + 1)
        .replace(/\s+/g, ' ')
        .trim();
    }
    for (const selector of head.split(',')) {
      const key = selector.replace(/\s+/g, ' ').trim();
      rules.set(key, { ...rules.get(key), ...declarations });
    }
  }
  return rules;
}

const PLAIN = rulesOf(compile(''));
const PREFIXED = rulesOf(compile('bestax-'));

const corner = (name: string) => PLAIN.get(`.affix.is-${name}`);

describe('Affix styles', () => {
  it('registers its offsets at Bulma’s block spacing and its z-index one under the dropdown layer', () => {
    expect(PLAIN.get('.affix')).toMatchObject({
      '--bulma-affix-offset-vertical': '1.5rem',
      '--bulma-affix-offset-horizontal': '1.5rem',
      '--bulma-affix-z-index': '19',
    });
  });

  it('takes the block spacing a build configures, as a value rather than the variable a Field redefines', () => {
    expect(rulesOf(compile('', '2rem')).get('.affix')).toMatchObject({
      '--bulma-affix-offset-vertical': '2rem',
      '--bulma-affix-offset-horizontal': '2rem',
    });
    const css = compile('');
    expect(css).not.toContain('block-spacing');
  });

  it('fixes it at that z-index, never wider than the viewport less both offsets and safe areas', () => {
    expect(PLAIN.get('.affix')).toMatchObject({
      position: 'fixed',
      'z-index': 'var(--bulma-affix-z-index)',
      'max-width':
        'calc(100% - 2 * var(--bulma-affix-offset-horizontal) - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
    });
  });

  const top =
    'calc(var(--bulma-affix-offset-vertical) + env(safe-area-inset-top, 0px))';
  const bottom =
    'calc(var(--bulma-affix-offset-vertical) + env(safe-area-inset-bottom, 0px))';
  const right =
    'calc(var(--bulma-affix-offset-horizontal) + env(safe-area-inset-right, 0px))';
  const left =
    'calc(var(--bulma-affix-offset-horizontal) + env(safe-area-inset-left, 0px))';

  it.each([
    ['top-right', { top, right }],
    ['top-left', { top, left }],
    ['bottom-right', { bottom, right }],
    ['bottom-left', { bottom, left }],
  ])(
    'places the %s corner by its offsets plus that edge’s safe-area inset',
    (name, insets) => {
      // Only the two edges of its corner, so the box stays as wide and as
      // tall as its content.
      expect(corner(name)).toEqual(insets);
    }
  );

  it('prefixes every selector under a class prefix', () => {
    expect(PREFIXED.get('.bestax-affix')).toMatchObject({
      '--bulma-affix-z-index': '19',
      position: 'fixed',
    });
    expect(PREFIXED.get('.bestax-affix.bestax-is-bottom-left')).toEqual({
      bottom,
      left,
    });
    expect(
      [...PREFIXED.keys()].filter(selector => !selector.startsWith('.bestax-'))
    ).toEqual([]);
  });
});
