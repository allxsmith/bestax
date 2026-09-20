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

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  compareVersions,
  expectedTagFormat,
  findVersionRegressions,
  tagGlob,
  UNREADABLE,
} from './lib/version-regression.mjs';
import { publishablePackages } from './check-conformance.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

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

test('accepts one package with no tags beside others that have them', () => {
  // A new package, or a branch cut before its first release: nothing released
  // to regress against. This is `eslint-plugin`'s real shape — a
  // `0.0.0-development` placeholder with no tag, next to four packages that
  // have them.
  assert.deepEqual(
    findVersionRegressions({
      packages: [
        { dir: 'new', name: 'new', version: '0.0.0-development' },
        { dir: 'old', name: 'old', version: '5.16.3' },
      ],
      anyTagsExist: true,
      tagsFor: name => (name === 'old' ? ['old@5.16.3'] : []),
      tagFormatFor: dir => expectedTagFormat(dir),
    }),
    []
  );
});

test('stops when NO package has a reachable tag, tags present or not', () => {
  // The predicate has to be the one the comparisons use. Guarding on whether
  // tags EXIST let a shallow clone through: `git fetch --tags` into a
  // `--depth 1` checkout leaves every tag present and none reachable, so the
  // existence guard passed, every package took the nothing-released exit, and
  // the run printed a tick having compared nothing.
  const shallow = run({
    packages: [pkg('5.15.0')],
    tags: {},
    anyTagsExist: true,
  });
  assert.equal(shallow.length, 1);
  // And it says WHICH of the two happened, because they want different fixes.
  assert.match(shallow[0], /none of them is reachable/);
  assert.match(shallow[0], /shallow/);

  const bare = run({
    packages: [pkg('5.15.0')],
    tags: {},
    anyTagsExist: false,
  });
  assert.equal(bare.length, 1);
  assert.match(bare[0], /no tags at all/);
});

