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
 * `validColors` exactly today, with no exceptions, and it is made per element
 * rather than across them all: asking whether a colour is dead on EVERY
 * element passes a colour Bulma ships on one and not the others, which would
 * land in neither set while that one renders a dead modifier unwarned. The
 * elements themselves are derived rather than listed, and each is held to
 * calling `warnUnstyledColor`, so a component that starts emitting the
 * modifier is compared whether or not anyone remembered to add it here.
 *
 * Two things sit outside everything asserted here, and are worth naming so
 * the scope reads as chosen rather than overlooked. `Hero` passes
 * `extraUnstyled: ['inherit', 'current']`, values that are not in
 * `validColors` at all, so no loop over the tuple reaches them. And `bgColor`
 * accepts `validSchemeColors` on top of the tuple, which the shade assertion
 * does not cover either. Both are pre-existing and both point the safe way.
 *
 * The helper-class check is
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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { extractComponent } from './lib/props-extract.mjs';

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

const SRC = join(REPO, 'bulma-ui', 'src');

/**
 * Is this component's `color` prop typed off `validColors`?
 *
 * Read from the TYPE, through the extractor behind the API docs, rather than
 * by matching the declaration's source text. The text version was a one-line
 * substring, so a prettier-wrapped union dropped the component out of the
 * comparison and `elements.length > 0` kept the suite green on the survivors:
 * weaker, on that one direction, than the hardcoded list it replaced. `Hero`
 * makes the point on its own, with four such declarations across its parts.
 *
 * `TYPE_DISPLAY` renders `(typeof validColors)[number]` as `Bulma color`,
 * which is the discriminator: `Button` comes back as its own spelled-out
 * union and `Tag` as the alias `TagColor`, and neither should be in the loop.
 * A component that aliased the tuple would read as its alias name and be
 * missed here, which is what the two-way comparison below is for.
 */
function tupleTyped(component) {
  let info;
  try {
    info = extractComponent(component, { markdown: false });
  } catch {
    // Not an exported component (a private sub-module, a helper file).
    return false;
  }
  return (info.tables ?? []).some(table =>
    (table.rows ?? []).some(
      row => row.name === 'color' && /Bulma color/.test(row.type ?? '')
    )
  );
}

/**
 * The components whose `color` prop emits `is-<colour>` and is typed off
 * `validColors`, so that widening the tuple widens theirs.
 *
 * DERIVED, not listed. A hand-maintained list was tied to nothing, so a
 * fourth component emitting that modifier off the tuple would have sat
 * outside the comparison entirely. Two conditions together identify them, and
 * both are needed: plenty of components type `color` off `validColors` and
 * emit no modifier at all — `Section`, `Footer`, `Level`, `Media` and the
 * `Card` parts are text aliases — while `Button` declares its own narrower
 * union and is therefore absent from the first condition.
 *
 * The component name doubles as the Bulma element class, which holds for
 * these three and is asserted rather than assumed: a derivation that produced
 * a name with no `.<class>.is-primary` rule would make every colour look dead
 * and fail the comparison below for the wrong reason.
 */
function modifierElements() {
  const found = [];
  const warns = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!/^(__tests__|__typetests__|skill-examples)$/.test(entry.name)) {
          walk(path);
        }
        continue;
      }
      if (!/\.tsx?$/.test(entry.name) || entry.name.includes('.stories.')) {
        continue;
      }
      const source = readFileSync(path, 'utf8');
      const component = entry.name.replace(/\.tsx?$/, '');
      const emits = /`is-\$\{color\}`/.test(source);
      if (emits && tupleTyped(component)) {
        found.push({ component, source, path });
      }
      // The helper declaring it is not a caller.
      if (
        /warnUnstyledColor\(/.test(source) &&
        component !== 'colorDeprecations'
      ) {
        warns.push(component);
      }
    }
  };
  walk(SRC);

  // BOTH DIRECTIONS, because each signal can miss what the other sees, and
  // SEPARATELY, because the two failures have different causes and a single
  // `deepEqual` could only explain one of them. An earlier version compared
  // the sets in one assertion whose message named the emission pattern, so a
  // component that emitted and never warned — the defect this exists for —
  // failed with the wrong explanation and never reached the per-element check
  // that names the file.
  const derived = found.map(f => f.component);

  // A component that emits the modifier and never warns renders its dead
  // values in silence. This is the defect; the message has to say so.
  const silent = derived.filter(c => !warns.includes(c)).sort();
  assert.deepEqual(
    silent,
    [],
    `${silent.join(', ')} emit(s) \`is-\${color}\` off \`validColors\` and ` +
      'never calls `warnUnstyledColor`, so the values with no CSS render in ' +
      'silence.'
  );

  // The other way round is not a library defect but a defect in THIS guard: a
  // component that warns is asserting it emits, so if the derivation did not
  // find it, the derivation has stopped working and the comparisons below are
  // checking fewer elements than they appear to.
  const undetected = warns.filter(c => !derived.includes(c)).sort();
  assert.deepEqual(
    undetected,
    [],
    `${undetected.join(', ')} call(s) \`warnUnstyledColor\` but this guard ` +
      'did not derive it as emitting `is-${color}` off `validColors`. The ' +
      'emission pattern or the type read in `modifierElements` has stopped ' +
      'matching, so the comparisons below cover fewer elements than they look ' +
      'like they do.'
  );
  return found;
}

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

/**
 * The stylesheet, or an actionable failure.
 *
 * Every case here reads it, and one of them read it without this guard, so
 * running that case alone threw a raw `ENOENT` instead of saying what to do.
 * In a full run the first case's guard fired first and hid it.
 */
