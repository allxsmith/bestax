export default {
  branches: ['main'],
  tagFormat: '@allxsmith/bestax-bulma@${version}', // Ensures correct tag format for this package
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          // Release for BOTH bulma-ui AND create-bestax scoped commits (synchronized versioning)
          { type: 'feat', scope: 'bulma-ui', release: 'minor' },
          { type: 'fix', scope: 'bulma-ui', release: 'patch' },
          { type: 'perf', scope: 'bulma-ui', release: 'patch' },
          { type: 'refactor', scope: 'bulma-ui', release: 'patch' },
          { type: 'style', scope: 'bulma-ui', release: 'patch' },

          // Also release for create-bestax changes (keeps versions in sync)
          { type: 'feat', scope: 'create-bestax', release: 'minor' },
          { type: 'fix', scope: 'create-bestax', release: 'patch' },
          { type: 'perf', scope: 'create-bestax', release: 'patch' },
          { type: 'refactor', scope: 'create-bestax', release: 'patch' },
          { type: 'style', scope: 'create-bestax', release: 'patch' },

          // Breaking changes for either package
          { breaking: true, scope: 'bulma-ui', release: 'major' },
          { breaking: true, scope: 'create-bestax', release: 'major' },

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