test('flags a tagFormat present in a form it cannot read', () => {
  // Distinct from having no release config. Collapsed together, a
  // backtick-spelled format produced no entry, read as "no config", and
  // exempted the package — the opposite of what reading the format is for.
  const problems = findVersionRegressions({
    packages: [{ dir: 'a', name: 'a', version: '1.0.0' }],
    anyTagsExist: true,
    tagsFor: () => ['a@2.0.0'],
    tagFormatFor: () => UNREADABLE,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /cannot read/);
  assert.doesNotMatch(problems[0], /BELOW/);
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

test('the tag strings are what git and semantic-release actually use', () => {
  // Spelled out rather than derived. `run()` below hands the check its own
  // `expectedTagFormat`, so every other test compares the function with itself
  // and cannot see it change; and `tagGlob` builds the real
  // `git tag --merged HEAD --list` pattern, so a wrong one matches nothing,
  // takes the no-tags-for-this-package exit, and prints a tick with the gate
  // entirely off.
  assert.equal(expectedTagFormat('@scope/pkg'), '@scope/pkg@${version}');
  assert.equal(tagGlob('@scope/pkg'), '@scope/pkg@*');
});

test('every real release config spells the tagFormat this check assumes', async () => {
  // Against the REAL configs, loaded rather than pattern-matched, which is the
  // shape publishable-manifests uses for the same reason: the check derives tag
  // names from the package name, so a package that adopts another format would
  // match no tags and be exempted in silence. Here that fails a test instead.
  const { packages } = await publishablePackages(REPO);
  assert.ok(packages.length >= 4, 'no publishable packages were found');
  let configs = 0;
  for (const pkg of packages) {
    let text;
    try {
      text = await readFile(join(REPO, pkg.dir, 'release.config.js'), 'utf8');
    } catch {
      continue;
    }
    configs += 1;
    const declared = /tagFormat:\s*'([^']*)'/.exec(text);
    assert.ok(declared, `${pkg.dir}/release.config.js declares no tagFormat`);
    assert.equal(
      declared[1],
      expectedTagFormat(pkg.name),
      `${pkg.dir} tags its releases differently from what this check looks for`
    );
  }
  assert.ok(configs >= 4, `only ${configs} release configs were read`);
});

test('reports every package that regressed, not just the first', () => {
  // The motivating shape is multi-package: one `git reset --soft` re-stages
  // EVERY manifest it touches. A check that reported one would have a
  // contributor fix it, re-run, and meet the next — so the aggregation is the
  // thing this rule exists to do, and it needs pinning as much as the
  // comparison does.
  const problems = findVersionRegressions({
    packages: [
      { dir: 'a', name: 'a', version: '1.0.0' },
      { dir: 'b', name: 'b', version: '2.0.0' },
      { dir: 'c', name: 'c', version: '3.0.0' },
    ],
    anyTagsExist: true,
    tagsFor: name => [`${name}@9.9.9`],
    tagFormatFor: dir => expectedTagFormat(dir),
  });
  assert.equal(problems.length, 3);
  // In package order, so the list reads the way the workspace does.
  assert.match(problems[0], /^a\/package\.json/);
  assert.match(problems[1], /^b\/package\.json/);
  assert.match(problems[2], /^c\/package\.json/);
});

test('mixes regressions with other problems rather than stopping at one', () => {
  const problems = findVersionRegressions({
    packages: [
      { dir: 'a', name: 'a', version: '1.0.0' },
      { dir: 'b', name: 'b', version: 'nightly' },
      { dir: 'c', name: 'c', version: '1.0.0' },
    ],
    anyTagsExist: true,
    tagsFor: name => [`${name}@2.0.0`],
    tagFormatFor: dir => (dir === 'c' ? 'v${version}' : expectedTagFormat(dir)),
  });
  assert.equal(problems.length, 3);
  assert.match(problems[0], /BELOW/);
  assert.match(problems[1], /nightly/);
  assert.match(problems[2], /tagFormat/);
});

test('--allow-untagged turns off this rule and nothing else', () => {
  const args = {
    packages: [{ dir: 'a', name: 'a', version: '0.1.0' }],
    tagsFor: () => [],
    tagFormatFor: () => expectedTagFormat('a'),
  };
  // Without it, the tagless repository is an error rather than a silent pass.
  assert.equal(
    findVersionRegressions({ ...args, anyTagsExist: false }).length,
    1
  );
  // With it, this rule stands down — an in-band remedy, which the other rules
  // in this file all have and this one did not.
  assert.deepEqual(
    findVersionRegressions({
      ...args,
      anyTagsExist: false,
      allowUntagged: true,
    }),
    []
  );
  // And it is not a blanket mute: with tags present it changes nothing.
  assert.equal(
    findVersionRegressions({
      packages: [{ dir: 'a', name: 'a', version: '0.1.0' }],
      anyTagsExist: true,
      allowUntagged: true,
      tagsFor: () => ['a@0.2.0'],
      tagFormatFor: () => expectedTagFormat('a'),
    }).length,
    1
  );
});

test('a failed tag lookup is not an empty answer', () => {
  // Collapsed into `[]` a failed `git tag --merged` read as "never released",
  // which exempted that one package while the run still printed a tick. The
  // failure has to reach the runner, so nothing here may catch it.
  assert.throws(
    () =>
      findVersionRegressions({
        packages: [{ dir: 'a', name: 'a', version: '1.0.0' }],
        anyTagsExist: true,
        tagsFor: () => {
          throw new Error('git tag --merged failed for a');
        },
        tagFormatFor: dir => expectedTagFormat(dir),
      }),
    /git tag --merged failed/
  );
});

test('compares numeric identifiers without losing precision', () => {
  // `Number` loses precision past 2^53, and the answer it produced was EQUAL —
  // the one answer that matters, because a manifest matching the highest tag is
  // what this check waves through. Digit strings compare by length then
  // lexically, which is what semver means by "numerically".
  assert.ok(
    compareVersions('9007199254740992.0.0', '9007199254740993.0.0') < 0
  );
  assert.ok(
    compareVersions('1.0.0-9007199254740992', '1.0.0-9007199254740993') < 0
  );
  // Length before lexical order, or `9` would sort above `10`.
  assert.ok(compareVersions('9.0.0', '10.0.0') < 0);
  assert.ok(compareVersions('1.0.0-9', '1.0.0-10') < 0);
  // Leading zeros are discounted rather than compared as text.
  assert.equal(compareVersions('1.0.0-01', '1.0.0-1'), 0);
  assert.ok(compareVersions('1.0.0-02', '1.0.0-10') < 0);
});
