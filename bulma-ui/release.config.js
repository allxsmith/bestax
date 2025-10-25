export default {
  branches: ['main'],
  tagFormat: '@allxsmith/bestax-bulma@${version}', // Ensures correct tag format for this package
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          // FIRST: Explicitly ignore ALL create-bestax commits (must be first to take precedence)
          { type: 'feat', scope: 'create-bestax', release: false },
          { type: 'fix', scope: 'create-bestax', release: false },
          { type: 'docs', scope: 'create-bestax', release: false },
          { type: 'style', scope: 'create-bestax', release: false },
          { type: 'refactor', scope: 'create-bestax', release: false },
          { type: 'perf', scope: 'create-bestax', release: false },
          { type: 'test', scope: 'create-bestax', release: false },
          { type: 'chore', scope: 'create-bestax', release: false },
          { type: 'build', scope: 'create-bestax', release: false },
          { type: 'ci', scope: 'create-bestax', release: false },
          { breaking: true, scope: 'create-bestax', release: false },
          { scope: 'create-bestax', release: false }, // Catch-all for create-bestax

          // Release ONLY for bulma-ui scoped commits
          { type: 'feat', scope: 'bulma-ui', release: 'minor' },
          { type: 'fix', scope: 'bulma-ui', release: 'patch' },
          { type: 'perf', scope: 'bulma-ui', release: 'patch' },
          { type: 'refactor', scope: 'bulma-ui', release: 'patch' },
          { type: 'style', scope: 'bulma-ui', release: 'patch' },
          { breaking: true, scope: 'bulma-ui', release: 'major' },

          // Ignore all other scopes and types (no release unless explicitly bulma-ui scoped)
          { scope: 'docs', release: false },
          { scope: '*', release: false }, // Ignore any other scope
          { type: 'docs', release: false },
          { type: 'chore', release: false },
          { type: 'ci', release: false },
          { type: 'test', release: false },
          { type: 'build', release: false },
          { type: '*', release: false }, // Ignore any other type
          { breaking: true, release: false }, // Ignore all other breaking changes
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
