/**
 * Holds bestax-migrate/scripts/pack-manifest.mjs and the
 * `publishable-manifests` rule in scripts/check-conformance.mjs in agreement
 * (#435).
 *
 * Both files encode the same rule about which pnpm specifier shapes survive
 * `npm publish`. The pack script decides what it will rewrite at pack time; the
 * conformance check decides what it will let past CI on the strength of the
 * pack hooks being wired. **A shape the script refuses but the check excuses is
 * a green CI with a red release** — the check reports all clear and the release
 * is what breaks, which is the exact inversion the check exists to prevent.
 *
 * That inversion shipped twice during review of #417, both times in code that
 * read as obviously correct: `catalog:` (fixed in 4127ead) and pnpm's alias
 * form `workspace:<name>@<range>` (fixed in de6a900, after it was found
 * unwrapping to a bare `@scope/pkg@^5` that no package manager can install —
 * #412 wearing a different hat).
 *
 * So this drives BOTH real implementations rather than restating their logic. A
 * third copy of the rule in a test would be one more thing to drift, which is
 * the bug class rather than a fix for it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  main,
  rewriteSpecifier,
  resolveSpecifier,
  UnsupportedSpecifierError,
} from '../bestax-migrate/scripts/pack-manifest.mjs';
import { unresolvableAtPack } from './check-conformance.mjs';

/** The linked-package lookup, stubbed so no pnpm tree is required. */
const VERSION = '5.11.1';
const resolveVersion = () => VERSION;

const NAME = '@allxsmith/bestax-bulma';

/** Does the pack script refuse this specifier? */
function packRefuses(spec) {
  try {
    rewriteSpecifier(NAME, spec, resolveVersion);
    return false;
  } catch (err) {
    if (err instanceof UnsupportedSpecifierError) return true;
    throw err;
  }
}

/** Does the conformance check flag this specifier as unresolvable at pack time? */
const checkFlags = spec => Boolean(unresolvableAtPack(spec));

/**
 * Every shape pnpm documents, and what each side is supposed to do with it.
 * `refused: true` means BOTH the script refuses it and the check flags it —
 * that pairing is the invariant, and it is asserted as a biconditional below
 * rather than as two independent expectations.
 */
const SHAPES = [
  { spec: 'workspace:*', refused: false, resolves: VERSION },
  { spec: 'workspace:', refused: false, resolves: VERSION },
  { spec: 'workspace:^', refused: false, resolves: `^${VERSION}` },
  { spec: 'workspace:~', refused: false, resolves: `~${VERSION}` },
  { spec: 'workspace:^5.0.0', refused: false, resolves: '^5.0.0' },
  { spec: 'workspace:~5.0.0', refused: false, resolves: '~5.0.0' },
  { spec: 'workspace:5.0.0', refused: false, resolves: '5.0.0' },
  { spec: 'workspace:>=5 <6', refused: false, resolves: '>=5 <6' },
  { spec: 'workspace:@allxsmith/bestax-bulma@^5', refused: true },
  { spec: 'workspace:bestax-bulma@^5', refused: true },
  { spec: 'catalog:', refused: true },
  { spec: 'catalog:default', refused: true },
];

// --- the invariant ----------------------------------------------------------

for (const { spec, refused } of SHAPES) {
  test(`agreement: "${spec}" is ${refused ? 'refused by both' : 'accepted by both'}`, () => {
    assert.equal(
      packRefuses(spec),
      checkFlags(spec),
      `pack-manifest.mjs and check-conformance.mjs disagree about "${spec}". ` +
        `That is a green-CI/red-release inversion: whichever one is wrong, the ` +
        `check will pass a manifest the pack hooks then refuse to publish.`
    );
    assert.equal(packRefuses(spec), refused, `expected refusal=${refused}`);
  });
}

// --- what the accepted shapes actually resolve to ---------------------------

for (const { spec, refused, resolves } of SHAPES) {
  if (refused) continue;
  test(`resolve: "${spec}" -> "${resolves}"`, () => {
    assert.equal(rewriteSpecifier(NAME, spec, resolveVersion), resolves);
  });
}

// --- the false-positive guard the #412 fix depends on -----------------------

test('an explicit range is not mistaken for the alias form', () => {
  // `rest.includes('/') || rest.lastIndexOf('@') > 0` is the alias predicate on
  // both sides. If it ever caught `workspace:^5.0.0`, the fix for #412 would
  // start rejecting the very shape it was written to support.
  for (const spec of [
    'workspace:^5.0.0',
    'workspace:>=5 <6',
    'workspace:5.0.0',
  ]) {
    assert.equal(checkFlags(spec), false, `${spec} must not be flagged`);
    assert.equal(packRefuses(spec), false, `${spec} must not be refused`);
  }
});

