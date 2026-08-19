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
export async function execOptions(dir) {
  const { default: config } = await import(`../../${dir}/release.config.js`);
  const entry = (config.plugins ?? []).find(
    p => Array.isArray(p) && p[0] === '@semantic-release/exec'
  );
  return entry?.[1] ?? {};
}

/** The `branches` a package releases from. */
export async function releaseBranches(dir) {
  const { default: config } = await import(`../../${dir}/release.config.js`);
  return config.branches;
}
