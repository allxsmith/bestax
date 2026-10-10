import { pnpmPublishPlugins } from '../scripts/lib/pnpm-publish.mjs';

export default {
  branches: ['main'],
  tagFormat: 'bestax-mcp@${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        // commit-analyzer checks every rule against each commit, in this
        // order, so rules are not first-match-wins. A matching
        // `release: false` replaces whatever matched above it, a release type
        // matching after a `false` replaces the `false`, the higher of two
        // release types stays, and `major` ends the walk. So the place of a
        // rule in this list can decide a commit, which the bulma-ui group at
        // the end depends on. Values are micromatch globs, hence the negated
        // glob below.
        releaseRules: [
          // Any commit scoped to something other than bestax-mcp or bulma-ui
          // never releases this package. Without this, commits matching no
          // rule fall back to the angular defaults and would bump this
          // package too. bulma-ui is left out because its commits can release
          // this package (the group at the end), so this `false` never meets
          // them and its place in the list decides nothing. (Does not match
          // unscoped commits: a scope on releasing types is enforced by
          // commitlint instead.)
          { scope: '!(bestax-mcp|bulma-ui)', release: false },

          // bestax-mcp releases. Breaking changes need a "BREAKING CHANGE:"
          // footer, since the angular preset does not parse "feat(x)!:".
          { breaking: true, scope: 'bestax-mcp', release: 'major' },
          { type: 'feat', scope: 'bestax-mcp', release: 'minor' },
          { type: 'fix', scope: 'bestax-mcp', release: 'patch' },
          { type: 'perf', scope: 'bestax-mcp', release: 'patch' },
          { type: 'refactor', scope: 'bestax-mcp', release: 'patch' },
          { type: 'style', scope: 'bestax-mcp', release: 'patch' },

          // Types that release nothing, in any scope, unless a
          // "BREAKING CHANGE:" footer brings in a breaking rule: the
          // bestax-mcp `major` above ends the walk before these, and the
          // bulma-ui rule below comes after them.
          { type: 'docs', release: false },
          { type: 'test', release: false },
          { type: 'chore', release: false },
          { type: 'ci', release: false },
          { type: 'build', release: false },

          // Every commit that releases bulma-ui releases this package too,
          // as a patch (#932). data/ indexes the library, so it ships when
          // the library does: the release job regenerates it after bulma-ui's
          // release and before this one, and this one packs it. These are
          // the commits bulma-ui/release.config.js releases on, and
          // scripts/release-rules.test.mjs holds the two lists together.
          //
          // Patch whatever bulma-ui's own bump, a major included. The
          // server's tools and prompts stay as they were and only what they
          // answer from moves, and a major here would leave every
          // `bestax-mcp@1` install and listing behind.
          //
          // Last on purpose, for the breaking rule. bulma-ui releases a major
          // for a breaking commit of any type, `build` and `chore` included,
          // because its `major` ends the walk before the type's
          // `release: false`. A patch ends nothing, so above the
          // non-releasing types the breaking rule would lose to that `false`,
          // and a library major would ship no index.
          { type: 'feat', scope: 'bulma-ui', release: 'patch' },
          { type: 'fix', scope: 'bulma-ui', release: 'patch' },
          { type: 'perf', scope: 'bulma-ui', release: 'patch' },
          { type: 'refactor', scope: 'bulma-ui', release: 'patch' },
          { type: 'style', scope: 'bulma-ui', release: 'patch' },
          { breaking: true, scope: 'bulma-ui', release: 'patch' },
        ],
      },
    ],
    // The notes list the feat, fix and perf commits since the last
    // bestax-mcp tag whatever their scope, so a release the rules above take
    // from bulma-ui lists bulma-ui's commits. Left that way: they are what
    // the new index documents. A breaking one lands under BREAKING CHANGES
    // in a patch, and that heading then describes the library, not this
    // server.
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
    '@semantic-release/github',
  ],
};
