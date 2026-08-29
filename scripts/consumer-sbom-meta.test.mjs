/**
 * Guards on the decision logic in consumer-sbom-meta.mjs.
 *
 * These tests carry an unusual amount of weight, because the code they cover
 * is almost entirely unverifiable any other way. `consumer-sbom` runs on
 * `release`, `schedule` and `workflow_dispatch` only, so no PR exercises it —
 * and the pinning path specifically fires ONLY on a real release event, which
 * means a dispatch cannot reach it either. There is no run to read. This file
 * is the coverage.
 *
 * Two assertions are load-bearing beyond their apparent size:
 *
 *   - the two-`@` scoped-package case. Three of the four packages are
 *     unscoped, so a lastIndexOf/indexOf slip passes every test that does not
 *     name @allxsmith/bestax-bulma and then mis-pins the one package whose
 *     release triggered the run.
 *   - ARTIFACT_PREFIX. `sign-sbom` and `attach-sbom` glob on that string from
 *     other jobs and cannot read a step output across a job boundary, so
 *     nothing else connects the constant to the globs that depend on it. If
 *     this assertion is ever "fixed" by updating the expected string, update
 *     the globs in supply-chain.yml in the same commit.
 *
 * `.mjs` and `node --test` rather than jest: root-level scripts with no
 * package of their own, matching check-security-txt-expiry.test.mjs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ARTIFACT_PREFIX,
  parseReleaseTag,
  installSpec,
  assertVersion,
  artifactBasename,
  readInstalledVersion,
  parseArgs,
  forLog,
  main,
} from './consumer-sbom-meta.mjs';

const SCOPED = '@allxsmith/bestax-bulma';

/** A scratch consumer tree with one installed package, as npm would leave it. */
function tree(pkg, version) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'consumer-sbom-'));
  const manifest = path.join(dir, 'node_modules', pkg);
  fs.mkdirSync(manifest, { recursive: true });
  fs.writeFileSync(
    path.join(manifest, 'package.json'),
    JSON.stringify({ name: pkg, version })
  );
  return dir;
}

// --- release tags ------------------------------------------------------------

test('parseReleaseTag splits a scoped tag on the LAST @', () => {
  assert.deepEqual(parseReleaseTag(`${SCOPED}@5.12.0`), {
    package: SCOPED,
    version: '5.12.0',
  });
});

test('parseReleaseTag handles the three unscoped packages', () => {
  for (const pkg of ['create-bestax', 'bestax-migrate', 'bestax-mcp']) {
    assert.deepEqual(parseReleaseTag(`${pkg}@1.2.3`), {
      package: pkg,
      version: '1.2.3',
    });
  }
});

test('parseReleaseTag returns null rather than throwing on a tag it cannot use', () => {
  // Not an error — just a release with nothing to pin to. The caller falls
  // back to `latest`, which is the correct answer.
  for (const tag of ['', undefined, null, 'v1.2.3', '@scope/only', 'name@']) {
    assert.equal(parseReleaseTag(tag), null, `expected null for ${tag}`);
  }
});

// --- install spec ------------------------------------------------------------

test('installSpec pins the package the release names', () => {
  assert.equal(
    installSpec({
      package: SCOPED,
      eventName: 'release',
      tagName: `${SCOPED}@5.12.0`,
    }),
    `${SCOPED}@5.12.0`
  );
});

test('installSpec leaves the other three legs on latest during a release', () => {
  // The whole asymmetry of item 1: a bulma-ui release says nothing about what
  // version of bestax-migrate a consumer installs today.
  for (const pkg of ['create-bestax', 'bestax-migrate', 'bestax-mcp']) {
    assert.equal(
      installSpec({
        package: pkg,
        eventName: 'release',
        tagName: `${SCOPED}@5.12.0`,
      }),
      pkg
    );
  }
});

