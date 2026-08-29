#!/usr/bin/env node
/**
 * Decide what `consumer-sbom` installs, and stamp what it actually got (#530,
 * items 1, 3 and 4; deferred from #529).
 *
 * Two questions, one script, because they are the same fact seen from either
 * side of an `npm install`:
 *
 *   spec  — which version should this matrix leg install?
 *   stamp — which version did it get, and what is the artifact called?
 *
 * ## Why `spec` exists at all (item 1)
 *
 * The job used to install the mutable `latest` dist-tag for all four packages.
 * For the ONE package a release names that is wrong twice over, and both are
 * real rather than theoretical:
 *
 *   - `release: published` fires immediately after `npm publish`, so a
 *     CDN-cached packument can resolve the PREVIOUS version. Release 5.12.0
 *     then carries an SBOM stamped 5.11.1.
 *   - A re-run days later resolves a newer `latest` and produces a different
 *     filename, which `gh release upload --clobber` cannot replace. The
 *     release ends up permanently carrying two contradictory consumer SBOMs
 *     for the same package.
 *
 * `release.tag_name` is `<pkg>@X.Y.Z` (VERSIONING.md, and the `tagFormat` in
 * each package's release.config.js), so the exact version IS available for
 * that one leg. The other three necessarily stay on `latest` — a release says
 * nothing about them, and pretending otherwise would pin them to whatever
 * happened to be current when an unrelated package shipped.
 *
 * That asymmetry is the whole reason this is not a one-line workflow change:
 * the tag has to be matched to its matrix leg, and only that leg pinned.
 *
 * ## Why `stamp` is here rather than in the YAML (rule 9, item 3)
 *
 * `assertVersion` guards a value that comes out of a published tarball — the
 * one input to this job an attacker would control if a package were
 * compromised — and it flows into `$GITHUB_OUTPUT` and from there into a YAML
 * heredoc that writes syft's config. A value containing a newline would define
 * arbitrary extra step outputs and inject syft config keys, silently
 * re-shaping the very document the job exists to produce. That is logic worth
 * testing, and `.github/CLAUDE.md` rule 9 says shell in a workflow step cannot
 * be tested where it lives.
 *
 * ## Why the basename is here (item 4)
 *
 * `bestax-consumer-sbom-<slug>-<version>` was written out four times across
 * two sbom-action steps. `artifactBasename` is now the only place it is
 * constructed, and `ARTIFACT_PREFIX` is the constant that `sign-sbom` and
 * `attach-sbom` glob on from their own jobs — they cannot read a step output
 * across a job boundary, so the prefix being pinned by a test is what keeps
 * those globs honest. Change it here and the test fails; that is the point.
 *
 * Design mirrors check-security-txt-expiry.mjs: plain node, zero npm deps,
 * pure helpers exported, main only runs when executed directly. No subprocess
 * and no network — every input is an argument or a file the install already
 * wrote, which makes every assertion testable against a temp directory.
 *
 * Usage:
 *   node scripts/consumer-sbom-meta.mjs spec  --package <pkg> --event <name> [--tag <tag>]
 *   node scripts/consumer-sbom-meta.mjs stamp --package <pkg> --slug <slug> \
 *                                             --dir <tree> [--expect <version>]
 *
 * Both modes append their results to $GITHUB_OUTPUT and echo them, so a
 * dispatch log says what happened without opening the artifact: `spec` writes
 * `spec=` and `expect=` (the latter empty unless this leg was pinned), `stamp`
 * writes `version=` and `basename=`.
 *
 * Deliberately no shell-side parsing of what this returns. An earlier draft had
 * the workflow derive `expect` from `spec` with `${spec##*@}`, which is the
 * same last-`@` split parseReleaseTag already does — reimplemented in YAML,
 * untested, one character away from being wrong for the scoped package.
 *
 * Exit codes: 0 fine,
 *             1 an assertion failed,
 *             2 bad usage — kept distinct, as in verify-attestation.mjs, so a
 *               typo'd flag is not reported as a supply-chain failure.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/**
 * The one string `sign-sbom`'s and `attach-sbom`'s globs key on. They run in
 * other jobs and download by artifact pattern, so they cannot consume the step
 * output built from this — pinning it in the test sibling is the only thing
 * standing between a rename here and an SBOM that silently stops being signed
 * or attached.
 */
export const ARTIFACT_PREFIX = 'bestax-consumer-sbom-';

/**
 * Split a release tag into the package it names and the version it carries.
 *
 * Split on the LAST `@`, not the first: `@allxsmith/bestax-bulma@5.12.0` has
 * two, and splitting on the first yields the empty package name and
 * `allxsmith/bestax-bulma@5.12.0` as a version. Three of the four packages are
 * unscoped and would hide this bug completely.
 *
 * Returns null for anything that is not `<name>@<version>` rather than
 * throwing: a tag this cannot parse is not an error, it is a release this job
 * has nothing to pin to, and the caller falls back to `latest`.
 */
export function parseReleaseTag(tag) {
  const value = String(tag ?? '').trim();
  const at = value.lastIndexOf('@');
  // `at < 1` covers both "no @ at all" and a leading @ with nothing before it,
  // which would name the empty package.
  if (at < 1) return null;

  const pkg = value.slice(0, at);
  const version = value.slice(at + 1);
  if (!pkg || !version) return null;
  return { package: pkg, version };
}

/**
 * The npm spec this matrix leg should install.
 *
 * Pinned only when a release event names THIS package. Everything else —
 * schedule, workflow_dispatch, a release for one of the sibling packages, an
 * unparsable tag — resolves `latest`, which is the correct answer for a leg no
 * release makes a claim about.
 *
 * Note what is deliberately NOT done: no attempt to guess a version for the
 * other three legs from the repository, the changelog, or the previous run. A
 * consumer SBOM describes what a consumer installs today, and today for those
 * three is whatever `latest` resolves to.
 */
