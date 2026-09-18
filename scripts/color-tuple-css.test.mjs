/**
 * Hold the colour tuples to the stylesheet, in both directions.
 *
 * Adding a colour has bitten twice, once each way, and each is a different
 * kind of silence.
 *
 * A colour the CSS has and `validColors` does not is dropped by membership:
 * `<Block bgColor="white-ter" />` rendered no background while
 * `has-background-white-ter` sat in `dist/bestax.css` and the library's own
 * docs used it. `black-bis` and `black-ter` were in the tuple and the white
 * pair was not, which is the shape of it: an asymmetry nobody could see by
 * reading either file alone.
 *
 * A colour in `validColors` whose COMPONENT modifier has no rule is worse,
 * because it renders a class. `Notification.color`, `Progress.color` and
 * `Hero.color` are typed off the tuple and emit `is-<colour>`, so adding the
 * white shades made `<Notification color="white-ter">` emit a dead modifier,
 * and it did so without the development warning that `black-ter` gets, since
 * only the black pair was declared in `UNSTYLED_MODIFIER_COLORS`. Fixing the
 * first defect created the second, which is the argument for checking both
 * here rather than one.
 *
 * The component-modifier check is an equality, because the two sets partition
 * `validColors` exactly today, with no exceptions. The helper-class check is
 * narrower than it looks and it is worth saying why, rather than leaving the
 * next person to find out: the general form, "every colour the CSS names is in
 * the tuple", is not available from the stylesheet, because `has-text-` is a
 * shared namespace carrying alignment (`has-text-centered`), weight
 * (`has-text-weight-bold`) and the CSS-wide keywords alongside the colours,
 * crossed with every shade in `validColorShades` plus a `-100` that tuple does
 * not carry. Separating those needs a hand-maintained exception list, a bigger
 * and more fragile thing than the defect it would catch. The `-bis`/`-ter`
 * family needs none: those suffixes are not shades, not viewports, and not
 * used by any other helper family, so that check is exact too.
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
const DEPRECATIONS = join(
  REPO,
  'bulma-ui',
  'src',
  'helpers',
  'colorDeprecations.ts'
);

/**
 * The components whose `color` prop emits `is-<colour>` and is typed off
 * `validColors`, so that widening the tuple widens theirs.
 *
 * Read the partition below as the reason this list is short: these are the
 * elements where a colour with no matching rule renders nothing and the
 * library warns instead. `Button` is absent on purpose, since its union is
 * declared separately and narrower.
 */
const MODIFIER_ELEMENTS = ['notification', 'progress', 'hero'];

/** A named `as const` string tuple, read from a source file. */
function tupleFrom(path, name) {
  const source = readFileSync(path, 'utf8');
  const block = new RegExp(
    `export const ${name} = \\[(.*?)\\] as const;`,
    's'
  ).exec(source);
  assert.ok(
    block,
    `could not find the \`${name}\` tuple in ${path}, so this guard cannot ` +
      'run. Fix the pattern in the same change that moved it.'
  );
  const values = [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.ok(values.length > 0, `the \`${name}\` tuple read as empty`);
  return values;
}

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

describe('the colour tuples agree with the shipped stylesheet', () => {
  it('declares every colour whose component modifier has no CSS', () => {
    // The defect this catches, which the `-bis`/`-ter` check below does not:
    // `Notification.color`, `Progress.color` and `Hero.color` are typed off
    // `validColors` and emit `is-<colour>`, so widening the tuple widened
    // theirs. `.notification.is-white-ter` does not exist, so
    // `<Notification color="white-ter">` rendered a dead modifier SILENTLY
    // while `black-ter` warned, because only the black pair was declared.
    //
    // The two sets partition `validColors` exactly, with no exceptions, so
    // this is an equality rather than a subset check: a colour is either
    // backed by a rule on all three elements or declared unstyled.
    assert.ok(
      existsSync(CSS),
      'bulma-ui/dist/bestax.css is absent, so the tuples cannot be compared ' +
        'against the shipped CSS. Build first, or run `pnpm all`.'
    );
    const css = readFileSync(CSS, 'utf8');
    const colors = validColors();
    const declared = tupleFrom(DEPRECATIONS, 'UNSTYLED_MODIFIER_COLORS');

    const dead = colors.filter(color =>
      MODIFIER_ELEMENTS.every(el => !shipsClass(css, `${el}.is-${color}`))
    );
    assert.deepEqual(
      [...dead].sort(),
      [...declared].sort(),
      'UNSTYLED_MODIFIER_COLORS and the colours with no component-modifier ' +
        'rule disagree. A colour in the real set and not the declared one ' +
        'renders a dead modifier with no warning, which is the silence the ' +
        'warning exists to break; the reverse warns about a colour that works.'
    );
  });

  it('names the CSS-backed colours consistently in the warning', () => {
    // `CSS_BACKED` is the message's half of the same fact, written as prose
    // for the console. It is the complement of the set above, so it can go
    // stale the same way and say the wrong thing to a developer.
    const source = readFileSync(DEPRECATIONS, 'utf8');
    const line = /const CSS_BACKED =\s*\n?\s*'([^']+)'/.exec(source);
    assert.ok(line, 'could not find `CSS_BACKED` in colorDeprecations.ts');
    const named = line[1].split(',').map(v => v.trim());
    const declared = new Set(
      tupleFrom(DEPRECATIONS, 'UNSTYLED_MODIFIER_COLORS')
    );
    assert.deepEqual(
      [...named].sort(),
      validColors()
        .filter(c => !declared.has(c))
        .sort(),
      'the colours `CSS_BACKED` names and the colours not declared unstyled ' +
        'disagree, so the warning tells the developer to use a value that is ' +
        'either dead or missing.'
    );
  });

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