test('a scoped name in the alias form is caught by the "/" arm', () => {
  // Two arms, two shapes: scoped names trip `includes('/')`, unscoped ones trip
  // `lastIndexOf('@') > 0`. Both are exercised so neither can be dropped.
  assert.ok(packRefuses('workspace:@scope/pkg@^1'));
  assert.ok(checkFlags('workspace:@scope/pkg@^1'));
  assert.ok(packRefuses('workspace:pkg@^1'));
  assert.ok(checkFlags('workspace:pkg@^1'));
});

// --- shapes neither side owns ----------------------------------------------

test('a plain semver range is nobody’s business', () => {
  for (const spec of ['^5.0.0', '5.0.0', '>=5 <6', 'npm:other@^1']) {
    assert.equal(rewriteSpecifier(NAME, spec, resolveVersion), null);
    assert.equal(checkFlags(spec), false);
  }
});

test('a non-string specifier is left alone rather than crashing', () => {
  // package.json can carry odd values; neither side should throw on them.
  for (const spec of [undefined, null, 42, {}]) {
    assert.equal(rewriteSpecifier(NAME, spec, resolveVersion), null);
    assert.equal(checkFlags(spec), false);
  }
});

// --- messages name the dependency, since that is what a maintainer greps ----

test('a refusal names the offending entry and the specifier', () => {
  assert.throws(
    () =>
      rewriteSpecifier(NAME, 'catalog:', resolveVersion, 'devDependencies.x'),
    err =>
      err instanceof UnsupportedSpecifierError &&
      err.message.includes('devDependencies.x') &&
      err.message.includes('catalog:')
  );
  assert.throws(
    () =>
      rewriteSpecifier(
        NAME,
        'workspace:pkg@^1',
        resolveVersion,
        'devDependencies.y'
      ),
    err =>
      err instanceof UnsupportedSpecifierError &&
      err.message.includes('devDependencies.y') &&
      err.message.includes('alias form')
  );
});

test('resolveSpecifier defers the version lookup to its caller', () => {
  // The seam that makes this testable at all: no pnpm-linked tree required.
  const calls = [];
  const spy = name => {
    calls.push(name);
    return '1.2.3';
  };
  assert.equal(resolveSpecifier(NAME, 'workspace:^', spy), '^1.2.3');
  assert.deepEqual(calls, [NAME]);
});

// --- what the CLI does with a refusal ---------------------------------------
//
// The specifier decisions above are the invariant this file exists for, but the
// exit CODE is what npm keys off to abort a publish. These refusals used to be
// `process.exit(1)` and are now thrown and translated by `main`, so the
// translation is worth freezing: if a refusal ever returned 0, npm would
// publish the broken tarball this whole guard exists to prevent — the bug
// inverted.

/** A throwaway package root, so nothing in the repo is touched. */
function fixtureRoot(pkg) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-manifest-'));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    `${JSON.stringify(pkg, null, 2)}\n`
  );
  return root;
}

const readManifest = root =>
  fs.readFileSync(path.join(root, 'package.json'), 'utf8');
const backupPath = root => path.join(root, 'package.json.pack-backup');

test('a refused specifier aborts the pack without touching the manifest', () => {
  const root = fixtureRoot({
    name: 'fixture',
    version: '0.0.0',
    devDependencies: { '@allxsmith/bestax-bulma': 'catalog:' },
  });
  const before = readManifest(root);

  assert.equal(main(['prepack'], { pkgRoot: root }), 1, 'must exit non-zero');
  assert.equal(readManifest(root), before, 'manifest must be left intact');
  // A stale backup makes the NEXT prepack refuse to run, so a half-done
  // refusal would wedge the following release too.
  assert.equal(fs.existsSync(backupPath(root)), false, 'no backup left behind');
});

test('the alias form aborts the pack the same way', () => {
  const root = fixtureRoot({
    name: 'fixture',
    version: '0.0.0',
    devDependencies: { 'bestax-bulma': 'workspace:@allxsmith/bestax-bulma@^5' },
  });
  const before = readManifest(root);
  assert.equal(main(['prepack'], { pkgRoot: root }), 1);
  assert.equal(readManifest(root), before);
  assert.equal(fs.existsSync(backupPath(root)), false);
});

test('prepack refuses to clobber a backup a previous pack left behind', () => {
  const root = fixtureRoot({ name: 'fixture', version: '0.0.0' });
  fs.writeFileSync(backupPath(root), '{}');
  assert.equal(main(['prepack'], { pkgRoot: root }), 1);
});

test('a manifest with nothing to rewrite is a no-op, not a failure', () => {
  const root = fixtureRoot({
    name: 'fixture',
    version: '0.0.0',
    dependencies: { bulma: '^1.0.4' },
  });
  const before = readManifest(root);
  assert.equal(main(['prepack'], { pkgRoot: root }), 0);
  assert.equal(readManifest(root), before);
  assert.equal(fs.existsSync(backupPath(root)), false);
});

