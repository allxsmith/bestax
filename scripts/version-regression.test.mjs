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
  compareVersions,
  expectedTagFormat,
  findVersionRegressions,
  tagGlob,
  UNREADABLE,
  loadTagFormat,
  versionRegressionProblems,
} from './lib/version-regression.mjs';
import { publishablePackages } from './check-conformance.mjs';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

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
  // to regress against. Every package in the repo has tags today, so this is
  // the shape the next new one arrives in rather than anything currently in
  // the tree — a placeholder with no tag, beside packages that have them.
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
  });
  assert.deepEqual(absent, []);

  const unreadable = await versionRegressionProblems({
    packages,
    git,
    importConfig: () => Promise.reject(new SyntaxError('boom')),
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
