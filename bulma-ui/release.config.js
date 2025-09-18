export default {
  branches: ['main'],
  tagFormat: '@allxsmith/bestax-bulma@${version}', // Ensures correct tag format for this package
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          // Only release for bulma-ui scoped commits
          { type: 'feat', scope: 'bulma-ui', release: 'minor' },
          { type: 'fix', scope: 'bulma-ui', release: 'patch' },
          { type: 'perf', scope: 'bulma-ui', release: 'patch' },
          { type: 'refactor', scope: 'bulma-ui', release: 'patch' },
          { type: 'style', scope: 'bulma-ui', release: 'patch' },

          // Breaking changes for bulma-ui
          { breaking: true, scope: 'bulma-ui', release: 'major' },

          // Explicitly ignore docs and other scopes
          { scope: 'docs', release: false },
          { scope: 'docs/*', release: false },
          { type: 'docs', release: false },
          { type: 'chore', release: false },
          { type: 'ci', release: false },
          { type: 'test', release: false },
          { type: 'build', release: false },

          // IMPORTANT: Ignore all commits without bulma-ui scope
          { type: 'feat', release: false },
          { type: 'fix', release: false },
          { type: 'perf', release: false },
          { type: 'refactor', release: false },
          { type: 'style', release: false },
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
