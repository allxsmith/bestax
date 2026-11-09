// The fill is a gradient in `_slider.scss`, and jsdom drops a background
// whose gradient reads a variable, so the fill is read from the compiled
// sheet. Transforms and custom properties do come through jsdom's cascade,
// `:dir()` included, so the marks and the value bubble are read from
// computed style.
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Slider } from '../Slider';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const css = sass.compileString(`@use 'form/slider';`, {
  loadPaths: [SCSS, NODE_MODULES],
  quietDeps: true,
  logger: sass.Logger.silent,
}).css;

describe('Slider fill direction', () => {
  it('paints toward the right left to right, and toward the left right to left', () => {
    expect(css).toMatch(/linear-gradient\(\s*to right,/);
    expect(css).toContain('.slider-input:dir(rtl)');
    expect(css).toContain('.slider.is-range .slider-track:dir(rtl)');
    expect(css).toMatch(/linear-gradient\(\s*to left,/);
    // The vertical track grows upward. Its own direction is part of the
    // control, not the page's, so the page's direction doesn't repaint it.
    expect(css).toMatch(/linear-gradient\(\s*to top,/);
  });
});

describe('Slider in the cascade', () => {
  let sheet: HTMLStyleElement;
  beforeAll(() => {
    sheet = document.createElement('style');
    sheet.textContent = css;
    document.head.appendChild(sheet);
  });
  afterAll(() => sheet.remove());

  // A mark sits at its value's distance from the inline start, the native
  // thumb's side, and is centred on that point by its transform.
  it.each([
    ['ltr', 'translateX(-50%)'],
    ['rtl', 'translateX(50%)'],
  ])('places and centres a mark on a %s page', (dir, centring) => {
    const { container } = render(
      <div dir={dir}>
        <Slider marks={[{ value: 0, label: '0' }, { value: 100 }]} />
      </div>
    );
    const [min, max] = Array.from(
      container.querySelectorAll<HTMLElement>('.slider-tick')
    );
    // From the inline start, so 0 is at the right edge right to left, where
    // the thumb sits at the minimum. A `left` would hold it on the left.
    expect([min.style.insetInlineStart, max.style.insetInlineStart]).toEqual([
      '0%',
      '100%',
    ]);
    expect(min.style.left).toBe('');
    expect(getComputedStyle(min).transform).toBe(centring);
  });

  // The bubble sits at the thumb's distance from the inline start, so right
  // to left its right edge is there and centring it shifts it right.
  it.each([
    ['ltr', '-50%'],
    ['rtl', '50%'],
  ])('centres a bubble on a %s page by a shift of %s', (dir, shift) => {
    const { container } = render(
      <div dir={dir}>
        <Slider defaultValue={25} showOutput />
      </div>
    );
    const output = container.querySelector('.slider-output') as HTMLElement;
    expect(
      getComputedStyle(output).getPropertyValue('--slider-output-shift')
    ).toBe(shift);
  });

  it("sets the shift on each bubble, so a nested slider doesn't take its page's", () => {
    const { container } = render(
      <div dir="rtl">
        <div dir="ltr">
          <Slider defaultValue={25} showOutput />
        </div>
      </div>
    );
    const output = container.querySelector('.slider-output') as HTMLElement;
    expect(
      getComputedStyle(output).getPropertyValue('--slider-output-shift')
    ).toBe('-50%');
  });
});

// Forced colors turns the value bubble's fill into the page's and paints every
// side of its arrow, which then draws as a square (#1502). jsdom evaluates no
// media query, so the rules are read off the compiled sheet, with no prefix
// and under one.
describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('Slider value bubble in forced colors, with %s', (_label, prefix) => {
  const FORCED = '@media (forced-colors: active)';
  const p = (name: string) => `.${prefix}${name}`;
  const compiled = sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/slider';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

  /** Every style rule, with the at-rules it sits in, outermost first. */
  const rules = (() => {
    const sheet = document.createElement('style');
    sheet.textContent = compiled;
    document.head.appendChild(sheet);
    const out: { rule: CSSStyleRule; within: string[] }[] = [];
    const walk = (list: CSSRuleList, within: string[]) => {
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSStyleRule) out.push({ rule, within });
        else if ('cssRules' in rule) {
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
  })();

  const forced = (selector: string) =>
    rules.filter(
      ({ rule, within }) =>
        within.join() === FORCED && rule.selectorText === selector
    );
  const atTop = (selector: string) =>
    rules.filter(
      ({ rule, within }) => !within.length && rule.selectorText === selector
    );

  const bubble = p('slider-output');
  const arrow = `${bubble}::after`;

  it('outlines the bubble in the system text color, so its edge shows on the page', () => {
    const [box] = forced(bubble);
    expect(box).toBeDefined();
    // jsdom writes a system color in lowercase.
    expect(box.rule.style.getPropertyValue('outline').toLowerCase()).toBe(
      '1px solid canvastext'
    );
  });

  it('opts the arrow alone out of forced colors, and paints it in the system text color', () => {
    const [own] = forced(arrow);
    expect(own).toBeDefined();
    expect(own.rule.style.getPropertyValue('forced-color-adjust')).toBe('none');
    expect(
      own.rule.style.getPropertyValue('--bulma-slider-output-background').trim()
    ).toMatch(/^canvastext$/i);
    // The bubble keeps the user's palette: only the arrow, and the range
    // track that opted out before it, do.
    const optedOut = rules
      .filter(({ rule }) => rule.style.getPropertyValue('forced-color-adjust'))
      .map(({ rule }) => rule.selectorText);
    expect(optedOut).toEqual([
      `${p('slider')}${p('is-range')} ${p('slider-track')}`,
      arrow,
    ]);
  });

  // The color above reaches every way the arrow points because each one
  // paints its pointing side from the variable and leaves the rest
  // transparent.
  it.each([
    ['down', '', 'top'],
    ['up, flipped below the thumb', 'flipped', 'bottom'],
    ['left, beside a vertical thumb', 'vertical', 'right'],
    ['right, flipped to a vertical thumb’s left', 'vertical-left', 'left'],
  ])(
    'paints the side of an arrow pointing %s from the bubble’s variable',
    (_way, kind, side) => {
      const vertical = `${p('slider')}${p('is-vertical')} `;
      // The rules that reach this arrow, in source order, the general first.
      const selectors = {
        '': [arrow],
        flipped: [arrow, `${bubble}${p('is-flipped')}::after`],
        vertical: [arrow, `${vertical}${arrow}`],
        'vertical-left': [
          arrow,
          `${vertical}${arrow}`,
          `${vertical}${bubble}${p('is-flipped-left')}::after`,
        ],
      }[kind]!;
      const sides: Record<string, string> = {};
      for (const { rule } of selectors.flatMap(atTop)) {
        for (const name of ['top', 'right', 'bottom', 'left']) {
          const value =
            rule.style.getPropertyValue(`border-${name}-color`) ||
            rule.style.getPropertyValue('border-color');
          if (value) sides[name] = value;
        }
      }
      expect(sides).toEqual({
        top: 'transparent',
        right: 'transparent',
        bottom: 'transparent',
        left: 'transparent',
        [side]: 'var(--bulma-slider-output-background)',
      });
    }
  );

  it('changes nothing about the bubble outside forced colors', () => {
    const outlined = rules.filter(
      ({ rule, within }) =>
        within.join() !== FORCED &&
        rule.selectorText.includes('slider-output') &&
        rule.style.getPropertyValue('outline')
    );
    expect(outlined).toEqual([]);
  });
});
