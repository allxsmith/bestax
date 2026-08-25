/**
 * Holds the orphan-partial rule in scripts/check-conformance.mjs to its
 * branches (#464, #543, #544).
 *
 * Once the exemptions are settled no real partial trips any of these, so
 * without fixtures an inverted rule stays green — the same seam rationale as
 * manifestViolations and rosterViolations.
 *
 * Since #544 the rule is key-level: a claimed partial is compared against the
 * set of variable keys the committed MCP data documents, so attribution gaps
 * (a selector the walk cannot place) surface per-key instead of hiding behind
 * "the file is claimed".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { orphanPartialViolations } from './check-conformance.mjs';

const REL = 'bulma-ui/src/scss/elements/_zzz.scss';
const KEYS = ['zzz-gap', 'zzz-color'];

test('a registering partial nobody claims is a violation naming the fix', () => {
  const v = orphanPartialViolations(REL, KEYS, new Set(), new Set());
  assert.equal(v.length, 1);
  assert.match(v[0], /_zzz\.scss/);
  assert.match(v[0], /gen:api-sources/);
  assert.match(v[0], /ORPHAN_EXEMPT/);
});

test('a claimed partial with every key documented is nobody’s business', () => {
  assert.deepEqual(
    orphanPartialViolations(REL, KEYS, new Set([REL]), new Set(KEYS)),
    []
  );
});

test('a claimed partial with an undocumented key names it and the fix', () => {
  // The #464 gap in key-level form: the file is claimed, but one variable is
  // registered somewhere the attribution walk cannot place (or the committed
  // data is stale), so it silently reaches no page. The violation names the
  // key, tries regen first, and offers the attributable homes.
  const v = orphanPartialViolations(
    REL,
    KEYS,
    new Set([REL]),
    new Set(['zzz-gap'])
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /--bulma-zzz-color/);
  assert.doesNotMatch(v[0], /--bulma-zzz-gap/);
  assert.match(v[0], /pnpm gen/);
  assert.match(v[0], /ORPHAN_EXEMPT/);
});

test('a partial registering nothing is nobody’s business', () => {
  assert.deepEqual(orphanPartialViolations(REL, [], new Set(), new Set()), []);
});

test('an exemption that outlives its orphan is itself a violation', () => {
  // The exemption list must not survive the fix: claim a partial that is
  // still exempted, document all its keys, and the check demands the entry be
  // removed. Driven against a REAL exempted path, so this also pins that the
  // exemptions still parse.
  const popover = 'bulma-ui/src/scss/form/_picker-popover.scss';
  const v = orphanPartialViolations(
    popover,
    ['picker-popover-x'],
    new Set([popover]),
    new Set(['picker-popover-x'])
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /stale exemption/i);
});

test('an exemption that outlives the registrations is itself a violation', () => {
  // The other stale shape: the partial stopped registering variables
  // entirely, so there is nothing left to exempt.
  const popover = 'bulma-ui/src/scss/form/_picker-popover.scss';
  const v = orphanPartialViolations(popover, [], new Set(), new Set());
  assert.equal(v.length, 1);
  assert.match(v[0], /outlived the problem/);
});

test('an exempted orphan is quiet while the gap it names persists', () => {
  const popover = 'bulma-ui/src/scss/form/_picker-popover.scss';
  // Unclaimed but registering: the documented #543 state.
  assert.deepEqual(
    orphanPartialViolations(
      popover,
      ['picker-popover-x'],
      new Set(),
      new Set()
    ),
    []
  );
  // Claimed with keys still undocumented: the exemption is doing its job.
  assert.deepEqual(
    orphanPartialViolations(
      popover,
      ['picker-popover-x'],
      new Set([popover]),
      new Set()
    ),
    []
  );
});
