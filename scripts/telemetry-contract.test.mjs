/**
 * Round-trip: CLI payload builders → JSON → worker validate().
 *
 * The worker is outside the pnpm workspace and the CLIs use `.js` specifiers
 * for `.ts` files, so this test registers a small resolver hook and imports
 * both sides' source. A payload the CLIs actually emit that the worker
 * rejects is the class of bug that silently drops every event.
 */
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../telemetry-worker/src/validate.ts';

register('./lib/resolve-ts-from-js.mjs', import.meta.url);

const { buildScaffoldPayload } =
  await import('../create-bestax/src/telemetry.ts');
const { buildMigratePayload } =
  await import('../bestax-migrate/src/telemetry.ts');

const PRODUCTION_RULES = [
  'prop:className',
  'prop:renderAs',
  'prop:size',
  'unsupported-file',
  'peer-deps',
  'plain-element',
  'imports',
  'responsive',
  'deps',
];

function roundTrip(payload) {
  return validate(JSON.parse(JSON.stringify(payload)));
}

test('create-bestax scaffold payload validates', () => {
  const result = roundTrip(
    buildScaffoldPayload({
      template: 'vite-ts',
      bulmaFlavor: 'complete',
      iconLibrary: 'none',
      skills: true,
    })
  );
  assert.equal(result.ok, true, JSON.stringify(result));
});

test('bestax-migrate payload with production rule slugs validates', () => {
  const result = roundTrip(
    buildMigratePayload({
      source: 'react-bulma-components',
      cssMode: 'bestax',
      dry: false,
      deps: true,
      changedCount: 23,
      todosByRule: PRODUCTION_RULES.map(rule => ({ rule, count: 1 })),
    })
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok && result.payload.tool === 'bestax-migrate') {
    assert.deepEqual(
      result.payload.todosByRule?.map(entry => entry.rule),
      PRODUCTION_RULES
    );
  }
});

test('bestax-migrate payload with no TODOs validates', () => {
  const result = roundTrip(
    buildMigratePayload({
      source: 'react-bulma-components',
      cssMode: 'keep',
      dry: true,
      deps: false,
      changedCount: 0,
      todosByRule: [],
    })
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) assert.equal('todosByRule' in result.payload, false);
});
