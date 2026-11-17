// Bulma draws `.dropdown-divider` and `.navbar-divider` as a background with
// no border, which forced colors paints in Canvas, the menu's own color, so
// both lines vanish (#1859). `_dropdown.scss` and `_navbar.scss` draw them in
// CanvasText there. jsdom evaluates no media query and doesn't rank rules
// across sheets, so these compile the real partials, lift their
// `forced-colors: active` rules to the top level, as a browser on a
// forced-colors page applies them, link them with Bulma's CSS on either
// side, and resolve each divider through `css-cascade`.
import type React from 'react';
import { render } from '@testing-library/react';
import { Dropdown } from '../Dropdown';
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