export function installSpec({ package: pkg, eventName, tagName } = {}) {
  if (!pkg) throw new Error('installSpec requires a package name');
  if (eventName !== 'release') return pkg;

  const parsed = parseReleaseTag(tagName);
  if (!parsed || parsed.package !== pkg) return pkg;

  assertVersion(parsed.version, `release tag ${tagName}`);
  return `${pkg}@${parsed.version}`;
}

/**
 * Validate a version string, throwing with a message naming where it came from.
 *
 * Two checks rather than one, and both earn their place. The shape test is the
 * plausibility check — npm will not publish a non-semver version, so it should
 * never fire. The character test is the injection guard, and it is the one
 * that matters: it is what stops a newline, a `$`, or a quote reaching
 * $GITHUB_OUTPUT and syft's YAML heredoc.
 *
 * Kept permissive on purpose beyond those two: prerelease and build-metadata
 * versions (`1.2.3-rc.1`, `1.2.3+build.4`) are legitimately publishable and a
 * stricter regex would fail a real release rather than catch an attack.
 */
export function assertVersion(version, source = 'version') {
  const value = String(version ?? '');
  if (!/^\d+\.\d+\.\d+/.test(value)) {
    throw new Error(`${source} is not a semver version: "${value}"`);
  }
  if (!/^[0-9A-Za-z.+-]+$/.test(value)) {
    throw new Error(`${source} contains unexpected characters: "${value}"`);
  }
  return value;
}

/** The artifact basename both sbom-action steps use, minus the format suffix. */
export function artifactBasename(slug, version) {
  if (!slug) throw new Error('artifactBasename requires a slug');
  assertVersion(version, 'artifact version');
  return `${ARTIFACT_PREFIX}${slug}-${version}`;
}

/**
 * Read back the version npm actually installed.
 *
 * Read from the tree rather than re-resolved from the registry, so the stamp
 * cannot disagree with what was scanned. A second `npm view` seconds later can
 * legitimately return a different answer; the document describes the tree.
 */
export function readInstalledVersion(dir, pkg) {
  const manifest = path.join(dir, 'node_modules', pkg, 'package.json');
  let raw;
  try {
    raw = fs.readFileSync(manifest, 'utf8');
  } catch (err) {
    throw new Error(
      `${pkg} is not installed under ${dir} (${manifest}: ${err.code ?? err.message}). ` +
        `The install step did not do what this stamp assumes.`,
      { cause: err }
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${pkg} has an unparsable package.json: ${err.message}`, {
      cause: err,
    });
  }
  return assertVersion(parsed.version, `${pkg} package.json version`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** Parse `--flag value` argv into { mode, ...flags }; throws Error on misuse. */
export function parseArgs(argv) {
  const [mode, ...rest] = argv;
  if (mode !== 'spec' && mode !== 'stamp') {
    throw new Error(`usage: consumer-sbom-meta.mjs <spec|stamp> [flags]`);
  }
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    if (!key.startsWith('--')) throw new Error(`unexpected argument "${key}"`);
    if (i + 1 >= rest.length) throw new Error(`${key} needs a value`);
    flags[key.slice(2)] = rest[i + 1];
  }
  // Required flags are validated HERE, not in main, so a mistyped invocation
  // exits 2 like every other usage error. Checking them in main put them on
  // the assertion path, which returns 1 — and 1 is what a caller reads as "the
  // published package is wrong". Keeping the codes distinct is the whole
  // reason there are two of them.
  const required = mode === 'spec' ? ['package'] : ['package', 'slug', 'dir'];
  for (const name of required) {
    if (!flags[name]) throw new Error(`${mode} requires --${name}`);
  }
  return { mode, ...flags };
}

/** Append `key=value` lines to $GITHUB_OUTPUT (when set) and echo them. */
function emit(lines, env) {
  if (env.GITHUB_OUTPUT) {
    fs.appendFileSync(env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
  }
  for (const line of lines) console.log(line);
}

export function main(argv = process.argv.slice(2), env = process.env) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(`::error::${err.message}`);
    return 2;
  }

  try {
    if (args.mode === 'spec') {
      const spec = installSpec({
        package: args.package,
        eventName: args.event,
        tagName: args.tag,
      });
      const pinned = spec !== args.package;
      console.error(
        pinned
          ? `pinned ${args.package} to the release tag`
          : `resolving ${args.package} from the latest dist-tag`
      );
      // `expect` is what the stamp step asserts the tree against, and it is
      // written here rather than derived in the workflow so the last-`@` split
      // exists in exactly one tested place.
      emit(
        [
          `spec=${spec}`,
          `expect=${pinned ? spec.slice(args.package.length + 1) : ''}`,
        ],
        env
      );
      return 0;
    }

    const version = readInstalledVersion(args.dir, args.package);

    // The pin's free assertion: when a version was asked for, the tree must
    // carry it. Without this the pin would be a request rather than a
    // guarantee, and a registry serving something else would go unnoticed —
    // which is the failure mode the read-back existed for in the first place.
    if (args.expect && args.expect !== version) {
      throw new Error(
        `asked npm for ${args.package}@${args.expect} but the tree carries ` +
          `${version}. The document would describe a different release than ` +
          `the one it is attached to.`
      );
    }

    emit(
      [
        `version=${version}`,
        `basename=${artifactBasename(args.slug, version)}`,
      ],
      env
    );
    return 0;
  } catch (err) {
    console.error(`::error::${err.message}`);
    return 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
