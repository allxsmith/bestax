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

import { fileURLToPath } from 'node:url';

import { releaseInfo, main, cli } from './npm-release-info.mjs';

// fileURLToPath, not .pathname: a URL path is percent-encoded, so a checkout
// under a directory with a space resolves to a path that does not exist.
const MIGRATE = fileURLToPath(new URL('../bestax-migrate/', import.meta.url));

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

test('the CLI cannot fail, however wrong its input', () => {
  // publishCmd chains this after `pnpm publish` with `&&`. A non-zero exit
  // would throw out of the publish step with the tarball already on the
  // registry: @semantic-release/github never runs, the job reds, the version is
  // spent. So every failure degrades to `{}`, which renders as the bare tag
  // this script improves on rather than taking a good release down.
  for (const argv of [
    [],
    ['--dir=/nonexistent'],
    ['2.0.1', '--dir=/nonexistent'],
  ]) {
    const { stdout, code } = cli(argv, MIGRATE, () => {});
    assert.equal(code, 0, `${JSON.stringify(argv)} must exit 0`);
    assert.doesNotThrow(() => JSON.parse(stdout), 'stdout must stay parseable');
  }
  // …and the reason still reaches the log.
  let warned = '';
  cli([], MIGRATE, m => (warned = m));
  assert.match(warned, /no version/);
  assert.match(warned, /published successfully/);
});

test('--dir decouples it from the cwd semantic-release ran in', () => {
  // Both exec commands pass an absolute --dir, so the release does not depend
  // on being invoked from the package directory.
  const { stdout } = cli(['2.0.1', `--dir=${MIGRATE}`], '/', () => {});
  assert.equal(
    JSON.parse(stdout).url,
    'https://www.npmjs.com/package/bestax-migrate/v/2.0.1'
  );
});

test('a non-default registry gets no npmjs.com link', () => {
  // Upstream omits the url rather than linking to a page that will 404, and
  // matching that is the point: a broken link presented as the release
  // artifact is worse than the bare tag.
  const info = releaseInfo('x', '1.0.0', 'latest', 'https://npm.example.test/');
  assert.equal(info.url, undefined);
  assert.equal(info.name, 'npm package (@latest dist-tag)');
  // The default registry still links.
  assert.ok(
    releaseInfo('x', '1.0.0', 'latest', 'https://registry.npmjs.org/').url
  );
  assert.ok(releaseInfo('x', '1.0.0').url);
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
  assert.match(exec[1].publishCmd, /npm-release-info\.mjs/);
  assert.match(exec[1].publishCmd, /--dir=/);
  assert.match(exec[1].publishCmd, /\$\{nextRelease\.version\}/);
  // `|| true` in the SHELL, not just error handling inside the script: node
  // exits non-zero before that handling if it cannot load the file at all, and
  // the `&&` chain would then fail the publish with the tarball already up.
  assert.match(exec[1].publishCmd, /\|\| true/);
  // Paths are quoted, so a checkout under a directory with a space does not
  // split into two arguments.
  assert.match(exec[1].publishCmd, /node '[^']*npm-release-info\.mjs'/);
  assert.match(
    exec[1].verifyConditionsCmd,
    /node '[^']*verify-oidc-context\.mjs'/
  );
  // Absolute paths, so neither command depends on the cwd semantic-release was
  // invoked from.
  assert.doesNotMatch(exec[1].publishCmd, /\.\.\/scripts/);
  assert.doesNotMatch(exec[1].verifyConditionsCmd, /\.\.\/scripts/);
});
