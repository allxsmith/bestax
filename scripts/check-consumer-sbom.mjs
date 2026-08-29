#!/usr/bin/env node
/**
 * Assert that a generated consumer-closure SBOM still describes a consumer
 * closure (#530 item 2, deferred from #529).
 *
 * ## What this is guarding against
 *
 * Nothing asserted anything about the generated document, so a syft,
 * cataloger, or exporter change — or a dependency that starts shipping a
 * lockfile inside its tarball — ships silently green. The knowledge that
 * prevents that ("do not select the `javascript` group", "exclude
 * node_modules") lived only in comments in supply-chain.yml, and comments do
 * not fail a build.
 *
 * The failure mode is specifically INFLATION, and it happened twice on #529's
 * own branch:
 *
 *   - syft's github-actions cataloger read `.github/workflows` YAML that some
 *     upstream packages ship inside their npm tarballs, listing
 *     `actions/checkout@v4` as a dependency — bestax-migrate at 111 entries
 *     against a real closure of 98.
 *   - Selecting the whole `javascript` cataloger group enabled both javascript
 *     catalogers, listing every package twice — bestax-migrate at 200.
 *
 * And a third time on THIS branch, which is why the check reads both formats
 * rather than SPDX alone: pointing syft at the lockfile as a `file:` source put
 * a `type: file` component named `/home/runner/work/_temp/consumer/
 * package-lock.json` into every CycloneDX document — the same runner-path leak
 * #529 fixed for SPDX, in the format nothing was reading. An SPDX-only guard
 * passed it, and the leaked document was signed and attached.
 *
 * All three were found by generating a document and reading it. None was
 * visible from a green job. That is what this script is for.
 *
 * ## Why there is no expected count here
 *
 * Because there cannot be one. The first implementation of this guard compared
 * `!==` against counts hardcoded in the workflow matrix (5/12/98/94) and was
 * reverted in 48c57d5. Those are LIVE REGISTRY closures: they drift whenever
 * any transitive dependency publishes, so the job would go red on somebody
 * else's release having found nothing wrong. That is the cry-wolf failure this
 * repository has already fixed twice (#391, #525), and re-shipping it would be
 * worse than having no guard.
 *
 * So: four assertions, none of which knows a count.
 *
 *   1. ORIGIN — every catalogued entry came from the npm registry. This is the
 *      one that catches inflation by its cause rather than by its size, and
 *      the two formats support it VERY unequally, which is worth stating
 *      precisely rather than glossing:
 *
 *      SPDX carries the real thing. syft maps the lockfile's `resolved` to
 *      `downloadLocation`, so "under registry.npmjs.org" is a genuine
 *      provenance claim: a git, tarball, private-registry or aliased
 *      dependency fails it.
 *
 *      CycloneDX does NOT. syft's lock cataloger builds `pkg:npm/name@version`
 *      from the name and version alone and carries `resolved` nowhere in the
 *      document — no `externalReferences`, not in `properties` (verified
 *      against a real artifact, run 33262407242). So the `pkg:npm/` test is an
 *      ECOSYSTEM test, not a provenance one. It still does real work — a
 *      github-actions entry is `pkg:githubactions/…` and a bare file component
 *      has no purl at all, which is exactly the leak class — but a git
 *      dependency would sail through it. Do not describe it as provenance; an
 *      earlier version of this comment did, and that is the
 *      comment-overstates-its-mechanism failure .github/CLAUDE.md ends on.
 *
 *      Assertion 4 is what stops that asymmetry becoming a hole.
 *
 *   2. TARGET — the package the document claims to describe is actually in it,
 *      at the version the stamp step recorded, and the document's own subject
 *      says the same. Without this the check passes a document that is a
 *      perfectly well-formed closure OF SOMETHING ELSE: a wrong install spec
 *      or a cataloger dropping the direct dependency would be approved as long
 *      as the transitive packages remained.
 *
 *   3. FLOOR — as MIN_EXPECTED_URLS does in check-pointer-urls.mjs. A floor,
 *      not a count: it catches "the document collapsed to nothing" without
 *      caring which packages are in it. Adding or removing a dependency never
 *      requires touching the number.
 *
 *   4. AGREEMENT — the two documents list exactly the same name@version set.
 *      They come from two separate syft runs, so nothing makes them agree by
 *      construction; the leak that shipped from #529 until #530 was in every
 *      CycloneDX document and no SPDX one. This is what carries the registry
 *      claim across to CycloneDX: anything the weaker purl test would let
 *      through has to appear in SPDX too, where the strong test is waiting.
 *      It also catches format-specific inflation of any other kind.
 *
 * Design mirrors check-pointer-urls.mjs: plain node, zero npm deps, pure
 * helpers exported, main only runs when executed directly.
 *
 * Usage:
 *   node scripts/check-consumer-sbom.mjs --spdx <file> --cdx <file> \
 *          --package <pkg> --slug <slug> --version <version>
 *
 * Both documents in ONE invocation, because assertion 4 compares them against
 * each other. Two separate runs could each pass while disagreeing.
 *
 * Exit codes: 0 the document checks out,
 *             1 an assertion failed,
 *             2 bad usage or an unreadable document.
 */
