export default {
  branches: ['main'],
  tagFormat: 'create-bestax@${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          // Release only for create-bestax scoped commits (independent versioning)
          { type: 'feat', scope: 'create-bestax', release: 'minor' },
          { type: 'fix', scope: 'create-bestax', release: 'patch' },
          { type: 'perf', scope: 'create-bestax', release: 'patch' },
          { type: 'refactor', scope: 'create-bestax', release: 'patch' },
          { type: 'style', scope: 'create-bestax', release: 'patch' },

          // Breaking changes for create-bestax
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
