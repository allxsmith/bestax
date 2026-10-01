// A class or a custom property reaching the stylesheet says nothing about
// whether anything reads it, which is how `color` sat dead on the wheels until
// #701 and the mobile overrides wrote names no rule used. These compile the
// real SCSS and check what it actually does.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { TimeInput } from '../TimeInput';

const compile = (file: string) =>
  sass.compile(path.resolve(__dirname, '../../scss', file), {
    loadPaths: [path.resolve(__dirname, '../../../../node_modules')],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css;

let styleEl: HTMLStyleElement;

beforeAll(() => {
  styleEl = document.createElement('style');
  styleEl.textContent = compile('form/_timeinput.scss');
  document.head.appendChild(styleEl);
});

afterAll(() => {
  styleEl.remove();
});

const colors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

describe('TimeInput wheel colour styles', () => {
  it.each(colors)(
    'points the band and the selected value at %s on each wheel',
    color => {
      const { getAllByRole } = render(
        <TimeInput inline color={color} enableSeconds />
      );
      for (const wheel of getAllByRole('spinbutton')) {
        const style = getComputedStyle(wheel);
        expect(
          style.getPropertyValue('--bulma-timeinput-wheel-selected-bg').trim()
        ).toBe(`var(--bulma-${color})`);
        expect(
          style
            .getPropertyValue('--bulma-timeinput-wheel-selected-color')
            .trim()
        ).toBe(`var(--bulma-${color}-invert)`);
      }
    }
  );

  it('leaves an uncoloured wheel on the inherited default', () => {
    const { getAllByRole } = render(<TimeInput inline />);
    for (const wheel of getAllByRole('spinbutton')) {
      expect(
        getComputedStyle(wheel)
          .getPropertyValue('--bulma-timeinput-wheel-selected-bg')
          .trim()
      ).toBe('');
    }
  });
});

/** Every top-level style rule whose selector is a keyboard focus state. */
function focusRules(sheet: CSSStyleSheet): CSSStyleRule[] {
  return Array.from(sheet.cssRules).filter(
    (rule): rule is CSSStyleRule =>
      rule instanceof CSSStyleRule &&
      rule.selectorText.includes(':focus-visible')
  );
}

describe('TimeInput focus ring', () => {
  // The wheel carries a mask, and the mask clips everything outside the
  // wheel's border box, so an outline on the wheel itself (which sits outside
  // it) never paints. The ring goes inset on the band, which the mask leaves
  // whole.
  it('puts no ring on the masked wheel itself', () => {
    const own = focusRules(styleEl.sheet as CSSStyleSheet).filter(
      r => r.selectorText === '.timeinput-wheel:focus-visible'
    );
    for (const rule of own) {
      expect(rule.style.getPropertyValue('outline')).toBe('');
      expect(rule.style.getPropertyValue('outline-style')).toBe('');
    }
  });

  it('draws it inset on the band in the selected value colour', () => {
    // It sits on the selection fill, which follows `color`, and the selected
    // value's colour is the one chosen to contrast with that fill.
    const band = focusRules(styleEl.sheet as CSSStyleSheet).find(
      r =>
        r.selectorText ===
        '.timeinput-wheel:focus-visible .timeinput-wheel-band'
    );
    expect(band?.style.getPropertyValue('outline')).toBe(
      '2px solid var(--bulma-timeinput-wheel-selected-color)'
    );
    expect(band?.style.getPropertyValue('outline-offset')).toBe('-2px');
  });
});

/** Every custom property the style rules in a list set, media blocks skipped. */
function customProperties(rules: CSSRuleList): string[] {
  const names = new Set<string>();
  for (const rule of Array.from(rules)) {
    if (!(rule instanceof CSSStyleRule)) continue;
    for (let i = 0; i < rule.style.length; i++) {
      const name = rule.style[i];
      if (name.startsWith('--')) names.add(name);
    }
  }
  return [...names];
}

/** Every custom property a `(max-width: …)` media block in the sheet sets. */
function mobileCustomProperties(sheet: CSSStyleSheet): string[] {
  const names = new Set<string>();
  for (const rule of Array.from(sheet.cssRules)) {
    if (!(rule instanceof CSSMediaRule)) continue;
    if (!/max-width/.test(rule.media.mediaText)) continue;
    for (const name of customProperties(rule.cssRules)) names.add(name);
  }
  return [...names];
}

/** The names no `var()` in the shipped stylesheet reads. */
let shipped: string | undefined;
function unread(names: string[]): string[] {
  shipped ??= compile('bestax.scss');
  const css = shipped;
  return names.filter(
    name => !new RegExp(`var\\(\\s*${name}\\s*[,)]`).test(css)
  );
}

describe('TimeInput variables', () => {
  // A registered variable nothing reads is a theming knob that turns nothing,
  // which is where the wheel background and hover fill sat. The item height
  // is left that way on purpose: the wheels position items from a height the
  // component passes them, and dropping the Sass variable would break a theme
  // that sets it. So it is named here, and has to stay unread to stay named.
  const UNREAD = ['--bulma-timeinput-wheel-item-height'];

  it('registers only variables that some rule reads', () => {
    const registered = customProperties(
      (styleEl.sheet as CSSStyleSheet).cssRules
    );
    expect(registered).toEqual(expect.arrayContaining(UNREAD));
    expect(unread(registered)).toEqual(UNREAD);
  });

  it('leaves the wheel background transparent by default', () => {
    // The wheel sits on the popover, the inline frame or DateTimeInput's time
    // card, each with a background variable of its own. Any other default
    // would paint over whichever of those a theme had changed.
    const { container } = render(<TimeInput inline />);
    const root = container.querySelector<HTMLElement>('.timeinput');
    expect(root).not.toBeNull();
    expect(
      getComputedStyle(root as HTMLElement)
        .getPropertyValue('--bulma-timeinput-wheel-bg')
        .trim()
    ).toBe('transparent');
  });
});

/** Where each rule that paints the hover fill sits: a media query, or none. */
function hoverFillContexts(rules: CSSRuleList, media = ''): string[] {
  const found: string[] = [];
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSMediaRule) {
      found.push(...hoverFillContexts(rule.cssRules, rule.media.mediaText));
    } else if (rule instanceof CSSStyleRule) {
      for (let i = 0; i < rule.style.length; i++) {
        const name = rule.style[i];
        if (name.startsWith('--')) continue;
        if (
          rule.style
            .getPropertyValue(name)
            .includes('var(--bulma-timeinput-wheel-hover-bg)')
        ) {
          found.push(media || '(top level)');
        }
      }
    }
  }
  return found;
}

describe('TimeInput hover fill', () => {
  // A touch browser can leave `:hover` on the last item a finger lifted from,
  // and a drag leaves that item off the band, so an ungated fill sticks there.
  it('fills a hovered item only where the pointer can hover', () => {
    expect(
      hoverFillContexts((styleEl.sheet as CSSStyleSheet).cssRules)
    ).toEqual(['(hover: hover)']);
  });
});

describe('TimeInput mobile overrides', () => {
  // The small-viewport block adjusts the wheels and the popover by setting
  // custom properties. Setting one that no rule reads changes nothing, so
  // each has to appear in a `var()` somewhere in the full stylesheet.
  it('sets only custom properties that some rule reads', () => {
    const set = mobileCustomProperties(styleEl.sheet as CSSStyleSheet);
    expect(set.length).toBeGreaterThan(0);
    expect(unread(set)).toEqual([]);
  });
});