import fs from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/** Where every package in a consumer closure must have come from (SPDX). */
export const REGISTRY_PREFIX = 'https://registry.npmjs.org/';

/** The same claim in CycloneDX's vocabulary. */
export const NPM_PURL_PREFIX = 'pkg:npm/';

/**
 * Fail below this many packages. A FLOOR, not the current count — bulma-ui has
 * the smallest real closure at five, so three leaves room for a dependency to
 * be dropped without touching this file, while still catching a document that
 * collapsed to the structural entries or to nothing at all.
 */
export const MIN_EXPECTED_PACKAGES = 3;

/**
 * The entries that are legitimately NOT dependencies, named exactly.
 *
 * The scratch project the lockfile records as its root appears in both
 * formats. The configured source appears as an SPDX package, but CycloneDX
 * puts it in `metadata.component` instead — where it is checked separately,
 * rather than being exempted and forgotten.
 *
 * Exempted BY NAME rather than by allowing a missing origin generally. A
 * blanket "entries without an origin are fine" exemption would readmit
 * precisely the github-actions entries and file components this check exists
 * to catch. If syft stops emitting one of these, the name simply stops
 * matching and nothing is weakened.
 */
export function structuralNames({ package: pkg, slug }) {
  return new Set([
    `bestax-consumer-closure-${slug}`,
    `consumer-closure:${pkg}`,
  ]);
}

/** Read and parse an SBOM, throwing a message that names the file. */
export function readDocument(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(`cannot read ${file}: ${err.code ?? err.message}`, {
      cause: err,
    });
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`${file} is not valid JSON: ${err.message}`, {
      cause: err,
    });
  }
}

/**
 * Flatten either format into one shape: { format, entries, subject }.
 *
 * The two documents describe the same closure from the same scan directory and
 * the same syft config, but they are produced by TWO SEPARATE `sbom-action`
 * invocations — two syft runs, not one. That is not pedantry, it is the whole
 * reason each is inspected independently rather than one being taken as proof
 * of the other: the leak that shipped from #529 until #530 was present in
 * every CycloneDX document and absent from every SPDX one, which cannot happen
 * if they are two renderings of a single result.
 *
 * Normalizing them means the shared assertions are written once rather than as
 * two implementations that could drift into disagreeing about what is
 * acceptable. Where the formats genuinely differ, they differ here rather than
 * at the call site.
 *
 * `subject` is CycloneDX's `metadata.component`. SPDX states the same thing as
 * an ordinary package entry, so it is resolved by name in `inspect`, where the
 * package name is known.
 */
export function normalize(doc) {
  if (Array.isArray(doc?.packages)) {
    return {
      format: 'spdx',
      originField: 'downloadLocation',
      originPrefix: REGISTRY_PREFIX,
      entries: doc.packages.map(p => ({
        name: p?.name,
        version: p?.versionInfo,
        origin: p?.downloadLocation,
      })),
      subject: null,
    };
  }
  if (Array.isArray(doc?.components)) {
    return {
      format: 'cyclonedx',
      originField: 'purl',
      originPrefix: NPM_PURL_PREFIX,
      entries: doc.components.map(c => ({
        name: c?.name,
        version: c?.version,
        origin: c?.purl,
      })),
      subject: doc?.metadata?.component ?? null,
    };
  }
  return null;
}

