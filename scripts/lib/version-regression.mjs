/**
 * Catch a branch that lowers an already-released version.
 *
 * Not by editing the version — nobody does that on purpose. By `git reset
 * --soft` onto `origin/main` with a pre-release working tree, which re-stages
 * the whole older tree CONSISTENTLY: manifest, changelog and generated index
 * all agreeing with each other at the wrong version. That coherence is what
 * made it invisible. The one gate with an opinion about versions,
 * `gen:mcp:check`, regenerates the index from the manifest and diffs it, so
 * lowering the manifest alone goes red — and lowering both does not (#705).
 *
 * The npm side survives this: semantic-release reads git tags, not the
 * manifest, so the next release still computes from the tag and writes the
 * right version back. What does not survive is the changelog. That plugin
 * PREPENDS, so a released section deleted and merged is gone — the next release
 * writes above the gap and nothing reconstructs it.
 */

/**
 * Compare two semver strings, returning a negative number, zero, or a positive
 * number the way a sort comparator does. `null` when either side is not a
 * version this understands, which the caller has to answer for rather than
 * treat as equal.
 *
 * Written out because the repo carries no `semver` dependency and this is not
 * worth adding one for. Build metadata is ignored, per the spec. A prerelease
 * sorts BELOW the release it leads to, which is the rule that matters here:
 * `eslint-plugin` sits at `0.0.0-development` as a deliberate placeholder, and
 * treating that as newer than a real tag would exempt the one package whose
 * version is least trustworthy.
 */
export const compareVersions = (a, b) => {
  const parse = value => {
    const match =
      /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(
        String(value).trim()
      );
    return match
      ? { core: [+match[1], +match[2], +match[3]], pre: match[4] }
      : null;
  };
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return null;
  for (let i = 0; i < 3; i += 1) {
    if (left.core[i] !== right.core[i]) return left.core[i] - right.core[i];
  }
  if (left.pre === undefined && right.pre === undefined) return 0;
  if (left.pre === undefined) return 1;
  if (right.pre === undefined) return -1;
  const leftParts = left.pre.split('.');
  const rightParts = right.pre.split('.');
  for (let i = 0; i < Math.max(leftParts.length, rightParts.length); i += 1) {
    const one = leftParts[i];
    const two = rightParts[i];
    // A shorter prerelease sorts below an otherwise equal longer one.
    if (one === undefined) return -1;
    if (two === undefined) return 1;
    const oneNumeric = /^\d+$/.test(one);
    const twoNumeric = /^\d+$/.test(two);
    if (oneNumeric && twoNumeric) {
      if (+one !== +two) return +one - +two;
    } else if (oneNumeric !== twoNumeric) {
      // Numeric identifiers sort below alphanumeric ones.
      return oneNumeric ? -1 : 1;
    } else if (one !== two) {
      return one < two ? -1 : 1;
    }
  }
  return 0;
};

/**
 * The `tagFormat` every release config here spells, for a package name.
 *
 * Derived from the name rather than read from the release config, because
 * parsing semantic-release's config format is how `publishable-manifests` got
 * four separate rules wrong. The check below still HOLDS each config to this
 * string — a cheap text match, not an evaluation — so a package that adopts a
 * different format fails loudly here instead of quietly matching no tags and
 * being exempted.
 */
export const expectedTagFormat = name => `${name}@\${version}`;

/**
 * The tag prefix to list for a package.
 */
export const tagGlob = name => `${name}@*`;

/**
 * @param packages [{ dir, name, version }] every publishable workspace package
 * @param tagsFor (name) => string[] release tags REACHABLE FROM HEAD
 * @param anyTagsExist boolean whether the repository has any tags at all
 * @param tagFormatFor (dir) => string|null the `tagFormat` literal in that
 *   package's release config, or null when it has none to read
 */
export const findVersionRegressions = ({
  packages,
  tagsFor,
  anyTagsExist,
  tagFormatFor,
}) => {
  const problems = [];

  // Without tags every package below matches nothing and passes, which is worse
  // than not running at all: a green check that asked no question. CI checkouts
  // are shallow by default and `fetch-depth: 0` does not imply tags, so this is
  // the likely way for it to happen rather than an exotic one.
  if (!anyTagsExist) {
    return [
      'version-regression: the repository has no tags, so no released ' +
        'version could be compared against and every package passed without ' +
        'being checked. Fetch tags before running this — in CI that is ' +
        '`fetch-depth: 0` AND tags on the checkout step; locally, ' +
        '`git fetch --tags`. This is deliberately an error rather than a skip, ' +
        'because a check that silently answers nothing is worse than an absent one.',
    ];
  }

  for (const pkg of packages) {
    const declared = tagFormatFor(pkg.dir);
    const expected = expectedTagFormat(pkg.name);
    if (declared !== null && declared !== expected) {
      problems.push(
        `${pkg.dir}/release.config.js: tagFormat is \`${declared}\`, but this ` +
          `check looks for \`${expected}\`, so it would compare against no ` +
          `tags and exempt ${pkg.name} silently. Either restore the ` +
          `\`<name>@\${version}\` form the other packages use, or teach ` +
          `scripts/lib/version-regression.mjs the new one.`
      );
      continue;
    }

    const tags = tagsFor(pkg.name);
    // A package with no tag reachable from here has not been released on this
    // line — a new package, or a branch cut before its first release. Nothing
    // to regress against.
    if (!tags.length) continue;

    let highest = null;
    for (const tag of tags) {
      const version = tag.slice(`${pkg.name}@`.length);
      if (compareVersions(version, version) === null) continue;
      if (highest === null || compareVersions(version, highest) > 0) {
        highest = version;
      }
    }
    if (highest === null) {
      problems.push(
        `${pkg.dir}: ${tags.length} tag(s) match \`${tagGlob(pkg.name)}\` but ` +
          `none carries a version this can read, so nothing was compared. ` +
          `Tags seen: ${tags.slice(0, 3).join(', ')}.`
      );
      continue;
    }

    const order = compareVersions(pkg.version, highest);
    if (order === null) {
      problems.push(
        `${pkg.dir}/package.json: version \`${pkg.version}\` is not a version ` +
          `this can compare, so it could not be held against the released ` +
          `\`${highest}\`.`
      );
      continue;
    }
    if (order < 0) {
      problems.push(
        `${pkg.dir}/package.json: version is \`${pkg.version}\`, which is ` +
          `BELOW \`${highest}\` — already released, and tagged in this ` +
          `branch's own history. Publishing is unaffected, because ` +
          `semantic-release computes the next version from the tag; what does ` +
          `not recover is CHANGELOG.md, whose released sections are prepended ` +
          `and never rebuilt, so any deleted here are gone for good. This is ` +
          `what a \`git reset --soft\` over a pre-release working tree ` +
          `produces. Restore the version, the changelog entries, and any ` +
          `generated file stamped from them (\`pnpm gen:mcp\`) from ` +
          `\`origin/main\`.`
      );
    }
  }

  return problems;
};
