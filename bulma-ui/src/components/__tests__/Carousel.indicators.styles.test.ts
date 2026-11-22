// Carousel's indicators take Bulma's look: a resting dot, line or bar filled
// in the border color, the border-hover color under the pointer, the current
// one in the primary color, and a circle a ring in the border color, filled
// when current. A dot, a line and a bar also have a ring a theme can color,
// transparent by default, so outside forced colors it draws nothing over the
// fill until then. These pin that look in each published sheet, and the rules
// that draw it in the partial, with no prefix and under one.
import { compileSheet } from '../../__tests__/compile-scss';
import {
  bulmaCss,
  compilePartial,
  compileSource,
  rulesOf,
} from '../../__tests__/css-cascade';
import { varsOn } from '../../__tests__/contrast';

/** The indicator variables each sheet declares on the carousel. */
const DEFAULTS = {
  '--bulma-carousel-indicator-background': 'var(--bulma-border)',
  '--bulma-carousel-indicator-background-hover': 'var(--bulma-border-hover)',
  '--bulma-carousel-indicator-background-active': 'var(--bulma-primary)',
  '--bulma-carousel-indicator-border-color': 'transparent',
  '--bulma-carousel-indicator-border-color-hover':
    'var(--bulma-carousel-indicator-border-color)',
  '--bulma-carousel-indicator-border-width': '2px',
  '--bulma-carousel-indicator-line-border-width': '1px',
  // The dots 24px apart, center to center, the least target size (#1926).
  '--bulma-carousel-indicator-gap':
    'calc(24px - var(--bulma-carousel-indicator-size))',
  '--bulma-carousel-indicator-gap-mobile':
    'calc(24px - var(--bulma-carousel-indicator-size-mobile))',
};

describe.each([
  ['bestax.css', '', () => compileSheet('bestax.scss')],
  [
    'bestax-prefixed.css',
    'bestax-',
    () => compileSheet('versions/bestax-prefixed.scss'),
  ],
  [
    'extras.css on Bulma’s own CSS',
    '',
    () => bulmaCss() + compileSheet('extras.scss'),
  ],
])('Carousel indicator defaults in %s', (_name, prefix, sheet) => {
  // A hook keeps Vitest's 10s default rather than `testTimeout`, and a whole
  // sheet can take longer than that to compile on a loaded machine.
  let own: Record<string, string>;
  beforeAll(() => {
    own = varsOn(rulesOf(sheet()).rules, `.${prefix}carousel`);
  }, 30_000);

  it('fills the indicators in the border and primary colors, with a transparent ring', () => {
    expect(own).toMatchObject(DEFAULTS);
  });
});

