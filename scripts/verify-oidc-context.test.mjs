/**
 * Covers scripts/verify-oidc-context.mjs (#436, #532).
 *
 * This guard exists because moving to `pnpm publish` switched
 * off `@semantic-release/npm`'s OIDC check in verifyConditions, and
 * semantic-release pushes the release commit and tag before any publish step
 * runs. Both directions are worth pinning: a guard that never fires is
 * decoration, and one that fires locally would block `--dry-run` on a
 * maintainer's laptop for no reason.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checkOidcContext, main } from './verify-oidc-context.mjs';

const OIDC = {
  GITHUB_ACTIONS: 'true',
  ACTIONS_ID_TOKEN_REQUEST_URL: 'https://example.test/token',
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'deadbeef',
};

const silent = () => {};

test('a complete OIDC context passes', () => {
  assert.deepEqual(checkOidcContext(OIDC), {
    ok: true,
    skipped: false,
    missing: [],
  });
  assert.equal(main(OIDC, silent), 0);
});

test('either variable missing on Actions fails, and the exit code says so', () => {
  // npm keys off the exit code to abort; a guard that reported the problem and
  // returned 0 would be worse than none, because the log would look checked.
  for (const name of [
    'ACTIONS_ID_TOKEN_REQUEST_URL',
    'ACTIONS_ID_TOKEN_REQUEST_TOKEN',
  ]) {
    const env = { ...OIDC };
    delete env[name];
    assert.equal(checkOidcContext(env).ok, false);
    assert.deepEqual(checkOidcContext(env).missing, [name]);
    assert.equal(main(env, silent), 1, `${name} unset must exit 1`);
  }
  assert.equal(
    main({ GITHUB_ACTIONS: 'true' }, silent),
    1,
    'neither set must exit 1'
  );
});

test('outside Actions it is a no-op, so a local dry run is not blocked', () => {
  assert.deepEqual(checkOidcContext({}), { ok: true, skipped: true });
  assert.equal(main({}, silent), 0);
  // Even with the variables half-present, which is what a stray shell export
  // looks like.
  assert.equal(main({ ACTIONS_ID_TOKEN_REQUEST_URL: 'x' }, silent), 0);
});

test('it does not key on CI, which is convention rather than contract', () => {
  // Keying on CI made this a silent no-op wherever CI happened to be unset —
  // a container image, a composite action, a job-level env: override — which
  // is the one direction a fail-early guard must not fail in. GITHUB_ACTIONS
  // is guaranteed by the runner and is what pnpm's own provenance check reads.
  assert.equal(
    checkOidcContext({ CI: 'true' }).skipped,
    true,
    'CI alone is not the signal'
  );
  assert.equal(
    checkOidcContext({ GITHUB_ACTIONS: 'true' }).skipped,
    false,
    'GITHUB_ACTIONS alone must arm it, with CI unset'
  );
});

test('the failure names the variables and does not overclaim', () => {
  // The claim has to match the mechanism: this proves a context exists, not
  // that npm will accept the token. A message that implied otherwise would
  // stop the next reader checking.
  let message = '';
  main({ GITHUB_ACTIONS: 'true' }, m => (message = m));
  assert.match(message, /ACTIONS_ID_TOKEN_REQUEST_URL/);
  assert.match(message, /ACTIONS_ID_TOKEN_REQUEST_TOKEN/);
  assert.match(message, /id-token: write/);
  assert.match(message, /only proves the context exists/);
});
