// Checkbox and Radio draw their own box in place of the browser's, and an
// unchecked one shows nothing but its border. WCAG 2.2 asks 3:1 of the
// boundary that identifies a control (SC 1.4.11, non-text contrast) against
// what is next to it, and the box has no fill of its own, so that is the
// surface the form sits on. Bulma's `border` is far fainter than that (#1152).
//
// These read the default each partial gives its border, resolve it through
// Bulma's themes, light and dark, and measure it against the scheme's
// surfaces. bestax's builds change Bulma's primary and no scheme token, so
// Bulma's themes are the ones every flavor ships.
import * as sass from 'sass';
import path from 'path';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (source: string) =>
  sass.compileString(source, {
    loadPaths: [SCSS, path.dirname(BULMA)],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css;

type Vars = Record<string, string>;

/** The custom properties the top-level rules for `selector` declare. */
function varsOn(css: string, selector: string): Vars {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  try {
    const vars: Vars = {};
    for (const rule of Array.from((sheet.sheet as CSSStyleSheet).cssRules)) {
      if (!(rule instanceof CSSStyleRule)) continue;
      const selectors = rule.selectorText.split(',').map(s => s.trim());
      if (!selectors.includes(selector)) continue;
      for (let i = 0; i < rule.style.length; i++) {
        const name = rule.style[i];
        if (name.startsWith('--')) {
          vars[name] = rule.style.getPropertyValue(name).trim();
        }
      }
    }
    return vars;
  } finally {
    sheet.remove();
  }
}

const THEMES = compile(`@use 'bulma/sass/themes';`);
const LIGHT = varsOn(THEMES, ':root');
const SCHEMES: Record<string, Vars> = {
  light: LIGHT,
  // The dark theme declares what it changes, and the rest is inherited.
  dark: { ...LIGHT, ...varsOn(THEMES, '[data-theme=dark]') },
};

/** What a page, a box, a card or a panel paints behind the control. */
const SURFACES = [
  '--bulma-scheme-main',
  '--bulma-scheme-main-bis',
  '--bulma-scheme-main-ter',
  '--bulma-background',
];

/** `value` with each `var()` replaced from `vars`, as a browser does. */
function substitute(value: string, vars: Vars): string {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    if (!(name in vars)) throw new Error(`${name} is not declared`);
    return substitute(vars[name], vars);
  });
}

/** An `hsl()` color's sRGB channels, from 0 to 1. */
function rgbOf(color: string): number[] {
  const match =
    /^hsl\(\s*([\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/.exec(
      color
    );
  if (!match) throw new Error(`not an hsl() color: ${color}`);
  const h = Number(match[1]);
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [channel(0), channel(8), channel(4)];
}

/** The WCAG 2 contrast ratio between two `hsl()` colors. */
function contrast(a: string, b: string): number {
  const luminance = (color: string) => {
    const [r, g, bl] = rgbOf(color).map(c =>
      c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The surfaces `color` falls under 3:1 against in `scheme`, with the ratio. */
function belowThreeToOne(color: string, scheme: string): string[] {
  const vars = SCHEMES[scheme];
  const resolved = substitute(color, vars);
  return SURFACES.flatMap(surface => {
    const ratio = contrast(resolved, substitute(`var(${surface})`, vars));
    return ratio < 3 ? [`${surface}: ${ratio.toFixed(2)}:1`] : [];
  });
}

describe.each([
  ['Checkbox', 'form/checkbox', '.styled-checkbox', 'checkbox'],
  ['Radio', 'form/radio', '.styled-radio', 'radio'],
])("%s's unchecked border", (_name, partial, root, key) => {
  const border = varsOn(compile(`@use '${partial}';`), root)[
    `--bulma-${key}-border-color`
  ];

  it('has a default', () => {
    expect(border).toMatch(/^var\(--bulma-[\w-]+\)$/);
  });

  it.each(Object.keys(SCHEMES))(
    'holds 3:1 on every scheme surface in %s',
    scheme => {
      expect(belowThreeToOne(border, scheme)).toEqual([]);
    }
  );
});

it("measures Bulma's `border` below 3:1, so the check can fail", () => {
  for (const scheme of Object.keys(SCHEMES)) {
    expect(belowThreeToOne('var(--bulma-border)', scheme)).toHaveLength(
      SURFACES.length
    );
  }
});
