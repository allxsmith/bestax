/**
 * The publish half of every package's semantic-release config (#436, #532).
 *
 * `@semantic-release/npm` shells out to `npm publish`, which resolves none of
 * pnpm's pack-time protocols. A `workspace:^` left in a published manifest is
 * uninstallable by every package manager, and that shipped as
 * bestax-migrate@1.0.0 (#412), invisibly, because nothing in CI installs the
 * published artifact. #436 moved that one package to `pnpm publish`, which
 * resolves every pnpm specifier shape by construction rather than by a script
 * of ours reimplementing a subset. #532 moved the other three, so this is now
 * how the whole workspace publishes.
 *
 * It lives here rather than in each release.config.js because the four configs
 * were identical and the reasons below are not obvious from the code. Four
 * copies of an explanation is four chances for three of them to go stale, and
 * every flag here is load-bearing in a way that fails quietly.
 */
import path from 'node:path';
// `sh` quotes the paths below for /bin/sh: a checkout under a directory with a
// space would otherwise split into two arguments and fail with a confusing
// "Cannot find module". It is colocated with its inverse, which the conformance
// check uses to read these commands back.
import { quote as sh } from './shell-words.mjs';

const SCRIPTS = path.join(import.meta.dirname, '..');

/**
 * The two plugins that publish a package, as a pair.
 *
 * They are returned together because they are one decision. `npmPublish: false`
 * is what stops @semantic-release/npm publishing, and the exec plugin is what
 * publishes instead; wiring one without the other either publishes twice or not
 * at all. Keeping them separate in each config made that a thing a reviewer had
 * to notice.
 *
 * @param pkgDir absolute path to the package, i.e. `import.meta.dirname` from
 *   the release config. Absolute, so neither exec command depends on the cwd
 *   semantic-release was invoked from. It works today only because ci.yml sets
 *   `working-directory`, and a relative `../scripts/...` would break the release
 *   the moment anything ran it from the repo root.
 */
export function pnpmPublishPlugins(pkgDir) {
  return [
    // Publishing is split deliberately. This plugin keeps its `prepare` step —
    // that is what writes nextRelease.version into package.json for
    // @semantic-release/git to commit — but its `publish` step shells out to
    // `npm publish`, which is the thing being replaced.
    //
    // `npmPublish: false` also switches off this plugin's npm auth check in
    // verifyConditions — see verifyConditionsCmd below for what partially
    // replaces it, and why only partially.
    [
      '@semantic-release/npm',
      {
        pkgRoot: '.',
        npmPublish: false,
      },
    ],
    [
      '@semantic-release/exec',
      {
        // Every command below runs in the package, not in whatever directory
        // semantic-release was started from. `pnpm publish` resolves its target
        // package from the cwd, so without this a run from the repo root would
        // reach the publish step (after the release commit and tag are already
        // pushed) and fail on the private root package.
        execCwd: pkgDir,

        // Guards the one failure this swap newly introduces rather than
        // inherits: with npmPublish false, nothing exchanges an OIDC token
        // during verifyConditions any more, and semantic-release runs every
        // `prepare` step (including the release commit and tag) before any
        // `publish` step. The script says what it does and does not prove.
        // `${options.dryRun}` is available because exec renders its commands
        // as lodash templates over the semantic-release context. Needed
        // because verifyConditions is marked `dryRun: true` upstream, so this
        // runs during `semantic-release --dry-run` as well, and a dry run
        // publishes nothing and needs no token.
        verifyConditionsCmd:
          `node ${sh(path.join(SCRIPTS, 'verify-oidc-context.mjs'))}` +
          ' ${options.dryRun ? "--dry-run" : ""}',

        // Every flag here is load-bearing; none is decoration.
        //
        //   --provenance    The ONLY thing turning provenance on. pnpm reads
        //                   publishConfig.registry and .access but takes
        //                   `provenance` from options, and it is absent from
        //                   the whitelist that hoists publishConfig keys. No
        //                   package here carries a `publishConfig.provenance`
        //                   any more, precisely so nobody reads one and
        //                   concludes this flag is redundant. Passing it
        //                   explicitly also survives an OIDC response that
        //                   omits provenance, since pnpm assigns that with
        //                   `??=`.
        //   --embed-readme  pnpm defaults this to false, npm defaults it to
        //                   true. Without it the npmjs.com page for the
        //                   package loses its README on the next release.
        //   --no-git-checks pnpm otherwise refuses to publish from a branch it
        //                   does not recognise as the publish branch;
        //                   semantic-release is mid-release when this runs.
        //   --access        load-bearing for the scoped package and belt and
        //                   braces for the rest: @allxsmith/bestax-bulma is
        //                   scoped, and scoped packages default to restricted.
        //                   pnpm would otherwise fall back to
        //                   publishConfig.access, which every package sets. It
        //                   is also the value pnpm errors on when generating
        //                   provenance for a package it believes is private,
        //                   so it belongs next to --provenance rather than a
        //                   file away.
        //
        // No --tag on purpose. The dist-tag would have to be derived from
        // nextRelease.channel, and @semantic-release/npm does not derive it
        // naively: get-channel.js maps a channel that is a valid semver RANGE
        // to `release-<channel>`, because the registry rejects a dist-tag that
        // parses as a range. Reimplementing that in a lodash template needs
        // semver and would be a copy of upstream logic drifting out of sight,
        // which is the bug class #436 exists to stop repeating. Every package's
        // `branches` is ['main'], so the channel is always null and pnpm's
        // default of `latest` is already right. The tests assert that
        // `branches` has not changed, so adding a maintenance or prerelease
        // branch fails CI here rather than silently publishing it to the
        // stable tag.
        //
        // pnpm's own output goes to stderr so stdout carries only the JSON
        // release object exec parses. Nothing is hidden by that: exec pipes
        // stdout and stderr separately to the job log, so the publish output
        // still appears exactly where it does today, and a failed publish
        // still throws. Without it, exec's parse fails, it returns undefined,
        // and the "release is available on" comment on every linked issue and
        // PR shows a bare `<pkg>@x.y.z` instead of an npm link.
        //
        // The `&&` tail cannot fail the release: npm-release-info.mjs always
        // exits 0, degrading to `{}` if anything goes wrong. A non-zero exit
        // there would throw out of the publish step with the tarball already
        // on the registry, skipping @semantic-release/github and spending the
        // version, for the sake of a link in a comment.
        // `|| true` and not just the script's own error handling: if node
        // cannot LOAD the script (moved, renamed, a syntax error), it exits
        // non-zero before that handling is ever reached, and the `&&` chain
        // would then fail the publish step with the tarball already on the
        // registry. The guarantee has to live in the shell, where it holds
        // whatever happens to the script.
        publishCmd:
          'pnpm publish --no-git-checks --provenance --embed-readme ' +
          '--access public 1>&2 && { node ' +
          sh(path.join(SCRIPTS, 'npm-release-info.mjs')) +
          ' --dir=' +
          sh(pkgDir) +
          ' ${nextRelease.version} || true; }',
      },
    ],
  ];
}
