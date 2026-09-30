/**
 * Hold `DEPRECATED_VARIABLE_ROUTE` to the library it describes.
 *
 * `valid-helper-value` keys its value table by prop name, not by element, and
 * that is safe only while a name means the same thing everywhere. `Theme` is
 * where that can break: it mints a prop for every Bulma CSS variable, so a
 * variable whose camelCase name matches a helper prop would make that prop set
 * the variable on `Theme` and emit a class everywhere else. `--bulma-shadow`
 * and `--bulma-radius` are the two that do, and `Theme` keeps both names out
 * of its variable map so they stay helpers. `radius` was missed once and set
 * the variable while typed as the helper (#694), so a string outside its tuple
 * still reaches `--bulma-radius` through a deprecated route, and the rule
 * reports that with its own message rather than saying nothing renders.
 *
 * A declaration no test can falsify becomes a fiction, which is the argument
 * `check-conformance.mjs` makes for `SIBLING_RUNTIME_DEPS`, so this recomputes
 * both facts from the library's source and fails if the plugin disagrees.
 * The ways it can fail, all loud: the variable list or the helper-name list
 * stops being findable, a helper name the plugin judges is taken as a variable
 * prop, or the declared routes and the ones Theme really has stop matching.
 *
 * The reason it reads source text rather than importing the map is that
 * neither `bulmaCssVars` nor `bulmaVarPropMap` is exported, and widening the
 * library's public API to make a guard convenient is the wrong trade. A
 * brittle read is acceptable here BECAUSE it is asserted: if a pattern stops
 * matching, this fails and says to re-derive it by hand.
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
 * What Theme's source says about its props, read the way `bulmaVarPropMap`
 * is built: the `bulmaCssVars` tuple mapped through `cssVarToProp`, minus the
 * `helperPropNames` that map filters out. Both halves are asserted rather
 * than assumed, and so is the filter that joins them.
 */
function readTheme(source) {
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

  const names = source.match(
    /const helperPropNames: readonly string\[\] = \[([^\]]*)\];/
  );
  assert.ok(
    names,
    'could not find `helperPropNames` in Theme.tsx. It is the list of names ' +
      'kept out of bulmaVarPropMap so they stay helper props; re-derive it by ' +
      'hand and fix this pattern in the same change.'
  );
  const excluded = [...names[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.match(
    source,
    /\.filter\(\(\[prop\]\) => !helperPropNames\.includes\(prop\)\)/,
    'Theme.tsx no longer filters bulmaVarPropMap through `helperPropNames` ' +
      'the way this guard expects. That filter decides which names are ' +
      'helper props on Theme: re-derive and update both sides.'
  );

  const intercepted = new Set(
    vars.map(cssVarToProp).filter(prop => !excluded.includes(prop))
  );
  // Every variable Theme writes by name outside the map loop. That is what a
  // deprecated route looks like in the source, so a route added or removed
  // there changes this set.
  const routed = new Set(
    [...source.matchAll(/vars\['(--bulma-[a-z0-9-]+)'\] = /g)].map(m => m[1])
  );
  return { vars, excluded, intercepted, routed };
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

async function loadValues() {
  assert.ok(
    existsSync(PLUGIN_VALUES),
    'eslint-plugin/dist is absent, so the declared table cannot be read. ' +
      'Run the build, or the whole gate with `pnpm all`.'
  );
  return import(pathToFileURL(PLUGIN_VALUES).href);
}

describe('helper prop collisions', () => {
  it('takes no prop the plugin judges as a Theme CSS variable', async () => {
    const values = await loadValues();
    const { intercepted } = readTheme(readFileSync(THEME, 'utf8'));
    const collisions = [...watchedProps(values)]
      .filter(prop => intercepted.has(prop))
      .sort();

    assert.deepEqual(
      collisions,
      [],
      'Theme takes these as CSS-variable props, and the plugin judges them as helper props everywhere, so the rule would report working Theme code: ' +
        collisions.join(', ') +
        '. Add each name to `helperPropNames` in Theme.tsx, as #694 did for ' +
        '`radius`, so it stays a helper on Theme and its variable goes ' +
        'through `bulmaVars`.'
    );
  });

  it('declares exactly the deprecated variable routes Theme has', async () => {
    const { DEPRECATED_VARIABLE_ROUTE, HELPER_VALUES } = await loadValues();
    const { vars, excluded, routed } = readTheme(readFileSync(THEME, 'utf8'));

    assert.deepEqual(
      [...DEPRECATED_VARIABLE_ROUTE.keys()],
      ['Theme'],
      'DEPRECATED_VARIABLE_ROUTE declares routes on an element other than ' +
        'Theme, and this guard only reads Theme.tsx. Extend it to hold the ' +
        'new element to its source before declaring one.'
    );
    const declared = DEPRECATED_VARIABLE_ROUTE.get('Theme');

    for (const [prop, cssVar] of declared) {
      assert.ok(
        vars.includes(cssVar) && cssVarToProp(cssVar) === prop,
        `the route ${prop} -> ${cssVar} does not name one of Theme's ` +
          'variables by the prop it would be minted as'
      );
      assert.ok(
        excluded.includes(prop) && HELPER_VALUES.has(prop),
        `\`${prop}\` is declared as a deprecated route, which only makes ` +
          'sense for a helper prop Theme keeps out of its variable map'
      );
    }

    assert.deepEqual(
      [...declared.values()].sort(),
      [...routed].sort(),
      'DEPRECATED_VARIABLE_ROUTE.get("Theme") and the variables Theme.tsx ' +
        'writes outside its variable map disagree. A route Theme has and the ' +
        'plugin does not declare gets a message saying nothing renders, which ' +
        'is false; a declared route Theme lacks gets a message saying the ' +
        'variable is set, which is false the other way.'
    );
  });

  it('keeps `shadow` a helper prop on Theme with no variable route', async () => {
    const { DEPRECATED_VARIABLE_ROUTE, HELPER_VALUES } = await loadValues();
    const { excluded } = readTheme(readFileSync(THEME, 'utf8'));
    // `--bulma-shadow` was kept out of Theme's variable map from the start,
    // so unlike `radius` no value of `shadow` ever set it and there is no
    // route to declare. Asserted on its own so a change to either side says
    // which fact moved.
    assert.ok(HELPER_VALUES.has('shadow'));
    assert.ok(excluded.includes('shadow'));
    // Truthiness rather than `=== false`, so this asserts only its own claim:
    // an absent Theme entry does not declare `shadow` either.
    assert.ok(!DEPRECATED_VARIABLE_ROUTE.get('Theme')?.has('shadow'));
  });
});
