/**
 * Covers scripts/require-pnpm-publish.mjs (#436, #532).
 *
 * Both directions are load-bearing and they fail differently. A guard that
 * misses `npm publish` lets #412 ship again with no signal. A guard that
 * refuses `pnpm publish` breaks the actual release, and it would do so during
 * `prepublishOnly`, after semantic-release has already pushed the release
 * commit and tag.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  isPnpmPublish,
  main,
  packTimeSpecifiers,
} from './require-pnpm-publish.mjs';

const PNPM = '/Users/x/.cache/node/corepack/v1/pnpm/11.9.0/bin/pnpm.mjs';
const NPM = '/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js';
const silent = () => {};

test('pnpm publish is allowed through', () => {
  assert.equal(isPnpmPublish(PNPM), true);
  assert.equal(main({ npm_execpath: PNPM }, silent), 0);
});

test('npm publish is refused', () => {
  assert.equal(isPnpmPublish(NPM), false);
  assert.equal(main({ npm_execpath: NPM }, silent), 1);
});

test('another package manager is refused too', () => {
  // Only pnpm resolves the workspace: protocol at pack time, so the rule is
  // "pnpm or nothing", not "anything but npm".
  for (const ua of ['/usr/local/bin/yarn.js', '/usr/bin/bun', '/x/cnpm.js']) {
    assert.equal(isPnpmPublish(ua), false, `${ua} must be refused`);
    assert.equal(main({ npm_execpath: ua }, silent), 1);
  }
});

test('an unrecognised packer is allowed, not refused', () => {
  // The asymmetry is deliberate. pnpm's own lifecycle runner falls back to
  // `process.argv[1] || process.cwd()` for npm_execpath, so a build where
  // argv[1] is falsy reports the package DIRECTORY. Refusing what we do not
  // recognise would kill that release from inside a pack hook, after the
  // commit and tag are pushed.
  for (const p of [
    '/home/runner/work/bestax/bestax-migrate',
    '/bin/pnpmx.mjs',
    '/opt/some-future-manager',
  ]) {
    assert.equal(isPnpmPublish(p), true, `${p} is unrecognised and must pass`);
  }
  // …while every packer we can name is still refused.
  for (const p of [
    '/x/npm-cli.js',
    '/x/yarn.js',
    '/usr/bin/bun',
    '/x/cnpm.js',
  ]) {
    assert.equal(isPnpmPublish(p), false, `${p} must be refused`);
  }
});

test('the user agent is NOT the signal, because npm relays it', () => {
  // The bug this replaced: `pnpm exec npm publish` runs the hook with the
  // inherited agent `pnpm/11.9.0 …` while npm assembles the tarball. Measured
  // in this repo; the guard allowed it. execpath is rewritten by whichever
  // process actually runs the script, so it names the real packer.
  assert.equal(
    main(
      {
        npm_config_user_agent: 'pnpm/11.9.0 npm/? node/v25.2.1 darwin arm64',
        npm_execpath: NPM,
      },
      silent
    ),
    1,
    'a pnpm agent with an npm execpath is `pnpm exec npm publish` and must be refused'
  );
});

test('a windows pnpm is allowed, in every form it ships as', () => {
  // pnpm is pnpm.cmd or pnpm.exe on Windows. Refusing those blocks a real
  // release from inside prepublishOnly, after the commit and tag are pushed —
  // the one direction this guard must not fail in.
  for (const p of [
    'C:\\Users\\x\\pnpm.cmd',
    'C:\\Users\\x\\pnpm.exe',
    'C:\\Users\\x\\pnpm.CJS',
    'C:\\Users\\x\\pnpm.cjs',
    'C:\\Users\\x\\pnpm.bat',
    'C:\\Users\\x\\pnpm.ps1',
  ]) {
    assert.equal(isPnpmPublish(p), true, `${p} is pnpm and must be allowed`);
  }
  for (const p of [
    'C:\\Program Files\\nodejs\\npm-cli.js',
    'C:\\Users\\x\\npm.cmd',
    'C:\\Users\\x\\yarn.cmd',
  ]) {
    assert.equal(isPnpmPublish(p), false, `${p} is not pnpm`);
  }
});

test('the refusal spells out the flags a hand publish would otherwise lose', () => {
  // publishConfig.provenance was removed from the manifest, so a hand
  // `pnpm publish` — the one path this guard permits — produces no provenance
  // and no embedded README unless the flags are passed.
  let msg = '';
  main({ npm_execpath: NPM }, m => (msg = m));
  assert.match(msg, /--provenance/);
  assert.match(msg, /--embed-readme/);
});

test('an absent execpath is allowed, not refused', () => {
  // prepublishOnly only runs under a package manager, so no agent means the
  // script was invoked directly. Failing there would be a confusing refusal
  // rather than a caught mistake.
  assert.equal(isPnpmPublish(undefined), true);
  assert.equal(isPnpmPublish(''), true);
  assert.equal(main({}, silent), 0);
});

test('the refusal explains the consequence, not just the rule', () => {
  let msg = '';
  main({ npm_execpath: NPM }, m => (msg = m));
  assert.match(msg, /pnpm publish/);
  assert.match(msg, /workspace:/);
  assert.match(msg, /#412/);
  assert.match(msg, /EUNSUPPORTEDPROTOCOL/);
});

test('every publishable package actually wires the hook up', async () => {
  // The script existing is not the same as it running, and #532 moved three
  // more packages onto the exemption this compensates for. Both hooks matter:
  // `npm pack` runs only prepack, and `npm publish <tarball>` runs neither,
  // so a tarball packed by npm would otherwise have nothing left to refuse it.
  for (const dir of [
    'bulma-ui',
    'create-bestax',
    'bestax-migrate',
    'bestax-mcp',
  ]) {
    const pkg = await import(`../${dir}/package.json`, {
      with: { type: 'json' },
    });
    for (const hook of ['prepack', 'prepublishOnly']) {
      assert.match(
        pkg.default.scripts[hook] ?? '',
        /require-pnpm-publish\.mjs/,
        `${dir} must run the guard on ${hook}`
      );
    }
  }
});

test('the refusal names the package being packed, not a hardcoded one', () => {
  // The message used to describe bestax-migrate's situation to whoever ran it.
  // With four callers that was wrong for three of them, so it now reads the
  // cwd — which is where a lifecycle hook runs.
  let msg = '';
  main(
    { npm_execpath: '/x/npm-cli.js' },
    m => (msg = m),
    '/tmp/nowhere/bulma-ui'
  );
  assert.match(msg, /pnpm -C bulma-ui pack/);
});

test('a package with no pack-time specifier is not told it has one', () => {
  // Inventing a specifier sends the reader looking for something that is not
  // there. The rule still holds for that package, so the message says why
  // without naming a dependency.
  let msg = '';
  main(
    { npm_execpath: '/x/npm-cli.js' },
    m => (msg = m),
    '/tmp/nowhere/bulma-ui'
  );
  assert.doesNotMatch(msg, /bulma-ui declares/);
  // …and still explains the rule and its consequence.
  assert.match(msg, /#412/);
  assert.match(msg, /--provenance/);
});

test('an unreadable manifest degrades to the directory name, never throws', () => {
  // This runs inside a pack hook. A guard that crashed while explaining itself
  // would report the wrong problem, and on the allow path would fail a real
  // release after the commit and tag are pushed.
  let msg = '';
  const code = main(
    { npm_execpath: '/x/npm-cli.js' },
    m => (msg = m),
    '/tmp/definitely-not-a-package/some-pkg'
  );
  assert.equal(code, 1);
  assert.match(msg, /pnpm -C some-pkg pack/);
});

test('packTimeSpecifiers finds every protocol, in every section', () => {
  assert.deepEqual(
    packTimeSpecifiers({
      dependencies: { a: 'workspace:^', ok: '^1.0.0' },
      devDependencies: { b: 'catalog:' },
      peerDependencies: { c: 'link:../y' },
      optionalDependencies: { d: 'file:../z' },
    }),
    [
      { section: 'dependencies', name: 'a', spec: 'workspace:^' },
      { section: 'devDependencies', name: 'b', spec: 'catalog:' },
      { section: 'peerDependencies', name: 'c', spec: 'link:../y' },
      { section: 'optionalDependencies', name: 'd', spec: 'file:../z' },
    ]
  );
});

test('packTimeSpecifiers survives a manifest that is missing or odd', () => {
  assert.deepEqual(packTimeSpecifiers(undefined), []);
  assert.deepEqual(packTimeSpecifiers({}), []);
  // A non-string specifier is malformed, not a protocol; it must not crash.
  assert.deepEqual(packTimeSpecifiers({ dependencies: { a: { x: 1 } } }), []);
});
