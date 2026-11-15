// How a styles suite measures a color the way WCAG 2 does. jsdom resolves no
// `var()`, so a suite reads a color as a sheet writes it, substitutes its
// variables from the ones the whole sheet declares in a scheme, and measures
// the `hsl()` that comes out.

/** Custom properties by name. */
export type Vars = Record<string, string>;

/**
 * The custom properties a sheet's top-level rules (`rulesOf(css).rules` in
 * `css-cascade.ts`) declare for a selector, one of a rule's list, or for any
 * selector `selector` returns true for, later rules over earlier ones.
 */
export function varsOn(
  rules: CSSStyleRule[],
  selector: string | ((selector: string) => boolean)
): Vars {
  const test =
    typeof selector === 'string' ? (s: string) => s === selector : selector;
  const vars: Vars = {};
  for (const rule of rules) {
    // Split at the commas between selectors, not the ones inside `:not()`.
    const selectors = rule.selectorText.split(/,(?![^(]*\))/);
    if (!selectors.some(s => test(s.trim()))) continue;
    for (let i = 0; i < rule.style.length; i++) {
      const name = rule.style[i];
      if (name.startsWith('--')) {
        vars[name] = rule.style.getPropertyValue(name).trim();
      }
    }
  }
  return vars;
}

/**
 * The variables a sheet declares in each scheme, from its top-level rules:
 * the light one on `:root`, and the dark one on the attribute that switches
 * the sheet to it (`[data-theme=dark]`, or `[data-bestax-theme=dark]` in the
 * prefixed build), over the light one, since it declares only what changes.
 */
export function schemesOf(rules: CSSStyleRule[]): { light: Vars; dark: Vars } {
  const light = varsOn(rules, ':root');
  const dark = varsOn(rules, s => /^\[data-[\w-]*theme=dark\]$/.test(s));
  if (Object.keys(dark).length === 0) {
    throw new Error('The sheet declares no dark scheme.');
  }
  return { light, dark: { ...light, ...dark } };
}

/** A `var()` whose variable has no value. */
class Unset extends Error {}

/**
 * `value` with each `var()` replaced from `vars`, as a browser does. A
 * variable that isn't declared, or whose own value reads one that isn't, has
 * no value, so the `var()` takes its fallback, and without one it fails.
 */
export function substitute(value: string, vars: Vars): string {
  const at = value.indexOf('var(');
  if (at < 0) return value;
  let depth = 0;
  let end = at + 3;
  for (; end < value.length; end++) {
    if (value[end] === '(') depth++;
    else if (value[end] === ')' && --depth === 0) break;
  }
  const inner = value.slice(at + 4, end);
  const comma = inner.indexOf(',');
  const name = (comma < 0 ? inner : inner.slice(0, comma)).trim();
  let replaced: string;
  try {
    if (!(name in vars)) throw new Unset(`${name} is not declared`);
    replaced = substitute(vars[name], vars);
  } catch (error) {
    if (!(error instanceof Unset) || comma < 0) throw error;
    replaced = substitute(inner.slice(comma + 1), vars);
  }
  return (
    value.slice(0, at) +
    replaced.trim() +
    substitute(value.slice(end + 1), vars)
  );
}

/** An opaque `hsl()` or `hsla()` color's sRGB channels, from 0 to 1. */
function rgbOf(color: string): number[] {
  const match =
    /^hsla?\(\s*([\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*1\s*)?\)$/.exec(
      color
    );
  if (!match) throw new Error(`not an opaque hsl() color: ${color}`);
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

/** The WCAG 2 contrast ratio between two opaque `hsl()` colors. */
export function contrast(a: string, b: string): number {
  const luminance = (color: string) => {
    const [r, g, bl] = rgbOf(color).map(c =>
      c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
