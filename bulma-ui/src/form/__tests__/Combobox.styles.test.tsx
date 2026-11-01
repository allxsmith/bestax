// Bulma's dropdown has the look of the list but none of the behavior, and it
// registers its variables on `.dropdown` alone, so `_combobox.scss` styles
// the Combobox's panel and options itself. jsdom never loads the partial on
// its own, so these compile it, with no prefix and under one, and check its
// rules land on the elements the Combobox renders, read through
// getComputedStyle. jsdom leaves `var()` unresolved, so a value that reads a
// variable is compared as written, and it evaluates no media query, so the
// forced-colors block is read off the sheet.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Combobox } from '../Combobox';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/combobox';`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

/** Bulma's own dropdown rules, compiled under the same prefix. */
const bulmaDropdown = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'bulma/sass/components/dropdown';`,
    {
      loadPaths: [path.dirname(BULMA)],
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
  // An @charset is valid only at the very start, and two sheets joined put
  // one in the middle.
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

/** Every top-level style rule in `css`, in source order. */
const rulesOf = (css: string): CSSStyleRule[] =>
  allRulesOf(css)
    .filter(({ within }) => within.length === 0)
    .map(({ rule }) => rule);

/** A selector list as one line, the way the tests below write it. */
const oneLine = (selector: string) =>
  selector.replace(/\s*,\s*/g, ', ').replace(/="?([\w-]+)"?\]/g, '="$1"]');

/** Every declaration the rules for `selector` make, merged in order. */
function declarations(css: string, selector: string) {
  const out: Record<string, string> = {};
  for (const { style } of rulesOf(css).filter(
    rule => oneLine(rule.selectorText) === selector
  )) {
    for (let i = 0; i < style.length; i++) {
      out[style[i]] = style.getPropertyValue(style[i]).trim();
    }
  }
  return out;
}

const removers: Array<() => void> = [];
afterEach(() => removers.splice(0).forEach(remove => remove()));

/** Puts stylesheets in the document, in order, until the test ends. */
function load(...sheets: string[]) {
  for (const css of sheets) {
    const sheet = document.createElement('style');
    sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
    document.head.appendChild(sheet);
    removers.push(() => sheet.remove());
  }
}

/** The selector list the variables are registered on. */
const ROOT = (prefix: string) =>
  `.${prefix}combobox, .${prefix}combobox-menu.${prefix}is-portal`;

/** The classes each part renders, which is all the partial may name. */
const OWN_CLASSES = [
  'combobox',
  'combobox-menu',
  'combobox-list',
  'combobox-item',
  'combobox-check',
  'combobox-group',
  'combobox-group-label',
  'combobox-empty',
  'dropdown-menu',
  'dropdown-content',
  'dropdown-item',
  'is-small',
  'is-medium',
  'is-large',
  'is-inline',
  'is-portal',
  'is-active',
  'is-checked',
  'is-disabled',
  'is-bottom-left',
  'is-bottom-right',
  'is-top-left',
  'is-top-right',
];

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('the Combobox partial with %s', (_label, prefix) => {
  const renderOpen = (props: { inline?: boolean; size?: 'small' } = {}) =>
    render(
      <ConfigProvider classPrefix={prefix}>
        <Combobox label="Produce" defaultOpen {...props}>
          <Combobox.Input />
          <Combobox.Menu data-testid="panel">
            <Combobox.List data-testid="list">
              <Combobox.Group label="Fruit" data-testid="group">
                <Combobox.Item value="apple" data-testid="apple">
                  Apple
                </Combobox.Item>
                <Combobox.Item value="pear" checked data-testid="pear">
                  Pear
                </Combobox.Item>
                <Combobox.Item value="plum" disabled data-testid="plum">
                  Plum
                </Combobox.Item>
              </Combobox.Group>
            </Combobox.List>
            <Combobox.Empty data-testid="empty">Nothing else</Combobox.Empty>
          </Combobox.Menu>
        </Combobox>
      </ConfigProvider>
    );

  it('names only the prefixed classes the Combobox renders', () => {
    // Inside at-rules too, so a rule in a media block is held to it as well.
    const classes = allRulesOf(compile(prefix)).flatMap(({ rule }) =>
      Array.from(rule.selectorText.matchAll(/\.([\w-]+)/g), m => m[1])
    );
    const named = [...new Set(classes)].sort();
    expect(named.every(c => c.startsWith(prefix))).toBe(true);
    expect(
      named.filter(c => !OWN_CLASSES.includes(c.slice(prefix.length)))
    ).toEqual([]);
  });

  it('registers its variables on the Combobox and on a portaled panel, from one map', () => {
    const registering = rulesOf(compile(prefix)).filter(rule =>
      Array.from({ length: rule.style.length }, (_, i) => rule.style[i]).some(
        name => name === '--bulma-combobox-menu-background'
      )
    );
    expect(registering.map(rule => oneLine(rule.selectorText))).toEqual([
      `.${prefix}combobox, .${prefix}combobox-menu.${prefix}is-portal`,
    ]);
  });

  it('builds its colors from Bulma’s tokens, so dark mode needs no rules', () => {
    const vars = declarations(compile(prefix), ROOT(prefix));
    expect(vars['--bulma-combobox-menu-background']).toBe(
      'var(--bulma-scheme-main)'
    );
    expect(vars['--bulma-combobox-highlight-background']).toBe(
      'var(--bulma-link)'
    );
    expect(vars['--bulma-combobox-highlight-color']).toBe(
      'var(--bulma-link-invert)'
    );
    expect(vars['--bulma-combobox-check-color']).toBe('currentColor');
    // jsdom drops the space after a comma in a custom property's value.
    expect(vars['--bulma-combobox-item-hover-background']).toMatch(
      /^hsl\(var\(--bulma-scheme-h\),var\(--bulma-scheme-s\),calc\(var\(--bulma-scheme-main-l\) \+ var\(--bulma-hover-background-l-delta\)\)\)$/
    );
    for (const [name, value] of Object.entries(vars)) {
      if (!/color|background/.test(name)) continue;
      expect([name, value]).not.toEqual([name, expect.stringMatching(/#/)]);
    }
  });

  it.each(['small', 'medium', 'large'])(
    'changes only variables at %s, on the Combobox and on its panel',
    size => {
      const rules = rulesOf(compile(prefix)).filter(rule =>
        rule.selectorText.includes(`.${prefix}is-${size}`)
      );
      expect(rules.map(rule => oneLine(rule.selectorText))).toEqual([
        `.${prefix}combobox.${prefix}is-${size}, .${prefix}combobox-menu.${prefix}is-${size}`,
      ]);
      const style = rules[0].style;
      const names = Array.from({ length: style.length }, (_, i) => style[i]);
      expect(names.sort()).toEqual([
        '--bulma-combobox-item-padding-x',
        '--bulma-combobox-item-padding-y',
        '--bulma-combobox-item-size',
      ]);
    }
  );

  it('shows the panel Bulma hides outside an active .dropdown, either sheet first', () => {
    // Bulma's `.dropdown-menu` is display: none. jsdom weighs rules by
    // order alone, so the sheets are read: the partial's rule names two
    // classes to Bulma's one, which wins wherever either sheet loads.
    const display = (css: string) =>
      rulesOf(css)
        .filter(rule => rule.style.getPropertyValue('display'))
        .map(rule => [
          oneLine(rule.selectorText),
          rule.style.getPropertyValue('display'),
        ]);
    expect(display(bulmaDropdown(prefix))).toContainEqual([
      `.${prefix}dropdown-menu`,
      'none',
    ]);
    expect(display(compile(prefix))).toContainEqual([
      `.${prefix}dropdown-menu.${prefix}combobox-menu`,
      'block',
    ]);

    load(bulmaDropdown(prefix), compile(prefix));
    const { getByTestId } = renderOpen();
    const panel = getComputedStyle(getByTestId('panel'));
    expect(panel.display).toBe('block');
    expect(panel.position).toBe('absolute');
    // It takes no room, so the Field's margin doesn't move as it opens.
    expect(panel.top).toBe('100%');
    expect(panel.marginTop).toBe('var(--bulma-combobox-menu-offset)');
    expect(panel.minWidth).toBe('100%');
    expect(panel.zIndex).toBe('var(--bulma-combobox-menu-z-index)');
    const content = getComputedStyle(
      getByTestId('panel').firstElementChild as Element
    );
    expect(content.backgroundColor).toBe(
      'var(--bulma-combobox-menu-background)'
    );
    expect(content.maxHeight).toBe('var(--bulma-combobox-list-max-height)');
    expect(content.overflowY).toBe('auto');
  });

  it('places the Combobox for the panel, across the field', () => {
    load(compile(prefix));
    const { container } = renderOpen();
    const root = getComputedStyle(
      container.querySelector(`.${prefix}combobox`) as Element
    );
    expect(root.position).toBe('relative');
    expect(root.width).toBe('100%');
  });

  it('gives a div option the hover and highlight looks Bulma gives a link', () => {
    load(bulmaDropdown(prefix), compile(prefix));
    const { getByTestId } = renderOpen();
    const apple = getComputedStyle(getByTestId('apple'));
    expect(apple.cursor).toBe('pointer');
    expect(apple.color).toBe('var(--bulma-combobox-item-color)');
    // Its size comes from the list, which takes the Combobox's.
    const list = getComputedStyle(getByTestId('list'));
    expect(list.fontSize).toBe('var(--bulma-combobox-item-size)');
    expect(apple.fontSize).toBe(list.fontSize);

    // jsdom has no :hover, so the hover rule is read off the sheet.
    const hover = rulesOf(compile(prefix)).find(rule =>
      rule.selectorText.includes(':hover')
    );
    expect(hover?.selectorText).toBe(
      `.${prefix}dropdown-item.${prefix}combobox-item:hover:not(.${prefix}is-active):not(.${prefix}is-disabled)`
    );
    expect(hover?.style.getPropertyValue('background-color')).toBe(
      'var(--bulma-combobox-item-hover-background)'
    );

    const highlight = declarations(
      compile(prefix),
      `.${prefix}dropdown-item.${prefix}combobox-item.${prefix}is-active`
    );
    expect(highlight).toEqual({
      'background-color': 'var(--bulma-combobox-highlight-background)',
      color: 'var(--bulma-combobox-highlight-color)',
    });
  });

  it('shows a disabled option as one, and its highlight without the pick look', () => {
    load(compile(prefix));
    const { getByTestId } = renderOpen();
    const plum = getComputedStyle(getByTestId('plum'));
    expect(plum.color).toBe('var(--bulma-combobox-disabled-color)');
    expect(plum.cursor).toBe('not-allowed');
    expect(
      declarations(
        compile(prefix),
        `.${prefix}dropdown-item.${prefix}combobox-item.${prefix}is-active.${prefix}is-disabled`
      )
    ).toEqual({
      'background-color': 'var(--bulma-combobox-item-hover-background)',
      color: 'var(--bulma-combobox-disabled-color)',
    });
  });

  it('keeps room for the check mark only in a list that shows one', () => {
    // jsdom matches :has() here, so the room lands on every option of a
    // list with a checked one, and on none of a list without.
    load(compile(prefix));
    const { getByTestId } = renderOpen();
    const room = `calc(var(--bulma-combobox-item-padding-x) + var(--bulma-combobox-check-size) + var(--bulma-combobox-check-gap))`;
    const squash = (s: string) => s.replace(/\s+/g, ' ');
    expect(
      squash(getComputedStyle(getByTestId('apple')).paddingInlineStart)
    ).toBe(room);
    const check = getComputedStyle(
      getByTestId('pear').querySelector(`.${prefix}combobox-check`) as Element
    );
    expect(check.position).toBe('absolute');
    expect(check.color).toBe('var(--bulma-combobox-check-color)');

    const selectors = rulesOf(compile(prefix))
      .filter(rule => rule.style.getPropertyValue('padding-inline-start'))
      .map(rule => oneLine(rule.selectorText));
    expect(selectors).toEqual([
      `.${prefix}combobox-list[aria-multiselectable="true"] .${prefix}combobox-item, .${prefix}combobox-list:has(.${prefix}combobox-item.${prefix}is-checked) .${prefix}combobox-item`,
    ]);
  });

  it('heads a group and sets it off from the one before', () => {
    load(compile(prefix));
    const { getByText } = renderOpen();
    const label = getComputedStyle(getByText('Fruit'));
    expect(label.fontSize).toBe('var(--bulma-combobox-group-label-size)');
    expect(label.fontWeight).toBe('var(--bulma-combobox-group-label-weight)');
    expect(label.color).toBe('var(--bulma-combobox-group-label-color)');
    expect(
      declarations(
        compile(prefix),
        `.${prefix}combobox-group:not(:first-child)`
      )
    ).toEqual({
      'border-top': '1px solid var(--bulma-combobox-divider-color)',
      'margin-top': 'var(--bulma-combobox-item-padding-y)',
    });
  });

  it('draws a line under a group that items with no group follow', () => {
    expect(
      declarations(
        compile(prefix),
        `.${prefix}combobox-group:has(+ :not(.${prefix}combobox-group))`
      )
    ).toEqual({
      'border-bottom': '1px solid var(--bulma-combobox-divider-color)',
      'margin-bottom': 'var(--bulma-combobox-item-padding-y)',
      'padding-bottom': 'var(--bulma-combobox-item-padding-y)',
    });
  });

  // jsdom computes no border whose shorthand reads a variable, so these
  // read the room the same rules make around the line, which shows each
  // rule matching where the Combobox puts its groups.
  it.each([
    [
      'after the last group',
      [
        { value: 'Apple', group: 'Fruit' },
        { value: 'Banana', group: 'Fruit' },
        { value: 'Carrot', group: 'Vegetables' },
        { value: 'Leek', group: 'Vegetables' },
        { value: 'Salt' },
        { value: 'Pepper' },
      ],
      { Fruit: [], Vegetables: ['above', 'below'] },
    ],
    [
      'among a group’s items in `data`',
      [
        { value: 'Apple', group: 'Fruit' },
        { value: 'Salt' },
        { value: 'Banana', group: 'Fruit' },
        { value: 'Pepper' },
      ],
      { Fruit: ['below'] },
    ],
    [
      'before the first group',
      [
        { value: 'Salt' },
        { value: 'Apple', group: 'Fruit' },
        { value: 'Carrot', group: 'Vegetables' },
      ],
      { Fruit: ['above'], Vegetables: ['above'] },
    ],
  ])(
    'sets items with no group off from a group, %s',
    (_where, data, lines: Record<string, string[]>) => {
      load(compile(prefix));
      const { getByRole } = render(
        <ConfigProvider classPrefix={prefix}>
          <Combobox label="Produce" defaultOpen data={data} />
        </ConfigProvider>
      );
      const room = 'var(--bulma-combobox-item-padding-y)';
      for (const [group, edges] of Object.entries(lines)) {
        const style = getComputedStyle(getByRole('group', { name: group }));
        expect({
          group,
          above: style.marginTop,
          below: [style.marginBottom, style.paddingBottom],
        }).toEqual({
          group,
          above: edges.includes('above') ? room : '0',
          below: edges.includes('below') ? [room, room] : ['0', '0'],
        });
      }
    }
  );

  it('pads the empty message like an option, in its own color', () => {
    load(compile(prefix));
    const { getByTestId } = renderOpen();
    const empty = getComputedStyle(getByTestId('empty'));
    expect(empty.color).toBe('var(--bulma-combobox-empty-color)');
    expect(empty.fontSize).toBe('var(--bulma-combobox-item-size)');
  });

  it('puts an inline list in the flow under the field, scrolling past its height', () => {
    load(compile(prefix));
    const { getByTestId } = renderOpen({ inline: true });
    const list = getComputedStyle(getByTestId('list'));
    expect(list.position).toBe('static');
    expect(list.marginTop).toBe('var(--bulma-combobox-menu-offset)');
    expect(list.maxHeight).toBe('var(--bulma-combobox-list-max-height)');
    expect(list.overflowY).toBe('auto');
  });

  it('fixes a portaled panel to the viewport, above a Modal', () => {
    const portal = declarations(
      compile(prefix),
      `.${prefix}dropdown-menu.${prefix}combobox-menu.${prefix}is-portal`
    );
    expect(portal).toEqual({
      position: 'fixed',
      'z-index': 'var(--bulma-combobox-portal-z-index)',
      right: 'auto',
      bottom: 'auto',
      // jsdom serializes a zero length as `0px`, as browsers do.
      'min-width': '0px',
    });
    const vars = declarations(compile(prefix), ROOT(prefix));
    // Bulma's Modal is 40.
    expect(Number(vars['--bulma-combobox-portal-z-index'])).toBeGreaterThan(40);
    expect(Number(vars['--bulma-combobox-menu-z-index'])).toBeLessThan(30);
  });

  it('outlines the highlight in forced colors, where its fill is replaced, and greys a disabled option', () => {
    const nested = allRulesOf(compile(prefix)).filter(
      ({ within }) => within.length > 0
    );
    expect(
      nested.map(({ rule, within }) => ({
        within,
        selector: oneLine(rule.selectorText),
        declarations: Array.from(
          { length: rule.style.length },
          (_, i) =>
            `${rule.style[i]}: ${rule.style.getPropertyValue(rule.style[i])}`
        ),
      }))
    ).toEqual([
      // jsdom serializes a system color lowercase, as browsers do, except in
      // `outline`, which it keeps as written.
      {
        within: ['@media (forced-colors: active)'],
        selector: `.${prefix}dropdown-item.${prefix}combobox-item.${prefix}is-active`,
        declarations: ['outline: 2px solid Highlight', 'outline-offset: -2px'],
      },
      {
        within: ['@media (forced-colors: active)'],
        selector: `.${prefix}dropdown-item.${prefix}combobox-item.${prefix}is-disabled, .${prefix}dropdown-item.${prefix}combobox-item.${prefix}is-active.${prefix}is-disabled`,
        declarations: ['color: graytext'],
      },
    ]);
  });
});

describe('the partial ships in every build', () => {
  it('is in the form index, so bestax.css and extras.css carry it', () => {
    const index = fs.readFileSync(path.join(SCSS, 'form/_index.scss'), 'utf8');
    expect(index).toMatch(/^@use 'combobox';$/m);
  });
});
