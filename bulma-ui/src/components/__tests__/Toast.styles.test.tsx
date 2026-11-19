// `_toast.scss` is all that fixes a toast stack to its place on the screen,
// so these compile it, with no prefix and under one, and read where each
// position puts the stack. While an overlay locks the page, the window's
// edges take back the room the page's scrollbar had, and the lock sets it on
// `<html>`; a stack adds it on its side so it stays put as the scrollbar
// goes. With no lock each variable falls back to 0. In forced colors the
// partial gives the toast an edge and the cancel button full strength (#1906).
import type { ComponentProps } from 'react';
import { act, render, screen } from '@testing-library/react';
import { Toast } from '../Toast';
import { ConfigProvider } from '../../helpers/Config';
import {
  compilePartial,
  rulesOf as parseSheet,
} from '../../__tests__/css-cascade';

const compile = (prefix: string) => compilePartial('components/toast', prefix);

/** Each selector in the sheet with its declarations, merged across rules. */
function rulesOf(css: string): Map<string, Record<string, string>> {
  const rules = new Map<string, Record<string, string>>();
  const plain = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Keyframes and media blocks nest rules, which this reader doesn't.
    .replace(/@(?:keyframes|media)[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  for (const [, head, body] of plain.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const declarations: Record<string, string> = {};
    for (const declaration of body.split(';')) {
      const at = declaration.indexOf(':');
      if (at < 0) continue;
      declarations[declaration.slice(0, at).trim()] = declaration
        .slice(at + 1)
        .replace(/\s+/g, ' ')
        .trim();
    }
    for (const selector of head.split(',')) {
      const key = selector.replace(/\s+/g, ' ').trim();
      rules.set(key, { ...rules.get(key), ...declarations });
    }
  }
  return rules;
}

const PLAIN = rulesOf(compile(''));
const PREFIXED = rulesOf(compile('bestax-'));

const left = 'var(--bulma-scroll-lock-offset-left, 0px)';
const right = 'var(--bulma-scroll-lock-offset-right, 0px)';
const centered = `calc(50% + (${left} - ${right}) / 2)`;

/** Where a position's rule puts the stack: its edges and transform. */
const placement = (rules: Map<string, Record<string, string>>, key: string) => {
  const rule = rules.get(key) ?? {};
  return Object.fromEntries(
    ['top', 'bottom', 'left', 'right', 'transform']
      .filter(property => property in rule)
      .map(property => [property, rule[property]])
  );
};

describe('Toast container styles', () => {
  it('fixes the stack, no wider than the window was before a scroll lock', () => {
    expect(PLAIN.get('.toast-container')).toMatchObject({
      position: 'fixed',
      'max-width': `calc(100% - ${left} - ${right})`,
    });
  });

  it.each([
    ['top-right', { top: '0', right }],
    ['top-left', { top: '0', left }],
    ['top-center', { top: '0', left: centered, transform: 'translateX(-50%)' }],
    ['bottom-right', { bottom: '0', right }],
    ['bottom-left', { bottom: '0', left }],
    [
      'bottom-center',
      { bottom: '0', left: centered, transform: 'translateX(-50%)' },
    ],
  ])(
    'puts the %s stack against its edge plus the room a scroll lock gives back there',
    (position, edges) => {
      // A centered stack moves by half of what the two sides take back.
      expect(placement(PLAIN, `.toast-container.is-${position}`)).toEqual(
        edges
      );
    }
  );

  it('prefixes every selector under a class prefix', () => {
    expect(
      placement(PREFIXED, '.bestax-toast-container.bestax-is-top-right')
    ).toEqual({ top: '0', right });
    expect(
      [...PREFIXED.keys()].filter(selector => !selector.includes('.bestax-'))
    ).toEqual([]);
  });
});

const FORCED = '@media (forced-colors: active)';

// Forced colors drop the toast's shadow and paint its fill in the page's own
// Canvas, so it had no edge, and they keep an element's opacity, so the cancel
// button's text stayed faded (#1906).
describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('Toast in forced colors, with %s', (_label, prefix) => {
  const { rules, nested } = parseSheet(compile(prefix));
  const forced = nested
    .filter(({ within }) => within === FORCED)
    .map(({ rule }) => rule);

  /**
   * What the forced-colors rules declare for `el`, merged in source order,
   * from every rule with a selector that lands on it. jsdom evaluates no media
   * query, so they're read rather than computed. A system color reads back in
   * whatever case jsdom keeps, so values are lowercased.
   */
  const forcedOn = (el: Element) => {
    const out: Record<string, string> = {};
    for (const rule of forced) {
      // A comma inside brackets, as in `:not(a, b)`, doesn't split the list.
      const lands = rule.selectorText
        .split(/,(?![^(]*\))/)
        .some(part => el.matches(part.trim()));
      if (!lands) continue;
      for (const name of Array.from(rule.style)) {
        out[name] = rule.style.getPropertyValue(name).trim().toLowerCase();
      }
    }
    return out;
  };

  /** Where a rule's top-level rule, itself or its block, sits in the sheet. */
  const placeOf = (rule: CSSStyleRule) => {
    const top = (rule.parentRule ?? rule) as CSSRule;
    return Array.from(top.parentStyleSheet!.cssRules).indexOf(top);
  };

  const renderToast = (props: Partial<ComponentProps<typeof Toast>> = {}) =>
    render(
      <ConfigProvider classPrefix={prefix || undefined}>
        <Toast
          inline
          indefinite
          closable
          message="Item deleted"
          cancelText="Dismiss"
          actionText="Undo"
          {...props}
        />
      </ConfigProvider>
    );

  it('draws the toast an edge inside itself in the system text color', () => {
    renderToast();
    expect(forcedOn(screen.getByRole('alert'))).toEqual({
      outline: '1px solid canvastext',
      'outline-offset': '-1px',
    });
  });

  it('leaves the browser’s focus ring on a toast given a tabIndex while it shows', () => {
    renderToast({ tabIndex: 0 });
    const toastEl = screen.getByRole('alert');
    act(() => {
      toastEl.focus();
    });
    // jsdom matches :focus-visible for focus a script moves, as a browser
    // does when the last input was a key.
    expect(toastEl.matches(':focus-visible')).toBe(true);
    expect(forcedOn(toastEl)).toEqual({});
  });

  it('draws the cancel button at full strength, over the rule that fades it', () => {
    renderToast();
    const cancel = screen.getByRole('button', { name: 'Dismiss' });
    expect(forcedOn(cancel)).toEqual({ opacity: '1' });
    // The forced rule wins by coming later with the same selector, so moving
    // it above the rule that fades the button, or giving that rule another
    // class, would undo the fix while the rule above still reads `1`.
    const fades = rules.filter(
      rule => rule.style.opacity && cancel.matches(rule.selectorText)
    );
    const restores = forced.filter(
      rule => rule.style.opacity && cancel.matches(rule.selectorText)
    );
    expect(fades.map(rule => rule.style.opacity)).toEqual(['0.7']);
    expect(restores).toHaveLength(1);
    expect(restores[0].selectorText).toBe(fades[0].selectorText);
    expect(placeOf(restores[0])).toBeGreaterThan(placeOf(fades[0]));
  });

  it('sets nothing on the action and close buttons', () => {
    renderToast();
    expect(forcedOn(screen.getByRole('button', { name: 'Undo' }))).toEqual({});
    expect(forcedOn(screen.getByRole('button', { name: 'Close' }))).toEqual({});
  });
});
