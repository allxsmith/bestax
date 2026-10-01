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

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  changelogSections,
  compareVersions,
  expectedTagFormat,
  findVersionRegressions,
  tagGlob,
  UNREADABLE,
  UNREADABLE_CHANGELOG,
  loadChangelog,
  loadTagFormat,
  versionRegressionProblems,
} from './lib/version-regression.mjs';
import { publishablePackages } from './check-conformance.mjs';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

// A changelog with a section for each version given, the way `loadChangelog`
// hands one over.
const sections = (...versions) => ({
  versions: new Set(versions),
  released: new Set(versions),
  unread: new Map(),
  mentioned: new Map(),
});
const versionOf = tag => tag.slice(tag.lastIndexOf('@') + 1);

const run = ({
  packages,
  tags = {},
  anyTagsExist = true,
  formats = {},
  changelogs = {},
} = {}) =>
  findVersionRegressions({
    packages,
    anyTagsExist,
    tagsFor: name => tags[name] ?? [],
    tagFormatFor: dir =>
      dir in formats ? formats[dir] : expectedTagFormat(packages[0].name),
    // Unless a case says otherwise, every tagged version still has its
    // section, so a case about something else is not also a case about this.
    changelogFor: dir =>
      dir in changelogs
        ? changelogs[dir]
        : sections(
            ...(tags[packages.find(p => p.dir === dir).name] ?? []).map(
              versionOf
            )
          ),
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
  // The shape that matters here: the placeholder a hand-published first
  // version carries.
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
  // to regress against. The shape is a placeholder with no tag, beside
  // packages that have them.
  assert.deepEqual(
    findVersionRegressions({
      packages: [
        { dir: 'new', name: 'new', version: '0.0.0-development' },
        { dir: 'old', name: 'old', version: '5.16.3' },
      ],
      anyTagsExist: true,
      tagsFor: name => (name === 'old' ? ['old@5.16.3'] : []),
      tagFormatFor: dir => expectedTagFormat(dir),
      // `new` has no changelog either, which is what makes its missing tag an
      // answer rather than a lost one.
      changelogFor: dir => (dir === 'old' ? sections('5.16.3') : null),
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
    changelogFor: () => sections('2.0.0'),
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /could not be read/);
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
  // If a placeholder is ever left in place after a real release, that is the
  // same regression wearing different clothes.
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
    changelogFor: () => sections('1.0.0'),
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
  // Against the REAL configs, through the SAME reader the build uses. That is
  // deliberate and it is also the limit of this case: a config that fools the
  // reader fools this too, so what it pins is that the five real configs are
  // spelled the way the check assumes — not that the reader cannot be fooled.
  // The decoy cases below are what hold that, and they are where to add one if
  // a new shape turns up.
  const { packages } = await publishablePackages(REPO);
  assert.ok(packages.length >= 4, 'no publishable packages were found');
  const importReal = dir =>
    import(pathToFileURL(join(REPO, dir, 'release.config.js')).href);
  let configs = 0;
  for (const pkg of packages) {
    // Through the SAME loader the build uses.
    const declared = await loadTagFormat(pkg.dir, importReal);
    if (declared === null) continue;
    configs += 1;
    assert.notEqual(
      declared,
      UNREADABLE,
      `${pkg.dir}/release.config.js declares no tagFormat this can read`
    );
    assert.equal(
      declared,
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
    changelogFor: () => sections('9.9.9'),
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
    changelogFor: () => sections('2.0.0'),
  });
  assert.equal(problems.length, 3);
  // Contract violations first, then the comparisons. The tagFormat rule is
  // about SOURCE and it gates whether a comparison can be trusted at all, so it
  // is answered before anything reads the environment — which is also what
  // keeps `--allow-untagged` from muting it.
  assert.match(problems[0], /tagFormat/);
  assert.match(problems[1], /BELOW/);
  assert.match(problems[2], /nightly/);
});

test('--allow-untagged mutes the environment stop, never the contract', () => {
  // The hatch is for a state nobody can fix by editing a file. A `tagFormat`
  // that this cannot read is exactly the opposite, and it was being muted along
  // with the stop — in precisely the situation the hatch exists for, so it
  // would have been muted for the people most likely to pass it.
  // Two packages, so one is still comparable and the environment stop is
  // genuinely reached rather than short-circuited.
  const args = {
    packages: [
      { dir: 'a', name: 'a', version: '1.0.0' },
      { dir: 'b', name: 'b', version: '1.0.0' },
    ],
    anyTagsExist: true,
    tagsFor: () => [],
    tagFormatFor: dir => (dir === 'a' ? 'v${version}' : expectedTagFormat('b')),
    changelogFor: () => null,
  };
  const stopped = findVersionRegressions(args);
  assert.equal(stopped.length, 2);
  assert.match(stopped[0], /tagFormat/);
  // Partial, because `a` was excluded by the contract — so the stop says the
  // excluded package may be where the tags are, rather than blaming the clone.
  assert.match(stopped[1], /the ones excluded above may be where the tags are/);

  // The hatch takes the stop and leaves the contract violation standing.
  const muted = findVersionRegressions({ ...args, allowUntagged: true });
  assert.equal(muted.length, 1);
  assert.match(muted[0], /tagFormat/);
});

test('a package excluded by the contract is not also called unreachable', () => {
  // When the contract rules out every package there is nothing left to compare,
  // so the environment stop is moot and saying it too would send someone after
  // their clone instead of the config in front of them.
  const problems = findVersionRegressions({
    packages: [{ dir: 'a', name: 'a', version: '1.0.0' }],
    anyTagsExist: true,
    tagsFor: () => [],
    tagFormatFor: () => 'v${version}',
    changelogFor: () => null,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /tagFormat/);
});

test('an unborn HEAD is its own state, not a shallow clone', () => {
  // `git tag --merged HEAD` fails outright here, which the reader treats as an
  // error rather than an empty answer — correct, but it threw before the flag
  // was ever read. Asked as a state, it gets its own message and the hatch
  // works.
  const args = {
    packages: [{ dir: 'a', name: 'a', version: '1.0.0' }],
    anyTagsExist: true,
    headExists: false,
    tagsFor: () => {
      throw new Error('git tag --merged failed for a');
    },
    tagFormatFor: dir => expectedTagFormat(dir),
    changelogFor: () => null,
  };
  const problems = findVersionRegressions(args);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /HEAD names no commit/);
  assert.doesNotMatch(problems[0], /shallow/);
  assert.deepEqual(
    findVersionRegressions({ ...args, allowUntagged: true }),
    []
  );
});

test('an empty package list is reported, not passed', () => {
  // It used to error, and correcting the WORDING deleted the answer with the
  // message. No publishable package at all means the list this reads was not
  // built, which is a workspace problem — and a tick says the opposite. Only
  // `--only=version-regression` saw the silence, because a full run reds the
  // same state through `release-docs-sync`.
  const problems = findVersionRegressions({
    packages: [],
    anyTagsExist: true,
    tagsFor: () => [],
    tagFormatFor: () => null,
    changelogFor: () => null,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no publishable packages/);
  // And it does NOT blame the checkout for it.
  assert.doesNotMatch(problems[0], /what a shallow clone looks like/);
});

test('does not blame the checkout when the contract excluded the tagged packages', () => {
  // The excluded package may be the one holding the reachable tags, so the
  // shallow-clone wording would be false about a checkout that demonstrably is
  // not one.
  const problems = findVersionRegressions({
    packages: [
      { dir: 'a', name: 'a', version: '1.0.0' },
      { dir: 'b', name: 'b', version: '1.0.0' },
    ],
    anyTagsExist: true,
    tagsFor: name => (name === 'a' ? ['a@2.0.0'] : []),
    tagFormatFor: dir => (dir === 'a' ? 'v${version}' : expectedTagFormat('b')),
    changelogFor: () => null,
  });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /tagFormat/);
  assert.match(
    problems[1],
    /the ones excluded above may be where the tags are/
  );
  // Not `/shallow/`: the remediation text names `--unshallow`, so what this
  // asserts is the absence of the CLAIM, not of the word.
  assert.doesNotMatch(problems[1], /what a shallow clone looks like/);
});

test('--allow-untagged turns off this rule and nothing else', () => {
  const args = {
    packages: [{ dir: 'a', name: 'a', version: '0.1.0' }],
    tagsFor: () => [],
    tagFormatFor: () => expectedTagFormat('a'),
    changelogFor: () => null,
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
      changelogFor: () => sections('0.2.0'),
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
        changelogFor: () => null,
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

test('a skipped manifest counts toward the partial diagnosis', () => {
  // `partial` decides whether the stop blames the checkout. It was written
  // against the contract's exclusions, and the same commit opened a second
  // channel it could not see: a manifest unreadable or nameless never becomes
  // a package at all, so it may be exactly where the reachable tags are — and
  // answering that with "shallow clone, run --unshallow" is both wrong and
  // inert.
  const args = {
    packages: [{ dir: 'a', name: 'a', version: '1.0.0' }],
    anyTagsExist: true,
    tagsFor: () => [],
    tagFormatFor: dir => expectedTagFormat(dir),
    changelogFor: () => null,
  };
  // No skipped manifests: every package this knows about is comparable, so a
  // checkout diagnosis is the honest one.
  const whole = findVersionRegressions(args);
  assert.equal(whole.length, 1);
  assert.match(whole[0], /what a shallow clone looks like/);

  // One skipped: the tags may be there, so the message stops blaming the clone.
  const partial = findVersionRegressions({ ...args, skippedCount: 1 });
  assert.equal(partial.length, 1);
  assert.match(partial[0], /the ones excluded above may be where the tags are/);
  assert.doesNotMatch(partial[0], /what a shallow clone looks like/);
});

test('an unreadable git is an environment stop like the others', () => {
  // It used to short-circuit in the WIRING, before the contract loop ran at
  // all — so letting the hatch reach it handed it the contract too, two rounds
  // after that exact bug was fixed inside this function. Every environment
  // answer belongs here, behind the contract, or the next one reopens it.
  const args = {
    packages: [
      { dir: 'a', name: 'a', version: '1.0.0' },
      { dir: 'b', name: 'b', version: '1.0.0' },
    ],
    anyTagsExist: false,
    tagsReadable: false,
    tagsFor: () => [],
    tagFormatFor: dir => (dir === 'a' ? 'v${version}' : expectedTagFormat('b')),
    changelogFor: () => null,
  };
  const stopped = findVersionRegressions(args);
  assert.equal(stopped.length, 2);
  assert.match(stopped[0], /tagFormat/);
  assert.match(stopped[1], /`git tag` failed/);

  // The hatch takes the environment stop and leaves the contract standing.
  const muted = findVersionRegressions({ ...args, allowUntagged: true });
  assert.equal(muted.length, 1);
  assert.match(muted[0], /tagFormat/);
});

// A release config as the loader sees it: an evaluated module, not text.
const config = tagFormat => () => Promise.resolve({ default: { tagFormat } });
const noConfig = () => {
  const error = new Error('not found');
  error.code = 'ERR_MODULE_NOT_FOUND';
  return Promise.reject(error);
};
// A changelog as the wiring reads it: the text of the file.
const changelog =
  (...versions) =>
  () =>
    Promise.resolve(versions.map(v => `# ${v} (2026-01-01)\n`).join('\n'));
const noChangelog = () => {
  const error = new Error('not found');
  error.code = 'ENOENT';
  return Promise.reject(error);
};

test('loadTagFormat reads what the config declares, however it is written', async () => {
  // The MODULE, not its text. Two rounds of pattern-matching over the file
  // could not see any of these, and each read wrong SILENTLY: a computed or
  // quoted key has no `tagFormat:` to match, a spread puts the declaration in
  // another file entirely, and a concatenation has one mention and one literal
  // that is not the value.
  const load = tagFormat => loadTagFormat('pkg', config(tagFormat));
  assert.equal(await load('pkg@${version}'), 'pkg@${version}');
  // Whatever the expression evaluates to is what the release will use, so it is
  // what this must compare — including a value no literal in the file spells.
  assert.equal(await load('pkg@${version}' + '-rc'), 'pkg@${version}-rc');
});

test('loadTagFormat tells absent from unusable', async () => {
  // Absent is not this check's business; anything else is a violation rather
  // than an exemption, because an exemption is the failure this rule exists to
  // prevent.
  assert.equal(await loadTagFormat('pkg', noConfig), null);
  assert.equal(
    await loadTagFormat('pkg', () => Promise.resolve({ default: {} })),
    UNREADABLE
  );
  // Declared, but not a string: a function, a template built at call time.
  assert.equal(
    await loadTagFormat('pkg', () =>
      Promise.resolve({ default: { tagFormat: () => 'x' } })
    ),
    UNREADABLE
  );
  // A config that throws on import — a syntax error, a bad require — must not
  // throw out of the middle of the run.
  assert.equal(
    await loadTagFormat('pkg', () => Promise.reject(new SyntaxError('boom'))),
    UNREADABLE
  );
  // No default export at all.
  assert.equal(
    await loadTagFormat('pkg', () => Promise.resolve({})),
    UNREADABLE
  );
});

test('the contract is answered before any environment state, through the wiring', async () => {
  // THE invariant, and the reason this path is drivable at all. It was broken
  // three times — once by ordering, twice by a caller returning first — and
  // each fix was local to the shape in front of it. Ordering inside
  // `findVersionRegressions` cannot enforce it while a caller may return
  // early, so the whole path is exercised here rather than the half of it that
  // was already pinned.
  const packages = [
    { dir: 'a', name: 'a', version: '1.0.0' },
    { dir: 'b', name: 'b', version: '1.0.0' },
  ];
  // git answers nothing at all: the most tempting place to return early.
  const problems = await versionRegressionProblems({
    packages,
    git: () => null,
    importConfig: dir =>
      Promise.resolve({
        default: { tagFormat: dir === 'a' ? 'v${version}' : 'b@${version}' },
      }),
    readChangelog: noChangelog,
  });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /tagFormat/);
  assert.match(problems[1], /`git tag` failed/);

  // And the hatch takes the environment answer while the contract stands.
  const muted = await versionRegressionProblems({
    packages,
    allowUntagged: true,
    git: () => null,
    importConfig: dir =>
      Promise.resolve({
        default: { tagFormat: dir === 'a' ? 'v${version}' : 'b@${version}' },
      }),
    readChangelog: noChangelog,
  });
  assert.equal(muted.length, 1);
  assert.match(muted[0], /tagFormat/);
});

test('a skipped manifest is reported and counted by the wiring', async () => {
  // `unnamed` and `unreadable` both arrive as `skipped`. Reported, and counted
  // toward the partial diagnosis so the stop does not blame the checkout for
  // tags a manifest this could not read may be holding.
  const problems = await versionRegressionProblems({
    packages: [{ dir: 'a', name: 'a', version: '1.0.0' }],
    skipped: ['nameless'],
    git: args => (args[1] === '--list' ? 'a@2.0.0\n' : ''),
    importConfig: config('a@${version}'),
    readChangelog: noChangelog,
  });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /nameless\/package\.json/);
  assert.match(
    problems[1],
    /the ones excluded above may be where the tags are/
  );
});

test('the wiring compares, and flags a real regression end to end', async () => {
  const problems = await versionRegressionProblems({
    packages: [{ dir: 'a', name: 'a', version: '5.15.0' }],
    git: args =>
      args[1] === '--list'
        ? 'a@5.16.3\n'
        : args[0] === 'rev-parse'
          ? 'sha\n'
          : 'a@5.16.3\n',
    importConfig: config('a@${version}'),
    readChangelog: changelog('5.16.3'),
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /BELOW `5\.16\.3`/);

  // A missing release config is not this check's business.
  const absent = await versionRegressionProblems({
    packages: [{ dir: 'a', name: 'a', version: '5.16.3' }],
    git: args =>
      args[1] === '--list'
        ? 'a@5.16.3\n'
        : args[0] === 'rev-parse'
          ? 'sha\n'
          : 'a@5.16.3\n',
    importConfig: noConfig,
    readChangelog: changelog('5.16.3'),
  });
  assert.deepEqual(absent, []);
});

test('the wiring maps git onto the questions the rule asks', async () => {
  // The mapping is drivable and was undriven, so four clauses in it survived
  // mutation — two of them drop-in reverts of fixes from earlier rounds. Each
  // assertion below names the clause it holds.
  const packages = [{ dir: 'a', name: 'a', version: '1.0.0' }];

  const calls = [];
  const git = args => {
    calls.push(args.join(' '));
    if (args[1] === '--list' && args.length === 2) return 'a@1.0.0\n';
    if (args[0] === 'rev-parse') return 'deadbeef\n';
    return 'a@1.0.0\n';
  };
  assert.deepEqual(
    await versionRegressionProblems({
      packages,
      git,
      importConfig: config('a@${version}'),
      readChangelog: changelog('1.0.0'),
    }),
    []
  );
  // `tagGlob` is what makes the per-package lookup select that package's tags.
  assert.ok(
    calls.some(c => c === 'tag --merged HEAD --list a@*'),
    `the tag lookup did not use the package glob: ${calls.join(' | ')}`
  );
  // PEELED. `--verify HEAD` resolves a ref without proving the object exists,
  // which answered yes on a corrupt store and then threw past every flag read.
  assert.ok(
    calls.includes('rev-parse --verify HEAD^{commit}'),
    `HEAD was not peeled to a commit: ${calls.join(' | ')}`
  );

  // A FAILED per-package lookup is not an empty answer. Collapsed to `[]` it
  // read as "never released" and exempted that package while the run ticked.
  await assert.rejects(
    versionRegressionProblems({
      packages,
      importConfig: config('a@${version}'),
      readChangelog: changelog('1.0.0'),
      git: args =>
        args[1] === '--list' && args.length === 2
          ? 'a@1.0.0\n'
          : args[0] === 'rev-parse'
            ? 'x\n'
            : null,
    }),
    /git tag --merged failed/
  );

  // Tags exist but none is reachable: the shallow-clone shape, which must be
  // told apart from having no tags at all.
  const shallow = await versionRegressionProblems({
    packages,
    importConfig: config('a@${version}'),
    readChangelog: changelog('1.0.0'),
    git: args =>
      args[1] === '--list' && args.length === 2
        ? 'a@9.9.9\n'
        : args[0] === 'rev-parse'
          ? 'x\n'
          : '',
  });
  assert.equal(shallow.length, 1);
  assert.match(shallow[0], /none of them is reachable/);
});

test('only an ABSENT release config is exempt, not an unreadable one', async () => {
  // Pinned on the absent side only, so deleting the discrimination — and
  // exempting a package over a permissions error — kept the suite green.
  const packages = [{ dir: 'a', name: 'a', version: '1.0.0' }];
  const git = args =>
    args[1] === '--list' && args.length === 2
      ? 'a@1.0.0\n'
      : args[0] === 'rev-parse'
        ? 'x\n'
        : 'a@1.0.0\n';

  const absent = await versionRegressionProblems({
    packages,
    git,
    importConfig: noConfig,
    readChangelog: changelog('1.0.0'),
  });
  assert.deepEqual(absent, []);

  const unreadable = await versionRegressionProblems({
    packages,
    git,
    importConfig: () => Promise.reject(new SyntaxError('boom')),
    readChangelog: changelog('1.0.0'),
  });
  assert.equal(unreadable.length, 1);
  assert.match(unreadable[0], /could not be read/);
});

test('a nameless manifest is produced as its own channel', async () => {
  // The CONSUMER was pinned and the producer was not, so the old predicate
  // stayed a drop-in revert: it dropped a nameless package on the floor and
  // nothing noticed.
  const root = mkdtempSync(join(tmpdir(), 'unnamed-'));
  writeFileSync(
    join(root, 'pnpm-workspace.yaml'),
    'packages:\n  - good\n  - nameless\n  - hidden\n'
  );
  for (const [dir, body] of [
    ['good', '{"name":"good","version":"1.0.0"}'],
    ['nameless', '{"version":"1.0.0"}'],
    ['hidden', '{"private":true}'],
  ]) {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, 'package.json'), body);
  }
  const { packages, unreadable, unnamed } = await publishablePackages(root);
  assert.deepEqual(
    packages.map(p => p.dir),
    ['good']
  );
  assert.deepEqual(unreadable, []);
  // Private is a deliberate choice and stays quiet; nameless is a broken
  // manifest wearing the same clothes.
  assert.deepEqual(unnamed, ['nameless']);
});

test('changelogSections reads every heading shape the release tooling writes', () => {
  const lines = [
    // The title line the oldest bulma-ui sections sit under: not a release.
    '# @allxsmith/bestax-bulma',
    '',
    // A minor or major.
    '# [5.18.0](https://github.com/o/r/compare/p@5.17.0...p@5.18.0) (2026-09-29)',
    '',
    '### Features',
    '',
    '* **x:** a change',
    // A patch, one level down.
    '## [5.17.1](https://github.com/o/r/compare/p@5.17.0...p@5.17.1) (2026-09-27)',
    // A prerelease.
    '# [5.17.0-rc.1](https://github.com/o/r/compare/p@5.16.0...p@5.17.0-rc.1) (2026-09-20)',
    // A first release, with nothing to compare against.
    '# 1.0.0 (2025-10-03)',
    // Before semantic-release: a bare version and no date.
    '## 0.9.0',
  ];
  const expected = ['0.9.0', '1.0.0', '5.17.0-rc.1', '5.17.1', '5.18.0'];
  const read = changelogSections(lines.join('\n'));
  assert.deepEqual([...read.versions].sort(), expected);
  // And none of them is left over as a shape it does not know.
  assert.deepEqual([...read.unread.keys()], []);
  // A checkout with CRLF line endings reads the same, rather than reading
  // nothing and calling every section missing.
  assert.deepEqual(
    [...changelogSections(lines.join('\r\n')).versions].sort(),
    expected
  );
});

test('changelogSections reads nothing looser than a section heading', () => {
  // Release notes carry commit bodies verbatim, so any of these can turn up in
  // a changelog, and reading one as a section would pass a file whose real
  // section is gone.
  const stray = [
    '### 1.0.0',
    '#1.0.0',
    '# 1.0.0 was the last good release',
    '# 1.0.0 (last week)',
    '# [1.0.0](a link with spaces) (2026-01-01)',
    '  # 1.0.0 (2026-01-01)',
    '* 1.0.0 (2026-01-01)',
    '# v1.0.0 (2026-01-01)',
    '# 1.0 (2026-01-01)',
  ];
  assert.deepEqual([...changelogSections(stray.join('\n')).versions], []);
});

test('a bare heading is a section, but not evidence of a release', () => {
  // A new package's author seeding its changelog by hand writes exactly the
  // bare shape the oldest bulma-ui sections carry. Read as a release, it would
  // stop a package that has never released, for want of a tag it cannot have.
  const seeded = changelogSections('# Changelog\n\n## 0.1.0\n\n* first cut\n');
  assert.deepEqual([...seeded.versions], ['0.1.0']);
  assert.deepEqual([...seeded.released], []);
  // A shape the parser knows, so not reported as one to teach it either.
  assert.deepEqual([...seeded.unread.keys()], []);
  // What a release writes, with a link or a date, is evidence either way.
  const written = changelogSections(
    '# [1.1.0](https://x.test/compare) (2026-10-02)\n\n# 1.0.0 (2026-10-01)\n\n## 0.1.0\n'
  );
  assert.deepEqual([...written.released].sort(), ['1.0.0', '1.1.0']);
});

test('a bare heading holds its tagged version like any other section', () => {
  // bulma-ui's releases from before semantic-release are tagged and headed
  // bare, and removing one of those is the same damage as any other.
  const text = [
    '# [1.1.0](https://x.test/compare) (2026-01-02)',
    '',
    '# @allxsmith/bestax-bulma',
    '',
    '## 1.0.1',
    '',
    '## 1.0.0',
  ].join('\n');
  const tags = { 'pkg-a': ['pkg-a@1.0.0', 'pkg-a@1.0.1', 'pkg-a@1.1.0'] };
  assert.deepEqual(
    run({
      packages: [pkg('1.1.0')],
      tags,
      changelogs: { 'pkg-a': changelogSections(text) },
    }),
    []
  );
  const gone = run({
    packages: [pkg('1.1.0')],
    tags,
    changelogs: { 'pkg-a': changelogSections(text.replace('## 1.0.1', '')) },
  });
  assert.equal(gone.length, 1);
  assert.match(gone[0], /no section for `1\.0\.1`/);
});

test('changelogSections names a heading shape it does not know', () => {
  // The other half of being strict. A shape the tooling starts writing has to
  // surface as a shape, or the check reads it as a deletion and sends someone
  // to restore a file that is not damaged. Each of these is a way the
  // installed templates vary the heading, or a `v` in front of the version.
  const drifted = [
    // Deeper, which is what a preset picking depth differently produces.
    ['### [1.2.3](https://x.test/compare) (2026-01-01)', '1.2.3'],
    ['#### 1.2.4', '1.2.4'],
    // A `v` in front, bare or linked.
    ['# v1.2.5 (2026-01-01)', '1.2.5'],
    ['## [v1.2.6](https://x.test/compare) (2026-01-01)', '1.2.6'],
    // A configured release title.
    ['# [1.3.0](https://x.test/compare) "Codename" (2026-01-01)', '1.3.0'],
    // The writer's default template for a patch.
    ['## <small>1.3.1 (2026-01-01)</small>', '1.3.1'],
    // Another date format.
    ['## [1.3.2](https://x.test/compare) (1 Jan 2026)', '1.3.2'],
    // Indented, which Markdown still renders as a heading.
    ['   ## 1.3.3 (2026-01-01)', '1.3.3'],
  ];
  for (const [line, version] of drifted) {
    const read = changelogSections(line);
    assert.deepEqual([...read.versions], [], `read as a section: ${line}`);
    assert.equal(read.unread.get(version), line.trim(), `not named: ${line}`);
  }
  // A heading that is not a release stays out of it, version or not.
  const plain = changelogSections(
    '### Bug Fixes\n\n### BREAKING CHANGES\n\n### Migrating to 5.0.0\n'
  );
  assert.deepEqual([...plain.unread.keys()], []);
});

test('every real changelog reads as the sections its headings name', async () => {
  // Against the REAL files, through the SAME loader the check uses. A heading
  // read loosely that the parser does not accept is a shape to teach it, and
  // this says so in any checkout. CI runs the check before this suite, so the
  // check's own message has to say it too, which a case below pins.
  const { packages } = await publishablePackages(REPO);
  const read = dir => readFile(join(REPO, dir, 'CHANGELOG.md'), 'utf8');
  const unreadIn = changelog => [...changelog.unread.values()];
  let released = 0;
  for (const pkg of packages) {
    const changelog = await loadChangelog(pkg.dir, read);
    // No changelog yet is a package that has not released.
    if (changelog === null) continue;
    assert.notEqual(
      changelog,
      UNREADABLE_CHANGELOG,
      `${pkg.dir}/CHANGELOG.md could not be read`
    );
    assert.deepEqual(
      unreadIn(changelog),
      [],
      `${pkg.dir}/CHANGELOG.md has a version heading that SECTION_HEADING in ` +
        'scripts/lib/version-regression.mjs does not accept. Nothing was ' +
        'deleted: teach the pattern that shape.'
    );
    if (!changelog.versions.size) continue;
    released += 1;
    // And the guard can fail on this very file: its newest heading moved a
    // level down, the drift a preset change would bring, is found.
    const drifted = (await read(pkg.dir)).replace(/^#{1,2} (?=\[?\d)/m, '### ');
    assert.equal(
      unreadIn(changelogSections(drifted)).length,
      1,
      `a drifted heading in ${pkg.dir}/CHANGELOG.md went unnoticed`
    );
  }
  assert.ok(released > 0, 'no real changelog had a section this could read');
});

test('flags a tagged version whose changelog section is gone', () => {
  // The shape the manifest comparison cannot see (#711). A partial revert
  // deletes released sections and leaves the version alone, so the manifest
  // sits level with the highest tag and passes.
  const problems = run({
    packages: [pkg('5.16.3')],
    tags: { 'pkg-a': ['pkg-a@5.16.0', 'pkg-a@5.16.1', 'pkg-a@5.16.3'] },
    changelogs: { 'pkg-a': sections('5.16.3', '5.16.0') },
  });
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /^pkg-a\/CHANGELOG\.md has no section for `5\.16\.1`,/
  );
  // It names where the section still is, since nothing rebuilds it.
  assert.match(problems[0], /git show pkg-a@5\.16\.1:pkg-a\/CHANGELOG\.md/);
  assert.doesNotMatch(problems[0], /BELOW/);
});

test('asks only that each tagged section is present', () => {
  // Order and wording are not this check's business, and neither is a section
  // with no tag behind it. Through the real parser: sections out of order, a
  // body rewritten, and an untagged extra all pass.
  const text = [
    '## [5.16.1](https://example.test/compare) (2026-01-02)',
    '',
    '* reworded by hand',
    '',
    '# [5.17.0](https://example.test/compare) (2026-01-09)',
    '',
    '# [5.16.0](https://example.test/compare) (2026-01-01)',
  ].join('\n');
  assert.deepEqual(
    run({
      packages: [pkg('5.16.1')],
      tags: { 'pkg-a': ['pkg-a@5.16.0', 'pkg-a@5.16.1'] },
      changelogs: { 'pkg-a': changelogSections(text) },
    }),
    []
  );
});

test('reports every missing section, one problem per package', () => {
  const tags = {
    a: ['a@1.0.0', 'a@1.1.0', 'a@1.2.0'],
    b: ['b@2.0.0'],
    c: ['c@3.0.0'],
  };
  const problems = findVersionRegressions({
    packages: [
      { dir: 'a', name: 'a', version: '1.2.0' },
      { dir: 'b', name: 'b', version: '2.0.0' },
      { dir: 'c', name: 'c', version: '3.0.0' },
    ],
    anyTagsExist: true,
    tagsFor: name => tags[name],
    tagFormatFor: dir => expectedTagFormat(dir),
    changelogFor: dir =>
      ({ a: sections('1.2.0'), b: sections('2.0.0'), c: sections() })[dir],
  });
  assert.equal(problems.length, 2);
  // Newest first, so the restore command names the release whose file holds
  // the most of what is missing.
  assert.match(
    problems[0],
    /^a\/CHANGELOG\.md has no section for `1\.1\.0`, `1\.0\.0`,/
  );
  assert.match(problems[0], /git show a@1\.1\.0:a\/CHANGELOG\.md/);
  assert.match(problems[1], /^c\/CHANGELOG\.md has no section for `3\.0\.0`/);

  // A long list is cut short rather than printed whole.
  const many = run({
    packages: [pkg('1.6.0')],
    tags: {
      'pkg-a': ['0', '1', '2', '3', '4', '5', '6'].map(n => `pkg-a@1.${n}.0`),
    },
    changelogs: { 'pkg-a': sections('1.6.0') },
  });
  assert.equal(many.length, 1);
  assert.match(
    many[0],
    /`1\.5\.0`, `1\.4\.0`, `1\.3\.0`, `1\.2\.0`, `1\.1\.0` and 1 more,/
  );
});

test('a deleted changelog is reported once, not per tag', () => {
  const problems = run({
    packages: [pkg('1.1.0')],
    tags: { 'pkg-a': ['pkg-a@1.0.0', 'pkg-a@1.1.0'] },
    changelogs: { 'pkg-a': null },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^pkg-a\/CHANGELOG\.md does not exist/);
  assert.match(problems[0], /git show pkg-a@1\.1\.0:pkg-a\/CHANGELOG\.md/);
});

test('holds the changelog even when the manifest cannot be compared', () => {
  // Two questions with two answers. An unreadable manifest used to end the
  // package's turn, which would have skipped its changelog with it.
  const unreadable = run({
    packages: [pkg('nightly')],
    tags: { 'pkg-a': ['pkg-a@1.0.0'] },
    changelogs: { 'pkg-a': sections() },
  });
  assert.equal(unreadable.length, 2);
  assert.match(unreadable[0], /nightly/);
  assert.match(unreadable[1], /no section for `1\.0\.0`/);

  // And the #705 shape, a whole older tree re-staged, gets both answers too.
  const reset = run({
    packages: [pkg('5.16.0')],
    tags: { 'pkg-a': ['pkg-a@5.16.0', 'pkg-a@5.16.1'] },
    changelogs: { 'pkg-a': sections('5.16.0') },
  });
  assert.equal(reset.length, 2);
  assert.match(reset[0], /BELOW `5\.16\.1`/);
  assert.match(reset[1], /no section for `5\.16\.1`/);
});

test('a released package with no reachable tag is stopped on its own', () => {
  // The limit #711 names. The stop above sums across packages, so a history
  // where only SOME packages lost their tags exempted those in silence. The
  // changelog tells a released package from a new one, because a release
  // writes its section in the commit its tag points at.
  const args = {
    packages: [
      { dir: 'a', name: 'a', version: '1.1.0' },
      { dir: 'b', name: 'b', version: '2.10.0' },
      // Never released: no changelog, one with no released section yet, or
      // one seeded by hand with a bare heading.
      { dir: 'c', name: 'c', version: '0.0.0-development' },
      { dir: 'd', name: 'd', version: '0.0.0-development' },
      { dir: 'f', name: 'f', version: '0.1.0' },
      // Excluded by the contract, which already says what to fix.
      { dir: 'e', name: 'e', version: '1.0.0' },
    ],
    anyTagsExist: true,
    tagsFor: name => (name === 'a' ? ['a@1.1.0'] : []),
    tagFormatFor: dir => (dir === 'e' ? 'v${version}' : expectedTagFormat(dir)),
    changelogFor: dir =>
      ({
        a: sections('1.1.0'),
        // Semver order, not the order they were read in or string order.
        b: sections('2.9.0', '2.10.0'),
        c: null,
        d: sections(),
        f: changelogSections('# Changelog\n\n## 0.1.0\n'),
        e: sections('1.0.0'),
      })[dir],
  };
  const problems = findVersionRegressions(args);
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^e\/release\.config\.js: tagFormat/);
  assert.match(
    problems[1],
    /^version-regression: this changelog records releases, but no tag of its package is reachable from HEAD/
  );
  assert.match(
    problems[1],
    /b\/CHANGELOG\.md \(releases up to `2\.10\.0`, no `b@\*` tag\)/
  );
  assert.doesNotMatch(problems[1], /[cdef]\/CHANGELOG\.md/);
  assert.match(problems[1], /--allow-untagged/);

  // An environment state, so the hatch takes it and leaves the contract.
  const muted = findVersionRegressions({ ...args, allowUntagged: true });
  assert.equal(muted.length, 1);
  assert.match(muted[0], /^e\/release\.config\.js: tagFormat/);
});

test('packages stopped for want of a tag are named in one message', () => {
  // A clone cut short loses the tags of every package that has not released
  // lately, all at once and for the same reason. One message per package said
  // the same long thing several times over.
  const problems = findVersionRegressions({
    packages: [
      { dir: 'a', name: 'a', version: '1.1.0' },
      { dir: 'b', name: 'b', version: '2.0.0' },
      { dir: 'c', name: 'c', version: '3.0.0' },
    ],
    anyTagsExist: true,
    tagsFor: name => (name === 'a' ? ['a@1.1.0'] : []),
    tagFormatFor: dir => expectedTagFormat(dir),
    changelogFor: dir =>
      ({ a: sections('1.1.0'), b: sections('2.0.0'), c: sections('3.0.0') })[
        dir
      ],
  });
  assert.equal(problems.length, 1);
  // Each package keeps its own facts, and the remedy is said once.
  assert.match(
    problems[0],
    /b\/CHANGELOG\.md \(releases up to `2\.0\.0`, no `b@\*` tag\); c\/CHANGELOG\.md \(releases up to `3\.0\.0`, no `c@\*` tag\)/
  );
  assert.equal(problems[0].match(/--allow-untagged/g).length, 1);
});

test('a heading in a shape the parser does not know is not called a deletion', () => {
  // What drift in the release tooling looks like to the check: the newest
  // release wrote its heading a level deeper, and every older section still
  // reads. Called a deletion, the message pointed at a restore that would
  // change nothing, and CI runs this check before the suite that says better.
  const text = [
    '### [5.17.0](https://x.test/compare) (2026-01-09)',
    '',
    '# [5.16.0](https://x.test/compare) (2026-01-01)',
  ].join('\n');
  const drift = run({
    packages: [pkg('5.17.0')],
    tags: { 'pkg-a': ['pkg-a@5.16.0', 'pkg-a@5.17.0'] },
    changelogs: { 'pkg-a': changelogSections(text) },
  });
  assert.equal(drift.length, 1);
  assert.match(
    drift[0],
    /^pkg-a\/CHANGELOG\.md has a heading for `5\.17\.0` that does not read as a released section: `### \[5\.17\.0\]/
  );
  assert.match(drift[0], /SECTION_HEADING/);
  assert.doesNotMatch(drift[0], /deleted since/);

  // Beside a real deletion, each gets its own answer.
  const both = run({
    packages: [pkg('5.17.0')],
    tags: { 'pkg-a': ['pkg-a@5.15.0', 'pkg-a@5.16.0', 'pkg-a@5.17.0'] },
    changelogs: { 'pkg-a': changelogSections(text) },
  });
  assert.equal(both.length, 2);
  assert.match(both[0], /heading for `5\.17\.0`/);
  assert.match(both[1], /no section for `5\.15\.0`, though its tag/);
});

test('a checkout with no reachable tag still gets one stop, not one per package', () => {
  // The whole clone is the problem there, and repeating it per package would
  // bury the one fix under copies of it.
  const problems = findVersionRegressions({
    packages: [
      { dir: 'a', name: 'a', version: '1.0.0' },
      { dir: 'b', name: 'b', version: '1.0.0' },
    ],
    anyTagsExist: true,
    tagsFor: () => [],
    tagFormatFor: dir => expectedTagFormat(dir),
    changelogFor: () => sections('1.0.0'),
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /what a shallow clone looks like/);
});

test('an unreadable changelog is a violation the hatch cannot mute', () => {
  // Distinct from having none. Read as absent, it would exempt a package from
  // every changelog question at once.
  const args = {
    packages: [
      { dir: 'a', name: 'a', version: '1.0.0' },
      { dir: 'b', name: 'b', version: '1.0.0' },
    ],
    anyTagsExist: false,
    tagsFor: () => [],
    tagFormatFor: dir => expectedTagFormat(dir),
    changelogFor: dir => (dir === 'a' ? UNREADABLE_CHANGELOG : null),
  };
  const stopped = findVersionRegressions(args);
  assert.equal(stopped.length, 2);
  assert.match(stopped[0], /^a\/CHANGELOG\.md exists but could not be read/);
  assert.match(stopped[1], /no tags at all/);
  const muted = findVersionRegressions({ ...args, allowUntagged: true });
  assert.equal(muted.length, 1);
  assert.match(muted[0], /^a\/CHANGELOG\.md exists but could not be read/);

  // With tags reachable it is said once, not again as every section missing.
  const tagged = findVersionRegressions({
    ...args,
    anyTagsExist: true,
    tagsFor: name => [`${name}@1.0.0`],
    changelogFor: dir =>
      dir === 'a' ? UNREADABLE_CHANGELOG : sections('1.0.0'),
  });
  assert.equal(tagged.length, 1);
  assert.match(tagged[0], /^a\/CHANGELOG\.md exists but could not be read/);
});

test('loadChangelog tells absent from unreadable', async () => {
  const failing = code => () =>
    Promise.reject(Object.assign(new Error(code), { code }));
  // No file is a package that has not released.
  assert.equal(await loadChangelog('pkg', noChangelog), null);
  // Anything else is not that, however it failed.
  assert.equal(
    await loadChangelog('pkg', failing('EISDIR')),
    UNREADABLE_CHANGELOG
  );
  assert.equal(
    await loadChangelog('pkg', failing('EACCES')),
    UNREADABLE_CHANGELOG
  );
  assert.equal(
    await loadChangelog('pkg', () => Promise.resolve(undefined)),
    UNREADABLE_CHANGELOG
  );
  assert.deepEqual(
    [...(await loadChangelog('pkg', changelog('1.0.0', '1.1.0'))).versions],
    ['1.0.0', '1.1.0']
  );
});

test('the wiring reads each changelog before git answers', async () => {
  const packages = [
    { dir: 'a', name: 'a', version: '1.1.0' },
    { dir: 'b', name: 'b', version: '1.0.0' },
  ];
  const importConfig = dir => config(`${dir}@\${version}`)();
  const unreadableA = dir =>
    dir === 'a'
      ? Promise.reject(Object.assign(new Error('EISDIR'), { code: 'EISDIR' }))
      : noChangelog();
  // git answers nothing: the tempting place to return early, and the file
  // problem must still be said, and said first.
  const problems = await versionRegressionProblems({
    packages,
    git: () => null,
    importConfig,
    readChangelog: unreadableA,
  });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^a\/CHANGELOG\.md exists but could not be read/);
  assert.match(problems[1], /`git tag` failed/);
  const muted = await versionRegressionProblems({
    packages,
    allowUntagged: true,
    git: () => null,
    importConfig,
    readChangelog: unreadableA,
  });
  assert.equal(muted.length, 1);
  assert.match(muted[0], /^a\/CHANGELOG\.md exists but could not be read/);

  // End to end, through the real parser: each package's own file is read,
  // and a section removed from one is found.
  const read = [];
  const tags = { 'a@*': 'a@1.0.0\na@1.1.0\n', 'b@*': 'b@1.0.0\n' };
  const found = await versionRegressionProblems({
    packages,
    git: args =>
      args[0] === 'rev-parse'
        ? 'x\n'
        : args.length === 2
          ? `${tags['a@*']}${tags['b@*']}`
          : tags[args[args.length - 1]],
    importConfig,
    readChangelog: dir => {
      read.push(dir);
      return changelog(dir === 'a' ? '1.1.0' : '1.0.0')();
    },
  });
  assert.deepEqual(read, ['a', 'b']);
  assert.equal(found.length, 1);
  assert.match(found[0], /^a\/CHANGELOG\.md has no section for `1\.0\.0`/);
});

test('changelogSections names a heading-like line neither pattern reads', () => {
  // Past what VERSION_HEADING knows: markup it has never seen, or decoration
  // in front of the version. None is a section, and each is named, so the
  // check can say "heading shape" instead of "deleted".
  const shapes = [
    // An emoji, or emphasis, in front of the version.
    ['## 🚀 1.2.3 (2026-01-01)', '1.2.3'],
    ['## **1.2.4** (2026-01-01)', '1.2.4'],
    // HTML headings, with attributes and a link inside.
    ['<h2>1.2.5 (2026-01-01)</h2>', '1.2.5'],
    ['<h2 id="x"><a href="https://x.test">v1.2.6</a></h2>', '1.2.6'],
    // A pseudo-heading: no heading markup, but opening the way one does.
    ['**1.2.7** (2026-01-01)', '1.2.7'],
    ['🎉 1.2.8', '1.2.8'],
    // An emoji carrying a variation selector, which is not pictographic.
    ['❤️ 1.2.9', '1.2.9'],
  ];
  for (const [line, version] of shapes) {
    const read = changelogSections(line);
    assert.deepEqual([...read.versions], [], `read as a section: ${line}`);
    assert.deepEqual([...read.unread.keys()], [], `recognised: ${line}`);
    assert.equal(read.mentioned.get(version), line, `not named: ${line}`);
  }
  // Setext: text over an underline of either kind.
  for (const underline of ['===', '---']) {
    const read = changelogSections(`1.3.0 (2026-01-01)\n${underline}\n`);
    assert.equal(read.mentioned.get('1.3.0'), '1.3.0 (2026-01-01)');
  }
});

test('a version named in the body of another release is not a heading', () => {
  // The direction that would hide a deletion. If any of these counted,
  // removing the 5.17.0 section would read as a change of heading shape
  // rather than the damage it is.
  const body = [
    '* reverts 5.17.0 ([abc1234](https://x.test/commit/abc1234))',
    // A note's continuation line, which lands at column 0.
    '5.17.0 introduced a regression in the select',
    'See `5.17.0` for the original change.',
    // A list item over what would otherwise be a setext underline.
    '* 5.17.0 was reverted',
    '---',
    // A heading, but one that does not open with the version.
    '## Upgrading from 5.17.0',
  ];
  assert.deepEqual(
    [...changelogSections(body.join('\n')).mentioned.keys()],
    []
  );
  // A whole token only: a longer version is a different one, not this one.
  const longer = changelogSections(
    '## 🚀 15.17.0\n\n## 🚀 5.17.0-rc.1\n\n## 🚀 5.17.0.1\n'
  );
  assert.deepEqual([...longer.mentioned.keys()], ['15.17.0', '5.17.0-rc.1']);
});

test('a version only a heading-like line names is not called deleted', () => {
  // A shape neither pattern knows, with the older sections still reading:
  // what drift into it looks like. And beside it a version that only another
  // release's notes mention, whose section really is gone.
  const text = [
    '## 🚀 5.17.0 (2026-01-09)',
    '',
    '* reverts 5.15.0',
    '',
    '# [5.16.0](https://x.test/compare) (2026-01-01)',
  ].join('\n');
  const problems = run({
    packages: [pkg('5.17.0')],
    tags: { 'pkg-a': ['pkg-a@5.15.0', 'pkg-a@5.16.0', 'pkg-a@5.17.0'] },
    changelogs: { 'pkg-a': changelogSections(text) },
  });
  assert.equal(problems.length, 2);
  assert.match(
    problems[0],
    /^pkg-a\/CHANGELOG\.md names `5\.17\.0` in a line that looks like a heading, `## 🚀 5\.17\.0 \(2026-01-09\)`/
  );
  assert.match(problems[0], /neither `SECTION_HEADING` nor `VERSION_HEADING`/);
  assert.doesNotMatch(problems[0], /deleted since|git show/);
  assert.match(
    problems[1],
    /^pkg-a\/CHANGELOG\.md has no section for `5\.15\.0`, though its tag/
  );
});