test('postpack with no backup is a no-op, not a failure', () => {
  const root = fixtureRoot({ name: 'fixture', version: '0.0.0' });
  assert.equal(main(['postpack'], { pkgRoot: root }), 0);
});

test('an unknown mode fails rather than silently doing nothing', () => {
  const root = fixtureRoot({ name: 'fixture', version: '0.0.0' });
  assert.equal(main(['bogus'], { pkgRoot: root }), 1);
  assert.equal(main([], { pkgRoot: root }), 1);
});

test('prepack rewrites and postpack restores the repo manifest exactly', () => {
  // The round trip is the whole safety property: the release commits
  // package.json, so a postpack that did not restore byte-for-byte would
  // commit resolved specifiers back into the workspace.
  const root = fixtureRoot({
    name: 'fixture',
    version: '0.0.0',
    devDependencies: { '@allxsmith/bestax-bulma': 'workspace:^' },
  });
  const linked = path.join(root, 'node_modules', '@allxsmith', 'bestax-bulma');
  fs.mkdirSync(linked, { recursive: true });
  fs.writeFileSync(
    path.join(linked, 'package.json'),
    JSON.stringify({ name: '@allxsmith/bestax-bulma', version: '5.11.1' })
  );
  const before = readManifest(root);

  assert.equal(main(['prepack'], { pkgRoot: root }), 0);
  const packed = JSON.parse(readManifest(root));
  assert.equal(
    packed.devDependencies['@allxsmith/bestax-bulma'],
    '^5.11.1',
    'the packed manifest carries a real range'
  );
  assert.ok(fs.existsSync(backupPath(root)), 'the original is backed up');

  assert.equal(main(['postpack'], { pkgRoot: root }), 0);
  assert.equal(readManifest(root), before, 'restored byte for byte');
  assert.equal(fs.existsSync(backupPath(root)), false, 'backup cleaned up');
});

test('an unresolvable workspace dep fails instead of packing a broken range', () => {
  // No linked package in node_modules — `pnpm install` was never run. Packing
  // anyway would emit an empty or bogus specifier. This exits 1 rather than
  // propagating, which is what the CLI did before the refactor and what npm
  // reads to abort the publish.
  const root = fixtureRoot({
    name: 'fixture',
    version: '0.0.0',
    devDependencies: { '@allxsmith/bestax-bulma': 'workspace:^' },
  });
  const before = readManifest(root);
  assert.equal(main(['prepack'], { pkgRoot: root }), 1);
  assert.equal(readManifest(root), before);
  assert.equal(fs.existsSync(backupPath(root)), false);
});

// --- agreement beyond the enumerated shapes ---------------------------------
//
// The table above pins the twelve shapes pnpm documents. Deep review on #531
// noted the gap that leaves: the two predicates agree on those twelve by
// assertion, and on everything else only because they are currently textually
// identical. An edit to one of them that happens to change a shape nobody
// listed would slip through.
//
// So assert the biconditional over a spread of odd, adversarial and
// not-yet-invented specifiers. This deliberately does NOT assert what the
// verdict should be — only that both sides reach the same one. Deciding the
// right answer for a hypothetical future pnpm syntax is not this test's job;
// noticing that the two files stopped answering it the same way is.
const ODD_SPECIFIERS = [
  // plausible future or undocumented pnpm shapes
  'workspace:^1.0.0-beta.1',
  'workspace:*-next',
  'workspace:latest',
  'workspace:1.x',
  'workspace:>=1',
  'workspace:@scope/name',
  'workspace:@scope/name@',
  'workspace:name@',
  'workspace:@',
  'workspace:@@',
  'workspace://',
  'workspace:a/b/c@1',
  'catalog:with-a-name',
  'catalog:@scope/thing',
  // adjacent protocols neither side owns
  'npm:pkg@^1',
  'file:../pkg',
  'link:../pkg',
  'git+https://example.test/x.git',
  'jsr:@scope/pkg',
  // degenerate strings
  '',
  ' ',
  'workspace',
  'workspaces:*',
  'catalog',
  'CATALOG:',
  'WORKSPACE:^',
  'x'.repeat(200),
  'workspace:' + 'a'.repeat(200),
];

for (const spec of ODD_SPECIFIERS) {
  test(`agreement holds for an unlisted shape: ${JSON.stringify(spec).slice(0, 40)}`, () => {
    assert.equal(
      packRefuses(spec),
      checkFlags(spec),
      `pack-manifest.mjs and check-conformance.mjs disagree about ` +
        `${JSON.stringify(spec)}. Whichever is right, one of them was edited ` +
        `without the other — the drift this file exists to catch.`
    );
  });
}
