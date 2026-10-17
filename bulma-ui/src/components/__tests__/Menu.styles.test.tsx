// Bulma draws a menu's active item with a fill and a text color only, and
// forced colors replaces both, so `_menu.scss` gives it the system's
// selection pair there (#1094). jsdom evaluates no media query and never
// loads the partial on its own, so these compile it, with no prefix and
// under one, read its rules off the sheet, and check their selectors land on
// the elements Menu.Item renders.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Menu } from '../Menu';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, resolved through package.json since jest
// maps any `.css` specifier to a stub.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/menu';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/**
 * Every style rule in `css`, at any depth, in source order, each with the
 * at-rules it sits in (`@media (forced-colors: active)`), outermost first.
 */
function allRulesOf(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: { rule: CSSStyleRule; within: string[] }[] = [];
  const walk = (list: CSSRuleList, within: string[]) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) {
        out.push({ rule, within });
      } else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules, [
          ...within,
          rule.cssText.split('{')[0].trim(),
        ]);
      }
    }
  };
  try {
    walk((sheet.sheet as CSSStyleSheet).cssRules, []);
  } finally {
    sheet.remove();
  }
  return out;
}

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Menu partial with %s', (_label, prefix) => {
  it('writes one rule, inside forced colors, so nothing changes outside it', () => {
    const rules = allRulesOf(compile(prefix));
    expect(rules.map(({ within }) => within)).toEqual([
      ['@media (forced-colors: active)'],
    ]);
  });

  it('gives an active or selected item the system selection pair', () => {
    const [{ rule }] = allRulesOf(compile(prefix));
    expect(rule.selectorText.split(/,\s*/)).toEqual(
      ['a', 'button', `.${prefix}menu-item`].flatMap(item =>
        ['is-active', 'is-selected'].map(
          state => `.${prefix}menu-list ${item}.${prefix}${state}`
        )
      )
    );
    expect(
      Array.from(
        { length: rule.style.length },
        (_, i) =>
          `${rule.style[i]}: ${rule.style.getPropertyValue(rule.style[i])}`
      )
    ).toEqual([
      // Without it the browser's text backplate, in Canvas, sits behind
      // HighlightText and the label can't be read.
      'forced-color-adjust: none',
      'background-color: Highlight',
      'color: HighlightText',
      'outline-color: CanvasText',
    ]);
  });

  it('matches what Menu.Item renders when active, and nothing else', () => {
    const [{ rule }] = allRulesOf(compile(prefix));
    const { getByText } = render(
      <ConfigProvider classPrefix={prefix}>
        <Menu>
          <Menu.List>
            <Menu.Item href="#a">Dashboard</Menu.Item>
            <Menu.Item href="#b" active>
              Customers
              <Menu.List>
                <Menu.Item href="#c">Nested</Menu.Item>
                <Menu.Item href="#d" active>
                  Nested and active
                </Menu.Item>
              </Menu.List>
            </Menu.Item>
            <Menu.Item as="button" active>
              Filter
            </Menu.Item>
          </Menu.List>
        </Menu>
      </ConfigProvider>
    );
    const matches = (text: string) =>
      getByText(text).matches(rule.selectorText);
    expect(matches('Customers')).toBe(true);
    expect(matches('Nested and active')).toBe(true);
    expect(matches('Filter')).toBe(true);
    expect(matches('Dashboard')).toBe(false);
    expect(matches('Nested')).toBe(false);
  });
});
