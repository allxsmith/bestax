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
import { fileURLToPath } from 'node:url';

import {
  parseWorkspacePackages,
  releaseDocViolations,
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
];

const recipe = (dirs = PACKAGES.map(p => p.dir)) =>
  '```bash\nfor pkg in ' +
  dirs.join(' ') +
  '; do\n  ( cd "$pkg" && pnpm exec semantic-release --dry-run --no-ci )\ndone\n```';

const publishers = (names = PACKAGES.map(p => p.name)) =>
  `- Packages: ${names.map(n => `\`${n}\``).join(', ')}`;

const doc = (opts = {}) =>
  [
    ...(opts.facts ?? FACTS),
    opts.recipe ?? recipe(),
    opts.publishers ?? publishers(),
  ].join('\n\n');

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
  assert.ok(
    v.every(m => /bestax\b/.test(m)),
    'both messages must name the omitted package'
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

test('the trusted-publisher list is only required of CONTRIBUTING.md', () => {
  // The docs mirror is a contributor page, not the operational runbook, so it
  // is not asked for the npmjs.com configuration list.
  assert.deepEqual(releaseDocViolations(docs(), PACKAGES), []);
});

test('a missing trusted-publisher line is its own message', () => {
  const v = releaseDocViolations(
    docs({ contributing: doc({ publishers: '' }) }),
    PACKAGES
  );
  assert.equal(v.length, 1);
  assert.match(v[0], /no "- Packages:" line/);
});

/**
 * How a TS template literal would carry this text: backslashes first, then
 * backticks. That order is the whole correctness of an escaper — doing
 * backticks first would then double the backslashes it just introduced — and
 * writing only the backtick half is what CodeQL flags as incomplete escaping,
 * correctly, even though these fixtures happen to contain no backslashes.
 */
const asTemplateLiteral = s => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

test('escaped backticks compare equal, as in the other sync checks', () => {
  // near-miss-sync strips backslashes so a TS template literal's escaped
  // backticks match a markdown copy's plain ones. Same normalisation here, so
  // a fact quoted from a template does not read as missing.
  const escaped = asTemplateLiteral(doc());
  assert.deepEqual(
    releaseDocViolations(
      new Map([
        ['CONTRIBUTING.md', escaped],
        ['docs/docs/guides/getting-started/contributing.md', escaped],
      ]),
      PACKAGES
    ),
    []
  );
});

test('the real repo files satisfy the check', () => {
  // The fixtures above could all agree with a rule the real docs violate.
  //
  // The package list is DERIVED here rather than reusing the PACKAGES fixture:
  // a fifth publishable package would otherwise let this pass against a stale
  // four while the real check failed in CI, which is the exact failure shape
  // this whole check exists to stop.
  const read = rel =>
    readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');
  const packages = parseWorkspacePackages(read('pnpm-workspace.yaml'))
    .map(dir => {
      try {
        return { dir, ...JSON.parse(read(`${dir}/package.json`)) };
      } catch {
        return null;
      }
    })
    .filter(p => p && !p.private && p.name)
    .map(({ dir, name }) => ({ dir, name }));

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
