// A loading Control or Select draws Bulma's ring on the input's own fill, in
// `--bulma-loading-color`. Bulma's light theme sets that to its `border` gray,
// about 1.4:1 on the fill, and the ring is all there is of the loading state,
// so it's a graphic that needs 3:1 (#1774). bestax's full builds set it to the
// scheme's weak text color after Bulma's themes, on the same elements the light
// theme sets it on and nowhere else, so a value an app sets keeps reaching the
// elements it did. `extras.css` leaves it to the app's own Bulma.
//
// These compile every stylesheet `package.json` publishes, read the variable
// off each sheet's rules, and measure it, as each scheme resolves it, against
// the fills the sheet itself gives an input and a select, enabled and
// disabled.
import fs from 'fs';
import path from 'path';
import { SCSS, compileScss, compileSheet } from '../../__tests__/compile-scss';
import { rulesOf } from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  varsOn,
  type Vars,
} from '../../__tests__/contrast';

const PKG = path.resolve(__dirname, '../../..');

/** Every stylesheet the package publishes, as the SCSS file it's built from. */
function publishedStylesheets(): string[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')
  ) as { exports: Record<string, { default?: string }> };
  const targets = new Set<string>();
  for (const entry of Object.values(manifest.exports)) {
    const target = entry?.default;
    if (target?.endsWith('.css')) targets.add(target);
  }
  return [...targets]
    .map(target => target.replace(/^\.\/dist\//, '').replace(/\.css$/, '.scss'))
    .sort();
}

/** A selector list's selectors, split at the commas outside parentheses. */
const selectorsOf = (rule: CSSStyleRule) =>
  rule.selectorText.split(/\s*,(?![^(]*\))\s*/).map(s => s.trim());

/** The `background-color` the last rule naming `selector` gives it. */
function fillOf(rules: CSSStyleRule[], selector: string): string {
  const value = rules
    .filter(rule => selectorsOf(rule).includes(selector))
    .map(rule => rule.style.getPropertyValue('background-color').trim())
    .filter(Boolean)
    .pop();
  if (!value) throw new Error(`The sheet gives ${selector} no fill.`);
  return value;
}

/**
 * `value` with each `calc()` of percentages added up, the one shape Bulma's
 * fills use, since `contrast` reads plain `hsl()` only. Anything else throws
 * rather than measuring something else.
 */
const summed = (value: string) =>
  value.replace(/calc\(([^()]*)\)/g, (whole, expression: string) => {
    if (!/^\s*-?[\d.]+%(\s*\+\s*-?[\d.]+%)*\s*$/.test(expression)) {
      throw new Error(`${whole} isn't a sum of percentages.`);
    }
    const sum = expression
      .split('+')
      .reduce((total, term) => total + parseFloat(term), 0);
    return `${sum}%`;
  });

/** A color in `vars`, with its `var()`s and sums resolved. */
const resolved = (value: string, vars: Vars) => summed(substitute(value, vars));

const SHEETS = publishedStylesheets().map(file => {
  const source = fs.readFileSync(path.join(SCSS, file), 'utf8');
  return {
    file,
    prefix: /\$class-prefix:\s*["']([^"']*)["']/.exec(source)?.[1] ?? '',
    bringsBulma: /bulma\/sass(?:\/elements|['"])/.test(source),
  };
});

/** Where Bulma sets a scheme: the page, and the elements that switch it. */
const schemeScope = (selector: string) =>
  selector === ':root' || /^\[data-[\w-]*theme=|^\.[\w-]*theme-/.test(selector);

describe.each(SHEETS.filter(sheet => sheet.bringsBulma))(
  '$file',
  ({ file, prefix }) => {
    let rules: CSSStyleRule[];
    let nested: { rule: CSSStyleRule; within: string }[];
    beforeAll(() => {
      ({ rules, nested } = rulesOf(compileSheet(file)));
    }, 60000);

    const light = [`[data-${prefix}theme=light]`, `.${prefix}theme-light`];
    const dark = [`[data-${prefix}theme=dark]`, `.${prefix}theme-dark`];
    const noDarkMode = /no-dark-mode/.test(file);

    /** The fills a loading control's or select's ring sits on, as written. */
    const fills = () => ({
      input: fillOf(rules, `.${prefix}input`),
      // Sass writes the attribute first.
      'disabled input': fillOf(rules, `[disabled].${prefix}input`),
      select: fillOf(rules, `.${prefix}select select`),
      'disabled select': fillOf(rules, `.${prefix}select select[disabled]`),
    });

    /** The fills `color` falls under 3:1 against, with the ratio. */
    const belowThreeToOne = (color: string, vars: Vars, fill: Vars = vars) => {
      // The input's own variables, which Bulma registers on it, over the
      // scheme's.
      const own = { ...fill, ...varsOn(rules, `.${prefix}input`) };
      return Object.entries(fills()).flatMap(([name, value]) => {
        const ratio = contrast(resolved(color, vars), resolved(value, own));
        return ratio < 3 ? [`${name}: ${ratio.toFixed(2)}:1`] : [];
      });
    };

    it('sets the loading color to the weak text color where Bulma’s light theme sets it', () => {
      const where = [':root', ...(noDarkMode ? [] : light)];
      expect(
        where.map(selector => [
          selector,
          varsOn(rules, selector)['--bulma-loading-color'],
        ])
      ).toEqual(where.map(selector => [selector, 'var(--bulma-text-weak)']));
    });

    it('sets nothing where Bulma’s dark theme is, so an app’s value still reaches it', () => {
      expect(
        dark.map(selector => varsOn(rules, selector)['--bulma-loading-color'])
      ).toEqual([undefined, undefined]);
      // Nor in the dark scheme a system setting turns on.
      expect(
        nested
          .filter(({ within }) => /prefers-color-scheme:\s*dark/.test(within))
          .filter(({ rule }) =>
            rule.style.getPropertyValue('--bulma-loading-color')
          )
          .map(({ rule }) => rule.selectorText)
      ).toEqual([]);
    });

    it('holds 3:1 on every fill in each scheme', () => {
      // Only the build named for it has no dark scheme; `schemesOf` throws on
      // any other sheet that has lost its own.
      const schemes: Record<string, Vars> = noDarkMode
        ? { light: varsOn(rules, ':root') }
        : schemesOf(rules);
      for (const [scheme, vars] of Object.entries(schemes)) {
        expect([
          scheme,
          belowThreeToOne('var(--bulma-loading-color)', vars),
        ]).toEqual([scheme, []]);
      }
      // A section that switches to the dark scheme sets no loading color of
      // its own, so it keeps the page's, resolved in the light scheme, on its
      // own dark fills.
      if (!noDarkMode) {
        expect(
          belowThreeToOne(
            'var(--bulma-loading-color)',
            schemes.light,
            schemes.dark
          )
        ).toEqual([]);
      }
      // Bulma's own gray is below it on every fill, so the check can fail.
      expect(
        belowThreeToOne('var(--bulma-border)', schemes.light)
      ).toHaveLength(Object.keys(fills()).length);
    });
  }
);

describe.each(SHEETS.filter(sheet => !sheet.bringsBulma))(
  '$file, for an app’s own Bulma',
  ({ file }) => {
    it('sets no loading color where a scheme is set, so the app’s Bulma keeps its own', () => {
      // Read off the sheet alone: linked next to Bulma's CSS, Bulma's own
      // `:root` would hide one on one side or the other.
      const { rules, nested } = rulesOf(compileSheet(file));
      expect(
        [...rules, ...nested.map(({ rule }) => rule)]
          .filter(rule => selectorsOf(rule).some(schemeScope))
          .filter(rule => rule.style.getPropertyValue('--bulma-loading-color'))
          .map(rule => rule.selectorText)
      ).toEqual([]);
    });
  }
);

describe('bulma-defaults in a modular build', () => {
  it('names the variable with the build’s own `$cssvars-prefix`, as Bulma reads it', () => {
    const css = compileScss(
      `@use 'bulma/sass/utilities' with ($cssvars-prefix: 'my-');
       @use 'bulma-defaults';
       @include bulma-defaults.rules;`
    );
    expect(css).toMatch(/--my-loading-color:\s*var\(--my-text-weak\)/);
    expect(css).not.toMatch(/--bulma-loading-color/);
  });
});
