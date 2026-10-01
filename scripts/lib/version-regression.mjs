/**
 * Catch a branch that lowers an already-released version, or deletes what a
 * release wrote into its changelog.
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
 *
 * So the manifest is only a proxy for the damage, and a partial revert gets
 * past it: released sections deleted while the manifest stays at or above the
 * highest tag. The changelog is held directly as well. Every version a
 * reachable tag names must still have its section, which asks about presence
 * only, not order or content (#711).
 */

/**
 * Compare two semver strings, returning a negative number, zero, or a positive
 * number the way a sort comparator does. `null` when either side is not a
 * version this understands, which the caller has to answer for rather than
 * treat as equal.
 *
 * Written out because the repo carries no `semver` dependency and this is not
 * worth adding one for. Build metadata is ignored, per the spec. A prerelease
 * sorts BELOW the release it leads to, which is the rule that matters here: a
 * package published by hand to claim its name carries a placeholder version,
 * and treating that as newer than a real tag would exempt the package whose
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
 * A release config exists and its `tagFormat` could not be read from it.
 *
 * Distinct from `null`, which means there is no config at all. Collapsing the
 * two exempted a package whose format could not be established — the opposite
 * of what reading the format is for.
 */
export const UNREADABLE = Symbol('unreadable tagFormat');

/**
 * The tag prefix to list for a package.
 */
export const tagGlob = name => `${name}@*`;

/**
 * One semver string, as a pattern.
 */
const VERSION = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?`;

/**
 * A released section's heading, as the release tooling writes it and no
 * looser: `# [1.2.0](<compare url>) (<date>)` for a minor or major, the same at
 * `##` for a patch, `# 1.0.0 (<date>)` for a first release with nothing to
 * compare against, and a bare `## 1.0.0` from before semantic-release, which
 * the oldest bulma-ui sections still carry.
 *
 * Strict on purpose. Release notes carry commit bodies verbatim, so a looser
 * pattern could read a stray line of one as a section and pass a changelog
 * whose real section is gone. The other direction is covered by
 * `VERSION_HEADING` and `headingLikeVersion` below, so a shape this does not
 * know is named as one rather than reported as a deletion.
 */
const SECTION_HEADING = new RegExp(
  String.raw`^#{1,2} (?:\[(${VERSION})\]\([^\s()]+\)|(${VERSION}))(?: \((\d{4}-\d{2}-\d{2})\))?[ \t]*$`
);

/**
 * Any heading that OPENS with a version, read as loosely as the release
 * tooling could plausibly vary it: any depth, an optional link, `v` or
 * `<small>` in front, and anything after. Depth is what changelog templates
 * pick by release type, and some add a quoted title or wrap a patch in
 * `<small>`. A heading this reads and `SECTION_HEADING` does not is a shape to
 * teach the parser, not a section someone deleted.
 */
const VERSION_HEADING = new RegExp(
  String.raw`^ {0,3}#{1,6}[ \t]+(?:<small>[ \t]*)?\[?v?(${VERSION})`
);

/**
 * The version a heading-LIKE line opens with, for a shape neither pattern above
 * reads, or null.
 *
 * Heading-like, not any line. A version named in the body of another release's
 * notes ("reverts 5.17.0") must not pass for its section, or it would hide a
 * real deletion behind a message about heading shapes. So the line has to be a
 * heading by some markup (`#` at any depth, an HTML `<h1>` to `<h6>`, or text
 * over a setext `===` or `---` underline), or open with emphasis or an emoji
 * the way a pseudo-heading does. And the version has to open its text as a
 * whole token, after nothing but decoration, so `5.17.0-rc.1` and `15.17.0` do
 * not count for `5.17.0`.
 */
