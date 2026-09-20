/**
 * The version-regression check (#705).
 *
 * The matching is driven through injected readers rather than a git fixture,
 * because what is worth pinning is the DECISION — which comparisons are made
 * and which are refused — and a fixture repository would test `git tag` instead.
 * The one thing only git can answer, that `--merged HEAD` sees a branch's own
 * history rather than every tag in the repository, is asserted in the check's
 * own docblock and exercised by running it on this repo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  compareVersions,
  expectedTagFormat,
  findVersionRegressions,
} from './lib/version-regression.mjs';

const run = ({ packages, tags = {}, anyTagsExist = true, formats = {} } = {}) =>
  findVersionRegressions({
    packages,
    anyTagsExist,
    tagsFor: name => tags[name] ?? [],
    tagFormatFor: dir =>
      dir in formats ? formats[dir] : expectedTagFormat(packages[0].name),
  });

const pkg = (version, name = 'pkg-a', dir = 'pkg-a') => ({
  dir,
  name,
  version,
});

test('compareVersions orders release versions', () => {
  assert.ok(compareVersions('1.0.0', '1.0.1') < 0);
  assert.ok(compareVersions('1.1.0', '1.0.9') > 0);
  assert.ok(compareVersions('2.0.0', '1.99.99') > 0);
  assert.equal(compareVersions('5.16.3', '5.16.3'), 0);
  // Numeric, not lexical: the mistake that makes 5.9.0 look newer than 5.16.0.
  assert.ok(compareVersions('5.9.0', '5.16.0') < 0);
});

test('compareVersions puts a prerelease below the release it leads to', () => {
  assert.ok(compareVersions('1.0.0-alpha', '1.0.0') < 0);
  assert.ok(compareVersions('1.0.0', '1.0.0-alpha') > 0);
  // The shape that matters here: the placeholder eslint-plugin sits at.
  assert.ok(compareVersions('0.0.0-development', '0.0.1') < 0);
});

test('compareVersions follows semver within a prerelease', () => {
  assert.ok(compareVersions('1.0.0-alpha.1', '1.0.0-alpha.2') < 0);
  // Numeric identifiers sort below alphanumeric ones.
  assert.ok(compareVersions('1.0.0-1', '1.0.0-alpha') < 0);
  // A shorter prerelease sorts below an otherwise equal longer one.
  assert.ok(compareVersions('1.0.0-alpha', '1.0.0-alpha.1') < 0);
  // Numerically, not as strings.
  assert.ok(compareVersions('1.0.0-alpha.9', '1.0.0-alpha.10') < 0);
});

test('compareVersions ignores build metadata and refuses what it cannot read', () => {
  assert.equal(compareVersions('1.0.0+build.1', '1.0.0+build.2'), 0);
  // `null`, never 0: an unreadable version that compared EQUAL would be
  // silently exempt, which is the failure this whole check exists to stop.
  assert.equal(compareVersions('not-a-version', '1.0.0'), null);
  assert.equal(compareVersions('1.0', '1.0.0'), null);
  assert.equal(compareVersions('v1.0.0', '1.0.0'), null);
});

test('flags a manifest below a tag in its own history', () => {
  const problems = run({
    packages: [pkg('5.15.0')],
    tags: { 'pkg-a': ['pkg-a@5.16.0', 'pkg-a@5.16.3', 'pkg-a@5.16.1'] },
  });
  assert.equal(problems.length, 1);
  // The highest tag, not the last one listed: git's order is not semver order.
  assert.match(problems[0], /5\.15\.0/);
  assert.match(problems[0], /5\.16\.3/);
  // The message has to say what does not recover, or it reads as cosmetic.
  assert.match(problems[0], /CHANGELOG\.md/);
});

test('accepts a manifest level with, or ahead of, the highest tag', () => {
  // Level: the normal state between releases.
  assert.deepEqual(
    run({ packages: [pkg('5.16.3')], tags: { 'pkg-a': ['pkg-a@5.16.3'] } }),
    []
  );
  // Ahead: what a release commit itself looks like.
  assert.deepEqual(
    run({ packages: [pkg('5.17.0')], tags: { 'pkg-a': ['pkg-a@5.16.3'] } }),
    []
  );
});

test('accepts a branch cut before a release it does not carry', () => {
  // THE false-positive case. `--merged HEAD` gives such a branch only the tags
  // in its own history, so the newer release is not among them and the older
  // manifest is correct. Comparing against every tag in the repository instead
  // would red every un-rebased PR the moment a release landed.
  assert.deepEqual(
    run({
      packages: [pkg('5.16.0')],
      tags: { 'pkg-a': ['pkg-a@5.15.4', 'pkg-a@5.16.0'] },
    }),
    []
  );
});

test('accepts a package with no tag reachable from here', () => {
  // A new package, or a branch cut before its first release. Nothing released
  // to regress against.
  assert.deepEqual(run({ packages: [pkg('0.0.0-development')], tags: {} }), []);
});

test('refuses to run at all when the repository has no tags', () => {
  // The vacuous pass: without tags every package matches nothing and sails
  // through. CI checkouts are shallow by default and `fetch-depth: 0` does not
  // imply tags, so this is the likely way for it to happen.
  const problems = run({
    packages: [pkg('0.0.1')],
    tags: {},
    anyTagsExist: false,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no tags/);
  assert.match(problems[0], /fetch/i);
});

test('flags a release config whose tagFormat this check cannot match', () => {
  // The silent-exemption shape: a package that renamed its tags would match no
  // tags and pass, which is how `publishable-manifests` got four rules wrong.
  const problems = run({
    packages: [pkg('1.0.0')],
    tags: { 'pkg-a': ['pkg-a@2.0.0'] },
    formats: { 'pkg-a': 'v${version}' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /tagFormat/);
  // And it does NOT then also report the regression: the comparison it would
  // have made is exactly the one that can no longer be trusted.
  assert.doesNotMatch(problems[0], /BELOW/);
});

test('skips the tagFormat assertion when a package has no release config', () => {
  assert.deepEqual(
    run({
      packages: [pkg('5.16.3')],
      tags: { 'pkg-a': ['pkg-a@5.16.3'] },
      formats: { 'pkg-a': null },
    }),
    []
  );
});

test('reports rather than skips a version it cannot compare', () => {
  const unreadable = run({
    packages: [pkg('nightly')],
    tags: { 'pkg-a': ['pkg-a@1.0.0'] },
  });
  assert.equal(unreadable.length, 1);
  assert.match(unreadable[0], /nightly/);

  const noUsableTag = run({
    packages: [pkg('1.0.0')],
    tags: { 'pkg-a': ['pkg-a@nightly'] },
  });
  assert.equal(noUsableTag.length, 1);
  assert.match(noUsableTag[0], /none carries a version/);
});

test('holds a prerelease placeholder to a real released tag', () => {
  // If the eslint-plugin placeholder is ever left in place after a real
  // release, that is the same regression wearing different clothes.
  const problems = run({
    packages: [pkg('0.0.0-development')],
    tags: { 'pkg-a': ['pkg-a@0.1.0'] },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /0\.0\.0-development/);
});

test('checks every package, not only the first that passes', () => {
  const problems = findVersionRegressions({
    packages: [
      { dir: 'a', name: 'a', version: '1.0.0' },
      { dir: 'b', name: 'b', version: '0.9.0' },
    ],
    anyTagsExist: true,
    tagsFor: name => [`${name}@1.0.0`],
    tagFormatFor: dir => expectedTagFormat(dir),
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^b\/package\.json/);
});
