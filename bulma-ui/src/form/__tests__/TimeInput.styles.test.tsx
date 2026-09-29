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

/** Every custom property a `(max-width: …)` media block in the sheet sets. */
function mobileCustomProperties(sheet: CSSStyleSheet): string[] {
  const names = new Set<string>();
  for (const rule of Array.from(sheet.cssRules)) {
    if (!(rule instanceof CSSMediaRule)) continue;
    if (!/max-width/.test(rule.media.mediaText)) continue;
    for (const inner of Array.from(rule.cssRules)) {
      if (!(inner instanceof CSSStyleRule)) continue;
      for (let i = 0; i < inner.style.length; i++) {
        const name = inner.style[i];
        if (name.startsWith('--')) names.add(name);
      }
    }
  }
  return [...names];
}

describe('TimeInput mobile overrides', () => {
  // The small-viewport block adjusts the wheels and the popover by setting
  // custom properties. Setting one that no rule reads changes nothing, so
  // each has to appear in a `var()` somewhere in the full stylesheet.
  it('sets only custom properties that some rule reads', () => {
    const set = mobileCustomProperties(styleEl.sheet as CSSStyleSheet);
    expect(set.length).toBeGreaterThan(0);

    const shipped = compile('bestax.scss');
    const unread = set.filter(
      name => !new RegExp(`var\\(\\s*${name}\\s*[,)]`).test(shipped)
    );
    expect(unread).toEqual([]);
  });
});
