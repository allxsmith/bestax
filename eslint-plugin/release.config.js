import { pnpmPublishPlugins } from '../scripts/lib/pnpm-publish.mjs';

export default {
  branches: ['main'],
  tagFormat: '@allxsmith/eslint-plugin-bestax@${version}',
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
          // Any commit scoped to something other than eslint-plugin never
          // releases this package. Without this, commits matching no rule
          // fall back to the angular defaults and would bump this package
          // too. (Does not match unscoped commits — a scope on releasing
          // types is enforced by commitlint instead.)
          { scope: '!(eslint-plugin)', release: false },

          // eslint-plugin releases. Breaking changes need a "BREAKING CHANGE:"
          // footer — the angular preset does not parse "feat(x)!:".
          { breaking: true, scope: 'eslint-plugin', release: 'major' },
          { type: 'feat', scope: 'eslint-plugin', release: 'minor' },
          { type: 'fix', scope: 'eslint-plugin', release: 'patch' },
          { type: 'perf', scope: 'eslint-plugin', release: 'patch' },
          { type: 'refactor', scope: 'eslint-plugin', release: 'patch' },
          { type: 'style', scope: 'eslint-plugin', release: 'patch' },

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
    // Publishing goes to `pnpm publish` rather than `npm publish` (#436, #532).
    // The two plugins are one decision and every flag they pass is load-bearing
    // in a way that fails quietly, so both live in the helper with the reasons.
    ...pnpmPublishPlugins(import.meta.dirname),
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
    [
      '@semantic-release/github',
      {
        // The other four configs pass this plugin bare. This one does not,
        // and the difference is the first release rather than the package.
        //
        // With no `@allxsmith/eslint-plugin-bestax@*` tag there is no
        // `lastRelease`, so the first run's commit range is the whole
        // repository history. The scope in `releaseRules` above does not
        // narrow it — those rules decide the release TYPE, not which commits
        // land in `context.commits` — which the repo demonstrates on itself:
        // bestax-migrate's own changelog carries `**bulma-ui:**` entries.
        //
        // Left bare, `@semantic-release/github` then walks that range for
        // associated PRs and issues and, on each, posts "This PR is included
        // in version 1.0.0" and adds a `released` label. Every one of those
        // is a false claim about a PR that predates this package, it is not
        // reversible, and each is a comment event in a repository with
        // comment-triggered automation. The first releases of the other three
        // packages did exactly that — PR #300 carries four such notices, two
        // of them from 1.0.0 releases of packages it has nothing to do with.
        //
        // Precedent for the noise is not a reason to add more of it, and the
        // asymmetry decides it: not commenting can be undone later, whereas
        // commenting on the whole history cannot. Restoring the default is a
        // one-line change once a tag exists and the range is bounded to this
        // package's own commits — #706 tracks that.
        // `successCommentCondition: false`, not `successComment: false`.
        // Both skip the walk in 12.0.9 — `success.js` branches on each — but
        // the second logs "DEPRECATION: 'false' for 'successComment' is
        // deprecated and will be removed in a future major version. Use
        // 'successCommentCondition' instead." A removal there would restore
        // the default template and reinstate exactly the commenting this
        // block exists to prevent, silently, on a version bump.
        successCommentCondition: false,
        // Redundant while the comment skip stands, because 12.0.9 applies the
        // label inside the comment's own try block, so no comment means no
        // label. Kept because that coupling is an implementation detail of
        // one version rather than a contract, and this is the option that
        // says what is wanted if a later version separates them.
        releasedLabels: false,
      },
    ],
  ],
};
