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
 * exactly, so the comment a pnpm-published release posts is indistinguishable
 * from the one that plugin used to post. Every package publishes this way now
 * (#532), so there is no longer a package to compare against — which is the
 * reason to keep matching the upstream shape rather than drift from it.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export function releaseInfo(
  pkgName,
  version,
  distTag = 'latest',
  registry = undefined
) {
  if (!pkgName) throw new Error('npm-release-info: package has no name');
  if (!version) {
    // Better to fail the publish step than to comment a URL pointing at a
    // version that does not exist.
    throw new Error(
      'npm-release-info: no version given. Pass ${nextRelease.version} from ' +
        'the publishCmd template.'
    );
  }
  // Upstream omits the url entirely for a non-default registry rather than
  // linking to npmjs.com, and matching that matters: a link to a package page
  // that does not exist is worse than no link.
  //
  // The limit of that, stated rather than left to be discovered: the registry
  // is known here only from `publishConfig.registry`. pnpm resolves the real
  // one as `publishConfig.registry ?? registries['@scope'] ?? registries.default`,
  // and the last two come from npmrc, which this cannot see. A registry set
  // purely in npmrc would therefore still produce an npmjs.com link. The repo's
  // own .npmrc pins `registry=https://registry.npmjs.org/`, so the two agree
  // today; a future non-default registry has to pass it here explicitly.
  const onNpmjs =
    !registry || /^https?:\/\/registry\.npmjs\.org\/?$/.test(registry);
  return {
    name: `npm package (@${distTag} dist-tag)`,
    url: onNpmjs
      ? `https://www.npmjs.com/package/${pkgName}/v/${version}`
      : undefined,
    channel: distTag,
  };
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  // `--dir` decouples this from the cwd semantic-release happens to run in.
  // Both exec commands pass an absolute path, so the release does not depend
  // on being invoked from the package directory.
  const dirFlag = argv.find(a => a.startsWith('--dir='));
  const root = dirFlag ? dirFlag.slice('--dir='.length) : cwd;
  const { name, publishConfig } = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8')
  );
  const [version, distTag] = argv.filter(a => !a.startsWith('--'));
  return JSON.stringify(
    releaseInfo(name, version, distTag || 'latest', publishConfig?.registry)
  );
}

/**
 * The CLI, which deliberately CANNOT fail.
 *
 * publishCmd chains this after `pnpm publish` with `&&`, so a non-zero exit
 * here would throw out of @semantic-release/exec's publish step after the
 * tarball is already on the registry: @semantic-release/github never runs, the
 * job goes red, and the version is spent. For a link in a comment. So any
 * failure degrades to `{}`, which puts the comment back to the bare-tag
 * rendering this script improves on rather than taking a successful release
 * down with it. The reason is still printed, on stderr, where the job log
 * shows it.
 */
export function cli(
  argv = process.argv.slice(2),
  cwd = process.cwd(),
  warn = console.error
) {
  try {
    return { stdout: main(argv, cwd), code: 0 };
  } catch (err) {
    warn(
      `npm-release-info: ${err.message}\n` +
        'The package published successfully; only the npm link in the release ' +
        'comment is affected.'
    );
    return { stdout: '{}', code: 0 };
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { stdout, code } = cli();
  console.log(stdout);
  process.exitCode = code;
}
