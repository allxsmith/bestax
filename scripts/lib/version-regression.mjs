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
    // Kept as STRINGS. `Number` loses precision past 2^53, which made
    // `9007199254740992.0.0` and `…93.0.0` compare equal — and equal is the one
    // answer that matters here, because a manifest matching the highest tag is
    // exactly what this check waves through. Absurd version numbers, but the
    // failure is silent and comparing digits costs nothing.
    return match
      ? { core: [match[1], match[2], match[3]], pre: match[4] }
      : null;
  };
  // Semver compares numeric identifiers numerically, which for arbitrary-length
  // digit strings is length first and then lexically, once leading zeros are
  // discounted.
  const compareNumeric = (a, b) => {
    const x = a.replace(/^0+(?=\d)/, '');
    const y = b.replace(/^0+(?=\d)/, '');
    if (x.length !== y.length) return x.length - y.length;
    return x < y ? -1 : x > y ? 1 : 0;
  };
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return null;
  for (let i = 0; i < 3; i += 1) {
    const order = compareNumeric(left.core[i], right.core[i]);
    if (order !== 0) return order;
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
      const order = compareNumeric(one, two);
      if (order !== 0) return order;
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
 * A release config was found and its `tagFormat` could not be read from it.
 *
 * Distinct from `null`, which means there is no config at all. Collapsing the
 * two exempted a package whose format this could not parse — the opposite of
 * what reading the format is for.
 */
export const UNREADABLE = Symbol('unreadable tagFormat');

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
  allowUntagged = false,
  unreadableTagFormat = UNREADABLE,
}) => {
  const problems = [];

  // Guarded on what the DECISIONS below actually read, which is reachability,
  // not existence. Those are not the same question and a shallow clone is where
  // they part: `git fetch --tags` into a `--depth 1` checkout leaves every tag
  // present and none of them reachable, so an existence guard passes, every
  // package takes the nothing-released exit, and the check prints a tick having
  // compared nothing. That is the exact vacuous pass this guard was written to
  // stop, waved through by asking the wrong question one line earlier.
  const reachable = packages.reduce(
    (total, pkg) => total + tagsFor(pkg.name).length,
    0
  );
  if (!reachable) {
    // An ERROR, not a skip, because a check that silently answers nothing is
    // worse than an absent one — but an error with a way out, which every other
    // rule in this file has and this one did not. The two ways to reach it are
    // both environmental and neither is fixable by editing source, and it sits
    // early in `pnpm all`'s `&&` chain, where one failure takes the rest of the
    // gates down with it.
    if (allowUntagged) return [];
    // The two ways to get here read almost identically and want different
    // fixes, so the message says which one happened.
    const cause = anyTagsExist
      ? 'this checkout has tags but none of them is reachable from HEAD, ' +
        'which is what a shallow clone looks like — `git fetch --tags` into a ' +
        '`--depth` clone leaves every tag present and unreachable'
      : 'this checkout has no tags at all';
    return [
      `version-regression: ${cause}, so no released version could be compared ` +
        'against and every package would pass without being checked. The fix ' +
        'is `git fetch --tags --unshallow`, or a full clone. If you genuinely ' +
        'cannot, re-run with `--allow-untagged`, which turns THIS rule off and ' +
        'leaves the rest of the run intact. Never pass that in CI: it is the ' +
        'difference between a gate and a tick.',
    ];
  }

  for (const pkg of packages) {
    const declared = tagFormatFor(pkg.dir);
    const expected = expectedTagFormat(pkg.name);
    if (declared === unreadableTagFormat) {
      problems.push(
        `${pkg.dir}/release.config.js: a \`tagFormat\` is declared in a form ` +
          `this cannot read, so ${pkg.name} would be compared against no tags ` +
          `and exempted in silence. Spell it as a plain literal, or teach ` +
          `scripts/lib/version-regression.mjs the form it uses.`
      );
      continue;
    }
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
