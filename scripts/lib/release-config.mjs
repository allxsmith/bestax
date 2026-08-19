/**
 * Reading a package's semantic-release exec options (#436).
 *
 * Used only by the tests, and deliberately NOT by
 * scripts/check-conformance.mjs: the check decides which packages publish with
 * pnpm from an explicit declaration, precisely so that no verdict depends on
 * parsing this format. Here the shape is asserted rather than inferred, so a
 * config that does not match throws, and a throw is a failed test.
 *
 * One copy, because there were four: three in publishable-manifests.test.mjs
 * and one in npm-release-info.test.mjs, each re-deriving the same lookup and
 * each dereferencing `[1]` without checking it found anything.
 */
const EXEC = '@semantic-release/exec';

/**
 * Understands the three plugin shapes semantic-release accepts, because two of
 * them are shapes check-conformance.mjs records as historical misses. Returns
 * null when the plugin genuinely is not there, and THROWS when it is there in
 * a form this cannot read — the caller is asserting things about that config,
 * so degrading to `{}` would turn a real assertion into a vacuous pass.
 */
export async function execOptions(dir) {
  const { default: config } = await import(`../../${dir}/release.config.js`);
  const plugins = config.plugins ?? [];

  for (const p of plugins) {
    if (typeof p === 'string') {
      if (p === EXEC) {
        throw new Error(
          `${dir}/release.config.js declares ${EXEC} with no options; there is ` +
            'nothing to read.'
        );
      }
      continue;
    }
    if (Array.isArray(p) && p[0] === EXEC) return p[1] ?? {};
    if (p && typeof p === 'object' && p.path === EXEC) {
      // eslint-disable-next-line no-unused-vars
      const { path: _path, ...options } = p;
      return options;
    }
  }
  return null;
}

/** The `branches` a package releases from. */
export async function releaseBranches(dir) {
  const { default: config } = await import(`../../${dir}/release.config.js`);
  return config.branches;
}
