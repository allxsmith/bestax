// Bulma writes a panel's heading in `text-invert` on the text color unless
// the panel has a color of its own, and its dark scheme lightens the text
// color without darkening `text-invert`, so a plain panel's heading was white
// on light gray there (#1550). `_panel.scss` gives the panel the scheme
// background's lightness as its `text-invert`.
//
// jsdom resolves no `var()`, so these read the custom properties Bulma's
// themes, Bulma's panel module and the partial declare, resolve the heading's
// colors from them the way a browser does, and measure the contrast on each
// scheme. bestax's builds change Bulma's primary and no scheme token, so
// Bulma's themes are the ones every flavor ships.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Panel } from '../Panel';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const compile = (source: string) =>
  sass.compileString(source, {
    loadPaths: [SCSS, path.dirname(BULMA)],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css;

const partial = (prefix = '') =>
  compile(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'components/panel';`
  );

type Vars = Record<string, string>;

/** Each top-level style rule in `css`, its selectors split apart. */
function rulesOf(css: string) {
  const sheet = document.createElement('style');
  sheet.textContent = css.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  try {
    return Array.from((sheet.sheet as CSSStyleSheet).cssRules)
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .map(rule => {
        const vars: Vars = {};
        for (let i = 0; i < rule.style.length; i++) {
          const name = rule.style[i];
          if (name.startsWith('--')) {
            vars[name] = rule.style.getPropertyValue(name).trim();
          }
        }
        return {
          selectors: rule.selectorText.split(',').map(s => s.trim()),
          vars,
        };
      });
  } finally {
    sheet.remove();
  }
}

/** The custom properties the top-level rules for `selector` declare. */
function varsOn(css: string, selector: string): Vars {
  return Object.assign(
    {},
    ...rulesOf(css)
      .filter(rule => rule.selectors.includes(selector))
      .map(rule => rule.vars)
  );
}

const THEMES = compile(`@use 'bulma/sass/themes';`);
const LIGHT = varsOn(THEMES, ':root');
const SCHEMES: Record<string, Vars> = {
  light: LIGHT,
  // The dark theme declares what it changes, and the rest is inherited.
  dark: { ...LIGHT, ...varsOn(THEMES, '[data-theme=dark]') },
};

const PANEL = compile(`@use 'bulma/sass/components/panel';`);
const PARTIAL = varsOn(partial(), '.panel');

/** The heading's colors, as Bulma's `.panel-heading` writes them. */
const HEADING = {
  color:
    'hsl(var(--bulma-panel-h), var(--bulma-panel-s), var(--bulma-panel-heading-color-l))',
  background:
    'hsl(var(--bulma-panel-h), var(--bulma-panel-s), var(--bulma-panel-heading-background-l))',
};

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

/**
 * The heading's contrast on `scheme`, for a panel with no color or with
 * `color`. What the panel declares itself beats what it inherits from the
 * root, and a colored panel's own rule outranks `.panel`.
 */
function headingContrast(
  scheme: string,
  { color, withPartial }: { color?: string; withPartial: boolean }
): number {
  const vars = {
    ...SCHEMES[scheme],
    ...(withPartial ? PARTIAL : {}),
    ...varsOn(PANEL, '.panel'),
    ...(color ? varsOn(PANEL, `.panel.is-${color}`) : {}),
  };
  return contrast(
    substitute(HEADING.color, vars),
    substitute(HEADING.background, vars)
  );
}

// Panel's `color` union.
const COLORS = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
];

describe('Panel heading contrast', () => {
  it("is Bulma's own heading formula", () => {
    const heading = rulesOf(PANEL).find(rule =>
      rule.selectors.includes('.panel-heading')
    );
    expect(heading).toBeDefined();
    const flat = PANEL.replace(/\s+/g, ' ');
    expect(flat).toContain(`background-color: ${HEADING.background};`);
    expect(flat).toContain(`color: ${HEADING.color};`);
  });

  it("measures Bulma's plain heading under 4.5:1 on the dark scheme, so the check can fail", () => {
    expect(headingContrast('dark', { withPartial: false })).toBeLessThan(4.5);
  });

  it.each(Object.keys(SCHEMES))(
    'holds 4.5:1 on a panel with no color on the %s scheme',
    scheme => {
      expect(
        headingContrast(scheme, { withPartial: true })
      ).toBeGreaterThanOrEqual(4.5);
    }
  );

  it.each(COLORS)(
    'leaves a %s panel as Bulma draws it on both schemes',
    color => {
      expect(varsOn(PANEL, `.panel.is-${color}`)).toHaveProperty(
        '--bulma-panel-heading-color-l'
      );
      for (const scheme of Object.keys(SCHEMES)) {
        expect(headingContrast(scheme, { color, withPartial: true })).toBe(
          headingContrast(scheme, { color, withPartial: false })
        );
      }
    }
  );
});

describe('Panel partial', () => {
  it("points the panel's text-invert at the scheme background", () => {
    expect(PARTIAL).toEqual({
      '--bulma-text-invert-l': 'var(--bulma-scheme-main-l)',
    });
  });

  it('applies whichever order it and Bulma load in', () => {
    // Bulma declares text-invert on the root and the themes, never on the
    // panel, so the partial's is the only declaration on the panel itself.
    const bulma = fs.readFileSync(path.join(BULMA, 'css', 'bulma.css'), 'utf8');
    const onPanel = rulesOf(bulma).filter(
      rule =>
        rule.selectors.some(s => /\.panel\b/.test(s)) &&
        '--bulma-text-invert-l' in rule.vars
    );
    expect(onPanel).toEqual([]);
    expect(
      rulesOf(bulma).some(rule => '--bulma-text-invert-l' in rule.vars)
    ).toBe(true);
  });

  it('keys on the prefixed class in the prefixed build', () => {
    expect(varsOn(partial('bestax-'), '.bestax-panel')).toEqual(PARTIAL);
  });

  it.each([
    ['', 'panel'],
    ['bestax-', 'bestax-panel'],
  ])(
    'matches the class Panel renders with prefix "%s"',
    (prefix, className) => {
      const { container } = render(
        <ConfigProvider classPrefix={prefix || undefined}>
          <Panel>
            <Panel.Heading>Heading</Panel.Heading>
          </Panel>
        </ConfigProvider>
      );
      expect(container.firstElementChild).toHaveClass(className);
    }
  );
});
