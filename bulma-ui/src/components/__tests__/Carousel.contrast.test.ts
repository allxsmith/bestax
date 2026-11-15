// The colors the carousel draws its indicators in, resolved through the
// variables a whole published sheet declares in each scheme, the way a
// browser does, and measured (#1716). An indicator is a button whose fill is
// all there is of it, a graphic, so it needs 3:1 against the page at rest, on
// hover and while it's the current slide's. `extras.css` takes its colors
// from the app's Bulma, so it is measured with Bulma's own. The overlay look
// draws them over the slides instead, where the picture decides, so it isn't
// measured here.
import { compileSheet } from '../../__tests__/compile-scss';
import { bulmaCss, compilePartial, rulesOf } from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  varsOn,
  type Vars,
} from '../../__tests__/contrast';

// A resting indicator's ring and its color under the pointer, and the
// current one's fill. A resting one has no fill of its own.
const STATES = ['border-color', 'border-color-hover', 'background-active'];

describe.each([
  ['bestax.css', '', () => compileSheet('bestax.scss')],
  [
    'bestax-prefixed.css',
    'bestax-',
    () => compileSheet('versions/bestax-prefixed.scss'),
  ],
  [
    'extras.css on Bulma’s own colors',
    '',
    () => bulmaCss() + compileSheet('extras.scss'),
  ],
])('Carousel indicator contrast in %s', (_name, prefix, sheet) => {
  let schemes: ReturnType<typeof schemesOf>;
  let own: Vars;
  // A hook keeps Vitest's 10s default rather than `testTimeout`, and a whole
  // sheet can take longer than that to compile on a loaded machine.
  beforeAll(() => {
    const { rules } = rulesOf(sheet());
    schemes = schemesOf(rules);
    // The variables the carousel declares on itself, over the page's.
    own = varsOn(rules, `.${prefix}carousel`);
  }, 30_000);

  it('draws an indicator at 3:1 against the page at rest, on hover and current, on both schemes', () => {
    const failures: string[] = [];
    for (const [scheme, page] of Object.entries(schemes)) {
      const vars = { ...page, ...own };
      const background = substitute('var(--bulma-scheme-main)', vars);
      for (const state of STATES) {
        const color = substitute(
          `var(--bulma-carousel-indicator-${state})`,
          vars
        );
        const ratio = contrast(color, background);
        if (ratio < 3) {
          failures.push(`${scheme}, ${state}: ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

// A resting indicator is a ring in the resting color, and turns the hover
// color under the pointer; the current one is filled in the current color.
// The fill is the cue that isn't color, so forced colors, which replaces
// fills, gets one of its own. The overlay look over the slides keeps its
// white fills with no ring.
describe.each([
  ['no prefix', ''],
  ['a prefix', 'bestax-'],
])('Carousel indicator looks with %s', (_name, prefix) => {
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

  it('rings a resting indicator, on its own and as a Bulma button, over its own fill', () => {
    for (const selector of [item, `${item}${p('button')}`]) {
      expect(declared(selector, 'border')).toContain(
        'var(--bulma-carousel-indicator-border-color)'
      );
      expect(declared(selector, 'background-color')).toBe(
        'var(--bulma-carousel-indicator-background)'
      );
    }
    expect(declared(`${item}:hover`, 'border-color')).toBe(
      'var(--bulma-carousel-indicator-border-color-hover)'
    );
    expect(declared(`${item}:hover`, 'background-color')).toBe(
      'var(--bulma-carousel-indicator-background-hover)'
    );
  });

  it('fills the current indicator, ring and all, in the current color', () => {
    const current = `${item}${p('is-active')}`;
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

  it('leaves the ring off over the slides, in the overlay look', () => {
    expect(
      declared(
        `${p('carousel')}${p('is-overlay')} ${p('carousel-indicator')}${p('is-inside')} ${p('indicator-item')}`,
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
