// `_toast.scss` is all that fixes a toast stack to its place on the screen,
// so these compile it, with no prefix and under one, and read where each
// position puts the stack. While an overlay locks the page, the window's
// edges take back the room the page's scrollbar had, and the lock sets it on
// `<html>`; a stack adds it on its side so it stays put as the scrollbar
// goes. With no lock each variable falls back to 0.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/toast';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/** Each selector in the sheet with its declarations, merged across rules. */
function rulesOf(css: string): Map<string, Record<string, string>> {
  const rules = new Map<string, Record<string, string>>();
  const plain = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Keyframes and media blocks nest rules, which this reader doesn't.
    .replace(/@(?:keyframes|media)[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
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

const left = 'var(--bulma-scroll-lock-offset-left, 0px)';
const right = 'var(--bulma-scroll-lock-offset-right, 0px)';
const centered = `calc(50% + (${left} - ${right}) / 2)`;

/** Where a position's rule puts the stack: its edges and transform. */
const placement = (rules: Map<string, Record<string, string>>, key: string) => {
  const rule = rules.get(key) ?? {};
  return Object.fromEntries(
    ['top', 'bottom', 'left', 'right', 'transform']
      .filter(property => property in rule)
      .map(property => [property, rule[property]])
  );
};

describe('Toast container styles', () => {
  it('fixes the stack, no wider than the window was before a scroll lock', () => {
    expect(PLAIN.get('.toast-container')).toMatchObject({
      position: 'fixed',
      'max-width': `calc(100% - ${left} - ${right})`,
    });
  });

  it.each([
    ['top-right', { top: '0', right }],
    ['top-left', { top: '0', left }],
    ['top-center', { top: '0', left: centered, transform: 'translateX(-50%)' }],
    ['bottom-right', { bottom: '0', right }],
    ['bottom-left', { bottom: '0', left }],
    [
      'bottom-center',
      { bottom: '0', left: centered, transform: 'translateX(-50%)' },
    ],
  ])(
    'puts the %s stack against its edge plus the room a scroll lock gives back there',
    (position, edges) => {
      // A centered stack moves by half of what the two sides take back.
      expect(placement(PLAIN, `.toast-container.is-${position}`)).toEqual(
        edges
      );
    }
  );

  it('prefixes every selector under a class prefix', () => {
    expect(
      placement(PREFIXED, '.bestax-toast-container.bestax-is-top-right')
    ).toEqual({ top: '0', right });
    expect(
      [...PREFIXED.keys()].filter(selector => !selector.includes('.bestax-'))
    ).toEqual([]);
  });
});