function stylesheet() {
  assert.ok(
    existsSync(CSS),
    'bulma-ui/dist/bestax.css is absent, so the tuples cannot be compared ' +
      'against the shipped CSS. Build first, or run `pnpm all`.'
  );
  return readFileSync(CSS, 'utf8');
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
    // this is an equality rather than a subset check: on each element a
    // colour is either backed by a rule or declared unstyled.
    const css = stylesheet();
    const colors = validColors();
    const declared = tupleFrom(DEPRECATIONS, 'UNSTYLED_MODIFIER_COLORS');

    const elements = modifierElements();
    assert.ok(
      elements.length > 0,
      'no component found that both types `color` off `validColors` and emits ' +
        '`is-${color}`. The derivation has stopped matching, which would make ' +
        'every assertion below vacuous.'
    );

    // PER ELEMENT, not across all three. An earlier version asked whether a
    // colour was dead on every one of them, which holds only while the three
    // agree: a colour Bulma shipped on `.hero` and not `.notification` would
    // land in neither set, the equality would pass, and one element would
    // render a dead modifier with no warning. They do agree today, since the
    // three come off one upstream colour map, so this is the same assertion
    // made for a reason rather than by luck — and it fails the moment they
    // diverge, which is when the declaration needs a per-element shape.
    for (const { component, source, path } of elements) {
      // Emitting the modifier without warning about the dead values is the
      // defect one layer before this one, and deriving the list is what makes
      // it checkable at all.
      // Counted, not merely present. A bare `assert.match` passes a file
      // where one part warns and a sibling emits without warning, which is
      // the shape `Hero` would take if `Head` started emitting the modifier.
      // Still FILE-scoped: the declarations come from the AST, but the
      // emission is matched in source text, so this cannot say WHICH part of
      // a compound emitted. Component-scoping it needs the emission read
      // from the AST too, which is a bigger change than the gap justifies,
      // so the count is the proxy and this comment is the limit.
      const emissions = (source.match(/`is-\$\{color\}`/g) ?? []).length;
      const warnings = (source.match(/warnUnstyledColor\(/g) ?? []).length;
      assert.equal(
        warnings,
        emissions,
        `${path} emits \`is-\${color}\` ${emissions} time(s) off ` +
          `\`validColors\` and calls \`warnUnstyledColor\` ${warnings} ` +
          'time(s). Each emission needs its own call, or the values with no ' +
          'CSS render in silence for whichever part is missing one. If the ' +
          'counts differ for a legitimate reason — one component emitting in ' +
          'two branches of a render, or warning once for two props — this is ' +
          'a count proxy standing in for per-component analysis, and the ' +
          'proxy is what needs changing rather than the component.'
      );
      const el = component.toLowerCase();
      assert.ok(
        shipsClass(css, `${el}.is-primary`),
        `no \`.${el}.is-primary\` rule, so \`${component}\` does not name a ` +
          'Bulma element class and the comparison below would call every ' +
          'colour dead. The component-name-to-class assumption has broken.'
      );
      const dead = colors.filter(
        color => !shipsClass(css, `${el}.is-${color}`)
      );
      assert.deepEqual(
        [...dead].sort(),
        [...declared].sort(),
        `UNSTYLED_MODIFIER_COLORS and the colours with no \`.${el}.is-…\` ` +
          'rule disagree. A colour in the real set and not the declared one ' +
          'renders a dead modifier with no warning, which is the silence the ' +
          'warning exists to break; the reverse warns about a colour that ' +
          'works. If the elements have genuinely diverged, this declaration ' +
          'has to become per element before it can be true of all of them.'
      );
    }
  });

  it('shades exactly the colours that have component modifiers', () => {
    // The shade props and the colour props are judged independently by the
    // lint rule, so `<Box textColor="white-bis" colorShade="15" />` passes
    // while `useColorClasses` emits `has-text-white-bis-15`, which the
    // stylesheet does not carry. `bgColor` with `backgroundColorShade` is the
    // same shape, which is why both families are checked below. That is a false negative rather than a wrong report, and
    // the reason it stays one is this partition: the colours that take a shade
    // are exactly the ones NOT declared unstyled, so the rule would need no
    // new data to close it, only a cross-prop check. Asserting the partition
    // is what keeps that true.
    //
    // A numeric shade is the probe, because the named ones collide with
    // colour names: `has-text-grey-light` is the COLOUR `grey-light`, not
    // `grey` shaded `light`, and a check that could not tell them apart
    // reported `grey` as partly shadeable.
    const css = stylesheet();
    const colors = validColors();
    const declared = new Set(
      tupleFrom(DEPRECATIONS, 'UNSTYLED_MODIFIER_COLORS')
    );
    const shades = tupleFrom(HELPERS, 'validColorShades');
    const probe = shades.find(sh => /^\d+$/.test(sh));
    assert.ok(probe, 'no numeric shade to probe with; the tuple changed shape');

    // Both families, because `colorShade` and `backgroundColorShade` have the
    // identical shape and an earlier version probed only the text one.
    for (const family of ['has-text', 'has-background']) {
      const shadeable = colors
        .filter(c => shipsClass(css, `${family}-${c}-${probe}`))
        .sort();
      assert.deepEqual(
        shadeable,
        colors.filter(c => !declared.has(c)).sort(),
        `the colours the stylesheet shades under \`${family}-\` and the ` +
          'colours with a live component modifier have diverged. They are ' +
          'the same set today, which is what lets ' +
          '`UNSTYLED_MODIFIER_COLORS` stand in for both; if they part ' +
          'company, the shade gap needs naming on its own rather than ' +
          'borrowing that declaration.'
      );
    }
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
    const css = stylesheet();
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
