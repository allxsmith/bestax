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

import { classifyPublisher } from './check-conformance.mjs';

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
    assert.equal(classifyPublisher(plugins), publisher);
  });
}

test('a missing plugin list does not throw, and does not read as pnpm', () => {
  // A release config that fails to parse the way this expects must not produce
  // the one verdict that turns the rule off.
  for (const plugins of [undefined, null]) {
    assert.notEqual(classifyPublisher(plugins), 'pnpm');
  }
});

test('only `pnpm publish` earns the exemption', () => {
  // The exemption is the dangerous verdict, so pin what cannot claim it.
  for (const publishCmd of [
    'npm publish',
    'yarn publish',
    'pnpm  publishing --dry-run',
    'pnpm-publish',
    'pnpmpublish',
    'echo "run pnpm publish by hand"',
  ]) {
    assert.notEqual(
      classifyPublisher([
        [NPM, { npmPublish: false }],
        [EXEC, { publishCmd }],
      ]),
      'pnpm',
      `"${publishCmd}" must not be read as publishing with pnpm`
    );
  }
  // …and that the real command still does.
  assert.equal(
    classifyPublisher([
      [NPM, { npmPublish: false }],
      [EXEC, { publishCmd: PNPM_PUBLISH }],
    ]),
    'pnpm'
  );
});

// --- the configs this repo actually ships ------------------------------------
//
// The fixtures above are hypotheticals. These are the four real release
// configs, and they are what the conformance check reads at runtime. A refactor
// that leaves the classifier correct but breaks on the actual shape of these
// files would pass everything above.

const REAL = [
  ['bulma-ui', 'npm'],
  ['create-bestax', 'npm'],
  ['bestax-migrate', 'pnpm'],
  ['bestax-mcp', 'npm'],
];

for (const [dir, publisher] of REAL) {
  test(`the real ${dir}/release.config.js classifies as ${publisher}`, async () => {
    const { default: config } = await import(`../${dir}/release.config.js`);
    assert.equal(classifyPublisher(config.plugins), publisher);
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
