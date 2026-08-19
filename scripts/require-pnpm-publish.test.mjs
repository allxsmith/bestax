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

const PNPM = 'pnpm/11.9.0 npm/? node/v25.2.1 darwin arm64';
const NPM = 'npm/11.6.2 node/v25.2.1 darwin arm64 workspaces/false';
const silent = () => {};

test('pnpm publish is allowed through', () => {
  assert.equal(isPnpmPublish(PNPM), true);
  assert.equal(main({ npm_config_user_agent: PNPM }, silent), 0);
});

test('npm publish is refused', () => {
  assert.equal(isPnpmPublish(NPM), false);
  assert.equal(main({ npm_config_user_agent: NPM }, silent), 1);
});

test('another package manager is refused too', () => {
  // Only pnpm resolves the workspace: protocol at pack time, so the rule is
  // "pnpm or nothing", not "anything but npm".
  for (const ua of ['yarn/4.0.0 npm/? node/v22', 'bun/1.1.0', 'cnpm/9.0.0']) {
    assert.equal(isPnpmPublish(ua), false, `${ua} must be refused`);
    assert.equal(main({ npm_config_user_agent: ua }, silent), 1);
  }
});

test('a name that merely starts with the letters pnpm is refused', () => {
  // `/^pnpm\//` and not `startsWith('pnpm')`: the slash is what makes this a
  // package-manager token rather than a prefix match.
  for (const ua of ['pnpmx/1.0.0', 'pnpm-fake/1.0.0', 'notpnpm/1.0.0']) {
    assert.equal(isPnpmPublish(ua), false, `${ua} must be refused`);
  }
});

test('an absent user agent is allowed, not refused', () => {
  // prepublishOnly only runs under a package manager, so no agent means the
  // script was invoked directly. Failing there would be a confusing refusal
  // rather than a caught mistake.
  assert.equal(isPnpmPublish(undefined), true);
  assert.equal(isPnpmPublish(''), true);
  assert.equal(main({}, silent), 0);
});

test('the refusal explains the consequence, not just the rule', () => {
  let msg = '';
  main({ npm_config_user_agent: NPM }, m => (msg = m));
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
