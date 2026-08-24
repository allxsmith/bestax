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
  readSkillDirs,
  readSkillNames,
  rosterSkillNames,
  rosterViolations,
  skillDirViolations,
  skillsPageViolations,
  frontmatterNameViolations,
} from './check-conformance.mjs';
import { pathsInsideSkills, untrackedSkillPaths } from './lib/skills.mjs';

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
  const gutted = REAL['skills/README.md']
    .split('\n')
    .filter(l => !l.startsWith('| [`bestax-form`]'))
    .join('\n');
  const v = rosterViolations(SKILLS, withFile('skills/README.md', gutted));
  assert.equal(v.length, 1, v.join('\n'));
  // A contributor should be able to paste the fix rather than infer the shape.
  assert.match(v[0], /\| \[`bestax-form`\]\(\.\/bestax-form\/SKILL\.md\)/);
});

test('a roster naming a skill that no longer exists is caught', () => {
  // The other direction, which nothing else covers: sync-skills.mjs stops
  // copying a deleted skill in silence, leaving the prose advertising it.
  const ghosted = REAL['skills/README.md'].replace(
    '| [`bestax-form`]',
    '| [`bestax-ghost`](./bestax-ghost/SKILL.md) | Ghost. |\n| [`bestax-form`]'
  );
  const v = rosterViolations(SKILLS, withFile('skills/README.md', ghosted));
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

// --- regressions from the #541 review ------------------------------------------

test('a metadata info string on an earlier fence does not frame-shift the pairing', () => {
  // markerFence walks fences with fenceMask, which parses info strings —
  // a decorated fence above the tree's marker must not shift which block
  // the Layout-tree scope lands on.
  const decorated = REAL['skills/README.md'].replace(
    '## Layout',
    '```bash title="quick look" showLineNumbers\nls skills/\n```\n\n## Layout'
  );
  assert.notEqual(decorated, REAL['skills/README.md']);
  assert.deepEqual(
    rosterViolations(SKILLS, withFile('skills/README.md', decorated)),
    []
  );
});

test('a removed marker is a missing anchor, not a silent skip', () => {
  const unmarked = REAL['skills/README.md'].replace(
    '<!-- skills-roster:tree -->\n\n',
    ''
  );
  assert.notEqual(unmarked, REAL['skills/README.md']);
  const v = rosterViolations(SKILLS, withFile('skills/README.md', unmarked));
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /Layout tree/);
  assert.match(v[0], /anchors on is gone/);
});

test('a fenced # comment inside the AI-skills section does not truncate it', () => {
  // section()'s end terminator was fence-blind: a flush-left "# comment" in a
  // fenced bash example ended the scope, so the roster below it reported as
  // entirely missing (or, after the bullets, silently went unchecked).
  const fenced = REAL['create-bestax/src/constants.ts'].replace(
    '## AI skills',
    '## AI skills\n\n```bash\n# install more skills later\nnpx skills add x\n```'
  );
  assert.notEqual(fenced, REAL['create-bestax/src/constants.ts']);
  assert.deepEqual(
    rosterViolations(
      SKILLS,
      withFile('create-bestax/src/constants.ts', fenced)
    ),
    []
  );
});

test('dropping the serial comma does not lose the last two names', () => {
  // The old comma-list regex only recognized a conjunction after a comma, so
  // "…, x and y" un-matched BOTH final names and a complete roster reported
  // two skills missing.
  const plain = REAL['bulma-ui/AGENTS.md'].replace(
    'bestax-optimize, bestax-theming',
    'bestax-optimize and bestax-theming'
  );
  assert.notEqual(plain, REAL['bulma-ui/AGENTS.md']);
  assert.deepEqual(
    rosterViolations(SKILLS, withFile('bulma-ui/AGENTS.md', plain)),
    []
  );
});

test('a kebab-case cell in an unrelated table is not a roster row', () => {
  // The table patterns used to scan the whole file: any backticked kebab-case
  // first cell anywhere satisfied (or polluted) the Agent Skills table.
  const decoyed =
    REAL['bulma-ui/README.md'] +
    '\n| Hook        | Notes |\n| ----------- | ----- |\n| `use-theme` | …     |\n';
  assert.deepEqual(
    rosterViolations(SKILLS, withFile('bulma-ui/README.md', decoyed)),
    []
  );
});

test('a deleted roster row is caught even when the name appears in another table', () => {
  // The silent-drift direction of the same bug: bestax-migrate is also a
  // package name, so a row for it elsewhere kept the check green after the
  // real roster row was deleted.
  const gutted =
    REAL['bulma-ui/README.md']
      .split('\n')
      .filter(l => !/^\s*\|\s*`bestax-migrate`/.test(l))
      .join('\n') +
    '\n| Package          | Notes |\n| ---------------- | ----- |\n| `bestax-migrate` | …     |\n';
  const v = rosterViolations(SKILLS, withFile('bulma-ui/README.md', gutted));
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /does not name bestax-migrate/);
});

