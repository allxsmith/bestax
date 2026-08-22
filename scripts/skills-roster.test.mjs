/**
 * Holds the `skills-roster` rule in scripts/check-conformance.mjs to what the
 * repo actually does (#540).
 *
 * The rule exists because `skills/` is a shipped product whose roster is
 * copied by hand into six files that nothing compared against the directory.
 * Every one of those copies agrees today, so none of the violation branches
 * executes during a real run — inverting the rule would leave CI green. That
 * is what the fixtures below are for, and it is the same reason
 * publishable-manifests.test.mjs is shaped this way.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SKILL_ROSTERS,
  readSkillNames,
  rosterViolations,
} from './check-conformance.mjs';

const repoFile = rel =>
  readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');

/** Every roster file, read for real. The fixtures below mutate copies of these. */
const REAL = Object.fromEntries(
  SKILL_ROSTERS.map(({ file }) => [file, repoFile(file)])
);

const SKILLS = await readSkillNames(
  fileURLToPath(new URL('../skills', import.meta.url))
);

// --- the reader ---------------------------------------------------------------

test('the roster is read from the directory, and finds the real skills', async () => {
  // Everything below compares against SKILLS, so an empty read would make the
  // whole file vacuous.
  assert.ok(SKILLS.length >= 5, `expected 5+ skills, got ${SKILLS.length}`);
  assert.ok(SKILLS.includes('bestax-migrate'), SKILLS.join(', '));
  // README.md and CLAUDE.md sit alongside the skill directories and are not
  // skills. The SKILL.md predicate is what excludes them.
  assert.ok(!SKILLS.includes('README.md'));
  assert.ok(!SKILLS.includes('CLAUDE.md'));
  assert.deepEqual([...SKILLS].sort(), SKILLS, 'must come back sorted');
});

test('a directory without a SKILL.md is not a skill', async () => {
  const names = await readSkillNames(
    fileURLToPath(new URL('../bulma-ui/src', import.meta.url))
  );
  assert.deepEqual(names, []);
});

// --- the rule holds on the real tree -----------------------------------------

test('every roster in the repo currently names every skill', () => {
  assert.deepEqual(rosterViolations(SKILLS, REAL), []);
});

test('the roster list is not empty, and every entry is reachable', () => {
  assert.ok(SKILL_ROSTERS.length >= 5);
  for (const { file, copies } of SKILL_ROSTERS) {
    assert.ok(copies.length >= 1, `${file} declares no copies`);
    assert.ok(REAL[file], `${file} could not be read`);
  }
});

// --- the rule ----------------------------------------------------------------

/** The real sources with one file swapped for a mutated copy. */
const withFile = (file, text) => ({ ...REAL, [file]: text });

test('a skill missing from one copy is caught, and only that copy', () => {
  // bestax-migrate still appears three other times in this file — the install
  // block, the layout tree, and `TODO(bestax-migrate)` in prose. A bare-name
  // search would pass here, which is why the patterns are structural.
  const gutted = REAL['skills/README.md']
    .split('\n')
    .filter(l => !l.startsWith('| [`bestax-migrate`]'))
    .join('\n');
  assert.ok(gutted.includes('bestax-migrate'), 'fixture must keep the name');

  const v = rosterViolations(SKILLS, withFile('skills/README.md', gutted));
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /skills\/README\.md/);
  assert.match(v[0], /Skills table/);
  assert.match(v[0], /bestax-migrate/);
});

test('the message shows the line to add, not just the name', () => {
  const gutted = REAL['skills/README.md'].replace(
    /^npx skills add .*--skill bestax-form\n/m,
    ''
  );
  const v = rosterViolations(SKILLS, withFile('skills/README.md', gutted));
  assert.equal(v.length, 1, v.join('\n'));
  // A contributor should be able to paste the fix rather than infer the shape.
  assert.match(v[0], /npx skills add .*--skill bestax-form/);
});

test('a roster naming a skill that no longer exists is caught', () => {
  // The other direction, which nothing else covers: sync-skills.mjs stops
  // copying a deleted skill in silence, leaving the prose advertising it.
  const ghosted = REAL['docs/docs/skills/intro.md'].replace(
    '--skill bestax-form',
    '--skill bestax-form\nnpx skills add x --skill bestax-ghost'
  );
  const v = rosterViolations(
    SKILLS,
    withFile('docs/docs/skills/intro.md', ghosted)
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /still names bestax-ghost/);
  assert.match(v[0], /Drop the entry, or restore the skill/);
});

test('an unreadable roster file fails rather than being skipped', () => {
  // The fail-open shape to avoid: a file that moved should not silently stop
  // being checked.
  const sources = { ...REAL };
  delete sources['bulma-ui/AGENTS.md'];
  const v = rosterViolations(SKILLS, sources);
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /bulma-ui\/AGENTS\.md/);
  assert.match(v[0], /went unchecked/);
  assert.match(v[0], /SKILL_ROSTERS/);
});

test('a missing anchor fails rather than matching nothing quietly', () => {
  // Both scoped rosters: if the heading or the parenthetical is renamed, the
  // scope returns null and the check must say so. Matching an empty string
  // instead would report every skill missing, which is noisier but still red;
  // returning "no violations" is the failure mode that matters.
  const noHeading = REAL['create-bestax/src/constants.ts'].replace(
    '## AI skills',
    '## Agent skills'
  );
  const v = rosterViolations(
    SKILLS,
    withFile('create-bestax/src/constants.ts', noHeading)
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /anchors on is gone/);

  const noParen = REAL['bulma-ui/AGENTS.md'].replace(
    'Agent skills (',
    'Skills ('
  );
  const w = rosterViolations(SKILLS, withFile('bulma-ui/AGENTS.md', noParen));
  assert.equal(w.length, 1, w.join('\n'));
  assert.match(w[0], /anchors on is gone/);
});

test('the scoped rosters really are scoped', () => {
  // constants.ts uses `- **bold**` bullets in several unrelated sections of the
  // scaffolded CLAUDE.md. Naming a skill in one of those must NOT satisfy the
  // AI-skills roster, or the scope is decorative.
  const decoy = REAL['create-bestax/src/constants.ts']
    .split('\n')
    .filter(l => !l.startsWith('- **bestax-icons**'))
    .join('\n')
    .replace(
      '## Docs',
      '## Docs\n\n- **bestax-icons** — decoy AFTER the section ends.'
    );

  const v = rosterViolations(
    SKILLS,
    withFile('create-bestax/src/constants.ts', decoy)
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /does not name bestax-icons/);
});

test('an empty roster of skills does not pass vacuously', () => {
  // Guards the degenerate input directly: with no skills, every "does not
  // name" comparison is trivially satisfied, so the only thing that can fire
  // is the stale direction — and it must, for every copy.
  const v = rosterViolations([], REAL);
  assert.ok(v.length >= SKILL_ROSTERS.length, v.join('\n'));
  assert.ok(
    v.every(m => /still names/.test(m)),
    v.join('\n')
  );
});