const DECORATION = String.raw`(?:\s|[*_~\[(]|<[^>]*>|\p{Extended_Pictographic}|\uFE0F)*`;
const OPENS_WITH_VERSION = new RegExp(
  String.raw`^${DECORATION}v?(${VERSION})(?![0-9A-Za-z.+-]*[0-9A-Za-z])`,
  'u'
);
const PSEUDO_HEADING = /^\s*(?:[*_~]|\p{Extended_Pictographic})/u;
const LIST_ITEM = /^\s*(?:[*+-]|\d+[.)])\s/;
const SETEXT_UNDERLINE = /^ {0,3}(?:=+|-+)[ \t]*$/;

const headingLikeVersion = (line, next = '') => {
  const atx = /^ {0,3}#{1,6}(.*)$/.exec(line);
  const html = /^\s*<h[1-6]\b[^>]*>(.*)$/i.exec(line);
  let text = null;
  if (atx) text = atx[1];
  else if (html) text = html[1];
  else if (LIST_ITEM.test(line)) return null;
  else if (line.trim() && SETEXT_UNDERLINE.test(next)) text = line;
  else if (PSEUDO_HEADING.test(line)) text = line;
  if (text === null) return null;
  return OPENS_WITH_VERSION.exec(text)?.[1] ?? null;
};

/**
 * What a CHANGELOG.md records: `versions`, every version it has a section
 * for; `released`, those whose heading has the link or date a release writes;
 * `unread`, each version that opens a heading in a shape `SECTION_HEADING`
 * does not accept but `VERSION_HEADING` does; and `mentioned`, each version a
 * heading-like line opens with in a shape neither reads. The last two map the
 * version to that line.
 *
 * A bare heading is a section wherever a tag stands behind it, which is how
 * bulma-ui's history from before semantic-release is held. It is not, on its
 * own, evidence that a package has released: a changelog seeded by hand ahead
 * of a first release looks exactly like it.
 */
export const changelogSections = text => {
  const versions = new Set();
  const released = new Set();
  const unread = new Map();
  const mentioned = new Map();
  const lines = String(text).split(/\r?\n/);
  lines.forEach((line, index) => {
    const section = SECTION_HEADING.exec(line);
    if (section) {
      const [, linked, bare, date] = section;
      versions.add(linked ?? bare);
      if (linked !== undefined || date !== undefined) {
        released.add(linked ?? bare);
      }
      return;
    }
    const heading = VERSION_HEADING.exec(line);
    if (heading) {
      if (!unread.has(heading[1])) unread.set(heading[1], line.trim());
      return;
    }
    const named = headingLikeVersion(line, lines[index + 1]);
    if (named !== null && !mentioned.has(named)) {
      mentioned.set(named, line.trim());
    }
  });
  return { versions, released, unread, mentioned };
};

/**
 * A changelog exists and could not be read.
 *
 * Distinct from `null`, which means there is no CHANGELOG.md at all: what a
 * package that has never released looks like, and exempt from everything
 * below while no tag of it is reachable either. A file that is there and cannot
 * be read establishes nothing of the kind, so it is a violation rather than an
 * exemption.
 */
export const UNREADABLE_CHANGELOG = Symbol('unreadable changelog');

/**
 * What a package's changelog records, as `changelogSections` reads it, `null`
 * when there is no changelog, `UNREADABLE_CHANGELOG` when there is one this
 * could not read.
 */
export const loadChangelog = async (dir, readChangelog) => {
  let text;
  try {
    text = await readChangelog(dir);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    return UNREADABLE_CHANGELOG;
  }
  return typeof text === 'string'
    ? changelogSections(text)
    : UNREADABLE_CHANGELOG;
};

/**
 * @param packages [{ dir, name, version }] every publishable workspace package
 * @param tagsFor (name) => string[] release tags REACHABLE FROM HEAD
 * @param anyTagsExist boolean whether the repository has any tags at all
 * @param tagFormatFor (dir) => string|null the `tagFormat` literal in that
 *   package's release config, or null when it has none to read
 * @param changelogFor (dir) => what that package's CHANGELOG.md records, as
 *   `loadChangelog` answers: `changelogSections`'s object, null, or
 *   UNREADABLE_CHANGELOG
 */