test('an indented dir line in an unrelated fence is not a Layout tree entry', () => {
  const decoyed =
    REAL['skills/README.md'] +
    '\nA scaffolded app looks like:\n\n```\nmy-app/\n  skills/\n  launch/\n```\n';
  assert.deepEqual(
    rosterViolations(SKILLS, withFile('skills/README.md', decoyed)),
    []
  );
});

test('the docs-site surfaces are held through the slug transform', () => {
  const noSidebar = REAL['docs/sidebars.js'].replace(
    /^\s*'skills\/optimize',\n/m,
    ''
  );
  assert.notEqual(noSidebar, REAL['docs/sidebars.js']);
  const v = rosterViolations(SKILLS, withFile('docs/sidebars.js', noSidebar));
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /skillsSidebar/);
  assert.match(v[0], /does not name bestax-optimize/);

  const noBullet = REAL['docs/docs/skills/intro.md'].replace(
    /^- \*\*\[Migrate\]\(\.\/migrate\)\*\*/m,
    '- **Migrate** (link dropped)'
  );
  assert.notEqual(noBullet, REAL['docs/docs/skills/intro.md']);
  const w = rosterViolations(
    SKILLS,
    withFile('docs/docs/skills/intro.md', noBullet)
  );
  assert.equal(w.length, 1, w.join('\n'));
  assert.match(w[0], /bullet roster/);
  assert.match(w[0], /does not name bestax-migrate/);
});

test('per-skill docs pages: missing and orphaned pages are both caught', () => {
  const v = skillsPageViolations(
    ['bestax-form', 'bestax-icons'],
    ['intro.md', 'form.mdx']
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /docs\/docs\/skills\/icons\.mdx: missing/);

  const w = skillsPageViolations(
    ['bestax-form'],
    ['intro.md', 'form.mdx', 'theming.mdx']
  );
  assert.equal(w.length, 1, w.join('\n'));
  assert.match(w[0], /docs\/docs\/skills\/theming/);
  assert.match(w[0], /no skill directory maps/);

  // intro is the index page, never a skill; an unreadable dir is reported.
  assert.deepEqual(
    skillsPageViolations(['bestax-form'], ['intro.md', 'form.mdx']),
    []
  );
  assert.match(
    skillsPageViolations(['bestax-form'], null)[0],
    /went unchecked/
  );
});

test('a frontmatter name that disagrees with the directory is caught', () => {
  // Every prose roster follows the DIRECTORY name while gen-mcp-index keys the
  // shipped MCP manifest off the FRONTMATTER — without this gate a rename in
  // one place ships two disagreeing rosters with everything green.
  const v = frontmatterNameViolations([
    { name: 'bestax-optimize', fmName: 'bestax-css-optimize' },
    { name: 'bestax-form', fmName: 'bestax-form' },
    { name: 'bestax-icons', fmName: null },
  ]);
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /bestax-optimize/);
  assert.match(v[0], /bestax-css-optimize/);
});

test('the tests and the check derive the comparison set the same way', () => {
  // readSkillNames is the bundling view (what the sync scripts copy);
  // rosterSkillNames additionally drops names the prose patterns cannot
  // express. Using the former for the roster comparison would demand prose
  // name `.draft` — the unsatisfiable noise the check's own comment avoids.
  const dirs = [
    { name: '.draft', hasSkillFile: true },
    { name: 'bestax-form', hasSkillFile: true },
    { name: 'half-landed', hasSkillFile: false },
  ];
  assert.deepEqual(rosterSkillNames(dirs), ['bestax-form']);
});

test('only paths inside bundled skill directories count against the gate', () => {
  const others = [
    'bestax-form/notes.md',
    'bestax-wip/SKILL.md',
    'scratch.txt',
    '',
  ];
  assert.deepEqual(pathsInsideSkills(others, ['bestax-form', 'bestax-wip']), [
    'bestax-form/notes.md',
    'bestax-wip/SKILL.md',
  ]);
  assert.deepEqual(pathsInsideSkills(others, ['bestax-icons']), []);
});

