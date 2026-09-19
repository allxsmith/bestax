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
 * and without the development warning `black-ter` gets, since only the black
 * pair was declared in `UNSTYLED_MODIFIER_COLORS`. Fixing the first defect
 * created the second, which is why both are checked here.
 *
 * ON THE SHAPE OF THIS FILE. The element list comes from one signal, the
 * `warnUnstyledColor` call sites: a function call with a string literal, and
 * a component calling it is declaring that its colour values can be dead,
 * which is exactly the set compared here. Everything else is DATA — tuples
 * and stylesheet rules — rather than behaviour inferred from how code is
 * written. Inferring it instead, by matching a prop's declared type and a
 * class emission in source text, needs a reader per signal and gives each its
 * own way to be wrong about a library that is fine.
 *
 * What the single signal gives up is stated rather than papered over: a
 * component that emits the modifier and never warns is not detected. The same
 * gap applies to `Calendar` and `TimeWheels`, which emit it today and are not
 * exported from `src/index.ts`. Closing it wants the library to say which
 * components warn, not a test to guess.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { extractComponent } from './lib/props-extract.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(REPO, 'bulma-ui', 'src');
const CSS = join(REPO, 'bulma-ui', 'dist', 'bestax.css');
const HELPERS = join(
  REPO,
  'bulma-ui',
  'src',
  'helpers',
  'bulmaClassHelpers.ts'
);
const COLOR_CLASSES = join(
  REPO,
  'bulma-ui',
  'src',
  'helpers',
  'useColorClasses.tsx'
);
const DEPRECATIONS = join(
  REPO,
  'bulma-ui',
  'src',
  'helpers',
  'colorDeprecations.ts'
);

/**
 * The stylesheet, or an actionable failure.
 *
 * One case read it without this guard, so running that case alone threw a raw
 * `ENOENT` instead of saying what to do, and in a full run the first case's
 * guard fired first and hid it. Every case that reads the stylesheet goes
 * through here; the `CSS_BACKED` one reads no stylesheet at all.
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

/**
 * Source with comments removed, so scanning it finds CODE.
 *
 * The caller scan looks for a function call by name, and these components
 * document the helper they call, so a comment quoting the call would invent
 * an element and fail the comparison for a reason unrelated to the library.
 */
const codeOnly = source =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

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

/**
 * The CSS-wide keywords the colour props accept beyond `validColors`.
 *
 * Read from `useColorClasses`, which spells the accepted set as
 * `[...validColors, 'inherit', 'current']`, rather than listed here — the
 * list was the last hand-maintained one in this guard. The hook spells it
 * more than once, so every copy is read and they are held to each other: one
 * decides whether a value is accepted at all, another gates emission, and
 * which keywords apply should not depend on which runs.
 */
function colorKeywords() {
  const source = codeOnly(readFileSync(COLOR_CLASSES, 'utf8'));
  const copies = [
    ...source.matchAll(/\[\s*\.\.\.validColors\s*,([^\]]*)\]/g),
  ].map(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]));
  // Counted against the spellings that EXIST, not against zero. A `> 0`
  // guard let a copy this pattern stopped matching drop out silently while
  // the function claimed to read every one of them.
  const spellings = (source.match(/\.\.\.validColors/g) ?? []).length;
  assert.equal(
    copies.length,
    spellings,
    `useColorClasses spreads \`validColors\` ${spellings} time(s) and this ` +
      `pattern parsed ${copies.length} of them, so the copies compared below ` +
      'are not all of them.'
  );
  assert.ok(
    copies.length > 0,
    'could not find `[...validColors, …]` in useColorClasses, so the ' +
      'CSS-wide keywords cannot be read. Fix the pattern in the same change ' +
      'that moved it.'
  );
  for (const copy of copies) {
    assert.deepEqual(
      copy,
      copies[0],
      `useColorClasses spells the accepted set ${copies.length} times and ` +
        'the copies disagree, so which keywords a value is judged against ' +
        'depends on which one runs.'
    );
  }
  assert.ok(
    copies[0].length > 0,
    'the accepted set named no keyword beyond `validColors`, which would ' +
      'make the keyword assertions below vacuous.'
  );
  return copies[0];
}

/**
 * Every `warnUnstyledColor` call in the library, as
 * `{ component, extraUnstyled }`.
 *
 * ONE signal, deliberately. A component calling this is declaring that its
 * colour values can be dead, which is exactly the set this file compares
 * against the stylesheet, and a call with a string literal is the least
 * fragile thing to read. Matched globally so a file with two calls yields
 * two, and the component name comes from the argument rather than the
 * filename.
 */
