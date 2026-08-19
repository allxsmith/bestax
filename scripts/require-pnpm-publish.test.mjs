/**
 * Covers scripts/require-pnpm-publish.mjs (#436).
 *
 * Both directions are load-bearing and they fail differently. A guard that
 * misses `npm publish` lets #412 ship again with no signal. A guard that
 * refuses `pnpm publish` breaks the actual release, and it would do so during
 * `prepublishOnly`, after semantic-release has already pushed the release
 * commit and tag.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isPnpmPublish, main } from './require-pnpm-publish.mjs';

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

test('a binary that merely starts with the letters pnpm is refused', () => {
  for (const p of ['/bin/pnpmx.mjs', '/bin/pnpm-fake.js', '/bin/notpnpm.mjs']) {
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

test('a windows-style path is handled', () => {
  assert.equal(isPnpmPublish('C:\\Users\\x\\pnpm.cjs'), true);
  assert.equal(isPnpmPublish('C:\\Program Files\\nodejs\\npm-cli.js'), false);
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

test('bestax-migrate actually wires the hook up', async () => {
  // The script existing is not the same as it running.
  const pkg = await import('../bestax-migrate/package.json', {
    with: { type: 'json' },
  });
  assert.match(
    pkg.default.scripts.prepublishOnly,
    /require-pnpm-publish\.mjs/,
    'bestax-migrate must run the guard on prepublishOnly'
  );
});
