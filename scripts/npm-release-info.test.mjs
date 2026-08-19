/**
 * Covers scripts/npm-release-info.mjs (#436).
 *
 * The output shape is the contract: @semantic-release/github renders it into
 * the comment posted on every linked issue and PR, and it has to be
 * indistinguishable from what @semantic-release/npm produces for the three
 * packages still publishing that way. So the field names and the URL format
 * are pinned against that plugin's get-release-info.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { releaseInfo, main } from './npm-release-info.mjs';

const MIGRATE = new URL('../bestax-migrate/', import.meta.url).pathname;

test('the shape matches @semantic-release/npm/lib/get-release-info.js', () => {
  const info = releaseInfo('bestax-migrate', '2.0.1');
  assert.deepEqual(info, {
    name: 'npm package (@latest dist-tag)',
    url: 'https://www.npmjs.com/package/bestax-migrate/v/2.0.1',
    channel: 'latest',
  });
});

test('a scoped name keeps its slash in the URL', () => {
  // npmjs.com URLs carry the scope unencoded; encoding it would 404.
  assert.equal(
    releaseInfo('@allxsmith/bestax-bulma', '5.11.1').url,
    'https://www.npmjs.com/package/@allxsmith/bestax-bulma/v/5.11.1'
  );
});

test('a non-default dist-tag shows up in both the name and the channel', () => {
  const info = releaseInfo('bestax-migrate', '3.0.0-next.1', 'next');
  assert.equal(info.name, 'npm package (@next dist-tag)');
  assert.equal(info.channel, 'next');
});

test('a missing version fails instead of linking to a version that does not exist', () => {
  // The template could silently interpolate nothing; a URL pointing at a
  // non-existent version is worse than a failed step.
  assert.throws(() => releaseInfo('bestax-migrate', undefined), /no version/);
  assert.throws(() => releaseInfo('bestax-migrate', ''), /no version/);
});

test('a package with no name fails rather than emitting a broken URL', () => {
  assert.throws(() => releaseInfo(undefined, '2.0.1'), /no name/);
});

test('main reads the real bestax-migrate manifest and emits parseable JSON', () => {
  // exec runs `parseJson` over stdout, so anything unparseable here puts the
  // publish back in the state this script exists to fix.
  const out = main(['2.0.1'], MIGRATE);
  const parsed = JSON.parse(out);
  assert.equal(parsed.name, 'npm package (@latest dist-tag)');
  assert.match(
    parsed.url,
    /^https:\/\/www\.npmjs\.com\/package\/bestax-migrate\/v\/2\.0\.1$/
  );
  assert.equal(
    out.trim(),
    out,
    "stdout must not need trimming beyond exec's own"
  );
});

test('the publishCmd sends pnpm output to stderr and calls this script', async () => {
  // The redirect is what makes stdout parseable. Losing it silently reverts
  // the bare-tag comment, so it is pinned rather than left to review.
  const { default: config } =
    await import('../bestax-migrate/release.config.js');
  const exec = config.plugins.find(
    p => Array.isArray(p) && p[0] === '@semantic-release/exec'
  );
  assert.match(exec[1].publishCmd, /1>&2/);
  assert.match(
    exec[1].publishCmd,
    /npm-release-info\.mjs \$\{nextRelease\.version\}/
  );
});