test('installSpec resolves latest on schedule and dispatch', () => {
  for (const eventName of ['schedule', 'workflow_dispatch']) {
    assert.equal(
      // A tag is present in neither event, but pass one anyway: the event
      // check must be what decides, not the tag's absence.
      installSpec({
        package: SCOPED,
        eventName,
        tagName: `${SCOPED}@5.12.0`,
      }),
      SCOPED
    );
  }
});

test('installSpec falls back to latest on an unparsable or foreign tag', () => {
  for (const tagName of [undefined, '', 'v5.12.0', 'some-other-pkg@1.0.0']) {
    assert.equal(
      installSpec({ package: SCOPED, eventName: 'release', tagName }),
      SCOPED
    );
  }
});

test('installSpec refuses a release tag carrying a junk version', () => {
  // A tag is repo-authored rather than registry-authored, but it reaches an
  // `npm install` argument either way.
  assert.throws(
    () =>
      installSpec({
        package: SCOPED,
        eventName: 'release',
        tagName: `${SCOPED}@latest`,
      }),
    /not a semver version/
  );
});

// --- version validation ------------------------------------------------------

test('assertVersion accepts prerelease and build metadata', () => {
  // These are legitimately publishable, so the grammar must not reject them —
  // a validator that reds a real release is worse than a loose one.
  for (const v of [
    '5.12.0',
    '0.0.0',
    '1.0.0-rc.1',
    '1.0.0+build.4',
    '1.0.0-rc.1+b.2',
    '1.0.0-0.3.7',
    '1.0.0-x.7.z.92',
    '10.20.30',
  ]) {
    assert.equal(assertVersion(v), v);
  }
});

test('assertVersion is anchored at BOTH ends', () => {
  // The grammar used to be a prefix test, so every one of these passed while
  // the error message claimed the opposite. None is a valid semver version,
  // and all are made of legal characters — so the SEMVER test is what has to
  // catch them, which is exactly what a prefix test could not do.
  for (const v of [
    '1.2.3garbage',
    '1.2.3.4',
    '01.2.3',
    '1.02.3',
    '1.2.3-',
    '1.2.3+',
    '1.2',
    'v1.2.3',
  ]) {
    assert.throws(
      () => assertVersion(v),
      /not a semver version/,
      `expected "${v}" to be rejected as non-semver`
    );
  }

  // Trailing whitespace is not a legal character, so it is turned away one
  // check earlier. Asserted rather than lumped in above, because "rejected"
  // for the wrong reason is how the prefix-test bug survived review.
  assert.throws(() => assertVersion('1.2.3 '), /unexpected/);
});

test('assertVersion rejects the injection shapes it exists for', () => {
  // This is the reason the read-back moved out of YAML: each of these flows
  // into $GITHUB_OUTPUT and then into syft's config heredoc. They are expected
  // to trip the CHARACTER test specifically — it runs first precisely so the
  // error names the injection rather than the formatting.
  assert.throws(() => assertVersion('1.0.0\nbasename=evil'), /unexpected/);
  assert.throws(() => assertVersion('1.0.0"; rm -rf /'), /unexpected/);
  assert.throws(() => assertVersion('1.0.0 $(id)'), /unexpected/);
  assert.throws(() => assertVersion('1.0.0`id`'), /unexpected/);
  assert.throws(() => assertVersion('1.0.0;id'), /unexpected/);
});

test('assertVersion rejects empty and non-numeric values', () => {
  // Empty and nullish carry no characters at all, so the character test is
  // what turns them away; `latest` is well-formed text that is not a version.
  assert.throws(() => assertVersion(''), /unexpected/);
  assert.throws(() => assertVersion(undefined), /unexpected/);
  assert.throws(() => assertVersion(null), /unexpected/);
  assert.throws(() => assertVersion('latest'), /not a semver/);
});

test('assertVersion names where the value came from', () => {
  assert.throws(
    () => assertVersion('nope', 'release tag x@nope'),
    /release tag/
  );
});

// --- artifact naming ---------------------------------------------------------