function warningCallers() {
  const callers = [];
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
      const source = codeOnly(readFileSync(path, 'utf8'));
      // Every call, and each bounded by its OWN closing paren. Ending at the
      // first `);` reads past the arguments whenever the call is not its own
      // statement — wrapped in a `useEffect` with a dependency array, say —
      // and would take that array for `extraUnstyled`.
      const calls = (source.match(/warnUnstyledColor\(/g) ?? []).length;
      let parsed = 0;
      for (const m of source.matchAll(/warnUnstyledColor\(/g)) {
        let depth = 0;
        let started = false;
        let text = '';
        for (let i = m.index; i < source.length; i++) {
          if (source[i] === '(') {
            depth += 1;
            started = true;
          } else if (source[i] === ')') {
            depth -= 1;
          }
          // `started` matters: without it the loop ends on the first
          // character, since depth is already 0 before any paren is seen.
          if (started && depth === 0) {
            text = source.slice(m.index, i + 1);
            break;
          }
        }
        const named = /warnUnstyledColor\(\s*'([^']+)'/.exec(text);
        // A call whose component is not a string literal cannot be attributed
        // to an element, and is counted below rather than skipped quietly.
        if (!named) continue;
        parsed += 1;
        callers.push({
          component: named[1],
          path,
          // Only the literals inside a bracketed list, so a nested call in
          // another argument cannot contribute one.
          extraUnstyled: [...text.matchAll(/\[([^\]]*)\]/g)].flatMap(a =>
            [...a[1].matchAll(/'([^']+)'/g)].map(x => x[1])
          ),
        });
      }
      assert.equal(
        parsed,
        calls,
        `${path} has ${calls} \`warnUnstyledColor\` call(s) and ${parsed} ` +
          'could be attributed to a component. A call naming its component ' +
          'by anything but a string literal cannot be compared, so this ' +
          'guard covers fewer elements than it appears to.'
      );
    }
  };
  walk(SRC);
  assert.ok(
    callers.length > 0,
    'no `warnUnstyledColor` call sites found, which would make every ' +
      'per-element assertion below vacuous. The call or this pattern moved.'
  );
  return callers;
}

/** The CSS-wide keywords a component's ROOT `color` prop accepts. */
function acceptedKeywords(component, keywords) {
  let info;
  try {
    info = extractComponent(component, { markdown: false });
  } catch (error) {
    // Only "not exported" means there is no declaration to read. Anything
    // else is the extractor breaking and must not read as "accepts none".
    if (!/is not exported from/.test(error.message)) throw error;
    return [];
  }
  // The ROOT table only. A compound's parts declare their own `color` and it
  // is a different prop: `Hero.color` is the `is-<colour>` modifier while
  // `Hero.Head.color` is a text colour, where `has-text-inherit` genuinely
  // ships. Reading the first `color` row across every table agreed with this
  // only because all four spell the same union.
  const root = (info.tables ?? []).find(t => t.path === component);
  const row = (root?.rows ?? []).find(r => r.name === 'color');
  return keywords.filter(k => (row?.type ?? '').includes(`'${k}'`));
}

