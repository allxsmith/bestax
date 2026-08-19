/**
 * Holds the `publishable-manifests` rule in scripts/check-conformance.mjs to
 * the fact it actually depends on: which command uploads each package (#436).
 *
 * Successor to scripts/pack-manifest.test.mjs, which held that rule in
 * agreement with a hand-rolled `workspace:` resolver. The resolver is gone —
 * bestax-migrate publishes with `pnpm publish`, which resolves every pnpm
 * specifier shape by construction — so there are no longer two implementations
 * of the same rule to drift apart. What replaced that failure mode is a
 * narrower one, and it is worse: the check now EXEMPTS a package when it
 * believes that package publishes with pnpm. Get the classification backwards
 * and the check waves through the exact manifest that shipped #412, reporting
 * all clear.
 *
 * So the classifier is the thing under test, and the direction that matters is
 * the false exemption. `@semantic-release/npm` publishes unless explicitly
 * switched off, which is why "npm" is the conservative default and why a
 * config nobody understands must never come back "pnpm".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';

import {
  classifyPublisher,
  manifestViolations,
  parseWorkspacePackages,
} from './check-conformance.mjs';

const NPM = '@semantic-release/npm';
const EXEC = '@semantic-release/exec';
const PNPM_PUBLISH =
  'pnpm publish --no-git-checks --provenance --embed-readme ' +
  '--access public --tag ${nextRelease.channel || "latest"}';

// --- the classification ------------------------------------------------------

const CONFIGS = [
  {
    what: 'the bare plugin name, no config object',
    plugins: ['@semantic-release/commit-analyzer', NPM],
    publisher: 'npm',
  },
  {
    what: 'a config object that does not mention npmPublish',
    plugins: [[NPM, { pkgRoot: '.' }]],
    publisher: 'npm',
  },
  {
    what: 'npmPublish switched off, publish handed to pnpm',
    plugins: [
      [NPM, { pkgRoot: '.', npmPublish: false }],
      [EXEC, { publishCmd: PNPM_PUBLISH }],
    ],
    publisher: 'pnpm',
  },
  {
    what: 'exec present but npm still publishing',
    plugins: [
      [NPM, { pkgRoot: '.' }],
      [EXEC, { publishCmd: PNPM_PUBLISH }],
    ],
    // npm still uploads a tarball here, so the strict rule must still apply.
    publisher: 'npm',
  },
  {
    what: 'exec running something that is not a publish',
    plugins: [
      [NPM, { npmPublish: false }],
      [EXEC, { publishCmd: 'echo pnpm publish is only mentioned here' }],
    ],
    // "pnpm publish" as prose inside another command must not count. The word
    // boundaries in the predicate are what stop this being a substring match.
    publisher: 'unknown',
  },
  {
    what: 'exec with only a verifyConditionsCmd',
    plugins: [
      [NPM, { npmPublish: false }],
      [
        EXEC,
        { verifyConditionsCmd: 'node ../scripts/verify-oidc-context.mjs' },
      ],
    ],
    publisher: 'unknown',
  },
  {
    what: 'no publishing plugin at all',
    plugins: ['@semantic-release/github'],
    publisher: 'unknown',
  },
  { what: 'an empty plugin list', plugins: [], publisher: 'unknown' },
];

for (const { what, plugins, publisher } of CONFIGS) {
  test(`classify: ${what} -> ${publisher}`, () => {
    assert.equal(classifyPublisher({ plugins }), publisher);
  });
}

test('a missing plugin list does not throw, and does not read as pnpm', () => {
  // A release config that fails to parse the way this expects must not produce
  // the one verdict that turns the rule off.
  for (const plugins of [undefined, null]) {
    assert.notEqual(classifyPublisher({ plugins }), 'pnpm');
  }
});

test('only `pnpm publish` earns the exemption', () => {
  // The exemption is the dangerous verdict, so pin what cannot claim it.
  // Sanity-check the fixture shape first. This loop asserts a NEGATIVE, so a
  // malformed config argument makes every case pass vacuously: classifyPublisher
  // reads `config.plugins`, and an earlier version of this test passed a bare
  // array, so all six inputs returned 'unknown' and the loop proved nothing.
  assert.equal(
    classifyPublisher({
      plugins: [
        [NPM, { npmPublish: false }],
        [EXEC, { publishCmd: PNPM_PUBLISH }],
      ],
    }),
    'pnpm',
    'fixture shape is wrong: the negatives below would pass vacuously'
  );

  for (const publishCmd of [
    'npm publish',
    'yarn publish',
    'pnpm  publishing --dry-run',
    'pnpm-publish',
    'pnpmpublish',
    'echo "run pnpm publish by hand"',
    'pnpm publish --dry-run',
  ]) {
    assert.notEqual(
      classifyPublisher({
        plugins: [
          [NPM, { npmPublish: false }],
          [EXEC, { publishCmd }],
        ],
      }),
      'pnpm',
      `"${publishCmd}" must not be read as publishing with pnpm`
    );
  }
  // …and that the real command still does.
  assert.equal(
    classifyPublisher({
      plugins: [
        [NPM, { npmPublish: false }],
        [EXEC, { publishCmd: PNPM_PUBLISH }],
      ],
    }),
    'pnpm'
  );
});

// --- the configs this repo actually ships ------------------------------------
//
// The fixtures above are hypotheticals. These are the four real release
// configs, and they are what the conformance check reads at runtime. A refactor
// that leaves the classifier correct but breaks on the actual shape of these
// files would pass everything above.

const EXPECTED = { 'bestax-migrate': 'pnpm' }; // everything else publishes with npm

// Derived from pnpm-workspace.yaml rather than hardcoded, because that is the
// list checkPublishableManifests actually walks. A fifth publishable package
// would otherwise be added without this block ever seeing it (#436 review).
//
// Reusing the check's own parser rather than writing a second one, for the
// reason this whole issue is about: the first draft of this block reimplemented
// it, ran past the `packages:` block, and tried to read `prettier/package.json`.
const REAL = parseWorkspacePackages(
  readFileSync(new URL('../pnpm-workspace.yaml', import.meta.url), 'utf8')
)
  .filter(dir => {
    const pkg = JSON.parse(
      readFileSync(new URL(`../${dir}/package.json`, import.meta.url), 'utf8')
    );
    return !pkg.private;
  })
  .map(dir => [dir, EXPECTED[dir] ?? 'npm']);

test('the workspace roster was actually discovered', () => {
  // A parse that silently yielded nothing would make every test below vacuous.
  assert.ok(
    REAL.length >= 4,
    `expected 4+ publishable packages, got ${REAL.length}`
  );
  assert.ok(REAL.some(([dir]) => dir === 'bestax-migrate'));
});

for (const [dir, publisher] of REAL) {
  test(`the real ${dir}/release.config.js classifies as ${publisher}`, async () => {
    const { default: config } = await import(`../${dir}/release.config.js`);
    assert.equal(classifyPublisher(config), publisher);
  });
}

test('bestax-migrate passes --provenance and --embed-readme', async () => {
  // Neither is optional and neither fails loudly if dropped, which is exactly
  // why they are pinned here rather than left to review.
  //
  //   --provenance   pnpm does not read `publishConfig.provenance`; without the
  //                  flag #411's provenance silently stops being produced.
  //   --embed-readme pnpm defaults it to false where npm defaults it to true;
  //                  without the flag the npmjs.com page loses its README.
  const { default: config } =
    await import('../bestax-migrate/release.config.js');
  const exec = config.plugins.find(p => Array.isArray(p) && p[0] === EXEC);
  assert.ok(exec, 'bestax-migrate must publish through @semantic-release/exec');
  assert.match(exec[1].publishCmd, /\s--provenance(\s|$)/);
  assert.match(exec[1].publishCmd, /\s--embed-readme(\s|$)/);
});

test('the release stays on a single branch, or the dist-tag needs revisiting', async () => {
  // publishCmd passes no --tag, which is only correct while every release goes
  // to `latest`. @semantic-release/npm's get-channel.js maps a channel that is
  // a valid semver range to `release-<channel>` because the registry rejects a
  // dist-tag that parses as a range, and nothing here reimplements that. So a
  // maintenance or prerelease branch must fail HERE, in CI, rather than by
  // publishing 1.x to the stable tag after the tag is already pushed.
  const { default: config } =
    await import('../bestax-migrate/release.config.js');
  assert.deepEqual(
    config.branches,
    ['main'],
    'branches changed: derive the dist-tag in publishCmd before adding a channel'
  );
});

// --- the rule itself, which has no live input in this repo --------------------
//
// bestax-migrate is the only package carrying a pack-time specifier and it is
// exempt, so the violation branch never executes during a real run. Without
// these, inverting the exemption would leave `pnpm check:conformance` green.

const WORKSPACE_DEP = {
  devDependencies: { '@allxsmith/bestax-bulma': 'workspace:^' },
};

test('an npm publisher carrying a pack-time specifier is a violation', () => {
  const v = manifestViolations('somepkg', WORKSPACE_DEP, 'npm');
  assert.equal(v.length, 1);
  assert.match(v[0], /somepkg\/package\.json/);
  assert.match(v[0], /workspace:/);
  assert.match(v[0], /#412/);
});

test('a pnpm publisher carrying the same specifier is exempt', () => {
  assert.deepEqual(manifestViolations('somepkg', WORKSPACE_DEP, 'pnpm'), []);
});

test('an unrecognised publisher is held to the strict rule', () => {
  const v = manifestViolations('somepkg', WORKSPACE_DEP, 'unknown');
  assert.equal(v.length, 1);
  // The message must not assert npm semantics it has not established, and must
  // name what it was looking for so the fix is actionable.
  assert.doesNotMatch(v[0], /publishes with `npm publish`/);
  assert.match(v[0], /cannot be assumed to resolve/);
  assert.match(v[0], /publishCmd/);
});

test('jsr: counts as a pack-time protocol', () => {
  // pnpm rewrites jsr: at pack time (replaceJsrProtocol in its converter
  // chain) and npm has no jsr: protocol, so it is the same shape as #412.
  assert.equal(
    manifestViolations(
      'somepkg',
      { dependencies: { x: 'jsr:@scope/pkg@^1' } },
      'npm'
    ).length,
    1
  );
});

test('every dependency section is inspected, not just dependencies', () => {
  for (const section of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    assert.equal(
      manifestViolations('somepkg', { [section]: { x: 'catalog:' } }, 'npm')
        .length,
      1,
      `${section} must be inspected`
    );
  }
});

test('a private package is not held to any of this', () => {
  assert.deepEqual(
    manifestViolations('docs', { private: true, ...WORKSPACE_DEP }, 'npm'),
    []
  );
});

test('a plain semver range is not a violation for anyone', () => {
  const clean = {
    dependencies: { bulma: '^1.0.4' },
    devDependencies: { jest: '^30' },
  };
  for (const publisher of ['npm', 'pnpm', 'unknown']) {
    assert.deepEqual(manifestViolations('somepkg', clean, publisher), []);
  }
});
