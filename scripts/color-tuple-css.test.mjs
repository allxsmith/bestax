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
 * component that emits the modifier and never warns is not detected, which is
 * the shape of the defect that started this. Several do emit it without
 * warning and are invisible here, and something IS exposed by that: the time
 * wheels take a public `color` and put `is-<colour>` on an element with no
 * colour rule, so the value is dead and silent. An earlier version of this
 * comment claimed otherwise on the grounds that each narrows `color` to a
 * CSS-backed union, which is true of the union and says nothing about the
 * element the class lands on. Grep the emission rather than trusting a list
 * here. Closing the gap wants the library to say which components warn,
 * rather than a test guessing from source.
 *
 * `codeOnly` is a textual strip, with the limit that implies: a comment
 * opener inside a string literal removes real code along with itself — `//`
 * to the end of that line, a block opener as far as the next closer — and a
 * call caught in that span leaves both the count and the parse together, so
 * only the "found at least one caller" floor is behind it. A tokenizer would
 * close it, and would be another reader of the kind this file has been
 * shedding.
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

/**
 * Does the stylesheet carry this class, or this exact compound?
 *
 * A single class is matched literally. A COMPOUND (`notification.is-primary`)
 * has to appear as one SIMPLE selector carrying exactly those classes, which
 * is narrower than it sounds and deliberately so.
 *
 * Order does not matter, because CSS does not care and Bulma does not either:
 * it writes `.notification.is-primary` and `.is-primary.input`. Matching
 * element-first only called the second absent, so a live modifier read as
 * dead.
 *
 * But co-occurrence is not a match. Indexing per comma-separated part made
 * `.hero.is-primary .tabs` answer the query `tabs.is-primary`, since all
 * three classes sit in that one part, and that is the silent direction: a
 * dead modifier reading as live, which is a missed defect rather than a false
 * alarm. Parts are split into simple selectors on the combinators, and the
 * class set has to match exactly, so a rule needing a third class does not
 * answer for two.
 */
function shipsClass(css, cls) {
  const wanted = cls.split('.');
  const index = simpleSelectors(css);
  if (wanted.length === 1) {
    return index.some(classes => classes.has(cls));
  }
  return index.some(
    classes =>
      classes.size === wanted.length && wanted.every(w => classes.has(w))
  );
}

/**
 * The class sets of every simple selector in the stylesheet.
 *
 * One pass per file read. Split rather than matched: a `[^{}]+` scan over a
 * minified stylesheet of this size backtracks badly, where splitting is
 * linear.
 */