describe.each([
  ['no prefix', ''],
  ['a prefix', 'bestax-'],
])('Carousel indicator rules with %s', (_name, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;
  const { rules, nested } = rulesOf(
    compilePartial('components/carousel', prefix)
  );
  /** The declaration of `property` in a rule whose list has `selector`. */
  const declared = (selector: string, property: string) =>
    rules
      .filter(rule => rule.selectorText.split(', ').includes(selector))
      .map(rule => rule.style.getPropertyValue(property))
      .find(Boolean);
  const item = `${p('carousel')} ${p('indicator-item')}`;
  const circle = `${p('carousel')}${p('is-indicator-circles')} ${p('indicator-item')}`;

  it('fills a resting indicator, on its own and as a Bulma button, inside its ring', () => {
    for (const selector of [item, `${item}${p('button')}`]) {
      expect(declared(selector, 'border')).toBe(
        'var(--bulma-carousel-indicator-border-width) solid var(--bulma-carousel-indicator-border-color)'
      );
      expect(declared(selector, 'background-color')).toBe(
        'var(--bulma-carousel-indicator-background)'
      );
    }
    expect(declared(`${item}:hover`, 'border-color')).toBe(
      'var(--bulma-carousel-indicator-border-color-hover)'
    );
    // The fill and the scale move; the ring changes at once, as it always has.
    expect(declared(item, 'transition')).toBe(
      'background-color var(--bulma-carousel-transition-duration), transform var(--bulma-carousel-transition-duration)'
    );
    expect(declared(`${item}:hover`, 'background-color')).toBe(
      'var(--bulma-carousel-indicator-background-hover)'
    );
  });

  // The indicators sat closer together than the 24px target size allows
  // (#1926). The gaps default to what puts the dots, the circles and a
  // phone's bars 24px apart, center to center, and the lines and a wider
  // screen's bars, already that far apart, as they were. A row too long for
  // the carousel wraps rather than squeezing them closer.
  it('sets each style’s default gap at the carousel’s own weight, and wraps a long row', () => {
    const gaps = (style: string) => {
      const selector = `${p('carousel')}:where(${p(`is-indicator-${style}`)})`;
      return [
        declared(selector, '--bulma-carousel-indicator-gap'),
        declared(selector, '--bulma-carousel-indicator-gap-mobile'),
      ];
    };
    expect(gaps('circles')).toEqual([
      'calc(24px - var(--bulma-carousel-indicator-circle-size))',
      'calc(24px - var(--bulma-carousel-indicator-circle-size))',
    ]);
    expect(gaps('lines')).toEqual(['0.5rem', '0.375rem']);
    expect(gaps('bars')).toEqual([
      '0.5rem',
      'calc(24px - var(--bulma-carousel-indicator-bar-width-mobile))',
    ]);
    // The row reads the variables, whatever a theme sets them to.
    const row = `${p('carousel')} ${p('carousel-indicator')}`;
    expect(declared(row, 'gap')).toBe('var(--bulma-carousel-indicator-gap)');
    expect(declared(row, 'flex-wrap')).toBe('wrap');
    expect(declared(item, 'flex-shrink')).toBe('0');
    // The marks draw at their own sizes, as before.
    expect(declared(item, 'width')).toBe(
      'var(--bulma-carousel-indicator-size)'
    );
  });

  /** The rules of the partial built with `config` for its variables. */
  const builtWith = (config: string) =>
    rulesOf(
      compileSource(
        `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
         @use 'components/carousel' with (${config});`
      )
    ).rules;
  /** Each value a rule whose list has `selector` gives `property`. */
  const on = (built: CSSStyleRule[], selector: string, property: string) =>
    built
      .filter(rule => rule.selectorText.split(', ').includes(selector))
      .map(rule => rule.style.getPropertyValue(property))
      .filter(Boolean);
  const styleRoot = (style: string) =>
    `${p('carousel')}:where(${p(`is-indicator-${style}`)})`;

  it('gives every style a gap a build sets, as it did', () => {
    const built = builtWith(
      '$carousel-indicator-gap: 4px, $carousel-indicator-gap-mobile: 3px'
    );
    expect(on(built, p('carousel'), '--bulma-carousel-indicator-gap')).toEqual([
      '4px',
    ]);
    expect(
      on(built, p('carousel'), '--bulma-carousel-indicator-gap-mobile')
    ).toEqual(['3px']);
    for (const style of ['circles', 'lines', 'bars']) {
      for (const gap of ['gap', 'gap-mobile']) {
        expect(
          on(built, styleRoot(style), `--bulma-carousel-indicator-${gap}`)
        ).toEqual([]);
      }
    }
  });

  it('keeps the other gap’s per-style defaults when a build sets one of the two', () => {
    const wide = builtWith('$carousel-indicator-gap: 4px');
    const phone = builtWith('$carousel-indicator-gap-mobile: 3px');
    for (const style of ['circles', 'lines', 'bars']) {
      const root = styleRoot(style);
      expect(on(wide, root, '--bulma-carousel-indicator-gap')).toEqual([]);
      expect(
        on(wide, root, '--bulma-carousel-indicator-gap-mobile')
      ).toHaveLength(1);
      expect(on(phone, root, '--bulma-carousel-indicator-gap')).toHaveLength(1);
      expect(on(phone, root, '--bulma-carousel-indicator-gap-mobile')).toEqual(
        []
      );
    }
  });

  it('puts a wrapped row of lines or bars 24px below the one above, center to center', () => {
    const row = (style: string) =>
      `${styleRoot(style)} ${p('carousel-indicator')}`;
    const mobileRowGap = (selector: string) =>
      nested
        .filter(
          ({ rule, within }) =>
            within.startsWith('@media screen and (max-width') &&
            rule.selectorText === selector
        )
        .map(({ rule }) => rule.style.getPropertyValue('row-gap'))
        .find(Boolean);
    for (const [style, height] of [
      ['lines', 'line-height'],
      ['bars', 'bar-height'],
    ]) {
      expect(declared(row(style), 'row-gap')).toBe(
        `calc(24px - var(--bulma-carousel-indicator-${height}))`
      );
      expect(mobileRowGap(row(style))).toBe(
        `calc(24px - var(--bulma-carousel-indicator-${height}-mobile))`
      );
    }
  });

  it('fills the current indicator in the current color, with no ring', () => {
    const current = `${item}${p('is-active')}`;
    expect(declared(current, 'background-color')).toBe(
      'var(--bulma-carousel-indicator-background-active)'
    );
    expect(declared(current, 'border-color')).toBe('transparent');
  });

  it('draws a circle as a ring in the border color, filled when current', () => {
    // The ring's variable, at the carousel's own weight, so a theme that
    // names the carousel's class with its own outranks it whatever order the
    // sheets load in.
    expect(
      declared(
        `${p('carousel')}:where(${p('is-indicator-circles')})`,
        '--bulma-carousel-indicator-border-color'
      )
    ).toBe('var(--bulma-border)');
    expect(declared(circle, 'border-color')).toBeUndefined();
    expect(declared(circle, 'background-color')).toBe('transparent');
    const current = `${circle}${p('is-active')}`;
    const fill = 'var(--bulma-carousel-indicator-background-active)';
    expect(declared(current, 'border-color')).toBe(fill);
    expect(declared(current, 'background-color')).toBe(fill);
  });

  it('draws a line’s and a bar’s ring thinner', () => {
    for (const style of ['lines', 'bars']) {
      expect(
        declared(
          `${p('carousel')}${p(`is-indicator-${style}`)} ${p('indicator-item')}`,
          'border-width'
        )
      ).toBe('var(--bulma-carousel-indicator-line-border-width)');
    }
  });

  it('fills the indicators over the slides in the overlay colors, a ring on circles alone', () => {
    const inside = `${p('carousel-indicator')}${p('is-inside')} ${p('indicator-item')}`;
    const overlay = `${p('carousel')}${p('is-overlay')} ${inside}`;
    expect(declared(overlay, 'background-color')).toBe(
      'var(--bulma-carousel-overlay-indicator-background)'
    );
    expect(declared(overlay, 'border-color')).toBeUndefined();
    expect(
      declared(
        `${p('carousel')}${p('is-overlay')}:not(${p('is-indicator-circles')}) ${inside}`,
        'border-color'
      )
    ).toBe('transparent');
  });

  it('fills the current indicator in the buttons’ text color in forced colors, in every look', () => {
    const rule = nested.find(
      ({ rule, within }) =>
        within === '@media (forced-colors: active)' &&
        rule.selectorText === `${item}${p('is-active')}`
    )?.rule;
    expect(rule?.style.getPropertyValue('forced-color-adjust')).toBe('none');
    // jsdom lowercases a system color's name.
    expect(rule?.style.getPropertyValue('background-color')).toBe('buttontext');
    expect(rule?.style.getPropertyValue('border-color')).toBe('buttontext');
    // Over the overlay look's white fills too, whose rules rank higher.
    expect(rule?.style.getPropertyPriority('background-color')).toBe(
      'important'
    );
    expect(rule?.style.getPropertyPriority('border-color')).toBe('important');
    // Kept out of forced colors, it draws its own focus ring in a system
    // color, important so the button's later focus rules can't take it.
    const focus = nested.find(
      ({ rule, within }) =>
        within === '@media (forced-colors: active)' &&
        rule.selectorText === `${item}${p('is-active')}:focus-visible`
    )?.rule;
    expect(focus?.style.getPropertyValue('outline')).toContain('CanvasText');
    expect(focus?.style.getPropertyValue('outline')).toContain(
      'var(--bulma-focus-style)'
    );
    for (const property of ['outline', 'outline-offset', 'box-shadow']) {
      expect(focus?.style.getPropertyPriority(property)).toBe('important');
    }
  });
});