/**
 * The problems with a document, as a list of strings. Empty means it checks
 * out.
 *
 * Returns every problem rather than the first: a reader who has to dispatch
 * the workflow to see this at all should get the whole picture from one run.
 */
export function inspect(doc, { package: pkg, slug, version, minPackages }) {
  const norm = normalize(doc);
  if (!norm) {
    return [
      `the document has neither a \`packages\` array (SPDX) nor a ` +
        `\`components\` array (CycloneDX). Either an exporter changed shape ` +
        `or this is not an SBOM.`,
    ];
  }

  const problems = [];
  const structural = structuralNames({ package: pkg, slug });
  const catalogued = norm.entries.filter(e => !structural.has(e.name));

  // The floor counts catalogued entries, not all of them. Counting everything
  // would let a document consisting only of the structural names pass a floor
  // of two, which is exactly the collapse being guarded against.
  if (catalogued.length < minPackages) {
    problems.push(
      `only ${catalogued.length} catalogued package(s), expected at least ` +
        `${minPackages}. This is a floor, not a count — the document has ` +
        `collapsed, not merely shrunk.`
    );
  }

  for (const e of catalogued) {
    const origin = e.origin;
    if (typeof origin !== 'string' || !origin.startsWith(norm.originPrefix)) {
      problems.push(
        `"${e.name ?? '(unnamed)'}" has ${norm.originField} ` +
          `${JSON.stringify(origin ?? null)}, which is not under ` +
          `${norm.originPrefix}. Usually that means a cataloger is reading ` +
          `files it should not, or the scan source is leaking into the ` +
          `document (#529, #530). If instead we have genuinely taken a ` +
          `runtime dependency that resolves from git, a tarball URL or an ` +
          `npm: alias, that is worth knowing about on its own — decide ` +
          `whether to keep the dependency before widening this check.`
      );
    }
  }

  // The document must contain the thing it claims to describe. A closure that
  // is well-formed but is a closure of something else — a wrong install spec,
  // a cataloger that dropped the direct dependency — passes every other
  // assertion here.
  const target = catalogued.find(e => e.name === pkg);
  if (!target) {
    problems.push(
      `"${pkg}" is not in its own closure. The document is well-formed but ` +
        `describes something else.`
    );
  } else if (version && target.version !== version) {
    problems.push(
      `"${pkg}" is present at ${JSON.stringify(target.version ?? null)} but ` +
        `the install stamped ${version}. The document and its filename ` +
        `disagree about which release this describes.`
    );
  }

  // The document's own claim about what it describes, checked in BOTH formats.
  //
  // The two state it in different places — CycloneDX in metadata.component,
  // SPDX as an ordinary package entry — and for a while only CycloneDX was
  // checked. That left the SPDX subject exempted by name and never validated,
  // so an SPDX document could name the wrong version, or omit the claim
  // entirely, while its dependency entries were perfectly correct. The subject
  // is the document's identity, not a structural detail to skip past.
  const expected = `consumer-closure:${pkg}`;
  const where =
    norm.format === 'cyclonedx'
      ? 'metadata.component'
      : `the "${expected}" entry`;
  const subject =
    norm.format === 'cyclonedx'
      ? norm.subject
      : (norm.entries.find(e => e.name === expected) ?? null);

  if (subject?.name !== expected) {
    problems.push(
      `${where} names ${JSON.stringify(subject?.name ?? null)}, expected ` +
        `"${expected}". The document does not say which package it describes, ` +
        `or it is naming a filesystem path (#529).`
    );
  }
  if (version && subject?.version !== version) {
    problems.push(
      `${where} carries version ${JSON.stringify(subject?.version ?? null)}, ` +
        `expected "${version}". The document would identify a different ` +
        `release than the one its filename and closure describe.`
    );
  }

  // SPDX keeps file entries in their own `files` array rather than among the
  // packages, so the origin loop above cannot see them. syft writes those
  // names RELATIVE to the source today — a bare `package-lock.json`, which
  // leaks nothing and is left alone. An ABSOLUTE one is the SPDX shape of the
  // leak that shipped in every .cdx.json from #529 until #530, so it is
  // rejected rather than trusted to stay relative.
  for (const f of Array.isArray(doc?.files) ? doc.files : []) {
    if (typeof f?.fileName === 'string' && f.fileName.startsWith('/')) {
      problems.push(
        `the files array names ${JSON.stringify(f.fileName)}, an absolute ` +
          `path. That is the runner's filesystem layout, which a published ` +
          `document must not carry (#529, #530).`
      );
    }
  }

  // Duplicate identities: a WARNING, deliberately, not a failure.
  //
  // The doubled-catalogers regression (#529) listed every package twice. It
  // reds today only because the second copy came from the package.json
  // cataloger and carried no registry origin — so a future duplication that
  // kept a valid origin in both documents would pass every assertion here,
  // since growth is explicitly allowed and the cross-check compares the two
  // documents to each other rather than to an expectation.
  //
  // Not asserted, because npm can legitimately place the same name@version at
  // two paths when it cannot hoist, and a lockfile with that shape is a real
  // closure rather than a defect. Failing on it would be the false-red
  // generator 48c57d5 reverted and #391/#525 are about — reddening somebody
  // else's release for a dependency-tree shape nobody chose.
  //
  // A warning names the count and the offenders, which is enough for a human
  // reading a dispatch to recognise "every package is listed twice" instantly,
  // and cannot fail a release on its own. Measured: zero duplicates across all
  // 208 catalogued entries in the four closures of run 33263381732.
  const seen = new Map();
  for (const e of catalogued) {
    const id = `${e.name}@${e.version ?? '?'}`;
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  const dupes = [...seen].filter(([, n]) => n > 1);
  if (dupes.length > 0) {
    console.error(
      `::warning::${norm.format}: ${dupes.length} package(s) listed more than ` +
        `once (${dupes
          .slice(0, 5)
          .map(([id, n]) => `${id} x${n}`)
          .join(', ')}${dupes.length > 5 ? ', …' : ''}). npm can place the ` +
        `same version at two paths, so this is not failed — but if MOST of ` +
        `the closure is duplicated, a second cataloger is running (#529).`
    );
  }

  // The scratch project root should be present in both formats. Not a failure
  // on its own — the document is still an honest closure without it — but its
  // absence means the scan container changed, and the exemption above is then
  // exempting nothing while looking like it still works.
  const root = `bestax-consumer-closure-${slug}`;
  if (!norm.entries.some(e => e.name === root)) {
    console.error(
      `::warning::expected structural entry "${root}" is absent from this ` +
        `${norm.format} document; the scan container in supply-chain.yml and ` +
        `the exemptions in check-consumer-sbom.mjs have drifted apart.`
    );
  }

  return problems;
}

/** The catalogued `name@version` identities in a document, sorted. */
export function identities(doc, { package: pkg, slug }) {
  const norm = normalize(doc);
  if (!norm) return [];
  const structural = structuralNames({ package: pkg, slug });
  return norm.entries
    .filter(e => !structural.has(e.name))
    .map(e => `${e.name}@${e.version ?? '?'}`)
    .sort();
}

/**
 * Assert the two documents describe the same closure.
 *
 * This is what carries the registry claim across to CycloneDX. The purl test
 * there is an ecosystem test — syft builds `pkg:npm/name@version` from the
 * name and version and puts `resolved` nowhere in the document — so a git or
 * tarball dependency would pass it. It cannot pass this: the same package has
 * to appear in the SPDX document, where `downloadLocation` carries the real
 * origin and the strong test is waiting.
 *
 * It is also the only thing that would notice the two syft runs disagreeing
 * for any other reason. They are separate invocations, so nothing makes them
 * agree by construction, and the #529-to-#530 leak is the proof: present in
 * every CycloneDX document, absent from every SPDX one.
 *
 * Compared as MULTISETS, not as sets. An earlier version used
 * `Array.includes`, which asks only "does this identity appear at all" — so a
 * package listed twice in one document and once in the other looked identical
 * to both being listed once, and asymmetric duplicate inflation passed
 * silently. Counting is the same work and answers the question actually being
 * asked.
 */
export function crossCheck(spdxDoc, cdxDoc, target) {
  const a = identities(spdxDoc, target);
  const b = identities(cdxDoc, target);
  const tally = list =>
    list.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
  const ta = tally(a);
  const tb = tally(b);
  const excess = (x, y) =>
    [...x].flatMap(([id, n]) => {
      const d = n - (y.get(id) ?? 0);
      return d > 0 ? [d > 1 ? `${id} (x${d} extra)` : id] : [];
    });
  const onlySpdx = excess(ta, tb);
  const onlyCdx = excess(tb, ta);
  const problems = [];

  if (onlySpdx.length) {
    problems.push(
      `${onlySpdx.length} package(s) are in the SPDX document but not the ` +
        `CycloneDX one: ${onlySpdx.slice(0, 5).join(', ')}` +
        `${onlySpdx.length > 5 ? ', …' : ''}. The two syft runs disagree ` +
        `about the closure.`
    );
  }
  if (onlyCdx.length) {
    problems.push(
      `${onlyCdx.length} package(s) are in the CycloneDX document but not the ` +
        `SPDX one: ${onlyCdx.slice(0, 5).join(', ')}` +
        `${onlyCdx.length > 5 ? ', …' : ''}. CycloneDX carries no registry ` +
        `URL, so an entry only present there has never been origin-checked ` +
        `by anything.`
    );
  }
  return problems;
}

/** Parse `--flag value` argv; throws Error on misuse. */
export function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`unexpected argument "${key}"`);
    if (i + 1 >= argv.length) throw new Error(`${key} needs a value`);
    flags[key.slice(2)] = argv[i + 1];
  }
  for (const required of ['spdx', 'cdx', 'package', 'slug', 'version']) {
    if (!flags[required]) throw new Error(`--${required} is required`);
  }
  return flags;
}

