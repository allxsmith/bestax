// Bulma draws `.dropdown-divider` and `.navbar-divider` as a background with
// no border, which forced colors paints in Canvas, the menu's own color, so
// both lines vanish (#1859). `_dropdown.scss` and `_navbar.scss` draw them in
// CanvasText there. jsdom evaluates no media query and doesn't rank rules
// across sheets, so these compile the real partials, lift their
// `forced-colors: active` rules to the top level, as a browser on a
// forced-colors page applies them, link them with Bulma's CSS on either
// side, and resolve each divider through `css-cascade`.
import type React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Dropdown } from '../Dropdown';
import { ContextMenu } from '../ContextMenu';
import { Navbar } from '../Navbar';
import { ConfigProvider } from '../../helpers/Config';
import {
  bulmaCss,
  cascade,
  compilePartial,
  rulesOf,
} from '../../__tests__/css-cascade';

const FORCED = '@media (forced-colors: active)';

/** The partial's rules: those a forced-colors page alone applies, and the rest. */
const rulesFor = (partial: string, prefix: string) => {
  const { rules, nested } = rulesOf(compilePartial(partial, prefix));
  return {
    outside: [
      ...rules,
      ...nested
        .filter(({ within }) => within !== FORCED)
        .map(({ rule }) => rule),
    ],
    forced: nested
      .filter(({ within }) => within === FORCED)
      .map(({ rule }) => rule.cssText)
      .join('\n'),
  };
};

/** The declarations that set each property checked here, shorthands included. */
const SETS: Record<string, string[]> = {
  'background-color': ['background-color', 'background'],
  'forced-color-adjust': ['forced-color-adjust'],
  // jsdom keeps an `outline` as written rather than splitting it.
  outline: ['outline', 'outline-color', 'outline-style', 'outline-width'],
  'outline-offset': ['outline-offset'],
};

/** What `el` gets for `property` with Bulma's sheet before `css` and after it. */
const bothOrders = (
  el: Element,
  css: string,
  property: string,
  prefix: string
) => {
  const bulma = bulmaCss(prefix ? 'versions/bulma-prefixed.css' : 'bulma.css');
  const valueOf = (style: CSSStyleDeclaration, name: string) =>
    style.getPropertyValue(name).trim() || undefined;
  return [
    cascade(el, `${bulma}\n${css}`, SETS[property], valueOf),
    cascade(el, `${css}\n${bulma}`, SETS[property], valueOf),
  ];
};

// Bulma's prefixed build uses `bulma-`, so the prefixed case does too.
describe.each([
  ['unprefixed', ''],
  ['under a class prefix', 'bulma-'],
])('dividers in forced colors, %s', (label, prefix) => {
  const wrap = (node: React.ReactNode) =>
    prefix ? (
      <ConfigProvider classPrefix={prefix}>{node}</ConfigProvider>
    ) : (
      node
    );

  // ContextMenu.Divider is this component (its identity test is in
  // ContextMenu.test.tsx), so it gets the same rule.
  it(`draws Dropdown.Divider in CanvasText, whichever sheet loads last, ${label}`, () => {
    const { forced, outside } = rulesFor('components/dropdown', prefix);
    // Only forced colors: everywhere else the divider is Bulma's.
    expect(outside).toEqual([]);
    render(
      wrap(
        <Dropdown label="Menu" active>
          <Dropdown.Item>One</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item>Two</Dropdown.Item>
        </Dropdown>
      )
    );
    const hr = document.querySelector(`.${prefix}dropdown-divider`)!;
    expect(bothOrders(hr, forced, 'background-color', prefix)).toEqual([
      'canvastext',
      'canvastext',
    ]);
    expect(bothOrders(hr, forced, 'forced-color-adjust', prefix)).toEqual([
      'none',
      'none',
    ]);
  });

  // Where it's used, in a colored navbar's dropdown, so a rule Bulma or the
  // partial scopes by an ancestor reaches it.
  it(`draws Navbar.Divider in CanvasText, whichever sheet loads last, ${label}`, () => {
    const { forced } = rulesFor('components/navbar', prefix);
    render(
      wrap(
        <Navbar color="primary">
          <Navbar.Menu>
            <Navbar.Start>
              <Navbar.Dropdown hoverable>
                <Navbar.Link>More</Navbar.Link>
                <Navbar.DropdownMenu>
                  <Navbar.Item href="#a">One</Navbar.Item>
                  <Navbar.Divider />
                  <Navbar.Item href="#b">Two</Navbar.Item>
                </Navbar.DropdownMenu>
              </Navbar.Dropdown>
            </Navbar.Start>
          </Navbar.Menu>
        </Navbar>
      )
    );
    const hr = document.querySelector(`.${prefix}navbar-divider`)!;
    expect(bothOrders(hr, forced, 'background-color', prefix)).toEqual([
      'canvastext',
      'canvastext',
    ]);
    expect(bothOrders(hr, forced, 'forced-color-adjust', prefix)).toEqual([
      'none',
      'none',
    ]);
  });
});

