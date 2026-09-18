/**
 * Hold `validColors` to the `-bis` and `-ter` shades the CSS actually ships.
 *
 * `useColorClasses` validates by membership, so a colour the CSS has and the
 * tuple does not is silently dropped: `<Block bgColor="white-ter" />` rendered
 * no background at all, while `has-background-white-ter` sits in
 * `dist/bestax.css` and the library's own docs used it. `black-bis` and
 * `black-ter` were in the tuple and their white counterparts were not, which
 * is the whole shape of the bug: an asymmetry nobody could see by reading
 * either file alone.
 *
 * Narrow on purpose, and worth saying why rather than leaving the next person
 * to find out. The general invariant, "every colour the CSS names is in the
 * tuple", is not available from the stylesheet: `has-text-` is a shared
 * namespace, carrying alignment (`has-text-centered`), weight
 * (`has-text-weight-bold`) and the CSS-wide keywords alongside the colours, and
 * the colour classes themselves are crossed with every shade in
 * `validColorShades` plus a `-100` that tuple does not carry. Separating those
 * needs a hand-maintained exception list, which is a bigger and more fragile
 * thing than the defect it would catch. The `-bis`/`-ter` family needs none:
 * the suffixes are not shades, not viewports, and not used by any other helper
 * family, so the check is exact.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const CSS = join(REPO, 'bulma-ui', 'dist', 'bestax.css');
const HELPERS = join(
  REPO,
  'bulma-ui',
  'src',
  'helpers',
  'bulmaClassHelpers.ts'
);

/** The `validColors` members, read from the source rather than the build. */
function validColors() {
  const source = readFileSync(HELPERS, 'utf8');
  const block = /export const validColors = \[(.*?)\] as const;/s.exec(source);
  assert.ok(
    block,
    'could not find the `validColors` tuple in bulmaClassHelpers.ts, so this ' +
      'guard cannot run. Fix the pattern in the same change that moved it.'
  );
  const colors = [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.ok(colors.length > 0, 'the `validColors` tuple read as empty');
  return colors;
}

/** Does the stylesheet carry this exact class, not a longer one starting with it? */
const shipsClass = (css, cls) =>
  new RegExp(
    `\\.${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9-])`
  ).test(css);

describe('validColors covers the shipped -bis and -ter shades', () => {
  it('has every bis/ter variant the stylesheet emits a class for', () => {
    assert.ok(
      existsSync(CSS),
      'bulma-ui/dist/bestax.css is absent, so the tuple cannot be compared ' +
        'against the shipped CSS. Build first, or run `pnpm all`.'
    );
    const css = readFileSync(CSS, 'utf8');
    const colors = validColors();

    // Read the variants off the CSS rather than listing them, so a new base
    // colour gaining a shade is covered without an edit here.
    const shipped = [];
    for (const color of colors) {
      for (const suffix of ['bis', 'ter']) {
        const variant = `${color}-${suffix}`;
        if (
          shipsClass(css, `has-text-${variant}`) ||
          shipsClass(css, `has-background-${variant}`)
        ) {
          shipped.push(variant);
        }
      }
    }

    assert.ok(
      shipped.length > 0,
      'no -bis or -ter colour classes found in the stylesheet, which would ' +
        'make this guard vacuous. Either Bulma dropped them or the class ' +
        'naming changed.'
    );

    const missing = shipped.filter(v => !colors.includes(v));
    assert.deepEqual(
      missing,
      [],
      `the stylesheet ships ${missing.join(', ')} but validColors does not ` +
        'carry them, so the library drops the value and renders nothing while ' +
        'the CSS for it exists.'
    );
  });
});
