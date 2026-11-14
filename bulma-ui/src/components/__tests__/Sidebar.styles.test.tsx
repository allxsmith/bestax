// `_sidebar.scss` styles two classes no prop sets, `is-static` and `is-mini`,
// which a page can pass through `className` (#1441). A static sidebar draws a
// border between itself and the content, on its logical end, or its start with
// `is-right`, so the border faces the content on a right-to-left page too. A
// mini sidebar hides each link's label visually but keeps it in the link, so
// the link keeps its name. jsdom never loads the partial on its own, so these
// compile it, with no prefix and under one, read its rules off the sheet, and
// check their selectors land on the elements a Sidebar renders. jsdom leaves
// `var()` unresolved, so a value that reads a variable is compared as written.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import { Menu } from '../Menu';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compileString = (source: string) =>
  sass.compileString(source, {
    loadPaths: [SCSS, path.dirname(BULMA)],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css;

const compile = (prefix: string) =>
  compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/sidebar';`
  );

/** Every style rule in `css`, at any depth, in source order. */
function allRulesOf(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: CSSStyleRule[] = [];
  const walk = (list: CSSRuleList) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) out.push(rule);
      else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  try {
    walk((sheet.sheet as CSSStyleSheet).cssRules);
  } finally {
    sheet.remove();
  }
  return out;
}

/**
 * The properties a rule declares, in order. Iterating its style lists the
 * longhands a shorthand sets as well, so the names are read off its
 * `cssText`, split at each `;` outside brackets.
 */
function propertiesOf(rule: CSSStyleRule) {
  const names: string[] = [];
  let depth = 0;
  let start = 0;
  const text = `${rule.style.cssText};`;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ';' && depth === 0) {
      const name = text.slice(start, i).split(':')[0].trim();
      if (name) names.push(name);
      start = i + 1;
    }
  }
  return names;
}

/** A rule's selector list on one line, `, ` between. */
const selectorOf = (rule: CSSStyleRule) =>
  rule.selectorText.split(/\s*,\s*/).join(', ');

/** Every declaration the rules for `selector` make, merged in order. */
function declarations(rules: CSSStyleRule[], selector: string) {
  const out: Record<string, string> = {};
  for (const rule of rules.filter(r => selectorOf(r) === selector)) {
    for (const name of propertiesOf(rule)) {
      out[name] = rule.style.getPropertyValue(name).trim();
    }
  }
  return out;
}

// What bestax's visually hidden mixin declares, compiled on its own.
const SR_ONLY = declarations(
  allRulesOf(
    compileString(`@use 'mixins' as *; .x { @include extras-sr-only; }`)
  ),
  '.x'
);

const BORDER = '1px solid var(--bulma-sidebar-static-border-color)';

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Sidebar partial with %s', (_label, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;
  const rules = allRulesOf(compile(prefix));
  const staticSidebar = `${p('sidebar')}${p('is-static')}`;
  const label = `${p('sidebar')}${p('is-mini')} ${p('menu-list')} a span:not(${p('icon')})`;

  /** A static, mini sidebar of icon-and-label links, at `position`. */
  const renderSidebar = (position: 'left' | 'right' = 'left') =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <Sidebar
          isOpen
          inline
          overlay={false}
          position={position}
          className={`${prefix}is-static ${prefix}is-mini`}
          aria-label="Sections"
        >
          <Menu>
            <Menu.List>
              <Menu.Item href="#home">
                <span className={`${prefix}icon`}>
                  <i aria-hidden="true" />
                </span>
                <span>Home</span>
              </Menu.Item>
              <Menu.Item href="#orders">
                <span className={`${prefix}icon`}>
                  <i aria-hidden="true" />
                </span>
                <span>Orders</span>
              </Menu.Item>
            </Menu.List>
          </Menu>
        </Sidebar>
      </ConfigProvider>
    );

  describe('is-static', () => {
    it('draws its border on its end, and on its start with is-right, so it faces the content either way', () => {
      expect(declarations(rules, staticSidebar)).toMatchObject({
        'border-inline-end': BORDER,
      });
      expect(declarations(rules, `${staticSidebar}${p('is-right')}`)).toEqual({
        'border-inline-end': 'none',
        'border-inline-start': BORDER,
      });
    });

    it('draws no border on a physical side', () => {
      const physical = rules.filter(rule =>
        propertiesOf(rule).some(name => /^border-(left|right)\b/.test(name))
      );
      expect(physical.map(selectorOf)).toEqual([]);
    });

    it('lands on the sidebar a Sidebar renders, and the is-right rule only on one at the right', () => {
      const end = `${staticSidebar}${p('is-right')}`;
      const sidebarAt = (position: 'left' | 'right') =>
        renderSidebar(position).container.querySelector('[role="dialog"]')!;
      const left = sidebarAt('left');
      expect([left.matches(staticSidebar), left.matches(end)]).toEqual([
        true,
        false,
      ]);
      const right = sidebarAt('right');
      expect([right.matches(staticSidebar), right.matches(end)]).toEqual([
        true,
        true,
      ]);
    });
  });

  describe('is-mini', () => {
    it('hides each link’s label visually, as bestax hides text for screen readers alone', () => {
      expect(SR_ONLY).toMatchObject({ position: 'absolute', width: '1px' });
      expect(declarations(rules, label)).toEqual(SR_ONLY);
    });

    it('takes no label out of the page', () => {
      expect(declarations(rules, label).display).toBeUndefined();
    });

    it('reaches the label of each link and not its icon, so each link keeps its name', () => {
      const { getByRole, getByText, container } = renderSidebar();
      for (const name of ['Home', 'Orders']) {
        expect(getByText(name).matches(label)).toBe(true);
        expect(getByRole('link', { name })).toBeInTheDocument();
      }
      for (const icon of Array.from(container.querySelectorAll(p('icon')))) {
        expect(icon.matches(label)).toBe(false);
      }
    });
  });
});

// The tablet width starts at Bulma's tablet breakpoint, so a build that
// configures `$tablet` moves it with the rest of the page (#1628). Screens
// only, as before.
describe('the Sidebar partial with a configured $tablet', () => {
  const tabletQueries = (tablet: string) => {
    const css = compileString(
      `@use 'bulma/sass/utilities/initial-variables' with ($tablet: ${tablet});
       @use 'components/sidebar';`
    );
    return css
      .split('@media ')
      .slice(1)
      .filter(block =>
        /--bulma-sidebar-width:\s*300px/.test(block.split(/\n\}/)[0])
      )
      .map(block => block.split('{')[0].trim());
  };

  it.each([
    ['769px', 'screen and (min-width: 769px)'],
    ['1024px', 'screen and (min-width: 1024px)'],
    ['600px', 'screen and (min-width: 600px)'],
  ])('widens at a $tablet of %s', (tablet, query) => {
    expect(tabletQueries(tablet)).toEqual([query]);
  });
});
