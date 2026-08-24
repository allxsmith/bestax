/**
 * Covers the `release-docs-sync` conformance check (#536).
 *
 * The four sync checks that came before this one have no tests, and that is the
 * precedent worth breaking rather than following: their comparison logic is
 * inline, so the only way to know they still bite is to break the repo on
 * purpose. `publishable-manifests` took the other route — export the pure
 * function, drive it on fixtures — and this follows that.
 *
 * What is actually at stake: the two derived assertions exist because #536
 * found two lists of packages that had quietly stopped being all of them, and
 * one of those lists decides whether a publish succeeds after the tag is
 * already pushed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  publishablePackages,
  releaseDocViolations,
  unreadableManifestViolations,
  recipeTargets,
} from './check-conformance.mjs';

const PACKAGES = [
  { dir: 'bulma-ui', name: '@allxsmith/bestax-bulma' },
  { dir: 'create-bestax', name: 'create-bestax' },
  { dir: 'bestax-migrate', name: 'bestax-migrate' },
  { dir: 'bestax-mcp', name: 'bestax-mcp' },
];

const FACTS = [
  '`pnpm publish --provenance --embed-readme --access public`',
  'its `prepack` and `prepublishOnly` hooks refuse',
  'skipped by `--ignore-scripts`',
  'see VERSIONING.md',
  'and scripts/require-pnpm-publish.mjs',
];

const recipe = (dirs = PACKAGES.map(p => p.dir)) =>
  '```bash\nfor pkg in ' +
  dirs.join(' ') +
  '; do\n  ( cd "$pkg" && pnpm exec semantic-release --dry-run --no-ci )\ndone\n```';

// The bullet AND the section heading that anchors it. packagesBullet locates
// the list by its OIDC section rather than by the first "- Packages:" in the
// file, so a fixture without the anchor is not a valid stand-in for the real
// document — and every fixture here was one until the anchor rule landed.
const publishers = (names = PACKAGES.map(p => p.name)) =>
  [
    '### npm authentication (OIDC trusted publishing)',
    '',
    'Each published package needs a trusted publisher configured on npmjs.com:',
    '',
    `- Packages: ${names.map(n => `\`${n}\``).join(', ')}`,
  ].join('\n');

const doc = (opts = {}) =>
  [
    '> **Safe to run; never publishes:** everything above.',
    ...(opts.facts ?? FACTS).map(f => `> ${f}`),
    '',
    '---',
    '',
    opts.recipe ?? recipe(),
    opts.publishers ?? publishers(),
  ].join('\n');

const docs = (over = {}) =>
  new Map([
    ['CONTRIBUTING.md', over.contributing ?? doc()],
    [
      'docs/docs/guides/getting-started/contributing.md',
      over.mirror ?? doc({ publishers: '' }),
    ],
  ]);

test('a matching pair is clean', () => {
  assert.deepEqual(releaseDocViolations(docs(), PACKAGES), []);
});

test('a fact dropped from one copy only is caught', () => {
  // The drift shape #536 exists for: an edit lands in the file the author had
  // open, and the mirror keeps saying the old thing.
  const v = releaseDocViolations(
    docs({ mirror: doc({ facts: FACTS.slice(1), publishers: '' }) }),
    PACKAGES
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /^docs\/docs\/guides\/getting-started\/contributing\.md/);
  assert.match(v[0], /apply the same edit to both/);
});

test('a fact is required inside the safe-to-run block, not anywhere in the file', () => {
  // The bug this exists for: the fact check searched the whole file, and
  // CONTRIBUTING.md links VERSIONING.md twice more for unrelated reasons — so
  // deleting the pointer from the guidance left the check green. The prose
  // satisfied the assertion while the thing being asserted was gone.
  const withStrayMention = [
    '# Contributing',
    '',
    'Versioning details live in VERSIONING.md and are worth reading.',
    'The guard is scripts/require-pnpm-publish.mjs, described elsewhere.',
    '',
    '> **Safe to run; never publishes:** run a manual',
    '> `pnpm publish --provenance --embed-readme --access public` only if you must.',
    '> The `prepack` and `prepublishOnly` hooks refuse a stray publish, though',
    '> `--ignore-scripts` skips them.',
    '',
    '---',
    '',
    recipe(),
    publishers(),
  ].join('\n');

  const v = releaseDocViolations(
    docs({ contributing: withStrayMention }),
    PACKAGES
  );
  const pointers = v.filter(m => /VERSIONING\.md|require-pnpm-publish/.test(m));
  assert.equal(pointers.length, 2, v.join('\n'));
  assert.ok(
    pointers.every(m => /"Safe to run" guidance/.test(m)),
    'the message must say which block is missing it'
  );
});

test('a missing safe-to-run block is reported once, not once per fact', () => {
  // Otherwise deleting the section produces six near-identical messages and
  // buries the one that says what actually happened.
  const v = releaseDocViolations(
    docs({ contributing: [recipe(), publishers()].join('\n\n') }),
    PACKAGES
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /no "Safe to run; never publishes" guidance/);
});

test('the dry-run recipe must name every publishable package', () => {
  // Derived from the workspace, not restated, because the failure mode is a
  // list that was right when written and stopped being all of them.
  const v = releaseDocViolations(
    docs({
      contributing: doc({ recipe: recipe(['bulma-ui', 'create-bestax']) }),
    }),
    PACKAGES
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /omits bestax-migrate, bestax-mcp/);
});

test('an overlapping package name is not satisfied by a substring', () => {
  // The membership test was `recipe.includes(dir)` and looked fine. Every
  // publishable name here contains "bestax", so a package literally named
  // `bestax` read as already present in a recipe that named only
  // `create-bestax` and `bestax-mcp` — and "present" is the verdict that
  // switches this rule off. Fail-open, from the same family as the parser
  // #436 refused to write.
  const withOverlap = [...PACKAGES, { dir: 'bestax', name: 'bestax' }];
  const v = releaseDocViolations(
    docs({
      contributing: doc({
        // Names every existing package, and not the new one.
        recipe: recipe(PACKAGES.map(p => p.dir)),
        publishers: publishers(PACKAGES.map(p => p.name)),
      }),
    }),
    withOverlap
  );
  // Both recipes miss it, and so does the trusted-publisher list.
  assert.equal(v.length, 3, v.join('\n'));
  // `\b` alone is not enough: "bestax" is followed by a word boundary inside
  // "bestax-migrate", so /bestax\b/ matched every message and proved nothing.
  assert.ok(
    v.every(m => /omits bestax(,|\.|$|\s)/m.test(m)),
    `each message must name \`bestax\` itself:\n${v.join('\n')}`
  );
});

test('a missing recipe is reported as missing, not as a package list', () => {
  const v = releaseDocViolations(
    docs({ contributing: doc({ recipe: '```bash\npnpm all\n```' }) }),
    PACKAGES
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /no fenced block running/);
});

test('the trusted-publisher list must name every publishable package', () => {
  // The one with teeth: a package with no trusted publisher fails its publish
  // after the release commit and tag are pushed, and the version is spent.
  const v = releaseDocViolations(
    docs({ contributing: doc({ publishers: publishers(['create-bestax']) }) }),
    PACKAGES
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /trusted-publisher list omits/);
  assert.match(v[0], /@allxsmith\/bestax-bulma/);
  assert.match(v[0], /spends the version/);
});

test('the trusted-publisher list is only required of the primary file', () => {
  // The docs mirror is a contributor page, not the operational runbook, so it
  // is not asked for the npmjs.com configuration list — and an incomplete one
  // there is not a violation either. Asserted with a deliberately short list on
  // the mirror, because the previous version of this test was byte-identical to
  // "a matching pair is clean" and so asserted nothing of its own.
  assert.deepEqual(
    releaseDocViolations(
      docs({ mirror: doc({ publishers: publishers(['create-bestax']) }) }),
      PACKAGES
    ),
    []
  );
});

test('a missing trusted-publisher line is its own message', () => {
  const v = releaseDocViolations(
    docs({ contributing: doc({ publishers: '' }) }),
    PACKAGES
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /no "- Packages:" line/);
});

test('a stray fence in prose does not hide the recipe', () => {
  // The regex this replaced paired backtick runs in document order, so one
  // unpaired ``` shifted every pair after it and the recipe stopped being
  // found — producing a violation whose suggested remedy is to switch the
  // check off.
  const withStray = doc().replace(
    '> **Safe to run; never publishes:** everything above.',
    'Fence code with ``` like this.\n\n> **Safe to run; never publishes:** everything above.'
  );
  assert.deepEqual(
    releaseDocViolations(docs({ contributing: withStray }), PACKAGES),
    []
  );
});

test('an unterminated fence still counts as the recipe', () => {
  // Dropping it produced the same false violation as the stray-fence case.
  const unterminated = doc().replace(/\n```\s*$/, '');
  assert.deepEqual(
    releaseDocViolations(docs({ contributing: unterminated }), PACKAGES),
    []
  );
});

test('a package named only in a comment does not satisfy the recipe', () => {
  const commented =
    '```bash\n' +
    '# bestax-migrate and bestax-mcp are covered separately\n' +
    'for pkg in bulma-ui create-bestax; do\n' +
    '  ( cd "$pkg" && pnpm exec semantic-release --dry-run --no-ci )\n' +
    'done\n```';
  const v = releaseDocViolations(
    docs({ contributing: doc({ recipe: commented }) }),
    PACKAGES
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /omits bestax-migrate, bestax-mcp/);
});

test('a package named only in an echo does not satisfy the recipe either', () => {
  // Stripping comments closed one hole and left the one beside it: only the
  // loop's own word list should count.
  const echoed =
    '```bash\n' +
    'echo "bestax-migrate bestax-mcp are released separately"\n' +
    'for pkg in bulma-ui create-bestax; do\n' +
    '  ( cd "$pkg" && pnpm exec semantic-release --dry-run --no-ci )\n' +
    'done\n```';
  const v = releaseDocViolations(
    docs({ contributing: doc({ recipe: echoed }) }),
    PACKAGES
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /omits bestax-migrate, bestax-mcp/);
});

test('any heading closes the guidance block, not just ## and ###', () => {
  // A #### heading did not terminate it, so the block ran to EOF and the
  // file-wide search this scoping exists to prevent came back.
  const leaked = [
    '> **Safe to run; never publishes:** everything above.',
    '> `pnpm publish --provenance --embed-readme --access public`',
    '',
    '#### An aside',
    '',
    'its `prepack` and `prepublishOnly` hooks refuse things, skipped by',
    '`--ignore-scripts`, see VERSIONING.md and scripts/require-pnpm-publish.mjs',
    '',
    recipe(),
    publishers(),
  ].join('\n');
  const v = releaseDocViolations(docs({ contributing: leaked }), PACKAGES);
  assert.ok(
    v.length >= 3,
    `expected the leaked facts to be flagged:\n${v.join('\n')}`
  );
  assert.ok(v.every(m => /Safe to run/.test(m)));
});

test('a wrapped bullet at end of file keeps its continuation lines', () => {
  // findIndex's -1 sentinel was collapsed with Math.max(0, …), which dropped
  // every continuation line whenever nothing followed the bullet.
  const atEof =
    doc({ publishers: '' }).trimEnd() +
    '\n\n### npm authentication (OIDC trusted publisher)\n\n' +
    '- Packages: `@allxsmith/bestax-bulma`, `create-bestax`,\n' +
    '  `bestax-migrate` and `bestax-mcp`';
  assert.deepEqual(
    releaseDocViolations(docs({ contributing: atEof }), PACKAGES),
    []
  );
});

test('a fenced example is not mistaken for the guidance block', () => {
  // masked was built and then not consulted when finding the START, so an
  // example that quotes the marker became the block — and the real guidance
  // could be deleted with the check still green.
  const quoted = [
    '````markdown',
    '> **Safe to run; never publishes:** everything above.',
    '> `pnpm publish --provenance --embed-readme --access public`',
    '> its `prepack` and `prepublishOnly` hooks refuse, skipped by `--ignore-scripts`,',
    '> see VERSIONING.md and scripts/require-pnpm-publish.mjs',
    '````',
    '',
    recipe(),
    publishers(),
  ].join('\n');
  const v = releaseDocViolations(docs({ contributing: quoted }), PACKAGES);
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /no "Safe to run; never publishes" guidance/);
});

test('a package list in a later section does not rescue the OIDC one', () => {
  // The bullet search ran to EOF after the anchor, so a complete list further
  // down stood in for an OIDC section that had lost its own.
  const rescued = [
    doc({ publishers: '' }).trimEnd(),
    '',
    '### npm authentication (OIDC trusted publishing)',
    '',
    'Each published package needs a trusted publisher configured on npmjs.com:',
    '',
    '(the bullet that belongs here has been deleted)',
    '',
    '### Something else entirely',
    '',
    '- Packages: `@allxsmith/bestax-bulma`, `create-bestax`, `bestax-migrate` and `bestax-mcp`',
  ].join('\n');
  const v = releaseDocViolations(docs({ contributing: rescued }), PACKAGES);
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /no "- Packages:" line in the OIDC trusted/);
});

test('body prose about trusted publishing is not an anchor', () => {
  // The anchor matched any line mentioning it, so deleting the heading left
  // the section's own sentence anchoring the search and the list still passed
  // while the section it belongs to was gone.
  const headingless = [
    doc({ publishers: '' }).trimEnd(),
    '',
    'Each published package needs a trusted publisher configured on npmjs.com:',
    '',
    '- Packages: `@allxsmith/bestax-bulma`, `create-bestax`, `bestax-migrate` and `bestax-mcp`',
  ].join('\n');
  const v = releaseDocViolations(docs({ contributing: headingless }), PACKAGES);
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /no "- Packages:" line in the OIDC trusted/);
});

test('a heading butted against the bullet does not extend the list', () => {
  // The continuation scan ran past the section, so a heading immediately after
  // the bullet — no blank line — swept the next section in, and a package
  // named there covered an omission in this one.
  const butted = [
    doc({ publishers: '' }).trimEnd(),
    '',
    '### npm authentication (OIDC trusted publishing)',
    '',
    '- Packages: `@allxsmith/bestax-bulma`, `create-bestax`',
    '### Something else',
    '`bestax-migrate` and `bestax-mcp` are mentioned here for other reasons',
  ].join('\n');
  const v = releaseDocViolations(docs({ contributing: butted }), PACKAGES);
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /trusted-publisher list omits/);
  assert.match(v[0], /bestax-migrate/);
});

test('a missing OIDC section is not rescued by a bullet elsewhere', () => {
  // packagesBullet fell back to line 0 when it found no "trusted publisher"
  // anchor, which is the file-wide search it exists to prevent: an unrelated
  // "- Packages:" bullet then satisfied the assertion with the real guidance
  // deleted.
  const noOidcSection = [
    '- Packages: `@allxsmith/bestax-bulma`, `create-bestax`, `bestax-migrate` and `bestax-mcp`',
    '',
    doc({ publishers: '' }),
  ].join('\n');
  const v = releaseDocViolations(
    docs({ contributing: noOidcSection }),
    PACKAGES
  );
  assert.equal(v.length, 1, v.join('\n'));
  assert.match(v[0], /no "- Packages:" line in the OIDC trusted/);
});

test('unreadable manifests each get a violation naming the package', () => {
  // The branch this covers used to live inside checkReleaseDocsSync, where no
  // test could reach it — so the test named for this asserted the clean case
  // and would have stayed green through a regression.
  assert.deepEqual(unreadableManifestViolations([]), []);
  const v = unreadableManifestViolations(['bestax-mcp', 'create-bestax']);
  assert.equal(v.length, 2);
  assert.match(v[0], /^bestax-mcp\/package\.json could not be read/);
  assert.match(v[0], /removes bestax-mcp from both lists silently/);
  assert.match(v[1], /^create-bestax\/package\.json/);
});

test('the real repo files satisfy the check', async () => {
  // The fixtures above could all agree with a rule the real docs violate.
  //
  // The package list comes from publishablePackages(), the same helper the
  // check itself uses, rather than from the PACKAGES fixture or a third
  // re-derivation. A fifth publishable package therefore cannot let this pass
  // against a stale four while the real check fails — which is the exact
  // failure shape this check exists to stop.
  const read = rel =>
    readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');
  const { packages, unreadable } = await publishablePackages();
  assert.deepEqual(unreadable, [], `unreadable manifests: ${unreadable}`);
  assert.ok(
    packages.length >= 4,
    `expected 4+ publishable, got ${packages.length}`
  );
  const real = new Map([
    ['CONTRIBUTING.md', read('CONTRIBUTING.md')],
    [
      'docs/docs/guides/getting-started/contributing.md',
      read('docs/docs/guides/getting-started/contributing.md'),
    ],
  ]);
  assert.deepEqual(releaseDocViolations(real, packages), []);
});

test('an empty package list is refused, not silently satisfied', () => {
  // Both derived assertions are vacuously true against no packages, so an
  // enumeration that quietly returned nothing would print a tick.
  const v = releaseDocViolations(docs(), []);
  assert.equal(v.length, 1);
  assert.match(v[0], /No publishable packages were found/);
});

// --- hardening round (#544 review) -------------------------------------------

test('a backslash-wrapped for-loop list is read in full', () => {
  // recipeTargets stopped at the first newline, so names wrapped onto the
  // continuation line were falsely reported missing from the recipe.
  const wrapped =
    '```bash\nfor pkg in bulma-ui create-bestax \\\n' +
    '  bestax-migrate bestax-mcp; do\n' +
    '  ( cd "$pkg" && pnpm exec semantic-release --dry-run --no-ci )\ndone\n```';
  assert.deepEqual(
    releaseDocViolations(
      docs({ contributing: doc({ recipe: wrapped }) }),
      PACKAGES
    ),
    []
  );
});

test('an example fence butted above the recipe does not merge into it', () => {
  // fenceMask marks delimiter lines true, so two butted fences formed one
  // block — and an example loop naming all four dirs then masked a real
  // omission in the recipe below it (fail-open), while a partial example
  // produced false missing-package reds (false positive).
  const butted =
    '```bash\nfor pkg in bulma-ui create-bestax bestax-migrate bestax-mcp; do echo "$pkg"; done\n```\n' +
    recipe(['bulma-ui']); // the REAL recipe omits three packages
  const v = releaseDocViolations(
    docs({ contributing: doc({ recipe: butted }) }),
    PACKAGES
  );
  assert.ok(v.length >= 1, 'the omission must not be masked by the example');
  assert.match(v.join(' '), /bestax-mcp/);
});

test('a fence butted under the Packages bullet does not extend it', () => {
  // The continuation scan stopped at blank lines and bullets only, so a
  // fenced example with no blank line above it was swept into the bullet
  // text and its tokens counted as trusted publishers.
  const swept =
    publishers(PACKAGES.slice(0, 3).map(p => p.name)) +
    '\n```bash\nnpm owner ls bestax-mcp\n```';
  const v = releaseDocViolations(
    docs({ contributing: doc({ publishers: swept }) }),
    PACKAGES
  );
  assert.ok(v.length >= 1, 'the fenced mention must not stand in for the list');
  assert.match(v.join(' '), /bestax-mcp/);
});

test('an earlier trusted-publishing heading does not steal the anchor', () => {
  // First-match anchoring meant a new earlier heading captured the search
  // and produced a false "no Packages line" while the real section was fine.
  const decoy =
    '## Why trusted publishing?\n\nBecause tokens leak.\n\n' + doc();
  assert.deepEqual(
    releaseDocViolations(docs({ contributing: decoy }), PACKAGES),
    []
  );
});

test('a manifest that parses to null is unreadable, not a crash', async () => {
  // JSON.parse succeeds on the literal `null` — a truncated-write artifact —
  // and dereferencing it threw a TypeError past the runner's loop, aborting
  // every remaining conformance check instead of reporting the one broken
  // package through the violation written for exactly this case.
  const root = await mkdtemp(join(tmpdir(), 'null-manifest-'));
  try {
    await writeFile(
      join(root, 'pnpm-workspace.yaml'),
      'packages:\n  - good\n  - broken\n'
    );
    await mkdir(join(root, 'good'));
    await writeFile(
      join(root, 'good', 'package.json'),
      '{"name": "good", "private": false}'
    );
    await mkdir(join(root, 'broken'));
    await writeFile(join(root, 'broken', 'package.json'), 'null');
    const { packages, unreadable } = await publishablePackages(root);
    assert.deepEqual(packages, [{ dir: 'good', name: 'good' }]);
    assert.deepEqual(unreadable, ['broken']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a preliminary loop cannot cover for the release loop', () => {
  // Union-of-all-loops was fail-open: an echo loop over every package let a
  // release loop covering only one pass the presence check. Only loops whose
  // body invokes the dry run contribute.
  const twoLoops =
    '```bash\nfor pkg in bulma-ui create-bestax bestax-migrate bestax-mcp; do echo "$pkg"; done\n' +
    'for pkg in bulma-ui; do\n  ( cd "$pkg" && pnpm exec semantic-release --dry-run --no-ci )\ndone\n```';
  const v = releaseDocViolations(
    docs({ contributing: doc({ recipe: twoLoops }) }),
    PACKAGES
  );
  assert.ok(v.length >= 1, 'the echo loop must not mask the omission');
  assert.match(v.join(' '), /bestax-mcp/);
});

test('an array manifest is unreadable, not silently absent', async () => {
  // `[]` parses, passes typeof object, has no name — the package vanished
  // from the list with no violation, the same outcome as the null crash by a
  // quieter road.
  const root = await mkdtemp(join(tmpdir(), 'array-manifest-'));
  try {
    await writeFile(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - arr\n');
    await mkdir(join(root, 'arr'));
    await writeFile(join(root, 'arr', 'package.json'), '[]');
    const { packages, unreadable } = await publishablePackages(root);
    assert.deepEqual(packages, []);
    assert.deepEqual(unreadable, ['arr']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('an echoed semantic-release mention is not an invoking loop', () => {
  // A banner loop over every package must not stand in for (or dilute) the
  // loop that actually runs the release.
  const block = [
    'for pkg in a b c d; do',
    '  echo "will run semantic-release for $pkg"',
    'done',
    'for pkg in a b; do',
    '  pnpm exec semantic-release --dry-run',
    'done',
  ].join('\n');
  assert.equal(recipeTargets(block), 'a b');
});
