// The keyboard focus ring of a Tabs.Tab comes from _tabs.scss, which jsdom
// never loads on its own, so className assertions cannot see it. These
// compile the real partial and assert computed style instead (pattern:
// Collapses.styles.test.tsx). jsdom leaves `var()` unresolved, so values
// that read a variable are compared as written.
import * as sass from 'sass';
import path from 'path';
import { act, render, screen } from '@testing-library/react';
import Tabs, { type TabsProps } from '../Tabs';
import { ConfigProvider } from '../../helpers/Config';

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
    expect(borders(right)).toEqual({
      'border-inline-end': 'none',
      'border-inline-start': EDGE,
    });
    expect(borders(`${right} > li a`)).toEqual({
      'border-inline-end': 'none',
      'border-inline-start': '2px solid transparent',
    });
    expect(borders(`${right} > li${p('is-active')} a`)).toEqual({
      'border-inline-start-color': 'var(--bulma-link)',
      'border-inline-end-color': 'transparent',
    });
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
