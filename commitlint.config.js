// Types that trigger a semantic-release in the per-package release configs
// (bulma-ui/release.config.js, create-bestax/release.config.js). Those
// configs key releases off the scope, and unscoped commits of these types
// would fall back to the angular defaults and bump BOTH packages — so a
// recognized scope is mandatory here.
const RELEASE_TYPES = ['feat', 'fix', 'perf', 'refactor', 'style'];
const RELEASE_SCOPES = ['bulma-ui', 'docs', 'create-bestax', 'bestax-migrate'];

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'release-scope-required': ({ type, scope }) => {
          if (!RELEASE_TYPES.includes(type)) return [true];
          if (RELEASE_SCOPES.includes(scope)) return [true];
          return [
            false,
            `commits of type "${type}" affect package releases and must use one of these scopes: ${RELEASE_SCOPES.join(', ')}`,
          ];
        },
      },
    },
  ],
  // semantic-release's @semantic-release/git makes a "chore(release): <version>
  // [skip ci]" commit whose body is the full changelog (long lines, URLs). That
  // machine commit must not be linted — otherwise the husky commit-msg hook
  // (installed in CI by `npm ci`) fails the release on body/footer-max-line-length.
  ignores: [message => message.startsWith('chore(release):')],
  rules: {
    'release-scope-required': [2, 'always'],
  },
};