describe('the colour tuples agree with the shipped stylesheet', () => {
  it('declares every colour whose component modifier has no CSS', () => {
    const css = stylesheet();
    const colors = tupleFrom(HELPERS, 'validColors');
    const declared = tupleFrom(DEPRECATIONS, 'UNSTYLED_MODIFIER_COLORS');
    const keywords = colorKeywords();

    // PER ELEMENT, not across them all: asking whether a colour is dead on
    // EVERY element passes a colour Bulma ships on one and not the others,
    // which would land in neither set while that one renders a dead modifier
    // unwarned.
    for (const { component, extraUnstyled } of warningCallers()) {
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
          'works.'
      );

      // The CSS-wide keywords, in both halves. An element that WIDENS its
      // `color` union with one has to warn about it, because the union is why
      // the warning exists; and Bulma must ship no rule for it, or that
      // warning complains about a value that works. `extraUnstyled` also
      // takes dead COLOURS, which are outside this equality rather than
      // wrong, so both sides are filtered to the keywords.
      const accepted = acceptedKeywords(component, keywords);
      assert.deepEqual(
        extraUnstyled.filter(v => keywords.includes(v)).sort(),
        [...accepted].sort(),
        `\`${component}\` accepts ${accepted.join(', ') || 'no'} CSS-wide ` +
          'keyword(s) on `color` and warns about ' +
          `${extraUnstyled.join(', ') || 'none'}. A keyword it accepts and ` +
          'does not warn about renders a dead modifier in silence; one it ' +
          'warns about and does not accept cannot be passed. The accepted ' +
          'side is read from the rendered type, so a union spelled through ' +
          'an alias or an indexed access hides the literals and lands here ' +
          'too — check how `color` is declared before changing the warning.'
      );
      // EVERYTHING it warns about has to be dead, not only the keywords.
      // Filtering the equality above to keywords left a dead COLOUR in
      // `extraUnstyled` reaching no check at all, so a component warning
      // about a value that works kept this green. The invariant is simpler
      // than the equality: if you warn about it, no rule may exist for it.
      for (const value of [...new Set([...extraUnstyled, ...accepted])]) {
        assert.ok(
          !shipsClass(css, `${el}.is-${value}`),
          `\`.${el}.is-${value}\` ships, so warning about \`${value}\` on ` +
            `\`${component}\` complains about a value that works. ` +
            '`extraUnstyled` needs it removed.'
        );
      }
    }
  });

  it('shades exactly the colours that have component modifiers', () => {
    // The shade props and the colour props are judged independently by the
    // lint rule, so `<Box textColor="white-bis" colorShade="15" />` passes
    // while `useColorClasses` emits `has-text-white-bis-15`, which the
    // stylesheet does not carry. `bgColor` with `backgroundColorShade` is the
    // same shape, which is why both families are checked. It stays a false
    // negative rather than a wrong report because of this partition: the
    // colours that take a shade are exactly the ones NOT declared unstyled.
    // What closing it would take is in `HELPER_VALUES`'s own comment.
    const css = stylesheet();
    const colors = tupleFrom(HELPERS, 'validColors');
    const shades = tupleFrom(HELPERS, 'validColorShades');
    const declared = new Set(
      tupleFrom(DEPRECATIONS, 'UNSTYLED_MODIFIER_COLORS')
    );
    const keywords = colorKeywords();

    // EVERY shade, with the ambiguity handled PER PAIR. A pair is ambiguous
    // when the two names concatenate into a colour: `grey` plus `light` is
    // the colour `grey-light`, so `has-text-grey-light` cannot be read as
    // `grey` shaded `light`. That is true of exactly two pairs and of no
    // shade in general, so excluding whole shades dropped comparisons that
    // should have run.
    const ambiguous = (color, shade) => colors.includes(`${color}-${shade}`);

    for (const family of ['has-text', 'has-background']) {
      for (const shade of shades) {
        const judged = colors.filter(c => !ambiguous(c, shade));
        assert.deepEqual(
          judged.filter(c => shipsClass(css, `${family}-${c}-${shade}`)).sort(),
          judged.filter(c => !declared.has(c)).sort(),
          `the colours the stylesheet shades \`-${shade}\` under ` +
            `\`${family}-\` and the colours with a live component modifier ` +
            'have diverged. They are the same set today, which is what lets ' +
            '`UNSTYLED_MODIFIER_COLORS` stand in for both; if they part ' +
            'company, the shade gap needs naming on its own rather than ' +
            'borrowing that declaration.'
        );
      }

      // The keywords are part of the same gap and outside the tuple: live
      // unshaded, dead shaded.
      for (const keyword of keywords) {
        assert.ok(
          shipsClass(css, `${family}-${keyword}`),
          `\`${family}-${keyword}\` no longer ships, so the claim that these ` +
            'keywords are live unshaded has stopped being true.'
        );
        for (const shade of shades) {
          assert.ok(
            !shipsClass(css, `${family}-${keyword}-${shade}`),
            `\`${family}-${keyword}-${shade}\` ships now, so these keywords ` +
              'are no longer part of the shade gap and `HELPER_VALUES` can ' +
              'say so.'
          );
        }
      }
    }
  });

  it('names the CSS-backed colours consistently in the warning', () => {
    // `CSS_BACKED` is the message's half of the same fact, written as prose
    // for the console. It is the complement of the declared set, so it can go
    // stale the same way and tell a developer to use a value that is dead or
    // missing.
    const source = readFileSync(DEPRECATIONS, 'utf8');
    const line = /const CSS_BACKED =\s*\n?\s*'([^']+)'/.exec(source);
    assert.ok(line, 'could not find `CSS_BACKED` in colorDeprecations.ts');
    const declared = new Set(
      tupleFrom(DEPRECATIONS, 'UNSTYLED_MODIFIER_COLORS')
    );
    assert.deepEqual(
      line[1]
        .split(',')
        .map(v => v.trim())
        .sort(),
      tupleFrom(HELPERS, 'validColors')
        .filter(c => !declared.has(c))
        .sort(),
      'the colours `CSS_BACKED` names and the colours not declared unstyled ' +
        'disagree, so the warning tells the developer to use a value that is ' +
        'either dead or missing.'
    );
  });

  it('has every bis/ter variant the stylesheet emits a class for', () => {
    // The first defect, and the narrowest check here. The general form —
    // every colour the CSS names is in the tuple — is not available, because
    // `has-text-` is a shared namespace carrying alignment
    // (`has-text-centered`), weight (`has-text-weight-bold`) and the CSS-wide
    // keywords alongside the colours, crossed with every shade plus a `-100`
    // the tuple does not carry. Separating those needs a hand-maintained
    // exception list, a bigger and more fragile thing than the defect it
    // would catch. The `-bis`/`-ter` family needs none: those suffixes are
    // not shades, not viewports, and not used by any other helper family.
    const css = stylesheet();
    const colors = tupleFrom(HELPERS, 'validColors');

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
        'carry them, so the library drops the value and renders nothing ' +
        'while the CSS for it exists.'
    );
  });
});
