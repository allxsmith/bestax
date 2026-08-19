export default {
  branches: ['main'],
  tagFormat: 'bestax-migrate@${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        // commit-analyzer evaluates EVERY matching rule and a matching
        // `release: false` always wins (its priority index is -1), so rules
        // are not first-match-wins. Values are micromatch globs, hence the
        // negated glob below; a `release: false` rule must never be able to
        // match a commit that should release.
        releaseRules: [
          // Any commit scoped to something other than bestax-migrate never
          // releases this package. Without this, commits matching no rule
          // fall back to the angular defaults and would bump this package
          // too. (Does not match unscoped commits — a scope on releasing
          // types is enforced by commitlint instead.)
          { scope: '!(bestax-migrate)', release: false },

          // bestax-migrate releases. Breaking changes need a "BREAKING
          // CHANGE:" footer — the angular preset does not parse "feat(x)!:".
          { breaking: true, scope: 'bestax-migrate', release: 'major' },
          { type: 'feat', scope: 'bestax-migrate', release: 'minor' },
          { type: 'fix', scope: 'bestax-migrate', release: 'patch' },
          { type: 'perf', scope: 'bestax-migrate', release: 'patch' },
          { type: 'refactor', scope: 'bestax-migrate', release: 'patch' },
          { type: 'style', scope: 'bestax-migrate', release: 'patch' },

          // Non-releasing types, any scope (safe: never release-triggering)
          { type: 'docs', release: false },
          { type: 'test', release: false },
          { type: 'chore', release: false },
          { type: 'ci', release: false },
          { type: 'build', release: false },
        ],
      },
    ],
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    // Publishing is split deliberately (#436). This plugin keeps its `prepare`
    // step — that is what writes nextRelease.version into package.json for
    // @semantic-release/git to commit — but its `publish` step shells out to
    // `npm publish`, which does not resolve pnpm's `workspace:` protocol and
    // shipped an uninstallable 1.0.0 because of it (#412). So the publish half
    // goes to `pnpm publish` below, which resolves every pnpm specifier shape
    // by construction rather than by a script of ours reimplementing a subset.
    //
    // `npmPublish: false` also switches off this plugin's npm auth check in
    // verifyConditions — see verifyConditionsCmd on the exec plugin for what
    // partially replaces it, and why only partially.
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
        // Guards the one failure this swap newly introduces rather than
        // inherits: with npmPublish false, nothing exchanges an OIDC token
        // during verifyConditions any more, and semantic-release runs every
        // `prepare` step (including the release commit and tag) before any
        // `publish` step. The script says what it does and does not prove.
        verifyConditionsCmd: 'node ../scripts/verify-oidc-context.mjs',

        // Every flag here is load-bearing; none is decoration.
        //
        //   --provenance    pnpm does NOT read `publishConfig.provenance`. It
        //                   reads publishConfig.registry and .access only, and
        //                   `provenance` is absent from the publishConfig
        //                   whitelist that hoists keys to the top level. Drop
        //                   this flag and #411's provenance silently stops
        //                   being produced. Passing it explicitly also survives
        //                   an OIDC response that omits provenance, because
        //                   pnpm assigns that with `??=`.
        //   --embed-readme  pnpm defaults this to false, npm defaults it to
        //                   true. Without it the npmjs.com page for this
        //                   package loses its README on the next release.
        //   --no-git-checks pnpm otherwise refuses to publish from a branch it
        //                   does not recognise as the publish branch;
        //                   semantic-release is mid-release when this runs.
        //   --access        belt and braces, not load-bearing: pnpm falls back
        //                   to publishConfig.access, which this package sets.
        //                   Stated explicitly because it is the value pnpm
        //                   errors on when generating provenance for a package
        //                   it believes is private, so it should be visible
        //                   next to --provenance rather than a file away.
        //
        // No --tag on purpose. The dist-tag would have to be derived from
        // nextRelease.channel, and @semantic-release/npm does not derive it
        // naively: get-channel.js maps a channel that is a valid semver RANGE
        // to `release-<channel>`, because the registry rejects a dist-tag that
        // parses as a range. Reimplementing that in a lodash template needs
        // semver and would be a copy of upstream logic drifting out of sight,
        // which is the bug class #436 exists to stop repeating. `branches` is
        // ['main'], so the channel is always null and pnpm's default of
        // `latest` is already right. The test asserts that `branches` has not
        // changed, so adding a maintenance or prerelease branch fails CI here
        // rather than silently publishing it to the stable tag.
        publishCmd:
          'pnpm publish --no-git-checks --provenance --embed-readme ' +
          '--access public',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'pnpm-lock.yaml', 'CHANGELOG.md'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
        commitArgs: ['-S'],
        author: 'Alex Smith <asmith62378@gmail.com>',
      },
    ],
    '@semantic-release/github',
  ],
};
