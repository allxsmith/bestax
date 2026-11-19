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
import { compileSource, rulesOf } from '../../__tests__/css-cascade';
import {
  contrast,
  schemesOf,
  substitute,
  varsOn,
  type Vars,
} from '../../__tests__/contrast';

const SCHEMES: Record<string, Vars> = schemesOf(
  rulesOf(compileSource(`@use 'bulma/sass/themes';`)).rules
);

/** What a page, a box, a card or a panel paints behind the control. */
const SURFACES = [
  '--bulma-scheme-main',
  '--bulma-scheme-main-bis',
  '--bulma-scheme-main-ter',
  '--bulma-background',
];

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
  const border = varsOn(
    rulesOf(compileSource(`@use '${partial}';`)).rules,
    root
  )[`--bulma-${key}-border-color`];

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
