export default {
  branches: ['main'],
  tagFormat: '@allxsmith/bestax-bulma@${version}', // Ensures correct tag format for this package
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
          // Any commit scoped to something other than bulma-ui never
          // releases this package. (Does not match unscoped commits — a
          // scope on releasing types is enforced by commitlint instead.)
          { scope: '!(bulma-ui)', release: false },

          // bulma-ui releases. Breaking changes need a "BREAKING CHANGE:"
          // footer — the angular preset does not parse "feat(x)!:" headers.
          { breaking: true, scope: 'bulma-ui', release: 'major' },
          { type: 'feat', scope: 'bulma-ui', release: 'minor' },
          { type: 'fix', scope: 'bulma-ui', release: 'patch' },
          { type: 'perf', scope: 'bulma-ui', release: 'patch' },
          { type: 'refactor', scope: 'bulma-ui', release: 'patch' },
          { type: 'style', scope: 'bulma-ui', release: 'patch' },

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
        assets: ['package.json', 'package-lock.json', 'CHANGELOG.md'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
        commitArgs: ['-S'],
        author: 'Alex Smith <asmith62378@gmail.com>',
      },
    ],
    '@semantic-release/github',
  ],
};
