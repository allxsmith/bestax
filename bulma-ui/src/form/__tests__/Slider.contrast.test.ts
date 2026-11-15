// The color Slider fills its track with, resolved through the variables a
// whole published sheet declares in each scheme, the way a browser does, and
// measured (#1714). The fill shows the value, a graphic, so it needs 3:1
// against the page. The value bubble is filled with it too, and its text
// needs 4.5:1 on that fill. `extras.css` takes its colors from the app's
// Bulma, so it is measured with Bulma's own.
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
])('Slider contrast in %s', (_name, prefix, sheet) => {
  let schemes: ReturnType<typeof schemesOf>;
  let rules: CSSStyleRule[];
  // A hook keeps Vitest's 10s default rather than `testTimeout`, and a whole
  // sheet can take longer than that to compile on a loaded machine.
  beforeAll(() => {
    rules = rulesOf(sheet()).rules;
    schemes = schemesOf(rules);
  }, 30_000);

  it.each(COLORS.map(color => [color ?? 'no color', color] as const))(
    'fills the track at 3:1 against the page, and labels the bubble at 4.5:1 on it, with %s, on both schemes',
    (_label, color) => {
      // The variables the slider declares on itself, over the page's.
      const own: Vars = {
        ...varsOn(rules, `.${prefix}slider`),
        ...(color
          ? varsOn(rules, `.${prefix}slider.${prefix}is-${color}`)
          : {}),
      };
      const failures: string[] = [];
      for (const [scheme, page] of Object.entries(schemes)) {
        const vars = { ...page, ...own };
        const fill = substitute('var(--bulma-slider-fill-color)', vars);
        const fillRatio = contrast(
          fill,
          substitute('var(--bulma-scheme-main)', vars)
        );
        if (fillRatio < 3) {
          failures.push(`${scheme}, fill: ${fillRatio.toFixed(2)}:1`);
        }
        const textRatio = contrast(
          substitute('var(--bulma-slider-output-color)', vars),
          substitute('var(--bulma-slider-output-background)', vars)
        );
        if (textRatio < 4.5) {
          failures.push(`${scheme}, bubble text: ${textRatio.toFixed(2)}:1`);
        }
      }
      expect(failures).toEqual([]);
    }
  );
});