// Bulma marks an active item with a fill and a text color, which forced
// colors replaces (#1876). `_dropdown.scss` gives every menu item a bar's
// width in Canvas there, and an active or selected one the bar in Highlight,
// as `_menu.scss` does for Menu. These check the rules and what they match.
describe.each([
  ['unprefixed', ''],
  ['under a class prefix', 'bestax-'],
])('the active item in forced colors, %s', (_label, prefix) => {
  const itemRules = () => {
    const { rules, nested } = rulesOf(
      compilePartial('components/dropdown', prefix)
    );
    expect(rules).toEqual([]);
    const found = nested
      .filter(
        ({ within, rule }) =>
          within === FORCED && /dropdown-item/.test(rule.selectorText)
      )
      .map(({ rule }) => rule);
    expect(found).toHaveLength(2);
    return found;
  };

  it('reserves the bar on every item and colors it on an active or selected one', () => {
    const [every, current] = itemRules();
    expect(every.style.getPropertyValue('border-inline-start')).toBe(
      '0.25em solid Canvas'
    );
    // The same items, when active or selected.
    for (const state of ['is-active', 'is-selected']) {
      expect(current.selectorText).toContain(
        `${every.selectorText}.${prefix}${state}`
      );
    }
    expect(current.style.getPropertyValue('border-inline-start-color')).toBe(
      'highlight'
    );
    // Inherited, so on an item it would leave an icon or a tag in the label
    // in its author colors. Only the divider opts out.
    expect(every.style.getPropertyValue('forced-color-adjust')).toBe('');
  });

  it('marks the active Dropdown and ContextMenu items, and no combobox option, even one inside the menu', () => {
    const [every, current] = itemRules();
    render(
      <ConfigProvider classPrefix={prefix}>
        <Dropdown label="Workspace" active closeOnClick={false}>
          <Dropdown.Item as="button">Design</Dropdown.Item>
          <Dropdown.Item as="button" active>
            Marketing
          </Dropdown.Item>
          {/* Choices in a group, as APG's radio menu has them. */}
          <div role="group" aria-label="Sort">
            <Dropdown.Item
              as="button"
              role="menuitemradio"
              aria-checked
              active
              aria-current={false}
            >
              Name
            </Dropdown.Item>
            <Dropdown.Item
              as="button"
              role="menuitemradio"
              aria-checked={false}
              className={`${prefix}is-selected`}
            >
              Date
            </Dropdown.Item>
          </div>
          {/* An Autocomplete's list in the menu: a menu of its own. */}
          <div className={`${prefix}dropdown-menu`}>
            <div className={`${prefix}dropdown-content`} role="listbox">
              <a
                className={`${prefix}dropdown-item ${prefix}is-active`}
                role="option"
                aria-selected
              >
                Nested option
              </a>
            </div>
          </div>
        </Dropdown>
        <ContextMenu
          aria-label="Actions"
          trigger={<div data-testid="row">Row</div>}
        >
          <ContextMenu.Item as="button">Rename</ContextMenu.Item>
          <ContextMenu.Item as="button" active>
            Share
          </ContextMenu.Item>
        </ContextMenu>
        {/* A combobox's list beside the menus. */}
        <div className={`${prefix}dropdown-menu`} role="listbox">
          <div className={`${prefix}dropdown-content`}>
            <a
              className={`${prefix}dropdown-item ${prefix}is-active`}
              role="option"
              aria-selected
            >
              Option
            </a>
          </div>
        </div>
      </ConfigProvider>
    );
    fireEvent.contextMenu(screen.getByTestId('row'));
    const names = [
      'Design',
      'Marketing',
      'Name',
      'Date',
      'Nested option',
      'Rename',
      'Share',
      'Option',
    ];
    const matched = (rule: CSSStyleRule) =>
      names.filter(name => screen.getByText(name).matches(rule.selectorText));
    expect(matched(every)).toEqual([
      'Design',
      'Marketing',
      'Name',
      'Date',
      'Rename',
      'Share',
    ]);
    expect(matched(current)).toEqual(['Marketing', 'Name', 'Date', 'Share']);
  });
});

// Bulma draws the menu's box with a shadow and no border, and forced colors
// drops shadows (#1952), so `_dropdown.scss` outlines the box there.
describe.each([
  ['unprefixed', ''],
  ['under a class prefix', 'bulma-'],
])('the menu’s edge in forced colors, %s', (label, prefix) => {
  const wrap = (node: React.ReactNode) =>
    prefix ? (
      <ConfigProvider classPrefix={prefix}>{node}</ConfigProvider>
    ) : (
      node
    );

  it(`outlines a Dropdown's and a ContextMenu's box in CanvasText, whichever sheet loads last, ${label}`, () => {
    const { forced } = rulesFor('components/dropdown', prefix);
    render(
      wrap(
        <>
          <Dropdown label="Menu" active closeOnClick={false}>
            <Dropdown.Item>One</Dropdown.Item>
            {/* A combobox's list in the menu, which keeps its own rules. */}
            <div className={`${prefix}dropdown-menu`}>
              <div className={`${prefix}dropdown-content`} role="listbox" />
            </div>
          </Dropdown>
          <ContextMenu
            aria-label="Actions"
            trigger={<div data-testid="row">Row</div>}
          >
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu>
        </>
      )
    );
    fireEvent.contextMenu(screen.getByTestId('row'));
    const boxes = Array.from(
      document.querySelectorAll(`.${prefix}dropdown-content`)
    );
    expect(boxes).toHaveLength(3);
    const outline = (box: Element) => [
      ...bothOrders(box, forced, 'outline', prefix),
      ...bothOrders(box, forced, 'outline-offset', prefix),
    ];
    const edge = [
      '1px solid CanvasText',
      '1px solid CanvasText',
      '-1px',
      '-1px',
    ];
    expect(boxes.map(outline)).toEqual([
      // The Dropdown's, the combobox's inside it, and the ContextMenu's,
      // which is portaled to the end of <body>.
      edge,
      [undefined, undefined, undefined, undefined],
      edge,
    ]);
  });
});