export function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(
      `::error::${err.message}\n` +
        `usage: check-consumer-sbom.mjs --spdx <file> --cdx <file> ` +
        `--package <pkg> --slug <slug> --version <version>`
    );
    return 2;
  }

  // Both documents in one invocation, because assertion 4 compares them. Two
  // separate invocations could each pass while disagreeing with each other,
  // which is the case the CycloneDX purl test cannot cover on its own.
  const docs = {};
  for (const format of ['spdx', 'cdx']) {
    try {
      docs[format] = readDocument(args[format]);
    } catch (err) {
      console.error(`::error::${err.message}`);
      return 2;
    }
  }

  // The flags are a CLAIM about each file; normalize() detects the format from
  // the document's own shape. Those are two different things, and until they
  // are compared the flags are decoration: hand this the CycloneDX file twice
  // and every per-document assertion passes, assertion 4 trivially agrees with
  // itself, and the release ships a file called `.spdx.json` that is not SPDX.
  // A `format:` typo on either sbom-action step produces exactly that.
  for (const [flag, expected] of [
    ['spdx', 'spdx'],
    ['cdx', 'cyclonedx'],
  ]) {
    const detected = normalize(docs[flag])?.format ?? null;
    if (detected !== expected) {
      console.error(
        `::error::${args[flag]} was passed as --${flag} but its contents are ` +
          `${JSON.stringify(detected)}, not ${expected}. The asset's name and ` +
          `its format disagree.`
      );
      return 1;
    }
  }

  const target = {
    package: args.package,
    slug: args.slug,
    version: args.version,
    minPackages: MIN_EXPECTED_PACKAGES,
  };

  let failed = 0;
  for (const format of ['spdx', 'cdx']) {
    const problems = inspect(docs[format], target);
    if (problems.length === 0) continue;
    failed += 1;
    console.error(
      `::error::${args[format]} is not a clean consumer closure ` +
        `(${problems.length} problem(s))`
    );
    for (const p of problems) console.error(`  - ${p}`);
  }

  const disagreements = crossCheck(docs.spdx, docs.cdx, target);
  if (disagreements.length > 0) {
    failed += 1;
    console.error(
      `::error::the two documents do not describe the same closure`
    );
    for (const p of disagreements) console.error(`  - ${p}`);
  }

  if (failed > 0) return 1;

  const counts = ['spdx', 'cdx']
    .map(f => `${normalize(docs[f]).entries.length} ${f}`)
    .join(' / ');
  console.log(
    `check-consumer-sbom: ${args.package}@${args.version} — ${counts} entries, ` +
      `subject and target correct in both, every catalogued package under ` +
      `${REGISTRY_PREFIX} in SPDX, and the two agree on ` +
      `${identities(docs.spdx, target).length} packages`
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