test('the vetting gate flags untracked files only in its OWN repository', async t => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } =
    await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const os = await import('node:os');
  const path = await import('node:path');

  const root = mkdtempSync(path.join(os.tmpdir(), 'bestax-gate-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (cwd, ...args) =>
    execFileSync('git', ['-C', cwd, ...args], { stdio: 'ignore' });

  // Scenario 1: skills/ inside its own repository — a tracked skill with an
  // untracked scratch file inside it is flagged FILE-granularly (sync copies
  // whole directories, so the scratch file would ship), and a fully-tracked
  // skill passes.
  const own = path.join(root, 'own');
  mkdirSync(path.join(own, 'skills', 'bestax-form'), { recursive: true });
  writeFileSync(path.join(own, 'skills', 'bestax-form', 'SKILL.md'), '# s\n');
  git(own, 'init', '-q');
  git(own, 'add', '-A');
  const skillsDir = path.join(own, 'skills');
  assert.deepEqual(untrackedSkillPaths(skillsDir, ['bestax-form']), []);
  writeFileSync(path.join(skillsDir, 'bestax-form', 'notes.md'), 'draft\n');
  assert.deepEqual(untrackedSkillPaths(skillsDir, ['bestax-form']), [
    'bestax-form/notes.md',
  ]);
  // A file outside the bundled skill dirs never blocks the bundle.
  writeFileSync(path.join(skillsDir, 'scratch.txt'), 'x\n');
  assert.deepEqual(untrackedSkillPaths(skillsDir, ['bestax-form']), [
    'bestax-form/notes.md',
  ]);

  // Scenario 2: an exported (git-less) tree nested inside some OUTER
  // repository. git resolves the outer repo, which knows none of these files —
  // the gate must return [] instead of refusing every skill (#550 review
  // reproduced exactly this against a git-managed $HOME).
  const outer = path.join(root, 'outer');
  mkdirSync(path.join(outer, 'exported', 'skills', 'bestax-form'), {
    recursive: true,
  });
  writeFileSync(
    path.join(outer, 'exported', 'skills', 'bestax-form', 'SKILL.md'),
    '# s\n'
  );
  git(outer, 'init', '-q');
  assert.deepEqual(
    untrackedSkillPaths(path.join(outer, 'exported', 'skills'), [
      'bestax-form',
    ]),
    []
  );
});

test('an adjacent fence with no blank line cannot merge into the scope', () => {
  // fenceMask marks delimiters and interiors alike, so back-to-back fences
  // form one continuous masked run; the close-scan must stop at the tree
  // block's own closer, or the second block's entries join the comparison.
  const treeAt = REAL['skills/README.md'].indexOf(
    '<!-- skills-roster:tree -->'
  );
  assert.ok(treeAt !== -1);
  const openAt = REAL['skills/README.md'].indexOf('\n```\n', treeAt);
  const closeAt = REAL['skills/README.md'].indexOf('\n```\n', openAt + 5);
  const merged =
    REAL['skills/README.md'].slice(0, closeAt + 5) +
    '```\n  bestax-ghost/\n```\n' +
    REAL['skills/README.md'].slice(closeAt + 5);
  assert.ok(merged.includes('bestax-ghost'));
  assert.deepEqual(
    rosterViolations(SKILLS, withFile('skills/README.md', merged)),
    []
  );
});

// --- the generated install rosters (#542) -------------------------------------

test('the generated install regions are fresh on the real tree', async () => {
  const { TARGETS, REGION_ID, renderInstallBlock } =
    await import('./gen-skills-rosters.mjs');
  const { readRegions } = await import('./lib/api-page.mjs');
  const { readSkillNames } = await import('./lib/skills.mjs');
  const skills = await readSkillNames(
    fileURLToPath(new URL('../skills', import.meta.url))
  );
  for (const { file, fence } of TARGETS) {
    const region = readRegions(repoFile(file), file).get(REGION_ID);
    assert.ok(region, `${file} lost its ${REGION_ID} marker pair`);
    assert.equal(
      region.body,
      renderInstallBlock(skills, fence),
      `${file} is stale — run pnpm gen:skills`
    );
  }
});

test('renderInstallBlock is a pure function of its inputs, order preserved', async () => {
  // Sorting belongs to the roster reader; the renderer must not reorder, or
  // the staleness diff would mask a reader regression.
  const { renderInstallBlock } = await import('./gen-skills-rosters.mjs');
  assert.equal(
    renderInstallBlock(['b-skill', 'a-skill'], 'sh'),
    '\n```sh\n' +
      'npx skills add https://github.com/allxsmith/bestax --skill b-skill\n' +
      'npx skills add https://github.com/allxsmith/bestax --skill a-skill\n' +
      '```\n'
  );
});
