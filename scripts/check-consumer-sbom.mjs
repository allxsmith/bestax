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
 * Both were found by dispatching the workflow and reading the JSON. Neither
 * was visible from a green job. That is what this script is for.
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
 * So: two assertions, neither of which knows a count.
 *
 *   1. REGISTRY-URL — every catalogued package resolves to registry.npmjs.org.
 *      This is the one that matters, because it catches inflation by its cause
 *      rather than by its size. A github-actions entry has no npm download
 *      location; neither does a package catalogued out of a dependency's own
 *      yarn.lock. It would have caught both #529 regressions, and it stays
 *      correct as the closure grows.
 *
 *   2. FLOOR — as MIN_EXPECTED_URLS does in check-pointer-urls.mjs. A floor,
 *      not a count: it catches "the document collapsed to nothing" (an
 *      exporter change, a cataloger that stopped matching) without caring
 *      which packages are in it. Adding or removing a dependency never
 *      requires touching the number.
 *
 * Design mirrors check-pointer-urls.mjs: plain node, zero npm deps, pure
 * helpers exported, main only runs when executed directly.
 *
 * Usage:
 *   node scripts/check-consumer-sbom.mjs --file <spdx.json> --package <pkg> --slug <slug>
 *
 * Exit codes: 0 the document checks out,
 *             1 an assertion failed,
 *             2 bad usage or an unreadable document.
 */
import fs from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/** Where every package in a consumer closure must have come from. */
export const REGISTRY_PREFIX = 'https://registry.npmjs.org/';

/**
 * Fail below this many packages. A FLOOR, not the current count — bulma-ui has
 * the smallest real closure at five, so three leaves room for a dependency to
 * be dropped without touching this file, while still catching a document that
 * collapsed to the two structural entries or to nothing at all.
 */
export const MIN_EXPECTED_PACKAGES = 3;

/**
 * The two entries that are legitimately NOT dependencies, named exactly.
 *
 * A directory scan adds the scratch project the lockfile records as its root;
 * syft additionally emits the configured source as a package of its own. Both
 * are ours, both are named deliberately in supply-chain.yml, and neither has a
 * registry URL.
 *
 * Exempted BY NAME rather than by allowing NOASSERTION generally. A blanket
 * "packages without a download location are fine" exemption would readmit
 * precisely the github-actions entries this check exists to catch — they carry
 * NOASSERTION too. If syft stops emitting one of these, the name simply stops
 * matching and nothing is weakened.
 */
export function structuralNames({ package: pkg, slug }) {
  return new Set([
    `bestax-consumer-closure-${slug}`,
    `consumer-closure:${pkg}`,
  ]);
}

/** Read and parse an SPDX document, throwing a message that names the file. */
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
 * The problems with a document, as a list of strings. Empty means it checks
 * out.
 *
 * Returns every problem rather than the first: a reader who has to dispatch
 * the workflow to see this at all should get the whole picture from one run.
 */
export function inspect(doc, { package: pkg, slug, minPackages }) {
  const problems = [];
  const packages = Array.isArray(doc?.packages) ? doc.packages : null;

  if (!packages) {
    return [
      `the document has no \`packages\` array. Either the exporter changed ` +
        `shape or this is not an SPDX document.`,
    ];
  }

  const structural = structuralNames({ package: pkg, slug });
  const catalogued = packages.filter(p => !structural.has(p?.name));

  // The floor counts catalogued packages, not entries. Counting entries would
  // let a document consisting only of the two structural names pass a floor of
  // two, which is exactly the collapse being guarded against.
  if (catalogued.length < minPackages) {
    problems.push(
      `only ${catalogued.length} catalogued package(s), expected at least ` +
        `${minPackages}. This is a floor, not a count — the document has ` +
        `collapsed, not merely shrunk.`
    );
  }

  for (const p of catalogued) {
    const location = p?.downloadLocation;
    if (typeof location !== 'string' || !location.startsWith(REGISTRY_PREFIX)) {
      problems.push(
        `"${p?.name ?? '(unnamed)'}" has downloadLocation ` +
          `${JSON.stringify(location ?? null)}, which is not under ` +
          `${REGISTRY_PREFIX}. It is not something a consumer installs from ` +
          `npm — a cataloger is reading files it should not (#529).`
      );
    }
  }

  // Both structural entries should be present. Not a failure on its own — the
  // document is still an honest closure without them — but their absence means
  // the source configuration changed, and the exemptions above are then
  // exempting nothing while looking like they still work.
  for (const name of structural) {
    if (!packages.some(p => p?.name === name)) {
      console.error(
        `::warning::expected structural entry "${name}" is absent; the syft ` +
          `source config in supply-chain.yml and the exemptions in ` +
          `check-consumer-sbom.mjs have drifted apart.`
      );
    }
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
  for (const required of ['file', 'package', 'slug']) {
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
        `usage: check-consumer-sbom.mjs --file <spdx.json> --package <pkg> --slug <slug>`
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
    minPackages: MIN_EXPECTED_PACKAGES,
  });

  if (problems.length > 0) {
    console.error(
      `::error::${args.file} is not a clean consumer closure (${problems.length} problem(s))`
    );
    for (const p of problems) console.error(`  - ${p}`);
    return 1;
  }

  const total = Array.isArray(doc.packages) ? doc.packages.length : 0;
  console.log(
    `check-consumer-sbom: ${args.file} — ${total} entries, every catalogued ` +
      `package resolves to ${REGISTRY_PREFIX}`
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
