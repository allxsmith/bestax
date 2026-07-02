export default {
  branches: ['main'],
  tagFormat: 'create-bestax@${version}',
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
          // Any commit scoped to something other than create-bestax never
          // releases this package. Without this, commits matching no rule
          // fall back to the angular defaults — feat(bulma-ui) commits used
          // to minor-bump this package. (Does not match unscoped commits — a
          // scope on releasing types is enforced by commitlint instead.)
          { scope: '!(create-bestax)', release: false },

          // create-bestax releases. Breaking changes need a "BREAKING
          // CHANGE:" footer — the angular preset does not parse "feat(x)!:".
          { breaking: true, scope: 'create-bestax', release: 'major' },
          { type: 'feat', scope: 'create-bestax', release: 'minor' },
          { type: 'fix', scope: 'create-bestax', release: 'patch' },
          { type: 'perf', scope: 'create-bestax', release: 'patch' },
          { type: 'refactor', scope: 'create-bestax', release: 'patch' },
          { type: 'style', scope: 'create-bestax', release: 'patch' },

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
    [
      '@semantic-release/npm',
      {
        pkgRoot: '.',
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
