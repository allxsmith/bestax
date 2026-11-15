// What shows a picked RadioCard, resolved through the variables a whole
// published sheet declares in each scheme, the way a browser does, and
// measured (#1776). The edge, the ring and the dot show the state, a graphic,
// so each needs 3:1 against the card it sits on and the page around it (WCAG
// 1.4.11). `extras.css` takes its colors from the app's Bulma, so it is
// measured with Bulma's own. CheckboxCard keeps each color's base shade, which
// its `scheme-invert` check mark reads on, until the next major (#1779).
import { compileSheet } from '../../__tests__/compile-scss';
import { bulmaCss, rulesOf } from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  varsOn,
  type Vars,
} from '../../__tests__/contrast';

const COLORS = [
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
])('Choice card contrast in %s', (_name, prefix, sheet) => {
  let schemes: ReturnType<typeof schemesOf>;
  let rules: CSSStyleRule[];
  // A hook keeps Vitest's 10s default rather than `testTimeout`, and a whole
  // sheet can take longer than that to compile on a loaded machine.
  beforeAll(() => {
    rules = rulesOf(sheet()).rules;
    schemes = schemesOf(rules);
  }, 30_000);

  /**
   * Each of `colors` that falls under 3:1 against the card or the page in a
   * scheme, with the ratio, for a RadioCard with `color`.
   */
  function belowThreeToOne(
    color: string | undefined,
    colors: Record<string, string>
  ): string[] {
    const card = `.${prefix}radio-card`;
    const own: Vars = {
      ...varsOn(rules, `.${prefix}card`),
      ...varsOn(rules, card),
      ...(color ? varsOn(rules, `${card}.${prefix}is-${color}`) : {}),
    };
    const failures: string[] = [];
    for (const [scheme, page] of Object.entries(schemes)) {
      const vars = { ...page, ...own };
      for (const [label, value] of Object.entries(colors)) {
        // The card, and what a page, a box or a panel paints around it.
        for (const surface of [
          '--bulma-card-background-color',
          '--bulma-scheme-main',
          '--bulma-scheme-main-bis',
          '--bulma-scheme-main-ter',
          '--bulma-background',
        ]) {
          const ratio = contrast(
            substitute(value, vars),
            substitute(`var(${surface})`, vars)
          );
          if (ratio < 3) {
            failures.push(
              `${scheme}, ${label} on ${surface}: ${ratio.toFixed(2)}:1`
            );
          }
        }
      }
    }
    return failures;
  }

  it.each([['no color', undefined], ...COLORS.map(color => [color, color])] as [
    string,
    string | undefined,
  ][])(
    'draws a picked RadioCard’s edge, ring and dot at 3:1, with %s',
    (_label, color) => {
      expect(
        belowThreeToOne(color, {
          'edge, ring and dot': 'var(--bulma-radio-card-active-color)',
        })
      ).toEqual([]);
    }
  );

  it('measures a base shade below 3:1, so the check can fail', () => {
    // `warning` as the card drew it before #1776, on a light page.
    const vars = { ...schemes.light, ...varsOn(rules, `.${prefix}card`) };
    expect(
      contrast(
        substitute('var(--bulma-warning)', vars),
        substitute('var(--bulma-card-background-color)', vars)
      )
    ).toBeLessThan(3);
  });

  it('finds the card’s surface', () => {
    expect(varsOn(rules, `.${prefix}card`)).toHaveProperty(
      '--bulma-card-background-color'
    );
  });
});