test('ARTIFACT_PREFIX matches the globs in supply-chain.yml', () => {
  // sign-sbom globs `bestax-consumer-sbom-*.spdx.json` and
  // `bestax-consumer-sbom-*.cdx.json`; attach-sbom does the same. They are in
  // other jobs and cannot read a step output. Changing this constant without
  // changing those globs stops the consumer SBOMs being signed and attached,
  // silently and greenly.
  assert.equal(ARTIFACT_PREFIX, 'bestax-consumer-sbom-');
});

test('artifactBasename builds the one name both sbom-action steps use', () => {
  assert.equal(
    artifactBasename('allxsmith-bestax-bulma', '5.12.0'),
    'bestax-consumer-sbom-allxsmith-bestax-bulma-5.12.0'
  );
});

test('artifactBasename validates the version it is about to embed', () => {
  assert.throws(() => artifactBasename('slug', 'x'), /not a semver/);
  assert.throws(() => artifactBasename('', '1.2.3'), /requires a slug/);
});

// --- read-back ---------------------------------------------------------------

test('readInstalledVersion reads the tree, scoped names included', () => {
  assert.equal(readInstalledVersion(tree(SCOPED, '5.12.0'), SCOPED), '5.12.0');
});

test('readInstalledVersion fails loudly when the package is absent', () => {
  assert.throws(
    () => readInstalledVersion(tree(SCOPED, '5.12.0'), 'create-bestax'),
    /is not installed under/
  );
});

test('readInstalledVersion validates what the tarball claims', () => {
  // The one input to this job an attacker would control if a package were
  // compromised.
  const dir = tree('evil', '0.0.0');
  fs.writeFileSync(
    path.join(dir, 'node_modules', 'evil', 'package.json'),
    JSON.stringify({ name: 'evil', version: '1.0.0\nbasename=owned' })
  );
  assert.throws(() => readInstalledVersion(dir, 'evil'), /unexpected/);
});

// --- CLI ---------------------------------------------------------------------

test('parseArgs requires a known mode', () => {
  assert.throws(() => parseArgs([]), /spec\|stamp/);
  assert.throws(() => parseArgs(['stampede']), /spec\|stamp/);
  assert.equal(parseArgs(['spec', '--package', 'x']).package, 'x');
});

test('parseArgs rejects a flag with no value', () => {
  assert.throws(() => parseArgs(['spec', '--package']), /needs a value/);
  assert.throws(
    () => parseArgs(['spec', 'package', 'x']),
    /unexpected argument/
  );
});

test('main stamps version and basename into GITHUB_OUTPUT', () => {
  const dir = tree(SCOPED, '5.12.0');
  const out = path.join(dir, 'gh-output');
  const code = main(
    [
      'stamp',
      '--package',
      SCOPED,
      '--slug',
      'allxsmith-bestax-bulma',
      '--dir',
      dir,
    ],
    { GITHUB_OUTPUT: out }
  );
  assert.equal(code, 0);
  assert.equal(
    fs.readFileSync(out, 'utf8'),
    'version=5.12.0\nbasename=bestax-consumer-sbom-allxsmith-bestax-bulma-5.12.0\n'
  );
});

test('main fails when the tree disagrees with the pinned version', () => {
  // The assertion the pin buys: without it, pinning is a request rather than a
  // guarantee, and a registry serving something else goes unnoticed.
  const dir = tree(SCOPED, '5.11.1');
  const code = main(
    [
      'stamp',
      '--package',
      SCOPED,
      '--slug',
      'allxsmith-bestax-bulma',
      '--dir',
      dir,
      '--expect',
      '5.12.0',
    ],
    {}
  );
  assert.equal(code, 1);
});

