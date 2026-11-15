// The colors Rate draws its stars in, resolved through the variables a whole
// published sheet declares in each scheme, the way a browser does, and
// measured (#1714). A star shows the value, a graphic, so it needs 3:1 against
// the page: an empty star in its own color, and a filled one, or one the
// pointer would fill, at its edge, which carries the contrast around a gold or
// a color's own shade. A font icon's filled glyph is drawn in that edge color.
// `extras.css` takes its colors from the app's Bulma, so it is measured with
// Bulma's own.
import { compileSheet } from '../../__tests__/compile-scss';
import { bulmaCss, compilePartial, rulesOf } from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  varsOn,
  type Vars,
} from '../../__tests__/contrast';

const COLORS = [
  undefined,
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

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
])('Rate contrast in %s', (_name, prefix, sheet) => {
  let schemes: ReturnType<typeof schemesOf>;
  let rules: CSSStyleRule[];
  // A hook keeps Vitest's 10s default rather than `testTimeout`, and a whole
  // sheet can take longer than that to compile on a loaded machine.
  beforeAll(() => {
    rules = rulesOf(sheet()).rules;
    schemes = schemesOf(rules);
  }, 30_000);

  it.each(COLORS.map(color => [color ?? 'no color', color] as const))(
    'draws an empty star and a filled star’s edge at 3:1 against the page with %s, on both schemes',
    (_label, color) => {
      // The variables the stars declare on themselves, over the page's.
      const own: Vars = {
        ...varsOn(rules, `.${prefix}rate`),
        ...(color ? varsOn(rules, `.${prefix}rate.${prefix}is-${color}`) : {}),
      };
      const failures: string[] = [];
      for (const [scheme, page] of Object.entries(schemes)) {
        const vars = { ...page, ...own };
        const background = substitute('var(--bulma-scheme-main)', vars);
        for (const part of ['color-inactive', 'color-edge']) {
          const ratio = contrast(
            substitute(`var(--bulma-rate-${part})`, vars),
            background
          );
          if (ratio < 3) {
            failures.push(`${scheme}, ${part}: ${ratio.toFixed(2)}:1`);
          }
        }
      }
      expect(failures).toEqual([]);
    }
  );
});

// A filled star, one the pointer would fill, and the filled part of a star
// the value only partly fills all take the edge, and a font icon's glyph is
// the edge's color.
describe.each([
  ['no prefix', ''],
  ['a prefix', 'bestax-'],
])('Rate star edges with %s', (_name, prefix) => {
  const p = (name: string) => `.${prefix}${name}`;
  const { rules, nested } = rulesOf(compilePartial('form/rate', prefix));
  /** The declaration of `property` in a rule whose list has `selector`. */
  const declared = (selector: string, property: string) =>
    rules
      .filter(rule =>
        rule.selectorText
          .split(/,(?![^(]*\))/)
          .map(part => part.trim())
          .includes(selector)
      )
      .map(rule => rule.style.getPropertyValue(property))
      .find(Boolean);
  const item = p('rate-item');
  const edge = 'var(--bulma-rate-color-edge)';

  it('edges the built-in star, filled or one the pointer would fill, around its own fill', () => {
    for (const state of [
      `:hover:not(${p('is-active')})`,
      p('is-active'),
      p('is-hovered'),
    ]) {
      // Only the built-in star: a custom icon is drawn as given.
      const star = `${item}${state} > ${p('rate-star')}`;
      expect(declared(star, 'fill')).toBe('currentcolor');
      expect(declared(star, 'stroke')).toBe(edge);
      expect(declared(star, 'stroke-width')).toBe(
        'var(--bulma-rate-edge-width)'
      );
      // A font icon's own glyph, not the empty half of a partly filled one.
      expect(declared(`${item}${state} > ${p('icon')}`, 'color')).toBe(edge);
    }
  });

  it('draws a partly filled star’s filled part as a filled star, and its empty part as an empty one', () => {
    const fill = p('rate-star-fill');
    expect(declared(fill, 'fill')).toBe('var(--bulma-rate-color-active)');
    expect(declared(fill, 'stroke')).toBe(edge);
    for (const state of [':hover', p('is-hovered')]) {
      expect(declared(`${item}${state} ${fill}`, 'fill')).toBe(
        'var(--bulma-rate-color-hover)'
      );
    }
    expect(declared(p('rate-star-empty'), 'stroke')).toBe(
      'var(--bulma-rate-color-inactive)'
    );
    expect(declared(p('rate-icon-fg'), 'color')).toBe(edge);
  });

  it('draws an empty star’s outline as wide as a filled star’s edge', () => {
    for (const outline of [
      `${item} > ${p('rate-star')}`,
      p('rate-star-empty'),
    ]) {
      expect(declared(outline, 'stroke-width')).toBe(
        'var(--bulma-rate-edge-width)'
      );
    }
  });

  it('draws the edge and a partly filled star in system colors in forced colors', () => {
    const forced = (selector: string, property: string) =>
      nested
        .filter(
          ({ rule, within }) =>
            within === '@media (forced-colors: active)' &&
            rule.selectorText === selector
        )
        .map(({ rule }) => rule.style.getPropertyValue(property))
        .find(Boolean);
    expect(forced(`${p('rate')} ${item}`, '--bulma-rate-color-edge')).toBe(
      'currentColor'
    );
    // jsdom lowercases a system color's name.
    expect(forced(`${p('rate')} ${p('rate-star-fill')}`, 'fill')).toBe(
      'highlight'
    );
    // Over the hover fill, whose rules rank higher.
    const fill = nested.find(
      ({ rule, within }) =>
        within === '@media (forced-colors: active)' &&
        rule.selectorText === `${p('rate')} ${p('rate-star-fill')}`
    )?.rule;
    expect(fill?.style.getPropertyPriority('fill')).toBe('important');
    expect(forced(`${p('rate')} ${p('rate-star-empty')}`, 'stroke')).toBe(
      'buttontext'
    );
    // A font icon's filled half, apart from its empty half.
    expect(forced(`${p('rate')} ${p('rate-icon-fg')}`, 'color')).toBe(
      'highlight'
    );
  });
});
