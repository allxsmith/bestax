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
  headExists = true,
  skippedCount = 0,
  tagsReadable = true,
}) => {
  const problems = [];

  // The tagFormat contract comes FIRST, and runs whatever the environment is
  // doing. It is the one rule here about SOURCE rather than surroundings, so
  // the environment hatch below must not reach it — muting a violation someone
  // can fix by editing a file, because their clone is shallow, is not what that
  // flag is for.
  const comparable = [];
  for (const pkg of packages) {
    const declared = tagFormatFor(pkg.dir);
    if (declared === unreadableTagFormat) {
      problems.push(
        `${pkg.dir}/release.config.js: its \`tagFormat\` could not be read ` +
          `unambiguously, so ${pkg.name} would be compared against no tags and ` +
          `exempted in silence. Either it is not a plain string literal, or ` +
          `\`tagFormat\` appears more than once — a mention in a comment or a ` +
          `string counts, and this refuses to guess which one is live rather ` +
          `than picking the first. Leave exactly one.`
      );
      continue;
    }
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
    comparable.push(pkg);
  }

  // An EMPTY workspace list is its own answer, and it used to be one. Folding
  // it in with "the contract excluded everything" turned it into a tick — and
  // a tick is the wrong answer here, because no publishable package at all
  // means the list this reads was not built, not that there is nothing to
  // check. `release-docs-sync` reds the same state in a full run, so only
  // `--only=version-regression` saw the silence.
  if (!packages.length) {
    return [
      ...problems,
      'version-regression: no publishable packages were found, so nothing was ' +
        'compared. That is a workspace problem rather than a version one — ' +
        'check the `packages:` block in pnpm-workspace.yaml, and that the ' +
        'manifests it names are readable and not private.',
    ];
  }
  // Where the CONTRACT emptied the list, every package already carries a
  // message naming what to fix, and adding "nothing is reachable" on top would
  // send someone after their checkout instead.
  if (!comparable.length) return problems;

  // git could not answer at all — a tarball, or a broken object store. An
  // environment state like the others, reaching the hatch through the same
  // door rather than around the contract.
  if (!tagsReadable) {
    if (allowUntagged) return problems;
    return [
      ...problems,
      'version-regression: `git tag` failed, so no released version could be ' +
        'compared against. This check needs to run inside the git repository ' +
        'rather than an extracted tarball.',
    ];
  }

  if (!headExists) {
    if (allowUntagged) return problems;
    return [
      ...problems,
      'version-regression: HEAD names no commit — an unborn branch, or a fresh ' +
        '`git init` — so nothing is reachable and no released version could be ' +
        'compared against. Commit something, or re-run with `--allow-untagged`.',
    ];
  }

  // Guarded on what the DECISIONS below actually read, which is reachability,
  // not existence. Those are not the same question and a shallow clone is where
  // they part: `git fetch --tags` into a `--depth 1` checkout leaves every tag
  // present and none of them reachable, so an existence guard passes, every
  // package takes the nothing-released exit, and the check prints a tick having
  // compared nothing.
  //
  // Summed across packages rather than asked per package, which is a real limit
  // and not an oversight: one package legitimately has no tags — a new one, or
  // the `0.0.0-development` placeholder — so a per-package stop would red it on
  // every run. The cost is that a history where only SOME packages lost their
  // tags still exempts those, quietly. Nothing distinguishes that from a
  // package that was never released.
  const reachable = comparable.reduce(
    (total, pkg) => total + tagsFor(pkg.name).length,
    0
  );
  if (!reachable) {
    if (allowUntagged) return problems;
    // Several states land here and they want different fixes, so the message
    // says which one this is rather than guessing at the commonest.
    // A package excluded by the contract may have been the one holding the
    // reachable tags, so blaming the checkout there would be false about it.
    // Both channels: the contract's exclusions, and the manifests the caller
    // could not turn into packages at all. Either may be where the tags are.
    const partial = comparable.length < packages.length + skippedCount;
    const cause = !anyTagsExist
      ? 'this checkout has no tags at all'
      : partial
        ? 'none of the packages this could still compare has a tag reachable ' +
          'from HEAD — the ones excluded above may be where the tags are'
        : 'this checkout has tags but none of them is reachable from HEAD, ' +
          'which is what a shallow clone looks like — `git fetch --tags` into ' +
          'a `--depth` clone leaves every tag present and unreachable, and a ' +
          'grafted or truncated history does the same';
    return [
      ...problems,
      `version-regression: ${cause}, so no released version could be compared ` +
        'against and every package would pass without being checked. The fix ' +
        'is `git fetch --tags --unshallow`, or a full clone. If you genuinely ' +
        'cannot, re-run with `--allow-untagged`, which turns THIS rule off and ' +
        'leaves the rest of the run intact. Never pass that in CI: it is the ' +
        'difference between a gate and a tick.',
    ];
  }

  for (const pkg of comparable) {
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

/**
 * The `tagFormat` literal a release config declares, or `UNREADABLE`.
 *
 * All three literal spellings. Reading only `'…'` meant a backtick-spelled
 * format produced no entry, which is indistinguishable from having no release
 * config — so the package was exempted by the very branch written to catch it.
 *
 * AMBIGUITY is refused rather than resolved, and that is the whole of the
 * second lesson here. Taking the FIRST match let a `tagFormat` written in a
 * comment or a string outrank the real declaration below it — and the dangerous
 * direction is the decoy that happens to match what this check expects, because
 * the contract then passes, the package is compared against tags spelled the
 * OTHER way, finds none, and is skipped with no comparison and no message. A
 * silent exemption, which is the one outcome this rule exists to prevent.
 *
 * Telling a comment from code needs a tokeniser, and this file has no business
 * carrying one. Refusing to guess costs a build on a config that mentions
 * `tagFormat` twice and says exactly how to fix it, which is the right trade
 * for a rule whose failure mode is silence.
 *
 * Exported rather than inlined because the test used to re-implement this
 * pattern to assert the real configs match it, and a copy of a regex is a
 * second place for it to be wrong.
 */
export const readTagFormat = text => {
  // MENTIONS first, before asking which are literals. Counting only the
  // literal matches narrowed the decoy class without closing it: a real
  // declaration that is not a string literal — `tagFormat: build(name)` —
  // produces no match at all, which leaves a decoy in a comment unopposed and
  // sole. It then reads as the single clean declaration, and if it happens to
  // match what this check expects, the package is compared against tags spelled
  // the other way, finds none, and is exempted in silence.
  const mentions = [...text.matchAll(/\btagFormat\s*:/g)];
  if (mentions.length !== 1) return UNREADABLE;
  const matches = [
    ...text.matchAll(/tagFormat:\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g),
  ];
  if (matches.length !== 1) return UNREADABLE;
  return matches[0][2];
};

/**
 * Everything `check:conformance` does for this rule, with git and the
 * filesystem injected.
 *
 * Extracted because the invariant below was broken three times, and each fix
 * was local to the shape in front of it: the contract must be answered before
 * ANY environment state is. Ordering it inside `findVersionRegressions` cannot
 * enforce that while a caller is free to return first — which is exactly what
 * happened, two rounds after the ordering went in. With the reads injected, a
 * case can drive the whole path and the invariant is pinned rather than
 * remembered.
 *
 * @param packages [{ dir, name, version }] the publishable workspace packages
 * @param skipped  dirs whose manifest could not be read or named nothing
 * @param git      (args) => string|null, `null` when git could not answer
 * @param readConfig (dir) => Promise<string>, rejecting with ENOENT when absent
 */
export const versionRegressionProblems = async ({
  packages,
  skipped = [],
  allowUntagged = false,
  git,
  readConfig,
}) => {
  const problems = skipped.map(
    dir =>
      `${dir}/package.json could not be read, or names no package, so ${dir} ` +
      'was not compared against its released version. Fix the manifest — a ' +
      'truncated, invalid or nameless one exempts the package from this check ' +
      'entirely.'
  );

  // Read BEFORE any environment answer is acted on, and with nothing to return
  // early for: reading release configs does not need git.
  const formats = new Map();
  for (const pkg of packages) {
    let text;
    try {
      text = await readConfig(pkg.dir);
    } catch (error) {
      // ABSENT is not this check's business: `publishable-manifests.test.mjs`
      // holds a publishable package to having a release config, by loading each
      // one. Present-but-unreadable is a different thing, and collapsing the
      // two exempted a package over a permissions problem.
      if (error.code === 'ENOENT') continue;
      formats.set(pkg.dir, UNREADABLE);
      continue;
    }
    formats.set(pkg.dir, readTagFormat(text));
  }

  const all = git(['tag', '--list']);
  return [
    ...problems,
    ...findVersionRegressions({
      packages,
      allowUntagged,
      skippedCount: skipped.length,
      // PEELED to a commit. `--verify HEAD` resolves the ref without proving
      // the object is in the store, so a corrupt one answered yes here and then
      // threw out of the tag lookup, past every flag read.
      headExists:
        all !== null &&
        git(['rev-parse', '--verify', 'HEAD^{commit}']) !== null,
      // `null` means git could not answer at all, which is a different state
      // from a repository with no tags — and one the contract runs ahead of.
      tagsReadable: all !== null,
      anyTagsExist: all !== null && all.trim().length > 0,
      tagsFor: name => {
        const out = git(['tag', '--merged', 'HEAD', '--list', tagGlob(name)]);
        // A FAILED git call is not an empty answer. Collapsed into `[]` it read
        // as "never released", which exempted that one package while the run
        // still printed a tick.
        if (out === null)
          throw new Error(`git tag --merged failed for ${name}`);
        return out.split('\n').filter(Boolean);
      },
      tagFormatFor: dir => (formats.has(dir) ? formats.get(dir) : null),
      unreadableTagFormat: UNREADABLE,
    }),
  ];
};
