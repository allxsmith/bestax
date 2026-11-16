// The keyboard focus ring of a Tabs.Tab comes from _tabs.scss, which jsdom
// never loads on its own, so className assertions cannot see it. These
// compile the real partial and assert computed style instead (pattern:
// Collapses.styles.test.tsx). jsdom leaves `var()` unresolved, so values
// that read a variable are compared as written. jsdom evaluates no media
// query either, so the forced-colors suite below reads its rules another
// way, which its own comment describes.
import * as sass from 'sass';
import path from 'path';
import { act, render, screen } from '@testing-library/react';
import Tabs, { type TabsProps } from '../Tabs';
import { ConfigProvider } from '../../helpers/Config';
import {
  bulmaCss,
  cascade,
  compilePartial,
  matches,
  splitList,
} from '../../__tests__/css-cascade';

let styleEl: HTMLStyleElement;

beforeAll(() => {
  const result = sass.compile(
    path.resolve(__dirname, '../../scss/components/_tabs.scss'),
    {
      loadPaths: [path.resolve(__dirname, '../../../../node_modules')],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  );
  styleEl = document.createElement('style');
  styleEl.textContent = result.css;
  document.head.appendChild(styleEl);
});

afterAll(() => {
  styleEl.remove();
});

const FOCUS_COLOR =
  'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))';

// What jsdom computes for an outline no rule sets: the initial values.
const NO_OUTLINE_COLOR = 'rgba(0, 0, 0, 0)';
const NO_OUTLINE_OFFSET = '0';

const renderTabs = (props: Partial<TabsProps> = {}) =>
  render(
    <Tabs {...props}>
      <Tabs.List>
        <Tabs.Tab index={0}>One</Tabs.Tab>
        <Tabs.Tab index={1}>Two</Tabs.Tab>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Content.Item index={0}>One panel</Tabs.Content.Item>
        <Tabs.Content.Item index={1}>Two panel</Tabs.Content.Item>
      </Tabs.Content>
    </Tabs>
  );

// Found by text, not by role: a role query reads each element's computed
// style, and jsdom keeps that until the DOM next changes, which focusing an
// element does not do. A stale entry would hide the :focus-visible rules.
const tab = (name: string) =>
  screen.getByText(name).closest('li') as HTMLLIElement;
const link = (el: HTMLElement) => el.querySelector('a') as HTMLAnchorElement;

describe('Tabs focus ring', () => {
  it('draws the ring inside the focused tab’s <a> and none on the <li>', () => {
    renderTabs();
    act(() => tab('Two').focus());
    const li = getComputedStyle(tab('Two'));
    const a = getComputedStyle(link(tab('Two')));
    expect(li.outline).toBe('none');
    expect(a.outlineColor).toBe(FOCUS_COLOR);
    expect(a.outlineStyle).toBe('var(--bulma-focus-style)');
    expect(a.outlineWidth).toBe('var(--bulma-focus-width)');
    expect(a.outlineOffset).toBe('calc(-1 * var(--bulma-focus-width))');
  });

  it('draws no ring on a tab without focus', () => {
    renderTabs();
    act(() => tab('Two').focus());
    expect(getComputedStyle(link(tab('One'))).outlineColor).toBe(
      NO_OUTLINE_COLOR
    );
  });

  it('sets the ring off the fill of a selected toggle tab', () => {
    renderTabs({ toggle: true });
    act(() => tab('One').focus());
    const a = getComputedStyle(link(tab('One')));
    // currentColor: the tab's text colour, which Bulma sets from its own
    // toggle variables. jsdom resolves it to the computed `color`.
    expect(a.outlineColor).not.toBe(FOCUS_COLOR);
    expect(a.outlineColor).toBe(a.color);
    expect(a.outlineOffset).toBe('calc(-2 * var(--bulma-focus-width))');
  });

  it('keeps the focus colour on an unselected toggle tab', () => {
    renderTabs({ toggle: true });
    act(() => tab('Two').focus());
    const a = getComputedStyle(link(tab('Two')));
    expect(a.outlineColor).toBe(FOCUS_COLOR);
    expect(a.outlineOffset).toBe('calc(-1 * var(--bulma-focus-width))');
  });

  it('dims a disabled tab and keeps the pointer off its link', () => {
    render(
      <Tabs>
        <Tabs.List>
          <Tabs.Tab index={0}>One</Tabs.Tab>
          <Tabs.Tab index={1} disabled>
            Two
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
    );
    const a = getComputedStyle(link(tab('Two')));
    expect(getComputedStyle(tab('Two')).cursor).toBe('not-allowed');
    expect(a.opacity).toBe('0.5');
    // Hover and clicks fall through to the <li>, so Bulma's hover colours
    // never light up a tab that can't be picked.
    expect(a.pointerEvents).toBe('none');
    expect(getComputedStyle(tab('One')).cursor).not.toBe('not-allowed');
    expect(getComputedStyle(link(tab('One'))).opacity).not.toBe('0.5');
    expect(getComputedStyle(link(tab('One'))).pointerEvents).not.toBe('none');
  });

  it('leaves the links of a Tabs.Item navigation to Bulma', () => {
    render(
      <Tabs>
        <Tabs.List>
          <Tabs.Item active>
            <a href="/home">Home</a>
          </Tabs.Item>
        </Tabs.List>
      </Tabs>
    );
    const home = screen.getByRole('link', { name: 'Home' });
    act(() => home.focus());
    expect(getComputedStyle(home).outlineOffset).toBe(NO_OUTLINE_OFFSET);
    expect(getComputedStyle(home).outlineColor).toBe(NO_OUTLINE_COLOR);
  });
});

// Bulma marks the active tab with colors alone, which forced colors replaces,
// so `_tabs.scss` draws a bar in Highlight along the active tab's bottom
// there (#1885). jsdom evaluates no media query, and which value wins is a
// cascade across Bulma's sheet and the partial, in either order, so these
// compile the real partial, link it with Bulma's own CSS on either side, lift
// the forced-colors block's rules out of it, as a forced-colors page applies
// them, and resolve each property with the shared cascade. The cascade skips
// pseudo-elements, so the bar's own rules are read off the sheet.
describe('the active tab on a forced-colors page', () => {
  const FORCED = '(forced-colors: active)';

  /** The sheet's top-level rules, parsed once per sheet. */
  const parsed = new Map<string, CSSRule[]>();
  const parse = (css: string) => {
    const known = parsed.get(css);
    if (known) return known;
    const sheet = document.createElement('style');
    sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
    document.head.appendChild(sheet);
    try {
      const rules = Array.from((sheet.sheet as CSSStyleSheet).cssRules);
      parsed.set(css, rules);
      return rules;
    } finally {
      sheet.remove();
    }
  };

  /**
   * The sheet as a page with forced colors on reads it: the forced-colors
   * block's rules in its place.
   */
  const forcedPage = (css: string) =>
    parse(css)
      .flatMap(rule =>
        rule instanceof CSSMediaRule && rule.conditionText === FORCED
          ? Array.from(rule.cssRules, inner => inner.cssText)
          : [rule.cssText]
      )
      .join('\n');

  /** What the rules give one property, read as it's declared. */
  const valueOf = (el: Element, css: string, ...properties: string[]) =>
    cascade(
      el,
      css,
      properties,
      (style, property) => style.getPropertyValue(property).trim() || undefined
    );

  /**
   * The declarations of every top-level `::after` rule whose element part
   * matches `el`, in source order, leaving out Bulma's `*::after` box sizing,
   * which reaches every element and draws nothing.
   */
  const afterOf = (el: Element, css: string) =>
    parse(css)
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .flatMap(rule =>
        splitList(rule.selectorText)
          .filter(part => part.endsWith('::after') && part !== '*::after')
          .filter(part => matches(el, part.slice(0, -'::after'.length)))
          .map(() => rule.style.cssText)
      );

  const bar = (color: string) =>
    'content: ""; position: absolute; z-index: -1; inset-inline: 1em; ' +
    `bottom: 0px; height: 0.25em; background-color: ${color};`;
  const BAR = bar('highlight');

  const STYLES: [string, Partial<TabsProps>][] = [
    ['plain', {}],
    ['boxed', { boxed: true }],
    ['toggle', { toggle: true }],
    ['rounded toggle', { toggle: true, rounded: true }],
    ['vertical', { vertical: true }],
  ];

  /** Two Tabs.Tabs, the first selected, and the links inside each. */
  const renderStyle = (prefix: string, props: Partial<TabsProps>) => {
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>
        <Tabs {...props}>
          <Tabs.List>
            <Tabs.Tab index={0}>One</Tabs.Tab>
            <Tabs.Tab index={1}>Two</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>One panel</Tabs.Content.Item>
            <Tabs.Content.Item index={1}>Two panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      </ConfigProvider>
    );
    const [active, other] = Array.from(
      container.querySelectorAll('li[role="tab"] > a')
    );
    expect(active.parentElement).toHaveClass(`${prefix}is-active`);
    expect(other.parentElement).not.toHaveClass(`${prefix}is-active`);
    return { active, other };
  };

  // Bulma's CSS can land on either side of the extras: `bestax-no-dark-mode`
  // emits them first, and an app can link `extras.css` before its own Bulma.
  describe.each([
    ['the partial after Bulma', '', 'bulma.css', true],
    ['the partial before Bulma', '', 'bulma.css', false],
    [
      'a prefixed build, the partial after Bulma',
      'bulma-',
      'versions/bulma-prefixed.css',
      true,
    ],
    [
      'a prefixed build, the partial before Bulma',
      'bulma-',
      'versions/bulma-prefixed.css',
      false,
    ],
  ])('with %s', (_order, prefix, bulmaFile, after) => {
    const partial = compilePartial('components/tabs', prefix);
    const css = forcedPage(
      after ? bulmaCss(bulmaFile) + partial : partial + bulmaCss(bulmaFile)
    );

    it.each(STYLES)(
      'draws the bar on the %s style’s active tab, and on no other',
      (_style, props) => {
        const { active, other } = renderStyle(prefix, props);
        // The bar is the only `::after` on a tab's link, Bulma's or ours.
        expect(afterOf(active, css)).toEqual([BAR]);
        expect(afterOf(other, css)).toEqual([]);
      }
    );

    // Only the toggle style positions its links in Bulma, so the plain style
    // is the one that shows the partial positioning the active tab itself.
    // Isolation makes the tab a stacking context, so the bar's -1 puts it
    // over the tab's background and under its label and focus ring.
    it('positions the active tab for the bar, and stacks the bar behind its label', () => {
      const { active } = renderStyle(prefix, {});
      expect(valueOf(active, css, 'position')).toBe('relative');
      expect(valueOf(active, css, 'isolation')).toBe('isolate');
    });

    // In the toggle style, whose selected label Bulma colors too.
    it('draws a disabled tab at full strength in GrayText, and a selected one’s bar too', () => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Tabs toggle>
            <Tabs.List>
              <Tabs.Tab index={0} disabled>
                One
              </Tabs.Tab>
              <Tabs.Tab index={1} disabled>
                Two
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </ConfigProvider>
      );
      const [selected, other] = Array.from(
        container.querySelectorAll('li[aria-disabled="true"] > a')
      );
      expect(selected.parentElement).toHaveClass(`${prefix}is-active`);
      expect(afterOf(selected, css)).toEqual([
        BAR,
        'background-color: graytext;',
      ]);
      expect(afterOf(other, css)).toEqual([]);
      for (const tab of [selected, other]) {
        expect(valueOf(tab, css, 'opacity')).toBe('1');
        expect(valueOf(tab, css, 'color')).toBe('graytext');
      }
    });

    it('draws the bar on a link in an active Tabs.Item too', () => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix}>
          <Tabs>
            <Tabs.List>
              <Tabs.Item active>
                <a href="/home">Home</a>
              </Tabs.Item>
              <Tabs.Item>
                <a href="/profile">Profile</a>
              </Tabs.Item>
            </Tabs.List>
          </Tabs>
        </ConfigProvider>
      );
      const [home, profile] = Array.from(container.querySelectorAll('a'));
      expect(afterOf(home, css)).toEqual([BAR]);
      expect(afterOf(profile, css)).toEqual([]);
    });
  });

  // A fill would need `forced-color-adjust: none`, which an icon, a tag and
  // the focus ring inside would inherit.
  it('leaves every color of the tab and what’s in it to the browser', () => {
    expect(compilePartial('components/tabs')).not.toMatch(
      /forced-color-adjust/
    );
  });

  it('draws nothing on the active tab with Bulma alone, which is the bug', () => {
    const { active, other } = renderStyle('', { toggle: true });
    const bulma = forcedPage(bulmaCss());
    expect(afterOf(active, bulma)).toEqual([]);
    // Every color Bulma sets that tells the active tab apart, forced colors
    // replaces with the system's, so nothing else sets it apart either.
    for (const property of ['background-color', 'border-color', 'color']) {
      const set = (el: Element) => valueOf(el, bulma, property) !== undefined;
      expect([property, set(active)]).toEqual([property, true]);
      expect(valueOf(active, bulma, property)).not.toMatch(
        /^(highlight|highlighttext|canvas|canvastext)$/i
      );
    }
    expect(afterOf(other, bulma)).toEqual([]);
  });

  it.each([
    ['no prefix', ''],
    ['a class prefix', 'bulma-'],
  ])('changes nothing outside forced colors, with %s', (_label, prefix) => {
    const p = (name: string) => `.${prefix}${name}`;
    const rules = parse(compilePartial('components/tabs', prefix));
    const forced = rules.filter(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule && rule.conditionText === FORCED
    );
    const active = `${p('tabs')} li${p('is-active')}`;
    const disabled = 'li[role=tab][aria-disabled=true]';
    expect(
      forced.flatMap(block =>
        Array.from(block.cssRules, rule => (rule as CSSStyleRule).selectorText)
      )
    ).toEqual([
      `${active} a`,
      `${active} a::after`,
      `${p('tabs')}${p('tabs')} ${disabled} > a`,
      `${p('tabs')} ${disabled}${p('is-active')} > a::after`,
    ]);
    // Nothing outside the block, at the top level or in another at-rule,
    // draws a pseudo-element or a system color.
    const outside = rules
      .filter(rule => !forced.includes(rule as CSSMediaRule))
      .map(rule => rule.cssText)
      .join('\n');
    expect(outside).not.toMatch(/::after|highlight|graytext/i);
  });
});

