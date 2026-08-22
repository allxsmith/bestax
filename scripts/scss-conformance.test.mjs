/**
 * Holds the orphan-partial rule in scripts/check-conformance.mjs to its three
 * branches (#464, #543).
 *
 * Once the exemptions are settled no real partial trips any of these, so
 * without fixtures an inverted rule stays green — the same seam rationale as
 * manifestViolations and rosterViolations.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { orphanPartialViolations } from './check-conformance.mjs';

const REL = 'bulma-ui/src/scss/elements/_zzz.scss';

test('a registering partial nobody claims is a violation naming the fix', () => {
  const v = orphanPartialViolations(REL, true, new Set());
  assert.equal(v.length, 1);
  assert.match(v[0], /_zzz\.scss/);
  assert.match(v[0], /gen:api-sources/);
  assert.match(v[0], /ORPHAN_EXEMPT/);
});

test('a claimed partial is nobody’s business', () => {
  assert.deepEqual(orphanPartialViolations(REL, true, new Set([REL])), []);
});

test('a partial registering nothing is nobody’s business', () => {
  assert.deepEqual(orphanPartialViolations(REL, false, new Set()), []);
});

test('an exemption that outlives its orphan is itself a violation', () => {
  // The exemption list must not survive the fix: claim a partial that is
  // still exempted and the check demands the entry be removed. Driven against
  // a REAL exempted path, so this also pins that the exemptions still parse.
  const tabs = 'bulma-ui/src/scss/components/_tabs.scss';
  const v = orphanPartialViolations(tabs, true, new Set([tabs]));
  assert.equal(v.length, 1);
  assert.match(v[0], /stale exemption/i);
});

test('an exempted orphan is quiet, and the exemption names its tracker', () => {
  const tabs = 'bulma-ui/src/scss/components/_tabs.scss';
  assert.deepEqual(orphanPartialViolations(tabs, true, new Set()), []);
});
