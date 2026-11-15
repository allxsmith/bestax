// The grip on a Splitter's handle is what shows the handle can be dragged, a
// graphic, so it needs 3:1 against the page (#1716), at rest and in the line's
// active color, which paints it while the handle is in use. Its colors are resolved
// through the variables a whole published sheet declares in each scheme, the
// way a browser does, and measured. `extras.css` takes its colors from the
// app's Bulma, so it is measured with Bulma's own.
import { compileSheet } from '../../__tests__/compile-scss';
import { bulmaCss, rulesOf } from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  varsOn,
  type Vars,
} from '../../__tests__/contrast';

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
])('Splitter grip contrast in %s', (_name, prefix, sheet) => {
  let schemes: ReturnType<typeof schemesOf>;
  let own: Vars;
  // A hook keeps Vitest's 10s default rather than `testTimeout`, and a whole
  // sheet can take longer than that to compile on a loaded machine.
  beforeAll(() => {
    const { rules } = rulesOf(sheet());
    schemes = schemesOf(rules);
    // The variables the splitter declares on itself, over the page's.
    own = varsOn(rules, `.${prefix}splitter`);
  }, 30_000);

  it('draws the grip at 3:1 against the page, at rest and in use, on both schemes', () => {
    const failures: string[] = [];
    for (const [scheme, page] of Object.entries(schemes)) {
      const vars = { ...page, ...own };
      for (const color of ['grip-color', 'line-active-color']) {
        const ratio = contrast(
          substitute(`var(--bulma-splitter-${color})`, vars),
          substitute('var(--bulma-scheme-main)', vars)
        );
        if (ratio < 3) {
          failures.push(`${scheme}, ${color}: ${ratio.toFixed(2)}:1`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
