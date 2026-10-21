// `_menu.scss` adds two things to Bulma's menu: the look of `Menu.Section`
// (#1172), and, in forced colors, a bar in the system's Highlight color on
// the active item, since forced colors replaces Bulma's fill and text color
// (#1094). jsdom evaluates no media query and never loads the partial on its
// own, so these compile it, with no prefix and under one, read its rules off
// the sheet, and check their selectors land on the elements Menu renders.
// jsdom leaves `var()` unresolved, so a value that reads a variable is
// compared as written.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Menu } from '../Menu';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, resolved through package.json since jest
// maps any `.css` specifier to a stub.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string, partial = 'menu') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/${partial}';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

type Found = { rule: CSSStyleRule; within: string[] };

/**
 * Every style rule in `css`, at any depth, in source order, each with the
 * at-rules it sits in (`@media (forced-colors: active)`), outermost first.
 */
function allRulesOf(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: Found[] = [];
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

/** A rule's selector list on one line, `, ` between. */
const selectorOf = (rule: CSSStyleRule) =>
  rule.selectorText.split(/\s*,\s*/).join(', ');

/** Every declaration the rules for `selector` make, merged in order. */
function declarations(found: Found[], selector: string) {
  const out: Record<string, string> = {};
  for (const { rule } of found.filter(f => selectorOf(f.rule) === selector)) {
    for (let i = 0; i < rule.style.length; i++) {
      out[rule.style[i]] = rule.style.getPropertyValue(rule.style[i]).trim();
    }
  }
  return out;
}

const FORCED = '@media (forced-colors: active)';
const REDUCED = '@media (prefers-reduced-motion: reduce)';

/** The rules for the items Bulma draws, which only forced colors changes. */
const itemRulesOf = (found: Found[]) =>
  found.filter(({ rule }) => /menu-list/.test(rule.selectorText));

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Menu partial with %s', (_label, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;
  const found = allRulesOf(compile(prefix));
  const items = ['a', 'button', `.${prefix}menu-item`].map(
    item => `.${prefix}menu-list ${item}`
  );

  describe('the active item in forced colors', () => {
    it('writes the item rules inside forced colors only, so nothing changes outside it', () => {
      expect(itemRulesOf(found).map(({ within }) => within)).toEqual([
        [FORCED],
        [FORCED],
      ]);
    });

    it('reserves the bar on every item, so marking one moves no label', () => {
      const [every, current] = itemRulesOf(found).map(({ rule }) => rule);
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
      // bar needs no opt-out: forced colors keeps a system color on a
      // border, and so does the section's chevron, which is a border too.
      expect(compile(prefix)).not.toMatch(/forced-color-adjust/);
    });

    it('reserves the bar on every item Menu.Item renders, and colors only the active ones', () => {
      const [every, current] = itemRulesOf(found).map(({ rule }) => rule);
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

    it('leaves a section heading out of the bar, since it isn’t an item', () => {
      const [every] = itemRulesOf(found).map(({ rule }) => rule);
      const { getByRole } = render(
        <ConfigProvider classPrefix={prefix}>
          <Menu>
            <Menu.Section label="Components" defaultOpen>
              <Menu.List>
                <Menu.Item href="#a">Button</Menu.Item>
              </Menu.List>
            </Menu.Section>
          </Menu>
        </ConfigProvider>
      );
      expect(
        getByRole('button', { name: 'Components' }).matches(every.selectorText)
      ).toBe(false);
      expect(
        getByRole('link', { name: 'Button' }).matches(every.selectorText)
      ).toBe(true);
    });
  });

  describe('Menu.Section', () => {
    const section = found.filter(f => !itemRulesOf(found).includes(f));
    const bulma = allRulesOf(
      fs.readFileSync(path.join(BULMA, 'css', 'bulma.css'), 'utf8')
    );
    const tree = allRulesOf(compile(prefix, 'treeview'));

    /** Renders an open section and a closed one, and returns their parts. */
    const renderSections = () => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Menu>
            <Menu.Section label="Components" defaultOpen>
              <Menu.List>
                <Menu.Item href="#a">Button</Menu.Item>
              </Menu.List>
            </Menu.Section>
            <Menu.Section label="Form">
              <Menu.List>
                <Menu.Item href="#b">Input</Menu.Item>
              </Menu.List>
            </Menu.Section>
          </Menu>
        </ConfigProvider>
      );
      const sections = Array.from(
        container.querySelectorAll<HTMLElement>(p('menu-section'))
      );
      return {
        container,
        sections,
        buttons: sections.map(s => s.querySelector('button')!),
        chevrons: sections.map(s =>
          s.querySelector(p('menu-section-chevron'))!
        ),
      };
    };

    it('writes its rules for the prefixed classes Menu.Section renders, and no others', () => {
      const classes = new Set(
        section
          .map(({ rule }) => rule.selectorText)
          .flatMap(sel => (sel.match(/\.[\w-]+/g) ?? []).map(n => n.slice(1)))
      );
      expect([...classes].sort()).toEqual(
        [
          'menu',
          'menu-section',
          'menu-section-chevron',
          'menu-section-label',
          'menu-section-toggle',
        ].map(name => prefix + name)
      );
      const { container } = renderSections();
      const rendered = new Set(
        Array.from(container.querySelectorAll('[class]'))
          .flatMap(el => Array.from(el.classList))
          // Bulma's own, drawn by its menu.
          .filter(
            name => !['menu', 'menu-list'].includes(name.slice(prefix.length))
          )
      );
      for (const name of rendered) expect(classes.has(name)).toBe(true);
    });

    it('registers its variables on the menu, as Bulma registers the menu’s', () => {
      expect(declarations(section, p('menu'))).toEqual({
        '--bulma-menu-section-gap': '0.375em',
        '--bulma-menu-section-chevron-size': '1em',
        '--bulma-menu-section-chevron-color': 'currentColor',
        '--bulma-menu-section-chevron-duration': 'var(--bulma-duration)',
      });
    });

    it('draws the heading the way Bulma draws a menu label, from the label’s variables', () => {
      const toggle = declarations(section, p('menu-section-toggle'));
      const label = declarations(bulma, '.menu-label');
      for (const property of [
        'color',
        'font-size',
        'letter-spacing',
        'text-transform',
      ]) {
        expect([property, toggle[property]]).toEqual([
          property,
          label[property],
        ]);
      }
      expect(toggle.color).toBe('var(--bulma-menu-label-color)');
    });

    it('takes the button’s own look off the heading, and lays it out as a line', () => {
      // The label's look, from the test above, and nothing of a button's.
      expect(declarations(section, p('menu-section-toggle'))).toEqual({
        'align-items': 'center',
        appearance: 'none',
        background: 'none',
        border: 'none',
        color: 'var(--bulma-menu-label-color)',
        cursor: 'pointer',
        display: 'flex',
        'font-family': 'inherit',
        'font-size': 'var(--bulma-menu-label-font-size)',
        'font-weight': 'inherit',
        gap: 'var(--bulma-menu-section-gap)',
        'letter-spacing': 'var(--bulma-menu-label-letter-spacing)',
        'line-height': 'inherit',
        margin: '0',
        padding: '0',
        'text-align': 'start',
        'text-transform': 'uppercase',
        width: '100%',
      });
      // The words take the room the chevron leaves, as TreeView's label does.
      expect(declarations(section, p('menu-section-label'))).toEqual({
        flex: '1 1 auto',
        'min-width': '0',
      });
      expect(declarations(section, p('menu-section-label'))).toEqual(
        declarations(tree, p('tree-view-label'))
      );
    });

    // On the heading, not the section, so the `em` is the label's small size,
    // as it is on Bulma's label.
    const following = `${p('menu-section')}:not(:first-child) > ${p('menu-section-toggle')}`;
    const followed = `${p('menu-section')}:not(:last-child) > ${p('menu-section-toggle')}`;
    const open = `${p('menu-section-toggle')}[aria-expanded=true]`;

    it('spaces sections as Bulma spaces labels: above one that follows something, below one something follows, and under an open heading', () => {
      expect(declarations(section, following)).toEqual({
        'margin-top': 'var(--bulma-menu-label-spacing)',
      });
      expect(declarations(section, `${followed}, ${open}`)).toEqual({
        'margin-bottom': 'var(--bulma-menu-label-spacing)',
      });
      // The same space Bulma puts around a label.
      expect(declarations(bulma, '.menu-label:not(:first-child)')).toEqual({
        'margin-top': 'var(--bulma-menu-label-spacing)',
      });
      expect(declarations(bulma, '.menu-label:not(:last-child)')).toEqual({
        'margin-bottom': 'var(--bulma-menu-label-spacing)',
      });
      // And they land where they should.
      const { buttons } = renderSections();
      expect(buttons.map(b => b.matches(following))).toEqual([false, true]);
      expect(buttons.map(b => b.matches(followed))).toEqual([true, false]);
      expect(buttons.map(b => b.matches(open))).toEqual([true, false]);
    });

    it('keeps a menu list after a closed section off its heading', () => {
      // Bulma's menu list has no margin of its own, so the heading's is all
      // that parts the two. Flush, the list would read as the section's.
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Menu>
            <Menu.Section label="Closed">
              <Menu.List>
                <Menu.Item href="#a">Inside</Menu.Item>
              </Menu.List>
            </Menu.Section>
            <Menu.List>
              <Menu.Item href="#b">After</Menu.Item>
            </Menu.List>
          </Menu>
        </ConfigProvider>
      );
      const heading = container.querySelector('button')!;
      expect(heading).toHaveAttribute('aria-expanded', 'false');
      // A rule of the partial's spaces the closed heading below.
      const below = section.filter(({ rule }) =>
        rule.style.getPropertyValue('margin-bottom')
      );
      expect(
        below.filter(({ rule }) => heading.matches(rule.selectorText))
      ).toHaveLength(1);
      const list = declarations(bulma, '.menu-list');
      expect(list.margin).toBeUndefined();
      expect(list['margin-top']).toBeUndefined();
    });

    it('rings the focused heading, and keeps the ring in forced colors', () => {
      expect(
        declarations(section, `${p('menu-section-toggle')}:focus`)
      ).toEqual({ outline: 'none' });
      const ring = declarations(
        section.filter(f => f.within.length === 0),
        `${p('menu-section-toggle')}:focus-visible`
      );
      expect(ring.outline).toMatch(/^2px solid hsl\(var\(--bulma-link-h/);
      expect(ring['outline-offset']).toBe('2px');
      expect(
        declarations(
          section.filter(f => f.within.join() === FORCED),
          `${p('menu-section-toggle')}:focus-visible`
        )
      ).toEqual({ 'outline-color': 'CanvasText' });
      // TreeView's ring is the same color there.
      expect(
        declarations(
          tree.filter(f => f.within.join() === FORCED),
          `${p('tree-view-item')}:focus-visible > ${p('tree-view-row')}`
        )
      ).toEqual({ 'outline-color': 'CanvasText' });
    });

    // The chevron is TreeView's, so these hold the two together: the same
    // box, the same two sides of a square, the same turns, and the same
    // right-to-left rule, with only the variables' names changed.
    const ours = (state: string) =>
      `${p('menu-section-toggle')}${state} > ${p('menu-section-chevron')}::after`;
    const theirs = (state: string) =>
      `${p('tree-view-item')}${state} > ${p('tree-view-row')} > ${p('tree-view-toggle')}::after`;
    const renamed = (decls: Record<string, string>) =>
      JSON.parse(
        JSON.stringify(decls).replace(
          /tree-view-toggle/g,
          'menu-section-chevron'
        )
      );

    it('draws TreeView’s chevron in a box of the same size', () => {
      expect(declarations(section, p('menu-section-chevron'))).toEqual(
        renamed(declarations(tree, p('tree-view-toggle')))
      );
      expect(
        declarations(section, `${p('menu-section-chevron')}::after`)
      ).toEqual(renamed(declarations(tree, theirs('[aria-expanded]'))));
      expect(
        declarations(section, `${p('menu-section-chevron')}::after`)
      ).toMatchObject({
        'border-width': '0 0 0.125em 0.125em',
        transform: 'translateX(-15%) rotate(-135deg)',
      });
    });

    it('turns the chevron down while open, and to the end of the line while closed in a right-to-left page', () => {
      expect(declarations(section, ours('[aria-expanded=true]'))).toEqual(
        declarations(tree, theirs('[aria-expanded=true]'))
      );
      expect(declarations(section, ours('[aria-expanded=true]'))).toEqual({
        transform: 'translateY(-15%) rotate(-45deg)',
      });
      // The selectors read as Sass writes them, with the values unquoted.
      const rtl = section.filter(({ rule }) =>
        rule.selectorText.includes(':dir(rtl)')
      );
      expect(rtl.map(({ rule }) => selectorOf(rule))).toEqual([
        ours('[aria-expanded=false]:dir(rtl)'),
      ]);
      expect(declarationsOf(rtl[0].rule)).toEqual(
        declarationsOf(
          tree.find(({ rule }) => rule.selectorText.includes(':dir(rtl)'))!.rule
        )
      );
      expect(rtl[0].rule.style.getPropertyValue('transform')).toBe(
        'translateX(15%) rotate(45deg)'
      );
    });

    it('lands the turns on the chevron Menu.Section renders', () => {
      // jsdom matches no pseudo-element and no :dir(), so the element half of
      // each selector is checked.
      const element = (selector: string) =>
        selector.replace('::after', '').replace(':dir(rtl)', '');
      const { chevrons } = renderSections();
      expect(
        chevrons.map(c => c.matches(element(ours('[aria-expanded=true]'))))
      ).toEqual([true, false]);
      expect(
        chevrons.map(c =>
          c.matches(element(ours('[aria-expanded=false]:dir(rtl)')))
        )
      ).toEqual([false, true]);
      expect(
        chevrons.every(c =>
          c.matches(element(`${p('menu-section-chevron')}::after`))
        )
      ).toBe(true);
    });

    it('stops the chevron turning when motion is reduced', () => {
      const reduced = section.filter(f => f.within.join() === REDUCED);
      expect(reduced.map(({ rule }) => selectorOf(rule))).toEqual([
        `${p('menu-section-chevron')}::after`,
      ]);
      expect(reduced[0].rule.style.getPropertyValue('transition')).toMatch(
        /^none/
      );
    });
  });
});
