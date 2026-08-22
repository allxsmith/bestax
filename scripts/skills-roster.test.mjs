/**
 * Holds the `skills-roster` rule in scripts/check-conformance.mjs to what the
 * repo actually does (#540).
 *
 * The rule exists because `skills/` is a shipped product whose roster is
 * copied by hand into rosters that nothing compared against the directory.
 * `SKILL_ROSTERS` is the count; stating one here would be a number to keep in
 * sync, which is the bug this file exists to prevent.
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
  installBlockViolations,
  readSkillDirs,
  readSkillNames,
  rosterViolations,
  skillDirViolations,
} from './check-conformance.mjs';
import { renderInstallBlock, TARGETS } from './gen-skills-rosters.mjs';

const repoFile = rel =>
  readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');

/** Every roster file, read for real. The fixtures below mutate copies of these. */
const REAL = Object.fromEntries(
  [...SKILL_ROSTERS.map(r => r.file), ...TARGETS.map(t => t.file)].map(f => [
    f,
    repoFile(f),
  ])
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

test('the generated install blocks match the committed files byte for byte', () => {
  // The staleness half of #542: what is committed is exactly what
  // gen-skills-rosters.mjs would write. If this fails, run `pnpm gen`.
  assert.deepEqual(installBlockViolations(SKILLS, REAL), []);
});

test('renderInstallBlock writes one line per skill, alphabetical', () => {
  const body = renderInstallBlock(['b-zeta', 'b-alpha'], 'sh');
  // Deliberately NOT sorted here: sorting is readSkillNames' job, and doing
  // it twice would hide a reader that stopped sorting.
  assert.equal(
    body,
    [
      '',
      '```sh',
      'npx skills add https://github.com/allxsmith/bestax --skill b-zeta',
      'npx skills add https://github.com/allxsmith/bestax --skill b-alpha',
      '```',
      '',
    ].join('\n')
  );
});

test('a ghost skill inside a generated block reads as stale', () => {
  // The other direction for the generated copies: a block still advertising a
  // deleted skill differs from the generator's output, so it fails as stale
  // and `pnpm gen` removes the line. No pattern matching involved.
  const ghosted = REAL['docs/docs/skills/intro.md'].replace(
    '--skill bestax-form',
    '--skill bestax-form\nnpx skills add x --skill bestax-ghost'
  );
  const v = installBlockViolations(
    SKILLS,
    withFile('docs/docs/skills/intro.md', ghosted)
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /stale/);
  assert.match(v[0], /pnpm gen/);
});

test('a missing marker pair is a violation, never a skip', () => {
  // replaceRegion treats absence as an opt-out by design; these blocks are
  // not opt-outable. A file without the pair can be neither regenerated nor
  // checked, which is the silent-generation failure #464 documents.
  const stripped = REAL['docs/docs/guides/llms/index.md']
    .replace('<!-- bestax:generated skills-install -->\n\n', '')
    .replace('\n\n<!-- /bestax:generated skills-install -->', '');
  const v = installBlockViolations(
    SKILLS,
    withFile('docs/docs/guides/llms/index.md', stripped)
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /marker/);
  assert.match(v[0], /Restore/);
});

test('an unreadable generated target fails rather than being skipped', () => {
  const sources = { ...REAL };
  delete sources['skills/README.md'];
  const v = installBlockViolations(SKILLS, sources);
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /skills\/README\.md/);
  assert.match(v[0], /went unchecked/);
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

test('the root README roster is covered', () => {
  // Copilot caught this one live on the PR that added the check: the repo's
  // front page listed four skills against seven, and nothing held it.
  assert.ok(
    SKILL_ROSTERS.some(r => r.file === 'README.md'),
    'the root README must be in SKILL_ROSTERS'
  );
  const gutted = REAL['README.md']
    .split('\n')
    .filter(l => !l.includes('`bestax-optimize`'))
    .join('\n');
  const v = rosterViolations(SKILLS, withFile('README.md', gutted));
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /README\.md/);
  assert.match(v[0], /bestax-optimize/);
});

test('a directory that looks like a skill but has no SKILL.md is caught', () => {
  // Discovery silently skips it, which would be the old silent-omission bug in
  // a new place: a half-landed skill ships nothing and no roster is asked for it.
  const v = skillDirViolations([
    { name: 'bestax-form', hasSkillFile: true },
    { name: 'bestax-halfdone', hasSkillFile: false },
  ]);
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /bestax-halfdone/);
  assert.match(v[0], /has no SKILL\.md/);
});

test('a skill name the roster patterns cannot express is caught', () => {
  // Every roster pattern captures a kebab-case token, so a name outside that
  // shape would make the check unsatisfiable: it reports the skill missing and
  // the line it tells you to paste still does not match.
  const v = skillDirViolations([
    { name: 'bestax_under', hasSkillFile: true },
    { name: 'Bestax-Caps', hasSkillFile: true },
    { name: 'bestax--double', hasSkillFile: true },
  ]);
  assert.equal(v.length, 3, v.join('\n'));
  assert.ok(
    v.every(m => /kebab-case/.test(m)),
    v.join('\n')
  );
});

test('the real skills directory has no anomalies', async () => {
  assert.deepEqual(
    skillDirViolations(
      await readSkillDirs(fileURLToPath(new URL('../skills', import.meta.url)))
    ),
    []
  );
});

test('an Oxford comma does not invent a skill called "and"', () => {
  // The AGENTS.md roster is a prose parenthetical, the one copy that is not
  // structural. A bare /([a-z][a-z0-9-]*)/g there would read the "and" out of
  // "x, y, and z" and demand you delete a skill by that name.
  const oxford = REAL['bulma-ui/AGENTS.md'].replace(
    'bestax-optimize, bestax-theming',
    'bestax-optimize, and bestax-theming'
  );
  // Asserted clean, not merely "does not mention `and`". The weaker assertion
  // passed while the parser silently dropped the skill AFTER the conjunction,
  // reporting a complete roster as missing its last entry.
  assert.deepEqual(
    rosterViolations(SKILLS, withFile('bulma-ui/AGENTS.md', oxford)),
    []
  );
});

test('a hidden directory holding a SKILL.md is not skipped', () => {
  // None of the three consumers tests for the dot, so `.draft/SKILL.md` really
  // would be bundled and indexed. Skipping it here would hide precisely the
  // silent omission this check exists to end.
  const v = skillDirViolations([
    { name: 'bestax-form', hasSkillFile: true },
    { name: '.draft', hasSkillFile: true },
  ]);
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /\.draft/);
  assert.match(v[0], /kebab-case/);
});

test('the section scope is line-anchored, not a substring search', () => {
  // `'## AI skills'` occurs inside `'### AI skills'`, so an indexOf-based scope
  // would lock onto a subheading and report an intact roster as wholly missing.
  // This is the failure c8b5d11 fixed in the release-docs extractors.
  const decoyed = REAL['create-bestax/src/constants.ts'].replace(
    '## AI skills',
    '### AI skills\n\nA decoy subheading.\n\n## AI skills'
  );
  assert.deepEqual(
    rosterViolations(
      SKILLS,
      withFile('create-bestax/src/constants.ts', decoyed)
    ),
    []
  );
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
