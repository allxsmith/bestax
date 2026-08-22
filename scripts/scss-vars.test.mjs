/**
 * Holds componentVars' selector-ownership rules to what the SCSS actually
 * means (#464).
 *
 * The bug this file exists to freeze: `.button.link-button` — a COMPOUND
 * selector — parsed as no classes at all, so LinkButton's four registered
 * variables belonged to nobody, `SCSS_SOURCES.LinkButton` regenerated as `[]`,
 * and the API page's CSS & Sass Variables section silently never rendered.
 * Every gate stayed green because the same wrong datum that omitted the
 * section also excused the omission.
 *
 * The fixtures below use the real interpolation shape (`.#{iv.$class-prefix}`)
 * because that is what the parser matches; a bare `.button` would not
 * exercise it.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { componentVars, registerVarsEntries } from './lib/scss-vars.mjs';

const repoFile = rel =>
  readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');

/** A minimal partial registering under one selector. */
const partial = (selector, keys) =>
  `@use "../utilities/css-variables" as cv;
${keys.map(k => `$${k}: 1em !default;`).join('\n')}
${selector} {
  @include cv.register-vars(
    (
${keys.map(k => `      "${k}": #{$${k}},`).join('\n')}
    )
  );
}
`;

const PREFIX = '.#{iv.$class-prefix}';

// --- the compound-selector fix, on the real partial ---------------------------

test('the real linkbutton partial yields its four variables', () => {
  const src = repoFile('bulma-ui/src/scss/elements/_linkbutton.scss');
  const rows = componentVars(src, 'link-button');
  assert.deepEqual(rows.map(r => r.cssVar).sort(), [
    '--bulma-link-button-ghost-color',
    '--bulma-link-button-ghost-hover-color',
    '--bulma-link-button-transition-duration',
    '--bulma-link-button-underline-offset',
  ]);
  // The default is declared on the component's own COMPOUND selector, and
  // the page's lead sentence keys its override advice off that — 'root' here
  // would advise a className override that 0-2-0 specificity silently beats,
  // and 'global' would claim `:root`.
  assert.ok(rows.every(r => r.scope === 'compound'));
});

test('the same partial yields nothing for Button', () => {
  // `.button.link-button` contains the class `button`, and Button's root class
  // IS `button`. Without the key-prefix guard, Button's page grows four bogus
  // `--bulma-link-button-*` rows the moment this partial parses. This is the
  // regression that makes the compound arm require class AND key together.
  const src = repoFile('bulma-ui/src/scss/elements/_linkbutton.scss');
  assert.deepEqual(componentVars(src, 'button'), []);
});

// --- the rule, on fixtures ----------------------------------------------------

test('a compound selector claims keys matching its prefix', () => {
  const src = partial(`${PREFIX}button${PREFIX}link-button`, [
    'link-button-underline-offset',
  ]);
  const rows = componentVars(src, 'link-button');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].cssVar, '--bulma-link-button-underline-offset');
  assert.equal(rows[0].scope, 'compound');
});

test('a compound selector does not claim keys of another component', () => {
  const src = partial(`${PREFIX}button${PREFIX}link-button`, [
    'link-button-underline-offset',
  ]);
  assert.deepEqual(componentVars(src, 'button'), []);
});

test('a simple selector still claims by class alone, key prefix or not', () => {
  // The pre-#464 behavior, unchanged: `.hero` owns whatever it registers, even
  // a key that shares no prefix with the class. Tightening this would strip
  // rows from real pages (sidebar registers 28 under one class).
  const src = partial(`${PREFIX}hero`, ['unrelated-key']);
  assert.equal(componentVars(src, 'hero').length, 1);
});

test('a descendant selector is not a compound and claims nothing new', () => {
  // `.tooltip.is-dark .tooltip-content` re-registers keys the base block
  // already owns; dedupe makes it neutral. A descendant selector must not be
  // parsed as a compound, or `.tooltip-content` becomes claimable.
  const src = partial(
    `${PREFIX}tooltip${PREFIX}is-dark ${PREFIX}tooltip-content`,
    ['tooltip-content-width']
  );
  assert.deepEqual(componentVars(src, 'tooltip'), []);
  assert.deepEqual(componentVars(src, 'tooltip-content'), []);
});

test('an unprefixed class disqualifies the compound', () => {
  // `.button.somebody-elses` — the second class is not ours to reason about,
  // so the item must not parse as a compound at all.
  const src = partial(`${PREFIX}button.somebody-elses`, ['button-x']);
  assert.deepEqual(componentVars(src, 'button'), []);
});

test('modifier compounds stay dedupe-neutral on the real partials', () => {
  // The four files that register under `.root.is-modifier` compounds only
  // re-register base-block keys. First-wins dedupe means the compound arm adds
  // zero rows — asserted against the real sources so a future edit that breaks
  // the neutrality shows up here, not on a docs page.
  for (const [file, root, count] of [
    ['bulma-ui/src/scss/components/_avatars.scss', 'avatars', 3],
    ['bulma-ui/src/scss/components/_sidebar.scss', 'sidebar', 28],
    ['bulma-ui/src/scss/components/_tooltip.scss', 'tooltip', 1],
    ['bulma-ui/src/scss/form/_numberinput.scss', 'numberinput', 7],
  ]) {
    assert.equal(componentVars(repoFile(file), root).length, count, file);
  }
});

test('the singular register-var form counts as registering (orphan rule input)', () => {
  // The orphan rule asks "does this partial register anything?" through
  // registerVarsEntries, not registerVarsKeys — the latter reads only the
  // plural form, and Bulma's own sources use the singular. A repo partial
  // written that way must not bypass the rule with zero keys.
  const src = `.#{iv.$class-prefix}foo {
  @include cv.register-var("foo-gap", 1rem);
}
`;
  assert.equal(registerVarsEntries(src).length, 1);
});
