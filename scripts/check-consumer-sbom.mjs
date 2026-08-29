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
 * So: three assertions, none of which knows a count.
 *
 *   1. ORIGIN — every catalogued entry came from the npm registry. SPDX says
 *      that with a `downloadLocation` under registry.npmjs.org; CycloneDX says
 *      it with a `pkg:npm/` purl. This is the one that matters, because it
 *      catches inflation by its cause rather than by its size: a
 *      github-actions entry, a package catalogued out of a dependency's own
 *      yarn.lock, and a bare file component all fail it, and it stays correct
 *      as the closure grows.
 *
 *   2. TARGET — the package the document claims to describe is actually in it,
 *      at the version the stamp step recorded. Without this the check passes a
 *      document that is a perfectly well-formed closure OF SOMETHING ELSE: a
 *      wrong install spec or a cataloger dropping the direct dependency would
 *      be approved as long as the transitive packages remained.
 *
 *   3. FLOOR — as MIN_EXPECTED_URLS does in check-pointer-urls.mjs. A floor,
 *      not a count: it catches "the document collapsed to nothing" without
 *      caring which packages are in it. Adding or removing a dependency never
 *      requires touching the number.
 *
 * Design mirrors check-pointer-urls.mjs: plain node, zero npm deps, pure
 * helpers exported, main only runs when executed directly.
 *
 * Usage:
 *   node scripts/check-consumer-sbom.mjs --file <sbom.json> --package <pkg> \
 *                                        --slug <slug> --version <version>
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
 * Both are generated from the same syft run and describe the same closure, so
 * they are checked by the same assertions rather than by two parallel
 * implementations that could drift into disagreeing about what is acceptable.
 *
 * `subject` is what the document says it describes — CycloneDX's
 * `metadata.component`. SPDX carries the equivalent as an ordinary package
 * entry, so it has none here and is checked through the structural names.
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

  // CycloneDX states its subject in metadata.component rather than as an
  // entry, so it is checked here rather than exempted by name and forgotten.
  if (norm.format === 'cyclonedx') {
    const expected = `consumer-closure:${pkg}`;
    if (norm.subject?.name !== expected) {
      problems.push(
        `metadata.component.name is ` +
          `${JSON.stringify(norm.subject?.name ?? null)}, expected ` +
          `"${expected}". The document does not say which package it ` +
          `describes, or it is naming a filesystem path (#529).`
      );
    }
    if (version && norm.subject?.version !== version) {
      problems.push(
        `metadata.component.version is ` +
          `${JSON.stringify(norm.subject?.version ?? null)}, expected ` +
          `"${version}".`
      );
    }
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

/** Parse `--flag value` argv; throws Error on misuse. */
export function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`unexpected argument "${key}"`);
    if (i + 1 >= argv.length) throw new Error(`${key} needs a value`);
    flags[key.slice(2)] = argv[i + 1];
  }
  for (const required of ['file', 'package', 'slug', 'version']) {
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
        `usage: check-consumer-sbom.mjs --file <sbom.json> --package <pkg> ` +
        `--slug <slug> --version <version>`
    );
    return 2;
  }

  let doc;
  try {
    doc = readDocument(args.file);
  } catch (err) {
    console.error(`::error::${err.message}`);
    return 2;
  }

  const problems = inspect(doc, {
    package: args.package,
    slug: args.slug,
    version: args.version,
    minPackages: MIN_EXPECTED_PACKAGES,
  });

  if (problems.length > 0) {
    console.error(
      `::error::${args.file} is not a clean consumer closure (${problems.length} problem(s))`
    );
    for (const p of problems) console.error(`  - ${p}`);
    return 1;
  }

  const norm = normalize(doc);
  console.log(
    `check-consumer-sbom: ${args.file} — ${norm.entries.length} ${norm.format} ` +
      `entries, ${args.package}@${args.version} present, every catalogued ` +
      `package under ${norm.originPrefix}`
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