const indexCache = new Map();
function simpleSelectors(css) {
  if (!indexCache.has(css)) {
    const sets = [];
    for (const chunk of css.split('{')) {
      // Each `{` is preceded by a prelude; the selector is whatever follows
      // the last `}` in it.
      // Functional pseudo-class ARGUMENTS go before anything is split, and
      // the order matters twice over. `:not(…)` names classes the element
      // must not carry, so reading them as present lets
      // `.notification:not(.is-light)` answer the query
      // `notification.is-light` — a rule that excludes the pair reporting it
      // live, which is the silent direction. And the arguments can contain
      // commas: `.navbar-item:not(.is-active,.is-selected)` is one selector,
      // so splitting the list first fragments it and leaves `is-active`
      // looking like a class the element carries. Stripping first solves
      // both.
      //
      // `:is()` and `:where()` lose their classes to the same strip. Those
      // are alternatives rather than requirements, so dropping them makes the
      // exact match demand fewer classes than the selector really needs and
      // under-report, which is the safe way to be wrong. Keeping them would
      // mean modelling branches, which is more parser than this file should
      // carry.
      const prelude = chunk
        .slice(chunk.lastIndexOf('}') + 1)
        .replace(/:[a-z-]+\([^()]*\)/gi, '');
      for (const part of prelude.split(',')) {
        for (const simple of part.split(/[\s>+~]+/)) {
          if (!simple.includes('.')) continue;
          sets.push(
            new Set([...simple.matchAll(/\.([A-Za-z0-9_-]+)/g)].map(m => m[1]))
          );
        }
      }
    }
    indexCache.set(css, sets);
  }
  return indexCache.get(css);
}

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
  const values = [...block[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
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
  ].map(m => [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1]));
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
        if (
          !/^(__tests__|__typetests__|__mocks__|skill-examples)$/.test(
            entry.name
          )
        ) {
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
        let quote = '';
        for (let i = m.index; i < source.length; i++) {
          const c = source[i];
          // Parens inside a string literal are not structure. A `)` in one
          // truncated the call text and dropped its later arguments, which is
          // exactly the silent empty read the assertion below exists to stop.
          if (quote) {
            if (c === quote && source[i - 1] !== '\\') quote = '';
            continue;
          }
          if (c === '"' || c === "'" || c === '`') {
            quote = c;
            continue;
          }
          if (c === '(') {
            depth += 1;
            started = true;
          } else if (c === ')') {
            depth -= 1;
          }
          // `started` matters: without it the loop ends on the first
          // character, since depth is already 0 before any paren is seen.
          if (started && depth === 0) {
            text = source.slice(m.index, i + 1);
            break;
          }
        }
        const named = /warnUnstyledColor\(\s*['"]([^'"]+)['"]/.exec(text);
        // A call whose component is not a string literal cannot be attributed
        // to an element, and is counted below rather than skipped quietly.
        if (!named) continue;
        parsed += 1;

        // A third argument that is not an inline list reads as no extras,
        // which silently empties both the expected set and the
        // warns-about-a-working-value check. Split on TOP-LEVEL commas so a
        // nested call or array in an earlier argument does not shift the
        // count.
        const inner = text.slice(text.indexOf('(') + 1, -1);
        const args = [];
        let argDepth = 0;
        let argQuote = '';
        let start = 0;
        for (let i = 0; i < inner.length; i++) {
          const c = inner[i];
          // Same reason the balancer above skips strings: a bracket or comma
          // inside one is text, not structure, and counting it mis-split the
          // arguments so the validated third one was the wrong slice.
          if (argQuote) {
            if (c === argQuote && inner[i - 1] !== '\\') argQuote = '';
            continue;
          }
          if (c === '"' || c === "'" || c === '`') {
            argQuote = c;
            continue;
          }
          if (c === '(' || c === '[' || c === '{') argDepth += 1;
          if (c === ')' || c === ']' || c === '}') argDepth -= 1;
          if (c === ',' && argDepth === 0) {
            args.push(inner.slice(start, i).trim());
            start = i + 1;
          }
        }
        args.push(inner.slice(start).trim());
        assert.ok(
          args.length < 3 || args[2].startsWith('['),
          `${path} passes \`${args[2]}\` as \`extraUnstyled\` to ` +
            `\`${named[1]}\`, which this guard can only read as an inline ` +
            'list. Read as none, it would empty the expected set and pass ' +
            'the checks that use it without testing anything.'
        );
        callers.push({
          component: named[1],
          path,
          // From `args[2]` alone, the argument validated just above. Taking
          // every bracketed span in the call text let a bracketed expression
          // in an earlier argument contribute a value, failing with a message
          // naming something the library never declared.
          extraUnstyled: [...(args[2] ?? '').matchAll(/['"]([^'"]+)['"]/g)].map(
            x => x[1]
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

/** The colours `CSS_BACKED` names to the developer as ones that work. */
function cssBackedColors() {
  const source = readFileSync(DEPRECATIONS, 'utf8');
  const line = /const CSS_BACKED =\s*\n?\s*['"]([^'"]+)['"]/.exec(source);
  assert.ok(line, 'could not find `CSS_BACKED` in colorDeprecations.ts');
  return line[1].split(',').map(v => v.trim());
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

      // The declared set is GLOBAL plus this element's own additions.
      // `extraUnstyled` exists to name a colour that is live in general and
      // dead here, so comparing against the global tuple alone failed that
      // use with a message calling the value unwarned when it is precisely
      // the warned one.
      const extraColors = extraUnstyled.filter(v => colors.includes(v));

      // A colour this element declares dead must not be named as a working
      // one by the very warning it triggers. `CSS_BACKED` is the message's
      // list of values that do work, and it is global, so a per-element
      // addition can contradict it: the user is told the value is unstyled
      // and, in the same sentence, offered it as an alternative.
      const backed = cssBackedColors();
      for (const color of extraColors) {
        assert.ok(
          !backed.includes(color),
          `\`${component}\` declares \`${color}\` unstyled while ` +
            '`CSS_BACKED` still names it as one that works, so the warning ' +
            'contradicts itself in a single message. Either the colour is ' +
            'dead everywhere and belongs in `UNSTYLED_MODIFIER_COLORS`, or ' +
            'the message needs to be per element.'
        );
      }

      // `declared` alone. Widening this by the element's own `extraUnstyled`
      // colours reads as the obvious thing to do and is provably a no-op:
      // `CSS_BACKED` is pinned to exactly `validColors` minus `declared`, and
      // the check just above forbids an element declaring a colour that list
      // names, so such a colour is already in `declared`. The fact underneath
      // is about the library: while that message is one global list, a colour
      // dead on a single element cannot be expressed without the warning
      // contradicting itself, which leaves `extraUnstyled` useful for values
      // outside `validColors` — what `inherit` and `current` are.
      const expected = [...declared].sort();
      const dead = colors.filter(
        color => !shipsClass(css, `${el}.is-${color}`)
      );
      assert.deepEqual(
        [...dead].sort(),
        expected,
        `the colours with no \`.${el}.is-…\` rule and the colours declared ` +
          'unstyled for it disagree. A colour in the real set and not the ' +
          'declared one renders a dead modifier with no warning, which is ' +
          'the silence the warning exists to break; the reverse warns about ' +
          'a colour that works. The declared set is ' +
          '`UNSTYLED_MODIFIER_COLORS`; a colour dead on this element alone ' +
          'cannot be declared while `CSS_BACKED` is one global list.'
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
      // For colours the equality above now reaches this first, since a
      // working colour in `extraUnstyled` puts it in `expected` and not in
      // `dead`. This stays as the direct statement of the invariant, and is
      // the only check covering the keywords, which that equality excludes.
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
    const declared = new Set(
      tupleFrom(DEPRECATIONS, 'UNSTYLED_MODIFIER_COLORS')
    );
    assert.deepEqual(
      cssBackedColors().sort(),
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
