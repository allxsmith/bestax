// Bulma draws a menu's active item with a fill and a text color only, and
// forced colors replaces both, so `_menu.scss` marks it with a bar in the
// system's Highlight color there (#1094). jsdom evaluates no media query and never
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

/** A rule's declarations as `name: value`, in order. */
const declarationsOf = (rule: CSSStyleRule) =>
  Array.from(
    { length: rule.style.length },
    (_, i) => `${rule.style[i]}: ${rule.style.getPropertyValue(rule.style[i])}`
  );

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Menu partial with %s', (_label, prefix) => {
  const items = ['a', 'button', `.${prefix}menu-item`].map(
    item => `.${prefix}menu-list ${item}`
  );

  it('writes its rules inside forced colors only, so nothing changes outside it', () => {
    const rules = allRulesOf(compile(prefix));
    expect(rules.map(({ within }) => within)).toEqual([
      ['@media (forced-colors: active)'],
      ['@media (forced-colors: active)'],
    ]);
  });

  it('reserves the bar on every item, so marking one moves no label', () => {
    const [every, current] = allRulesOf(compile(prefix)).map(
      ({ rule }) => rule
    );
    // In Canvas, the color forced colors gives the item's background, so
    // the bar doesn't show until an item is marked.
    expect(every.selectorText.split(/,\s*/)).toEqual(items);
    expect(declarationsOf(every)).toEqual([
      'border-inline-start: 0.25em solid Canvas',
    ]);
    // An active or selected item changes the bar's color and nothing that
    // takes room.
    expect(current.selectorText.split(/,\s*/)).toEqual(
      items.flatMap(item =>
        ['is-active', 'is-selected'].map(state => `${item}.${prefix}${state}`)
      )
    );
    expect(declarationsOf(current)).toEqual([
      'border-inline-start-color: Highlight',
    ]);
  });

  it('leaves forced colors adjusting the item and everything inside it', () => {
    // `forced-color-adjust: none` is inherited, so on the item it would
    // leave a colored icon or tag in the label in its author colors. The
    // bar needs no opt-out: forced colors keeps a system color on a border.
    expect(compile(prefix)).not.toMatch(/forced-color-adjust/);
  });

  it('reserves the bar on every item Menu.Item renders, and colors only the active ones', () => {
    const [every, current] = allRulesOf(compile(prefix)).map(
      ({ rule }) => rule
    );
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
    const all = ['Dashboard', 'Customers', 'Nested', 'Nested and active'];
    const marked = (rule: CSSStyleRule) =>
      [...all, 'Filter'].filter(text =>
        getByText(text).matches(rule.selectorText)
      );
    expect(marked(every)).toEqual([...all, 'Filter']);
    expect(marked(current)).toEqual([
      'Customers',
      'Nested and active',
      'Filter',
    ]);
  });
});