test('main separates usage errors from assertion failures', () => {
  // Exit 2 must not be readable as a supply-chain failure, and the converse:
  // a mistyped invocation must not be reported as one. A missing --slug is a
  // usage error, so parseArgs owns it and the code is 2, not 1.
  assert.equal(main(['nonsense'], {}), 2);
  assert.equal(main(['stamp', '--package', SCOPED], {}), 2);
  assert.equal(main(['stamp', '--package', SCOPED, '--slug', 'x'], {}), 2);
  assert.equal(main(['spec'], {}), 2);

  // 1 is reserved for a real assertion failure — here, a tree that does not
  // contain the package it was asked about.
  assert.equal(
    main(
      [
        'stamp',
        '--package',
        'absent-pkg',
        '--slug',
        'x',
        '--dir',
        tree(SCOPED, '5.12.0'),
      ],
      {}
    ),
    1
  );
});

test('parseArgs owns the required flags for each mode', () => {
  assert.throws(() => parseArgs(['spec']), /spec requires --package/);
  assert.throws(
    () => parseArgs(['stamp', '--package', SCOPED]),
    /stamp requires --slug/
  );
  assert.throws(
    () => parseArgs(['stamp', '--package', SCOPED, '--slug', 'x']),
    /stamp requires --dir/
  );
  // --expect stays optional: only a pinned leg passes one.
  assert.equal(
    parseArgs(['stamp', '--package', SCOPED, '--slug', 'x', '--dir', '/t'])
      .expect,
    undefined
  );
});

test('main emits spec and expect when the release names this leg', () => {
  const out = path.join(tree(SCOPED, '5.12.0'), 'gh-output');
  const code = main(
    [
      'spec',
      '--package',
      SCOPED,
      '--event',
      'release',
      '--tag',
      `${SCOPED}@5.12.0`,
    ],
    { GITHUB_OUTPUT: out }
  );
  assert.equal(code, 0);
  // `expect` must be the version alone, not the spec. Deriving it in the
  // workflow instead would reimplement the last-`@` split in untested YAML.
  assert.equal(
    fs.readFileSync(out, 'utf8'),
    `spec=${SCOPED}@5.12.0\nexpect=5.12.0\n`
  );
});

test('main emits an empty expect for an unpinned leg', () => {
  const out = path.join(tree(SCOPED, '5.12.0'), 'gh-output');
  const code = main(
    [
      'spec',
      '--package',
      'bestax-migrate',
      '--event',
      'release',
      '--tag',
      `${SCOPED}@5.12.0`,
    ],
    { GITHUB_OUTPUT: out }
  );
  assert.equal(code, 0);
  assert.equal(fs.readFileSync(out, 'utf8'), 'spec=bestax-migrate\nexpect=\n');
});

// --- log injection through the rejection message -----------------------------

test('a rejected version cannot forge an Actions workflow command', () => {
  // The value is blocked from $GITHUB_OUTPUT, and then the complaint about it
  // used to hand the same newline straight back to the runner inside
  // `::error::…`, emitting a second forged command. Rejecting is not enough if
  // the rejection message re-introduces the value verbatim.
  const attacks = [
    '1.0.0\n::error::FORGED',
    '1.0.0\r\n::add-mask::secret',
    '1.0.0\n::notice::x',
  ];
  for (const v of attacks) {
    assert.throws(
      () => assertVersion(v),
      err => {
        assert.ok(
          !err.message.includes('\n'),
          `raw newline in: ${err.message}`
        );
        assert.ok(!/^::/m.test(err.message), `command in: ${err.message}`);
        return true;
      }
    );
  }
});

test('forLog neutralises anything bound for a log line', () => {
  assert.equal(forLog('1.0.0\n::error::x'), '"1.0.0\\n::error::x"');
  assert.equal(forLog('a\r\nb'), '"a\\r\\nb"');
  assert.equal(forLog(undefined), '""');
  assert.ok(!forLog('x\ny').includes('\n'));
});

test('the tarball read-back cannot forge one either', () => {
  const dir = tree('evil', '0.0.0');
  fs.writeFileSync(
    path.join(dir, 'node_modules', 'evil', 'package.json'),
    JSON.stringify({ name: 'evil', version: '1.0.0\n::error::FORGED' })
  );
  assert.throws(
    () => readInstalledVersion(dir, 'evil'),
    err => {
      assert.ok(!err.message.includes('\n'));
      return true;
    }
  );
});