// Vertical Tabs draw an edge between the list and the panel, and a marker on
// the selected tab against it (#1510). The row follows the page's direction,
// so right to left the list comes first at the right, and a physical
// `border-right` landed on the page's outer edge. jsdom maps no logical
// property to a physical side, so these read the rules off the compiled
// sheet, with no prefix and under one, and check where they land.
describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('vertical Tabs edge, with %s', (_label, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;
  const MOBILE = '@media screen and (max-width: 768px)';
  const TABLET = '@media screen and (min-width: 769px), print';
  const compiled = sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/tabs';`,
    {
      loadPaths: [
        path.resolve(__dirname, '../../scss'),
        path.resolve(__dirname, '../../../../node_modules'),
      ],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

  /** Every style rule, with the at-rule it sits in. */
  const rules = (() => {
    const sheet = document.createElement('style');
    sheet.textContent = compiled;
    document.head.appendChild(sheet);
    const out: { rule: CSSStyleRule; within: string }[] = [];
    const walk = (list: CSSRuleList, within: string) => {
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSStyleRule) out.push({ rule, within });
        else if ('cssRules' in rule) {
          walk(
            (rule as CSSGroupingRule).cssRules,
            rule.cssText.split('{')[0].trim()
          );
        }
      }
    };
    try {
      walk((sheet.sheet as CSSStyleSheet).cssRules, '');
    } finally {
      sheet.remove();
    }
    return out;
  })();

  /** The border declarations the rules for `selector` make, in `within`. */
  const borders = (selector: string, within = '') => {
    const out: Record<string, string> = {};
    for (const { rule } of rules.filter(
      r => r.within === within && r.rule.selectorText === selector
    )) {
      for (const [, name, value] of rule.style.cssText.matchAll(
        /(border[\w-]*):\s*([^;]+)/g
      )) {
        out[name] = value.trim();
      }
    }
    return out;
  };

  const root = `${p('tabs-root')}${p('is-vertical')}`;
  const list = `${root} > ${p('tabs')} > ul`;
  const right = `${root}${p('is-right')} > ${p('tabs')} > ul`;
  const EDGE =
    'var(--bulma-tabs-vertical-border-width) solid var(--bulma-tabs-vertical-border-color)';

  it('draws no border on a physical side', () => {
    const physical = rules.filter(({ rule }) =>
      /border-(left|right)/.test(rule.style.cssText)
    );
    expect(physical.map(({ rule }) => rule.selectorText)).toEqual([]);
  });

  it('puts the edge and the marker at the end of the list, where the panel is', () => {
    expect(borders(list)).toMatchObject({ 'border-inline-end': EDGE });
    expect(borders(`${list} > li a`)).toMatchObject({
      'border-inline-end': '2px solid transparent',
    });
    expect(borders(`${list} > li${p('is-active')} a`)).toMatchObject({
      'border-inline-end-color': 'var(--bulma-link)',
    });
  });

  it('moves them to the start of the list with side="right", where the panel is then', () => {
    expect(borders(right, TABLET)).toEqual({
      'border-inline-end': 'none',
      'border-inline-start': EDGE,
    });
    expect(borders(`${right} > li a`, TABLET)).toEqual({
      'border-inline-end': 'none',
      'border-inline-start': '2px solid transparent',
    });
    expect(borders(`${right} > li${p('is-active')} a`, TABLET)).toEqual({
      'border-inline-start-color': 'var(--bulma-link)',
      'border-inline-end-color': 'transparent',
    });
  });

  // The side="right" rules name one class more than the phone fallback, so
  // on a phone they kept the row and the side edge (#1520). They apply from
  // tablet up, and in print, where Bulma's own tablet query reaches.
  it('keeps every side="right" rule to tablet and up, where the tabs sit beside the panel', () => {
    const sideRight = rules.filter(({ rule }) =>
      rule.selectorText.includes(`${p('is-right')}`)
    );
    expect(sideRight.length).toBeGreaterThan(0);
    expect([...new Set(sideRight.map(({ within }) => within))]).toEqual([
      TABLET,
    ]);
  });

  it('starts the side="right" query where the phone fallback ends, whatever $tablet a build sets', () => {
    // Both read Bulma's `$tablet`, so a build that moves it moves both, and
    // no width gets both layouts or neither.
    const media = (tablet: string) => {
      const css = sass.compileString(
        `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}', $tablet: ${tablet});
         @use 'components/tabs';`,
        {
          loadPaths: [
            path.resolve(__dirname, '../../scss'),
            path.resolve(__dirname, '../../../../node_modules'),
          ],
          quietDeps: true,
          logger: sass.Logger.silent,
        }
      ).css;
      const of = (selector: string) =>
        css
          .split('@media ')
          .slice(1)
          .filter(block => block.split('}')[0].includes(selector))
          .map(block => block.split('{')[0].trim());
      return {
        phone: of(`${root} {`),
        side: of(`${root}${p('is-right')} {`),
      };
    };
    expect(media('1024px')).toEqual({
      phone: ['screen and (max-width: 1023px)'],
      side: ['screen and (min-width: 1024px), print'],
    });
    expect(media('600px')).toEqual({
      phone: ['screen and (max-width: 599px)'],
      side: ['screen and (min-width: 600px), print'],
    });
  });

  it('lays a side="right" Tabs out on a phone with exactly the rules a side="left" one gets', () => {
    // A phone reads the top-level rules and the phone fallback, and not the
    // tablet query. With no side="right" rule among them, the two match the
    // same rules on every element, so the list stacks above the panel with
    // only the bottom border.
    const phone = rules.filter(
      ({ within }) => within === '' || within === MOBILE
    );
    const matched = (side: 'left' | 'right') => {
      const { container, unmount } = render(
        <ConfigProvider classPrefix={prefix}>
          <Tabs vertical side={side}>
            <Tabs.List>
              <Tabs.Tab index={0}>One</Tabs.Tab>
              <Tabs.Tab index={1}>Two</Tabs.Tab>
            </Tabs.List>
            <Tabs.Content>
              <Tabs.Content.Item index={0}>One panel</Tabs.Content.Item>
              <Tabs.Content.Item index={1}>Two panel</Tabs.Content.Item>
            </Tabs.Content>
          </Tabs>
        </ConfigProvider>
      );
      const elements = [
        container.firstElementChild!,
        container.querySelector('ul')!,
        ...Array.from(container.querySelectorAll('li a')),
      ];
      const out = elements.map(el =>
        phone
          .filter(({ rule }) => el.matches(rule.selectorText))
          .map(({ rule, within }) => `${within} ${rule.selectorText}`)
      );
      unmount();
      return out;
    };
    const right = matched('right');
    expect(right).toEqual(matched('left'));
    // The root's own stacking rule is among them.
    expect(right[0]).toContain(`${MOBILE} ${root}`);
  });

  it('takes both sides off on a phone, where the list runs across the top', () => {
    expect(borders(list, MOBILE)).toMatchObject({ 'border-inline': 'none' });
    expect(borders(`${list} > li a`, MOBILE)).toMatchObject({
      'border-inline': 'none',
    });
  });

  it('lands on the list and the links a vertical Tabs renders, and the side="right" rules only there', () => {
    for (const side of ['left', 'right'] as const) {
      const { container, unmount } = render(
        <ConfigProvider classPrefix={prefix}>
          <Tabs vertical side={side}>
            <Tabs.List>
              <Tabs.Tab index={0}>One</Tabs.Tab>
            </Tabs.List>
            <Tabs.Content>
              <Tabs.Content.Item index={0}>One panel</Tabs.Content.Item>
            </Tabs.Content>
          </Tabs>
        </ConfigProvider>
      );
      const ul = container.querySelector('ul')!;
      const a = container.querySelector('li a')!;
      expect([side, ul.matches(list), a.matches(`${list} > li a`)]).toEqual([
        side,
        true,
        true,
      ]);
      expect([side, ul.matches(right)]).toEqual([side, side === 'right']);
      unmount();
    }
  });
});
