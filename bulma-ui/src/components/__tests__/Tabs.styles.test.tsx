// The keyboard focus ring of a Tabs.Tab comes from _tabs.scss, which jsdom
// never loads on its own, so className assertions cannot see it. These
// compile the real partial and assert computed style instead (pattern:
// Collapses.styles.test.tsx). jsdom leaves `var()` unresolved, so values
// that read a variable are compared as written.
import * as sass from 'sass';
import path from 'path';
import { act, render, screen } from '@testing-library/react';
import Tabs, { type TabsProps } from '../Tabs';

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
    expect(getComputedStyle(link(tab('One'))).outlineColor).toBe('');
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
    expect(getComputedStyle(home).outlineOffset).toBe('');
    expect(getComputedStyle(home).outlineColor).toBe('');
  });
});
