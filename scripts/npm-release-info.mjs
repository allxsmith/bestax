#!/usr/bin/env node
/**
 * Prints the release object semantic-release records for an npm publish (#436).
 *
 * `@semantic-release/npm` returns one from its publish step, and
 * `@semantic-release/github` turns it into the "The release is available on:"
 * entry it comments onto every linked issue and PR. Handing publishing to
 * `pnpm publish` loses that, and loses it in a way that looks like a bug rather
 * than an omission: `@semantic-release/exec` parses its command's stdout as
 * JSON, pnpm prints prose, so the parse fails and exec returns `undefined`.
 * `undefined` is not `false`, so semantic-release's publish transform
 * (lib/definitions/plugins.js) falls through to spreading `nextRelease` over
 * it, and `nextRelease.name` is the git tag (index.js:187). The comment then
 * reads:
 *
 *     The release is available on:
 *     - `bestax-migrate@2.0.1`          <- a bare tag, no link
 *     - [GitHub release](...)
 *
 * which reads as a link that failed to render. So print the same shape
 * @semantic-release/npm does, and let the publish command send pnpm's own
 * output to stderr. Nothing is hidden by that: exec pipes stdout and stderr
 * separately to the job log, so both still appear, and a failed publish still
 * throws.
 *
 * Name and URL deliberately match `@semantic-release/npm/lib/get-release-info.js`
 * exactly, so bestax-migrate's comments are indistinguishable from the three
 * packages still publishing through that plugin.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export function releaseInfo(pkgName, version, distTag = 'latest') {
  if (!pkgName) throw new Error('npm-release-info: package has no name');
  if (!version) {
    // Better to fail the publish step than to comment a URL pointing at a
    // version that does not exist.
    throw new Error(
      'npm-release-info: no version given. Pass ${nextRelease.version} from ' +
        'the publishCmd template.'
    );
  }
  return {
    name: `npm package (@${distTag} dist-tag)`,
    url: `https://www.npmjs.com/package/${pkgName}/v/${version}`,
    channel: distTag,
  };
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const { name } = JSON.parse(
    fs.readFileSync(path.join(cwd, 'package.json'), 'utf8')
  );
  const [version, distTag] = argv;
  return JSON.stringify(releaseInfo(name, version, distTag || 'latest'));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    console.log(main());
  } catch (err) {
    // A stack trace here would be buried under pnpm's publish output; the
    // message is the actionable part.
    console.error(err.message);
    process.exitCode = 1;
  }
}
