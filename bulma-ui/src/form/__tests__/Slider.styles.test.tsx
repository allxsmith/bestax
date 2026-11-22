// The fill is a gradient in `_slider.scss`, and jsdom drops a background
// whose gradient reads a variable, so the fill is read from the compiled
// sheet. Transforms and custom properties do come through jsdom's cascade,
// `:dir()` included, so the marks and the value bubble are read from
// computed style.
import * as sass from 'sass';
import path from 'path';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Slider } from '../Slider';
import { ConfigProvider } from '../../helpers/Config';

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

// Forced colors drops the gradient the track and the fill are painted with,
// so a single-thumb slider showed only its thumb (#1509). jsdom evaluates no
// media query, so the rules are read off the compiled sheet, with no prefix
// and under one.
describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('Slider track in forced colors, with %s', (_label, prefix) => {
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

  const oneLine = (selector: string) => selector.split(/\s*,\s*/).join(', ');
  const forced = (selector: string) =>
    rules.filter(
      ({ rule, within }) =>
        within === FORCED && oneLine(rule.selectorText) === selector
    );

  const input = p('slider-input');
  const rangeTrack = `${p('slider')}${p('is-range')} ${p('slider-track')}`;
  const painted = `${input}, ${rangeTrack}`;
  const disabled = `${p('slider')}${p('is-disabled')} ${input}, ${p('slider')}${p('is-disabled')}${p('is-range')} ${p('slider-track')}`;
  const value = (selector: string, name: string) =>
    forced(selector)
      .map(({ rule }) => rule.style.getPropertyValue(name).trim())
      .filter(Boolean);

  it('opts the track out of forced colors and paints it in system colors', () => {
    expect(value(painted, 'forced-color-adjust')).toEqual(['none']);
    expect(value(painted, '--bulma-slider-fill-color')).toEqual([
      expect.stringMatching(/^highlight$/i),
    ]);
    expect(value(painted, '--bulma-slider-track-color')).toEqual([
      expect.stringMatching(/^canvastext$/i),
    ]);
  });

  it('paints a disabled track in the system color for disabled text', () => {
    for (const name of [
      '--bulma-slider-fill-color',
      '--bulma-slider-track-color',
    ]) {
      expect(value(disabled, name)).toEqual([
        expect.stringMatching(/^graytext$/i),
      ]);
    }
  });

  // The colors above reach every track because each gradient reads them.
  it.each([
    ['a single thumb', input],
    ['a single thumb right to left', `${input}:dir(rtl)`],
    ['a vertical slider', `${p('slider')}${p('is-vertical')} ${input}`],
    ['the range track', rangeTrack],
    ['the range track right to left', `${rangeTrack}:dir(rtl)`],
  ])('paints %s from the two variables', (_what, selector) => {
    const gradients = rules
      .filter(
        ({ rule, within }) => !within && oneLine(rule.selectorText) === selector
      )
      .map(({ rule }) => rule.style.getPropertyValue('background'))
      .filter(Boolean);
    expect(gradients).toHaveLength(1);
    expect(gradients[0]).toContain('linear-gradient(');
    expect(gradients[0]).toContain('var(--bulma-slider-fill-color)');
    expect(gradients[0]).toContain('var(--bulma-slider-track-color)');
  });

  it('takes the thumb’s shadows off, which the opt-out would otherwise keep', () => {
    for (const pseudo of ['::-webkit-slider-thumb', '::-moz-range-thumb']) {
      expect(
        value(`${input}${pseudo}, ${input}:focus${pseudo}`, 'box-shadow')
      ).toEqual(['none']);
    }
  });

  it('keeps a hovered thumb’s border at rest, so only focus turns it Highlight', () => {
    // The base hover rule paints the border from the fill color, which is
    // Highlight here. The forced-colors hover rule ties it and comes later,
    // and the focus rule ties that and comes later still.
    const order = (selector: string) =>
      rules.findIndex(
        ({ rule, within }) =>
          within === FORCED && oneLine(rule.selectorText) === selector
      );
    for (const pseudo of ['::-webkit-slider-thumb', '::-moz-range-thumb']) {
      expect(value(`${input}${pseudo}:hover`, 'border-color')).toEqual([
        expect.stringMatching(/^buttontext$/i),
      ]);
      expect(value(`${input}:focus${pseudo}`, 'border-color')).toEqual([
        expect.stringMatching(/^highlight$/i),
      ]);
      expect(order(`${input}${pseudo}:hover`)).toBeLessThan(
        order(`${input}:focus${pseudo}`)
      );
    }
  });

  it('lands on the element each kind of slider paints its track on', () => {
    const at = (ui: ReactElement, selector: string) =>
      render(ui).container.querySelector(selector)!;
    const wrap = (ui: ReactElement) => (
      <ConfigProvider classPrefix={prefix}>{ui}</ConfigProvider>
    );
    expect(at(wrap(<Slider defaultValue={40} />), input).matches(input)).toBe(
      true
    );
    expect(
      at(
        wrap(<Slider range defaultValue={[20, 70]} />),
        p('slider-track')
      ).matches(rangeTrack)
    ).toBe(true);
    const [single, range] = disabled.split(', ');
    expect(
      at(wrap(<Slider defaultValue={40} disabled />), input).matches(single)
    ).toBe(true);
    expect(
      at(
        wrap(<Slider range defaultValue={[20, 70]} disabled />),
        p('slider-track')
      ).matches(range)
    ).toBe(true);
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

// A range slider's ticks were placed for a single slider's track, so they hung
// below the range track (#2101), and a single slider of another size had its
// ticks placed for the default track, a pixel or two off its own. jsdom works
// out no layout, so this reads where the cascade puts the ticks: a range
// slider's at the middle, where its track is centred, and a single slider's
// up half its own track from the default track's bottom edge.
describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('Slider ticks on the track, with %s', (_label, prefix) => {
  let sheet: HTMLStyleElement;
  beforeAll(() => {
    sheet = document.createElement('style');
    sheet.textContent = sass.compileString(
      `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
       @use 'form/slider';`,
      {
        loadPaths: [SCSS, NODE_MODULES],
        quietDeps: true,
        logger: sass.Logger.silent,
      }
    ).css;
    document.head.appendChild(sheet);
  });
  afterAll(() => sheet.remove());

  const ticksOf = (ui: ReactElement) => {
    const { container } = render(
      <ConfigProvider classPrefix={prefix}>{ui}</ConfigProvider>
    );
    return {
      slider: container.querySelector(`.${prefix}slider`) as HTMLElement,
      ticks: container.querySelector(`.${prefix}slider-ticks`) as HTMLElement,
    };
  };

  it.each([
    ['default', undefined],
    ['small', 'small'],
    ['medium', 'medium'],
    ['large', 'large'],
  ] as const)(
    'centres a %s range slider’s ticks on its track',
    (_name, size) => {
      const { slider, ticks } = ticksOf(
        <Slider range ticks step={10} defaultValue={[20, 70]} size={size} />
      );
      // The track is centred in the slider, and the ticks sit there too.
      const track = slider.querySelector(`.${prefix}slider-track`)!;
      expect(getComputedStyle(track).top).toBe('50%');
      expect(getComputedStyle(track).transform).toBe('translateY(-50%)');
      expect(getComputedStyle(ticks).top).toBe('50%');
    }
  );

  it('leaves a vertical range slider’s ticks along its track', () => {
    const { ticks } = ticksOf(
      <Slider range ticks step={10} orientation="vertical" />
    );
    expect(getComputedStyle(ticks).top).toBe('0px');
  });

  it('places a single slider’s ticks half its track up from the default track’s bottom edge', () => {
    const { ticks } = ticksOf(<Slider ticks step={10} />);
    expect(getComputedStyle(ticks).top.replace(/\s+/g, ' ')).toBe(
      'calc(0.5rem + var(--bulma-slider-thumb-size) / 2 + var(--bulma-slider-track-height) - var(--slider-size-track-height, var(--bulma-slider-track-height)) / 2)'
    );
  });

  it.each([
    ['default', undefined, ''],
    ['small', 'small', 'var(--bulma-slider-track-height-small)'],
    ['medium', 'medium', 'var(--bulma-slider-track-height-medium)'],
    ['large', 'large', 'var(--bulma-slider-track-height-large)'],
  ] as const)(
    'places a %s single slider’s ticks by the height its track is drawn at',
    (_name, size, height) => {
      const { slider, ticks } = ticksOf(<Slider ticks step={10} size={size} />);
      const own = getComputedStyle(slider).getPropertyValue(
        '--slider-size-track-height'
      );
      expect(own).toBe(height);
      // The ticks go up half that height from the bottom edge, falling back
      // to the default track's, and the input the track is drawn on is that
      // height.
      expect(getComputedStyle(ticks).top.replace(/\s+/g, ' ')).toContain(
        '- var(--slider-size-track-height, var(--bulma-slider-track-height)) / 2)'
      );
      const input = slider.querySelector(`.${prefix}slider-input`)!;
      expect(getComputedStyle(input).height).toBe(
        own || 'var(--bulma-slider-track-height)'
      );
    }
  );
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
    // The bubble keeps the user's palette: only the arrow opts out, besides
    // the elements that paint the track's gradient and the ticks that paint
    // a gap in their line.
    const optedOut = rules
      .filter(
        ({ rule }) =>
          rule.style.getPropertyValue('forced-color-adjust') === 'none'
      )
      .map(({ rule }) => rule.selectorText.split(/\s*,\s*/).join(', '));
    const track = `${p('slider')}${p('is-range')} ${p('slider-track')}`;
    const line = `${p('slider-tick')}:not(${p('is-endpoint')})`;
    const ticks = `${p('slider')}${p('has-ticks')} ${line}`;
    expect(optedOut).toEqual([
      `${p('slider-input')}, ${track}`,
      ticks,
      track,
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

// A mark's label is drawn in Bulma's text-light inside its tick, and the
// tick's own opacity dims the label with the line. That's Bulma's stock gray,
// which changes only when the owner asks (the root CLAUDE.md, "Bulma's stock
// colors and the bestax blue").
describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('Slider mark labels, with %s', (_label, prefix) => {
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

  /** A selector list's text on one line, as `a, b`. */
  const oneLine = (selector: string) => selector.split(/\s*,\s*/).join(', ');

  /** A property's values across the rules for exactly `selector`. */
  const values = (selector: string, property: string, within: string[]) =>
    rules
      .filter(
        r =>
          r.within.join() === within.join() &&
          oneLine(r.rule.selectorText) === selector
      )
      .map(r => r.rule.style.getPropertyValue(property))
      .filter(Boolean);

  it('write in text-light', () => {
    expect(compiled).toContain(
      '--bulma-slider-tick-label-color: var(--bulma-text-light)'
    );
    expect(values(p('slider-tick-label'), 'color', [])).toEqual([
      'var(--bulma-slider-tick-label-color)',
    ]);
  });

  it('sit in a tick that carries the line’s opacity, so it dims the label too', () => {
    const tick = p('slider-tick');
    expect(values(tick, 'background', [])).toEqual([
      'var(--bulma-slider-tick-color)',
    ]);
    expect(values(tick, 'opacity', [])).toEqual([
      'var(--bulma-slider-tick-opacity)',
    ]);
    expect(values(`${tick}${p('is-endpoint')}`, 'background', [])).toEqual([
      'transparent',
    ]);
  });

  it('paint the label in the page’s text color in forced colors, and the line in the button text color', () => {
    // The label sits on the page, so it takes the color paired with it. The
    // line crosses the track and the fill, so it keeps the button text color.
    expect(
      values(p('slider-tick'), 'background', [FORCED]).map(v => v.toLowerCase())
    ).toEqual(['buttontext']);
    expect(
      values(p('slider-tick-label'), 'color', [FORCED]).map(v =>
        v.toLowerCase()
      )
    ).toEqual(['canvastext']);
  });

  it('run a hairline in the page’s color down a tick’s line across the track in forced colors', () => {
    // The track is drawn in CanvasText, which most contrast themes make the
    // same color as ButtonText, the line's, so the line merged into the track
    // where it crossed it (#2032). A Canvas hairline, half the line's width
    // and the track's height, now runs down its middle. Every slider with
    // ticks gets it, a range one too since its ticks cross its track
    // (#2101). jsdom drops a gradient, so it's read from the compiled sheet,
    // with its whitespace collapsed.
    const line = `${p('slider-tick')}:not(${p('is-endpoint')})`;
    const across = `${p('slider')}${p('has-ticks')} ${line}`;
    const vertical = `${p('slider')}${p('is-vertical')} ${line}`;
    const flat = compiled.replace(/\s+/g, ' ');
    const block = (selector: string) => {
      const at = flat.lastIndexOf(`${selector} {`);
      expect(at).toBeGreaterThan(-1);
      return flat.slice(at, flat.indexOf('}', at));
    };
    const band = 'var(--bulma-slider-track-height)';
    expect(block(across)).toContain(
      `background: linear-gradient(Canvas, Canvas) center/50% ${band} no-repeat, currentColor;`
    );
    expect(block(vertical)).toContain(`background-size: ${band} 50%;`);
    // No slider is left out of it, the range one included.
    expect(flat).not.toContain(`:not(${p('is-range')}) ${line}`);
    // Forced colors drops a gradient unless the tick opts out. The line is
    // painted from the tick's color, ButtonText, or GrayText while disabled.
    expect(values(across, 'forced-color-adjust', [FORCED])).toEqual(['none']);
    expect(
      values(p('slider-tick'), 'color', [FORCED]).map(v => v.toLowerCase())
    ).toEqual(['buttontext']);
    expect(
      values(`${p('slider')}${p('is-disabled')} ${line}`, 'color', [
        FORCED,
      ]).map(v => v.toLowerCase())
    ).toEqual(['graytext']);
    // None of it applies outside forced colors.
    expect(
      rules.some(
        r =>
          !r.within.length &&
          (r.rule.selectorText.includes(across) ||
            r.rule.selectorText.includes(vertical))
      )
    ).toBe(false);
  });

  it('hand a tick’s label back to the user’s palette, since the opt-out is inherited', () => {
    const line = `${p('slider-tick')}:not(${p('is-endpoint')})`;
    const label = p('slider-tick-label');
    expect(
      values(
        `${p('slider')}${p('has-ticks')} ${line} ${label}`,
        'forced-color-adjust',
        [FORCED]
      )
    ).toEqual(['auto']);
  });

  it('draw the hairline after a disabled line’s plain one, which ties with it on specificity', () => {
    const line = `${p('slider-tick')}:not(${p('is-endpoint')})`;
    const at = (selector: string) =>
      rules.findIndex(
        r =>
          r.within.join() === FORCED &&
          oneLine(r.rule.selectorText) === selector
      );
    const hairline = at(`${p('slider')}${p('has-ticks')} ${line}`);
    const plain = at(`${p('slider')}${p('is-disabled')} ${line}`);
    expect(plain).toBeGreaterThan(-1);
    expect(hairline).toBeGreaterThan(plain);
  });

  it('draw the tick and its label at full strength in forced colors', () => {
    // Forced colors keeps an opacity, so the tick's would halve the line and
    // the label inside it there.
    expect(values(p('slider-tick'), 'opacity', [FORCED])).toEqual(['1']);
  });

  it('draw a disabled slider’s ticks and labels in the color for disabled text in forced colors', () => {
    const disabled = `${p('slider')}${p('is-disabled')}`;
    expect(
      values(
        `${disabled} ${p('slider-tick')}:not(${p('is-endpoint')})`,
        'background',
        [FORCED]
      ).map(v => v.toLowerCase())
    ).toEqual(['graytext']);
    expect(
      values(`${disabled} ${p('slider-tick-label')}`, 'color', [FORCED]).map(
        v => v.toLowerCase()
      )
    ).toEqual(['graytext']);
  });

  it('draw a disabled slider’s input at full strength in forced colors', () => {
    // Its usual opacity sits on the input, which holds the thumbs and, but for
    // a range slider, the track, and would halve the GrayText they're drawn in.
    const input = `${p('slider')}${p('is-disabled')} ${p('slider-input')}`;
    expect(values(input, 'opacity', [])).toEqual([
      'var(--bulma-slider-disabled-opacity)',
    ]);
    expect(values(input, 'opacity', [FORCED])).toEqual(['1']);
    // The two rules tie on specificity, so the reset wins by coming later.
    const at = (within: string[]) =>
      rules.findIndex(
        r =>
          r.within.join() === within.join() &&
          r.rule.selectorText === input &&
          r.rule.style.getPropertyValue('opacity')
      );
    expect(at([FORCED])).toBeGreaterThan(at([]));
  });
});