export const findVersionRegressions = ({
  packages,
  tagsFor,
  anyTagsExist,
  tagFormatFor,
  changelogFor,
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
    // A changelog that cannot be read is a file problem, so it is answered here
    // with the contract, where the hatch cannot mute it. Reported whether or
    // not the package clears the contract, since fixing a tagFormat would not
    // fix this.
    if (changelogFor(pkg.dir) === UNREADABLE_CHANGELOG) {
      problems.push(
        `${pkg.dir}/CHANGELOG.md exists but could not be read, so whether it ` +
          `still has a section for every released version of ${pkg.name} was ` +
          `not checked. Make it a readable file again.`
      );
    }
    const declared = tagFormatFor(pkg.dir);
    if (declared === unreadableTagFormat) {
      problems.push(
        `${pkg.dir}/release.config.js: its \`tagFormat\` could not be read, so ` +
          `${pkg.name} would be compared against no tags and exempted in ` +
          `silence. The config is loaded and \`tagFormat\` read off it, so this ` +
          `means it is absent, not a string, or the module would not import — ` +
          `check that the file evaluates and declares one.`
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
  // Summed across packages here, so a checkout that lost every tag gets one
  // message about the checkout rather than one per package saying the same
  // thing. The per-package question is asked in the loop below, where it can
  // tell a package that has released from one that has not.
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

  // A version list for a message: newest first, cut short past a handful.
  const newestFirst = (a, b) => compareVersions(b, a);
  const listed = versions => {
    const shown = versions.slice(0, 5).map(v => `\`${v}\``);
    const more = versions.length - shown.length;
    return shown.join(', ') + (more > 0 ? ` and ${more} more` : '');
  };

  // Packages with released sections and no reachable tag, said once after the
  // loop: a truncated clone loses several at once, and the fix is the same.
  const untagged = [];

  for (const pkg of comparable) {
    const tags = tagsFor(pkg.name);
    const changelog = changelogFor(pkg.dir);
    if (!tags.length) {
      // No tag of THIS package is reachable, while some other package's is.
      // Tags alone cannot say whether it should have one: a new package, or a
      // branch cut before its first release, has none and is fine. Its
      // changelog can, because a release writes its section in the same commit
      // its tag points at, so on a whole history the two arrive together. A
      // released section with no tag behind it means this checkout lost that
      // package's tags, or its history stops short of them, and every
      // comparison below would be skipped for it in silence.
      //
      // It asks whether ANY tag of the package is reachable, not each one, so
      // a history cut between two of its releases is compared against the
      // tags it still reaches and says nothing about the rest. A package that
      // lost its tags AND had every section deleted looks unreleased, which
      // takes a broken checkout and a broken file at once. And only headings
      // with the link or date a release writes count here, so a bare one
      // seeded by hand does not stop a new package, but one written by hand
      // with a date does.
      const recorded =
        changelog && changelog !== UNREADABLE_CHANGELOG
          ? [...changelog.released].sort(newestFirst)
          : [];
      if (!allowUntagged && recorded.length) {
        untagged.push(
          `${pkg.dir}/CHANGELOG.md (releases up to \`${recorded[0]}\`, ` +
            `no \`${tagGlob(pkg.name)}\` tag)`
        );
      }
      continue;
    }

    let highest = null;
    const released = [];
    for (const tag of tags) {
      const version = tag.slice(`${pkg.name}@`.length);
      if (compareVersions(version, version) === null) continue;
      released.push(version);
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
    } else if (order < 0) {
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

    // The damage itself, asked separately from the manifest because a partial
    // revert deletes sections and leaves the version alone. Presence only: a
    // tag reachable from HEAD says that version was released on this line, so
    // its section has to be here. Order and wording are not this check's
    // business, and neither is a section with no tag behind it.
    if (changelog === UNREADABLE_CHANGELOG) continue; // reported with the contract
    if (changelog === null) {
      problems.push(
        `${pkg.dir}/CHANGELOG.md does not exist, but release tags of ` +
          `${pkg.name} are reachable from HEAD, up to \`${highest}\`. Every ` +
          `released section it held is gone, and nothing rebuilds one. Restore ` +
          `it from \`origin/main\`, or from the release that last wrote it: ` +
          `\`git show ${pkg.name}@${highest}:${pkg.dir}/CHANGELOG.md\`.`
      );
      continue;
    }
    const missing = released
      .filter(v => !changelog.versions.has(v))
      .sort(newestFirst);
    // A missing version that still opens a heading was not deleted. Its
    // heading is in a shape the parser does not accept, which is what drift in
    // the release tooling looks like, and restoring the file would not help.
    // One that only a heading-like line names is probably the same thing in a
    // shape neither pattern knows yet. Only a version no such line names is
    // called deleted.
    const misread = missing.filter(v => changelog.unread.has(v));
    const unknown = missing.filter(
      v => !changelog.unread.has(v) && changelog.mentioned.has(v)
    );
    const deleted = missing.filter(
      v => !changelog.unread.has(v) && !changelog.mentioned.has(v)
    );
    if (misread.length) {
      problems.push(
        `${pkg.dir}/CHANGELOG.md has a heading for ${listed(misread)} that ` +
          `does not read as a released section: ` +
          `\`${changelog.unread.get(misread[0])}\`. The section is there, so ` +
          `this is not a deletion. \`SECTION_HEADING\` in ` +
          `scripts/lib/version-regression.mjs does not accept that shape: if ` +
          `the release tooling now writes headings that way, teach it the new ` +
          `one, and if the heading was edited by hand, restore it from ` +
          `\`origin/main\`.`
      );
    }
    if (unknown.length) {
      problems.push(
        `${pkg.dir}/CHANGELOG.md names ${listed(unknown)} in a line that ` +
          `looks like a heading, ` +
          `\`${changelog.mentioned.get(unknown[0])}\`, but in a shape neither ` +
          `\`SECTION_HEADING\` nor \`VERSION_HEADING\` in ` +
          `scripts/lib/version-regression.mjs reads. That is more likely a ` +
          `change in heading shape than a deletion: if the release tooling ` +
          `now writes headings that way, teach \`SECTION_HEADING\` to read it ` +
          `and \`VERSION_HEADING\` to recognise it, and if the heading was ` +
          `edited by hand, restore it from \`origin/main\`.`
      );
    }
    if (deleted.length) {
      problems.push(
        `${pkg.dir}/CHANGELOG.md has no section for ${listed(deleted)}, ` +
          `though ${deleted.length === 1 ? 'its tag is' : 'their tags are'} ` +
          `reachable from HEAD: released on this line, and deleted since. ` +
          `Nothing rebuilds a released section, because the next release ` +
          `writes above the gap. Restore ` +
          `${deleted.length === 1 ? 'it' : 'them'} from \`origin/main\`, or ` +
          `from the release that wrote ` +
          `${deleted.length === 1 ? 'it' : 'the newest'}: ` +
          `\`git show ${pkg.name}@${deleted[0]}:${pkg.dir}/CHANGELOG.md\`.`
      );
    }
  }

  if (untagged.length) {
    const one = untagged.length === 1;
    problems.push(
      'version-regression: ' +
        (one
          ? 'this changelog records releases, but no tag of its package is ' +
            'reachable from HEAD, so neither its version nor its changelog ' +
            'could be compared: '
          : 'these changelogs record releases, but no tag of their package is ' +
            'reachable from HEAD, so none of those versions or changelogs ' +
            'could be compared: ') +
        `${untagged.join('; ')}. A release writes its section in the commit ` +
        `its tag points at, so on a whole history the two arrive together: ` +
        `this checkout is missing those tags, or its history stops short of ` +
        `them. The fix is \`git fetch --tags\` (with \`--unshallow\` in a ` +
        `shallow clone), or a full clone. If you genuinely cannot, re-run ` +
        `with \`--allow-untagged\`, which turns THIS rule off and leaves the ` +
        `rest of the run intact. Never pass that in CI.`
    );
  }

  return problems;
};

/**
 * The `tagFormat` a release config actually declares, read off the evaluated
 * module. `UNREADABLE` when it declares one this cannot use, `null` when there
 * is no config at all.
 *
 * This replaced a regex over the file text, twice, and the second replacement
 * was still wrong. Text-matching has a ceiling here and the ceiling is not a
 * spelling problem: the declared value need not be a literal in that file at
 * all. Five shapes got past the last version, every one of them silently —
 *
 *   { ["tagFormat"]: build(name) }   no colon after the identifier
 *   { "tagFormat": build(name) }     likewise
 *   { ...base }                      the declaration is in another file
 *   export { default } from …        likewise
 *   tagFormat: "pkg@" + SUFFIX       one mention, one literal, wrong value
 *
 * — and the last needs no decoy beside it, which is what settles it: there is
 * no ambiguity to refuse, the count is exactly one, and the answer is wrong.
 * Widening the pattern closes the first two at the cost of red-lining any
 * comment that says the word, and does nothing for the rest.
 *
 * Reading the module is authoritative for all five, and the repo already does
 * it: `scripts/lib/release-config.mjs` imports these same files and
 * `publishable-manifests.test.mjs` loads all five on every run. That is not the
 * mistake `publishable-manifests` records — that one was inferring a verdict
 * from plugin SHAPES it might not recognise, and this is one top-level scalar,
 * neither inferred nor a shape.
 *
 * The import is caught, so a config with a syntax error becomes `UNREADABLE`
 * rather than a throw out of the middle of the run.
 */
export const loadTagFormat = async (dir, importConfig) => {
  let config;
  try {
    const module = await importConfig(dir);
    config = module?.default;
  } catch (error) {
    // ABSENT is not this check's business: `publishable-manifests.test.mjs`
    // holds a publishable package to having a release config, by loading each
    // one. Anything else — a syntax error, a throwing import — is a config this
    // cannot read, which is a violation rather than an exemption.
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    return UNREADABLE;
  }
  const declared = config?.tagFormat;
  return typeof declared === 'string' ? declared : UNREADABLE;
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
 * @param importConfig (dir) => Promise<module>, rejecting with
 *   ERR_MODULE_NOT_FOUND when the package has no release config
 * @param readChangelog (dir) => Promise<string>, the text of that package's
 *   CHANGELOG.md, rejecting with ENOENT when it has none
 */
export const versionRegressionProblems = async ({
  packages,
  skipped = [],
  allowUntagged = false,
  git,
  importConfig,
  readChangelog,
}) => {
  const problems = skipped.map(
    dir =>
      `${dir}/package.json could not be read, or names no package, so ${dir} ` +
      'was not compared against its released version. Fix the manifest — a ' +
      'truncated, invalid or nameless one exempts the package from this check ' +
      'entirely.'
  );

  // Read BEFORE any environment answer is acted on, and with nothing to return
  // early for: loading release configs and changelogs does not need git.
  const formats = new Map();
  const changelogs = new Map();
  for (const pkg of packages) {
    const declared = await loadTagFormat(pkg.dir, importConfig);
    if (declared !== null) formats.set(pkg.dir, declared);
    changelogs.set(pkg.dir, await loadChangelog(pkg.dir, readChangelog));
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
      changelogFor: dir => changelogs.get(dir),
      unreadableTagFormat: UNREADABLE,
    }),
  ];
};
