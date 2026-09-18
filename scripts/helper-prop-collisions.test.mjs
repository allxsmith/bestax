/**
 * Hold `NOT_A_HELPER_PROP` to the library it describes.
 *
 * `valid-helper-value` keys its value table by prop name, not by element, and
 * that is safe only while a name means the same thing everywhere. `Theme`
 * breaks it: it mints a prop for every Bulma CSS variable, so `--bulma-radius`
 * becomes a `radius` prop that sets the variable and never reaches
 * `useBulmaClasses`, while its declared type stays the helper union. The rule
 * reported `<Theme radius="6px" />`, which is how a JSX consumer sets that
 * variable, and called `radiusless` the fix, which on `Theme` renders
 * `--bulma-radius: radiusless` and does nothing. Neither reading is
 * reportable, so the pair is skipped. The library-side disagreement is #694.
 *
 * A declaration no test can falsify becomes a fiction, which is the argument
 * `check-conformance.mjs` makes for `SIBLING_RUNTIME_DEPS`, so this recomputes
 * the collision from the library's own variable list and fails if the two
 * disagree. Three ways it can fail, all loud: the variable list stops being
 * findable, the one exclusion from the prop map stops matching, or a new
 * collision appears that nobody declared.
 *
 * The reason it reads source text rather than importing the map is that
 * neither `bulmaCssVars` nor `bulmaVarPropMap` is exported, and widening the
 * library's public API to make a guard convenient is the wrong trade. A
 * brittle read is acceptable here BECAUSE it is asserted: if either pattern
 * stops matching, this fails and says to re-derive it by hand.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const THEME = join(REPO, 'bulma-ui', 'src', 'helpers', 'Theme.tsx');
const PLUGIN_VALUES = join(REPO, 'eslint-plugin', 'dist', 'lib', 'values.js');

/** `--bulma-primary-h` → `primaryH`, the library's own `cssVarToProp`. */
const cssVarToProp = varName =>
  varName
    .replace(/^--bulma-/, '')
    .split('-')
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');

/**
 * Every prop name `Theme` intercepts as a CSS variable, read from the source.
 *
 * Mirrors `bulmaVarPropMap`: the `bulmaCssVars` tuple, mapped through
 * `cssVarToProp`, minus the names that map filters out. Both halves of that
 * are asserted below rather than assumed.
 */
function themeVarProps(source) {
  const list = source.match(/const bulmaCssVars = \[([\s\S]*?)\n\] as const;/);
  assert.ok(
    list,
    'could not find the `bulmaCssVars` tuple in Theme.tsx. It is what decides ' +
      'which prop names Theme intercepts as CSS variables, so this guard ' +
      'cannot run without it. Re-derive the collision by hand and fix this ' +
      'pattern in the same change.'
  );
  const vars = [...list[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.ok(
    vars.length > 0,
    'the `bulmaCssVars` tuple read as empty, which would make every ' +
      'assertion here vacuously true'
  );

  // The exclusions from `bulmaVarPropMap`. Asserted against the source so the
  // mirror cannot silently stop matching: a name added to or removed from that
  // filter changes which props are helper props on Theme.
  const excluded = ['shadow'];
  for (const name of excluded) {
    assert.match(
      source,
      new RegExp(`\\.filter\\(\\[?\\(?\\[prop\\]\\)? => prop !== '${name}'\\)`),
      `Theme.tsx no longer filters \`${name}\` out of bulmaVarPropMap the way ` +
        'this guard expects. If the filter changed, that changes which names ' +
        'are helper props on Theme: re-derive and update both sides.'
    );
  }

  return new Set(
    vars.map(cssVarToProp).filter(prop => !excluded.includes(prop))
  );
}

/**
 * Every prop name any rule in the plugin judges.
 *
 * Wider than `HELPER_VALUES` on purpose. `color` is deliberately absent from
 * that table and is what `no-color-as-surface` reads and rewrites, so a
 * `--bulma-color` variable would collide for that rule while a table-only
 * check saw nothing. The flex and display props are already table keys; they
 * are listed anyway so this reads as the plugin's whole surface rather than as
 * whichever part happened to get checked.
 */
const watchedProps = values =>
  new Set([
    ...values.HELPER_VALUES.keys(),
    ...values.FLEX_CONTAINER_PROPS,
    ...values.DISPLAY_PROPS,
    'color',
    'textColor',
  ]);

describe('helper prop collisions', () => {
  it('declares every Theme prop name the plugin must not judge', async () => {
    assert.ok(
      existsSync(PLUGIN_VALUES),
      'eslint-plugin/dist is absent, so the declared table cannot be read. ' +
        'Run the build, or the whole gate with `pnpm all`.'
    );
    const values = await import(pathToFileURL(PLUGIN_VALUES).href);
    const { NOT_A_HELPER_PROP } = values;

    const intercepted = themeVarProps(readFileSync(THEME, 'utf8'));
    const collisions = [...watchedProps(values)]
      .filter(prop => intercepted.has(prop))
      .sort();
    const declared = [...(NOT_A_HELPER_PROP.get('Theme') ?? [])].sort();

    assert.deepEqual(
      declared,
      collisions,
      'NOT_A_HELPER_PROP.get("Theme") and the real collision between the ' +
        "props the plugin judges and Theme's CSS-variable props disagree. A " +
        'name in the real set and not the declared one is a false positive on ' +
        'working code; the reverse is a prop going unchecked for no reason.'
    );
  });

  it('keeps `shadow` a helper prop on Theme', async () => {
    const { HELPER_VALUES, NOT_A_HELPER_PROP } = await import(
      pathToFileURL(PLUGIN_VALUES).href
    );
    // The other half of the same fact, and the reason the exclusion above is
    // worth asserting: `--bulma-shadow` would collide exactly like
    // `--bulma-radius`, and Theme keeps `shadow` out of its variable map so
    // the helper prop wins. If that ever flips, the test above fails and this
    // one says what changed.
    assert.ok(HELPER_VALUES.has('shadow'));
    // Truthiness rather than `=== false`, so this asserts only its own claim:
    // an absent Theme entry does not declare `shadow` either, and reading
    // that as a failure would just restate the case above.
    assert.ok(!NOT_A_HELPER_PROP.get('Theme')?.has('shadow'));
  });
});
