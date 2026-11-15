// What shows a checked Radio, a Switch on or off, and a focused Slider's
// thumb, resolved through the variables a whole published sheet declares in
// each scheme, the way a browser does, and measured (#1766). Each shows a
// control's state, a graphic, so it needs 3:1 against the page (WCAG 1.4.11),
// and the switch's circle, drawn on the track, needs 3:1 against that track.
// `extras.css` takes its colors from the app's Bulma, so it is measured with
// Bulma's own.
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

/** Each color, and no color, as `it.each` rows. */
const ROWS = [
  ['no color', undefined],
  ...COLORS.map(color => [color, color]),
] as [string, string | undefined][];

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
])('Control state contrast in %s', (_name, prefix, sheet) => {
  let schemes: ReturnType<typeof schemesOf>;
  let rules: CSSStyleRule[];
  // A hook keeps Vitest's 10s default rather than `testTimeout`, and a whole
  // sheet can take longer than that to compile on a loaded machine.
  beforeAll(() => {
    rules = rulesOf(sheet()).rules;
    schemes = schemesOf(rules);
  }, 30_000);

  /** The variables `root` declares, and its `is-<color>` declares over them. */
  const own = (root: string, color?: string): Vars => ({
    ...varsOn(rules, `.${prefix}${root}`),
    ...(color ? varsOn(rules, `.${prefix}${root}.${prefix}is-${color}`) : {}),
  });

  /**
   * Each pair of colors in `pairs` that falls under 3:1 in a scheme, with the
   * ratio, `vars(scheme)` giving the variables they resolve through there.
   */
  function belowThreeToOne(
    vars: (scheme: string) => Vars,
    pairs: Record<string, [string, string]>
  ): string[] {
    const failures: string[] = [];
    for (const scheme of Object.keys(schemes)) {
      const resolved = vars(scheme);
      for (const [label, [a, b]] of Object.entries(pairs)) {
        const ratio = contrast(
          substitute(a, resolved),
          substitute(b, resolved)
        );
        if (ratio < 3)
          failures.push(`${scheme}, ${label}: ${ratio.toFixed(2)}:1`);
      }
    }
    return failures;
  }

  const PAGE = 'var(--bulma-scheme-main)';

  it.each(ROWS)(
    'draws a checked Radio’s ring and dot at 3:1 against the page, with %s',
    (_label, color) => {
      const vars = (scheme: string) => ({
        ...schemes[scheme as 'light'],
        ...own('styled-radio', color),
      });
      expect(
        belowThreeToOne(vars, {
          ring: ['var(--bulma-radio-active-color)', PAGE],
          dot: ['var(--bulma-radio-dot-color)', PAGE],
        })
      ).toEqual([]);
    }
  );

  /**
   * The circle a Switch draws in `scheme`, from the rule that pins it there,
   * which declares the same circle the OS's scheme gives it.
   */
  const circle = (scheme: string): Vars =>
    varsOn(
      rules,
      s =>
        s.startsWith(':where(') &&
        s.endsWith(`.${prefix}switch`) &&
        new RegExp(`theme="?${scheme}"?\\]`).test(s)
    );

  it.each(ROWS)(
    'draws a Switch’s track at 3:1 against the page, on and off, and its circle at 3:1 on it, with %s',
    (_label, color) => {
      const vars = (scheme: string) => ({
        ...schemes[scheme as 'light'],
        ...own('switch', color),
        ...circle(scheme),
      });
      expect(
        belowThreeToOne(vars, {
          'on track': ['var(--bulma-switch-active-color)', PAGE],
          'off track': ['var(--bulma-switch-background)', PAGE],
          'circle on': [
            'var(--bulma-switch-circle-color)',
            'var(--bulma-switch-active-color)',
          ],
          'circle off': [
            'var(--bulma-switch-circle-color)',
            'var(--bulma-switch-background)',
          ],
        })
      ).toEqual([]);
    }
  );

  it.each(COLORS)(
    'draws a Switch’s %s passive off track at 3:1 against the page, and its circle at 3:1 on it',
    color => {
      const track = rules.find(
        rule =>
          rule.selectorText ===
          `.${prefix}switch.${prefix}is-${color}-passive .${prefix}check`
      );
      const fill = track?.style.getPropertyValue('background-color') ?? '';
      expect(fill).not.toBe('');
      const vars = (scheme: string) => ({
        ...schemes[scheme as 'light'],
        ...own('switch'),
        ...circle(scheme),
      });
      expect(
        belowThreeToOne(vars, {
          'off track': [fill, PAGE],
          circle: ['var(--bulma-switch-circle-color)', fill],
        })
      ).toEqual([]);
    }
  );

  it.each(ROWS)(
    'rings a keyboard-focused Slider’s thumb at 3:1 against the page, with %s',
    (_label, color) => {
      const vars = (scheme: string) => ({
        ...schemes[scheme as 'light'],
        ...own('slider', color),
      });
      expect(
        belowThreeToOne(vars, {
          'focus ring': ['var(--bulma-slider-focus-color)', PAGE],
        })
      ).toEqual([]);
    }
  );

  it('finds the circle each scheme pins', () => {
    expect(circle('light')['--bulma-switch-circle-color']).toBe(
      'var(--bulma-white-ter)'
    );
    expect(circle('dark')['--bulma-switch-circle-color']).toBe(
      'var(--bulma-scheme-main)'
    );
  });
});
