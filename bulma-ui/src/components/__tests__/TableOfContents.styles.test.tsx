// A table of contents takes Bulma's menu as it is, so `_tableofcontents.scss`
// holds only its opt-in sticky position. jsdom never loads the partial on its
// own, so these compile it, with no prefix and under one, read its rules off
// the sheet, and check their selectors land on the `<nav>` TableOfContents
// renders. jsdom leaves `var()` unresolved, so a value that reads a variable
// is compared as written.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { TableOfContents } from '../TableOfContents';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/tableofcontents';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/** The sheet's style rules, all at its top level here. */
function rulesOf(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css;
  document.head.appendChild(sheet);
  try {
    return Array.from((sheet.sheet as CSSStyleSheet).cssRules).filter(
      (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
    );
  } finally {
    sheet.remove();
  }
}

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('_tableofcontents.scss under %s', (_, prefix) => {
  const css = compile(prefix);
  const rules = rulesOf(css);
  const declares = (property: string) =>
    rules.filter(rule => rule.style.getPropertyValue(property) !== '');

  const renderNav = (isSticky: boolean) => {
    const { container } = render(
      <ConfigProvider classPrefix={prefix || undefined}>
        <TableOfContents
          isSticky={isSticky}
          items={[{ id: 'intro', label: 'Intro' }]}
        />
      </ConfigProvider>
    );
    return container.querySelector('nav')!;
  };

  it('registers the sticky top on the root, from Bulma’s block spacing', () => {
    const [rule] = declares('--bulma-table-of-contents-sticky-top');
    expect(
      rule.style.getPropertyValue('--bulma-table-of-contents-sticky-top')
    ).toBe('var(--bulma-block-spacing)');
    expect(renderNav(false).matches(rule.selectorText)).toBe(true);
  });

  it('sticks with is-sticky, at the variable, and scrolls a list taller than the room it has', () => {
    const [rule] = declares('position');
    expect(rule.style.position).toBe('sticky');
    expect(rule.style.top).toBe('var(--bulma-table-of-contents-sticky-top)');
    expect(rule.style.overflowY).toBe('auto');
    expect(renderNav(true).matches(rule.selectorText)).toBe(true);
    expect(renderNav(false).matches(rule.selectorText)).toBe(false);
  });

  it('caps the height at the room below its top, in dvh after a vh fallback', () => {
    // jsdom keeps one value per property, so the declarations are read from
    // the sheet's text, in the order a browser meets them.
    const body = css.slice(css.indexOf(`${prefix}is-sticky {`));
    const heights = [...body.matchAll(/max-height: ([^;]+);/g)].map(m => m[1]);
    expect(heights).toEqual([
      'calc(100vh - var(--bulma-table-of-contents-sticky-top))',
      'calc(100dvh - var(--bulma-table-of-contents-sticky-top))',
    ]);
  });

  it('keeps room at its sides for a focus ring, and gives it back', () => {
    const [rule] = declares('position');
    const ring = 'calc(var(--bulma-focus-width) + var(--bulma-focus-offset))';
    expect(rule.style.paddingInline).toBe(ring);
    expect(rule.style.marginInline).toBe(`calc(-1 * ${ring})`);
  });
});
