export default {
  branches: ['main'],
  tagFormat: '@allxsmith/bestax-bulma@${version}', // Ensures correct tag format for this package
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          // Explicitly ignore create-bestax scoped commits (including breaking changes)
          { scope: 'create-bestax', release: false },
          { breaking: true, scope: 'create-bestax', release: false },

          // Release only for bulma-ui scoped commits (independent versioning)
          { type: 'feat', scope: 'bulma-ui', release: 'minor' },
          { type: 'fix', scope: 'bulma-ui', release: 'patch' },
          { type: 'perf', scope: 'bulma-ui', release: 'patch' },
          { type: 'refactor', scope: 'bulma-ui', release: 'patch' },
          { type: 'style', scope: 'bulma-ui', release: 'patch' },

          // Breaking changes for bulma-ui
          { breaking: true, scope: 'bulma-ui', release: 'major' },

          // Explicitly ignore docs and other scopes
          { scope: 'docs', release: false },
          { type: 'docs', release: false },
          { type: 'chore', release: false },
          { type: 'ci', release: false },
          { type: 'test', release: false },
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
