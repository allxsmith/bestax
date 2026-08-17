#!/usr/bin/env node
/**
 * Assert that our published packages' provenance attestations say what they
 * are supposed to say (#526).
 *
 * The gap this closes: `verify-provenance` in supply-chain.yml proved an
 * attestation *existed* and was typed `https://slsa.dev/provenance/v1`, by
 * reading a single field off `npm view`. It never opened the attestation. A
 * valid, correctly-signed attestation naming a completely different source
 * repository satisfied that check and `npm audit signatures` both.
 *
 * That matters because SECURITY.md tells users provenance "links the tarball
 * to the exact commit and CI run that built it". The attestation does. Nothing
 * in CI checked the link pointed at us.
 *
 * What is deliberately NOT here: signature verification. This script answers a
 * different question — not "is this signed?" but "signed as *what*?".
 *
 * Be precise about what that leaves uncovered, because the easy version of this
 * sentence overstates it. `npm audit signatures` runs in the immediately-prior
 * step and verifies the bundles it fetched. This step makes its *own* request,
 * so the two are not cryptographically tied: a registry that equivocates —
 * serving a validly signed foreign attestation to the audit and an unsigned
 * matching statement here — would satisfy both. Closing that means verifying
 * this bundle's DSSE signature, which needs a Sigstore verifier this repository
 * does not vendor.
 *
 * What the pairing does buy is that an attacker must compromise the registry's
 * responses rather than merely publish a wrong attestation, and must do it
 * differently for two requests seconds apart. That is a real cost increase and
 * not a proof, which is the honest way to describe it.
 *
 * Design mirrors check-security-txt-expiry.mjs: plain node, zero npm deps,
 * pure helpers exported, main only runs when executed directly. No subprocess:
 * the installed version and the tarball digest both come from files the
 * install already wrote, which makes every assertion testable against a temp
 * directory.
 *
 * Usage:
 *   node scripts/verify-attestation.mjs --dir <scratch-tree> <pkg>...
 *
 * Exit codes: 0 every package's attestation checks out,
 *             1 at least one did not,
 *             2 bad usage or an unusable scratch tree — kept distinct so a
 *               typo'd flag is not reported as a provenance failure.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { fetchWithRetry } from './lib/fetch-retry.mjs';

/**
 * Backoff for the attestation lookup, deliberately longer than the shared
 * default.
 *
 * The shared 1s/3s was tuned for the pull-request URL gate. This job's primary
 * trigger is `release: published`, seconds after `npm publish`, and the shell
 * loop it replaces spent 5s/10s waiting out exactly that propagation lag.
 * Inheriting the PR-tuned budget would have cut the wait from ~15s to ~4s and
 * false-redded a release whose attestation was merely slow.
 */
export const ATTESTATION_BACKOFF_MS = [5000, 10000];

/** The SLSA predicate type npm publishes alongside its own publish attestation. */
export const SLSA_PREDICATE = 'https://slsa.dev/provenance/v1';

/**
 * What a legitimate build of ours looks like.
 *
 * `repositoryId` and `repositoryOwnerId` are the load-bearing pair. The
 * repository *URL* is a name, and names transfer: rename the repo, or let the
 * `allxsmith` handle lapse, and whoever takes that path can publish a validly
 * signed attestation naming this exact URL. The numeric IDs cannot be
 * reassigned, so they are what actually pins "us". Verified against the live
 * payload, which carries them in `internalParameters.github`.
 *
 * `builder` is the exact `github-hosted` value, not a prefix. npm emits either
 * `.../actions/runner/github-hosted` or `.../actions/runner/self-hosted`, and a
 * prefix match accepts both — which would let a build on an attacker-registered
 * self-hosted runner satisfy a check whose whole stated point is that it did
 * not happen on one.
 *
 * `ref` is pinned to main because that is the only branch semantic-release
 * publishes from. If that changes, this must change with it in the same PR,
 * which is the point of pinning rather than accepting any ref.
 *
 * Frozen so the assertion baseline cannot be mutated by anything that imports
 * this module.
 */
export const EXPECTED = Object.freeze({
  repository: 'https://github.com/allxsmith/bestax',
  repositoryId: '975765002',
  repositoryOwnerId: '49878611',
  workflowPath: '.github/workflows/ci.yml',
  ref: 'refs/heads/main',
  builder: 'https://github.com/actions/runner/github-hosted',
  invocationIdPrefix: 'https://github.com/allxsmith/bestax/actions/runs/',
  // The exact `resolvedDependencies[].uri` npm emits. Compared with `===`,
  // not `includes`: a substring test also selects
  // `git+https://github.com/allxsmith/bestax-evil@...`, whose 40-char digest
  // would then satisfy the source-commit assertion while no dependency
  // describes this repository at all. Near-collision covered by a test.
  sourceUri: 'git+https://github.com/allxsmith/bestax@refs/heads/main',
});

/** in-toto statement type the SLSA predicate is wrapped in. */
export const STATEMENT_TYPE = 'https://in-toto.io/Statement/v1';

export function attestationUrl(pkg, version) {
  return `https://registry.npmjs.org/-/npm/v1/attestations/${pkg}@${version}`;
}

/**
 * Compare two package URLs without tripping over percent-encoding.
 *
 * The purl spec encodes the `@` that introduces an npm scope, so npm attests
 * `@allxsmith/bestax-bulma` as `pkg:npm/%40allxsmith/bestax-bulma@5.11.1`.
 * Building the expected string naively made the check fail on the one scoped
 * package we publish — caught by running this against the real registry, which
 * is exactly the false red it would otherwise have produced in CI.
 *
 * Decoding both sides rather than hard-coding the encoding means the check
 * keeps working whichever form the registry emits. A malformed escape decodes
 * to nothing and simply fails to match, which is the fail-closed direction.
 */
export function samePurl(a, b) {
  const decode = s => {
    try {
      return decodeURIComponent(String(s));
    } catch {
      return null;
    }
  };
  const left = decode(a);
  return left !== null && left === decode(b);
}

/**
 * Parse argv.
 *
 * An unrecognised `--flag` is a usage error rather than a package name. Left
 * permissive, `--dirs /tmp/x pkg` parses as three packages, `installedVersion`
 * throws ENOENT, and the run exits 1 reporting that provenance "does not check
 * out" for a package that never existed — a typo dressed up as a verification
 * failure, which is exactly the distinction the exit codes exist to draw.
 *
 * The package list is optional: with none given, the roster is read from the
 * scratch tree. See `packagesInTree`.
 */
export function parseArgs(argv) {
  const packages = [];
  let dir = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dir') {
      dir = argv[++i] ?? null;
    } else if (arg.startsWith('--dir=')) {
      dir = arg.slice('--dir='.length);
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown option "${arg}"`);
    } else {
      packages.push(arg);
    }
  }
  if (!dir) throw new Error('--dir <scratch-tree> is required');
  return { dir, packages };
}

/**
 * The packages the install step actually put in the scratch tree.
 *
 * This exists so the workflow does not have to name the roster twice. Listing
 * it in both the install step and the verify step made "keep these in sync" a
 * hand-maintained invariant with nothing enforcing it — add a fifth published
 * package to one and not the other and it ships unverified, silently, green.
 * Reading it back from the tree makes the two structurally incapable of
 * disagreeing.
 */
export function packagesInTree(dir) {
  const manifest = path.join(dir, 'package.json');
  const { dependencies } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const names = Object.keys(dependencies ?? {});
  if (names.length === 0) {
    throw new Error(
      `no dependencies in ${manifest} — nothing was installed, so there is ` +
        `nothing to verify. Refusing to report success on an empty run.`
    );
  }
  return names.sort();
}

/** The version npm actually installed, read from the tree rather than resolved again. */
export function installedVersion(dir, pkg) {
  const manifest = path.join(
    dir,
    'node_modules',
    ...pkg.split('/'),
    'package.json'
  );
  const { version } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  if (typeof version !== 'string' || version === '') {
    throw new Error(`${pkg}: no version in ${manifest}`);
  }
  return version;
}

/**
 * The sha512 of the tarball that was installed, as lowercase hex.
 *
 * npm records it in the lockfile as Subresource Integrity (`sha512-<base64>`)
 * and the attestation states it as hex, so one has to be converted. Verified
 * against the real registry: for bestax-migrate@2.0.0 the lockfile integrity
 * decodes to exactly the attestation's subject digest.
 */
export function installedDigest(dir, pkg) {
  const lockPath = path.join(dir, 'package-lock.json');
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const entry = lock.packages?.[`node_modules/${pkg}`];
  const integrity = entry?.integrity;
  if (typeof integrity !== 'string' || !integrity.startsWith('sha512-')) {
    throw new Error(`${pkg}: no sha512 integrity in ${lockPath}`);
  }
  const raw = Buffer.from(integrity.slice('sha512-'.length), 'base64');
  // Node's base64 decoder discards invalid characters silently, so a truncated
  // or corrupted integrity yields a short buffer rather than an error. Without
  // this a malformed lockfile would surface downstream as "subject digest does
  // not match", sending the reader to investigate the registry instead of the
  // tree.
  if (raw.length !== 64) {
    throw new Error(
      `${pkg}: integrity in ${lockPath} decoded to ${raw.length} bytes, expected 64`
    );
  }
  return raw.toString('hex');
}

/**
 * Pull the SLSA provenance predicate out of the registry's attestation
 * response.
 *
 * The endpoint returns two bundles — npm's own publish attestation and the
 * SLSA one — so the right one has to be selected rather than assumed to be
 * first. The payload is a base64 DSSE envelope.
 */
export function extractProvenance(responseText) {
  const parsed = JSON.parse(responseText);
  const bundles = Array.isArray(parsed?.attestations)
    ? parsed.attestations
    : [];
  const slsa = bundles.find(a => a?.predicateType === SLSA_PREDICATE);
  if (!slsa) {
    throw new Error(
      `no ${SLSA_PREDICATE} attestation among [${bundles.map(b => b?.predicateType).join(', ')}]`
    );
  }
  const payload = slsa?.bundle?.dsseEnvelope?.payload;
  if (typeof payload !== 'string' || payload === '') {
    throw new Error('SLSA attestation has no dsseEnvelope payload');
  }
  const statement = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));

  // The `predicateType` selected on above is envelope metadata, outside what
  // the DSSE signature covers. The decoded statement carries its own type
  // fields, so re-check them here: that makes the selection self-verifying
  // rather than load-bearing on an unsigned label, and settles the case of a
  // response carrying two bundles both claiming to be SLSA.
  if (statement?._type !== STATEMENT_TYPE) {
    throw new Error(
      `decoded statement is "${statement?._type}", expected "${STATEMENT_TYPE}"`
    );
  }
  if (statement?.predicateType !== SLSA_PREDICATE) {
    throw new Error(
      `decoded predicateType is "${statement?.predicateType}", expected "${SLSA_PREDICATE}"`
    );
  }
  return statement;
}

/**
 * Compare a provenance statement against what our build should look like.
 *
 * Returns the list of problems rather than throwing on the first, so a single
 * run reports everything wrong with a package instead of one thing at a time.
 * Every branch is written so a missing or malformed field produces a problem —
 * there is no path where an absent value silently satisfies a check, which is
 * rule 4's fail-closed requirement applied field by field.
 */
export function checkStatement(statement, { pkg, version, digest }) {
  const problems = [];
  const build = statement?.predicate?.buildDefinition;
  const workflow = build?.externalParameters?.workflow;
  const github = build?.internalParameters?.github;
  const run = statement?.predicate?.runDetails;
  const builder = run?.builder?.id;
  const invocationId = run?.metadata?.invocationId;
  // resolvedDependencies is an unordered collection, so indexing [0] cuts both
  // ways: a valid attestation listing another dependency first would false-fail,
  // and an unrelated first entry that happens to carry a 40-char gitCommit would
  // let a missing source commit pass. Select the descriptor that actually
  // describes this repository.
  const source = (
    Array.isArray(build?.resolvedDependencies) ? build.resolvedDependencies : []
  ).find(d => d?.uri === EXPECTED.sourceUri);
  const gitCommit = source?.digest?.gitCommit;

  // Find the subject by name rather than assuming subject[0]. npm emits one
  // today, but the in-toto schema allows several, and indexing would report a
  // perfectly correct package as both wrong-subject and wrong-digest the day
  // that changes.
  const expectedName = `pkg:npm/${pkg}@${version}`;
  const subjects = Array.isArray(statement?.subject) ? statement.subject : [];
  const subject = subjects.find(s => samePurl(s?.name, expectedName));

  if (!subject) {
    problems.push(
      `no subject named "${expectedName}" (saw ${subjects.length ? subjects.map(s => `"${s?.name}"`).join(', ') : 'none'})`
    );
  } else if (subject.digest?.sha512 !== digest) {
    problems.push(
      `subject digest does not match the installed tarball ` +
        `(attested ${String(subject.digest?.sha512).slice(0, 16)}…, ` +
        `installed ${digest.slice(0, 16)}…)`
    );
  }

  if (workflow?.repository !== EXPECTED.repository) {
    problems.push(
      `built from repository "${workflow?.repository}", expected "${EXPECTED.repository}"`
    );
  }
  // The IDs are the assertion that survives a rename; the URL above is a name.
  if (String(github?.repository_id) !== EXPECTED.repositoryId) {
    problems.push(
      `repository_id is "${github?.repository_id}", expected "${EXPECTED.repositoryId}"`
    );
  }
  if (String(github?.repository_owner_id) !== EXPECTED.repositoryOwnerId) {
    problems.push(
      `repository_owner_id is "${github?.repository_owner_id}", expected "${EXPECTED.repositoryOwnerId}"`
    );
  }
  if (workflow?.path !== EXPECTED.workflowPath) {
    problems.push(
      `built by workflow "${workflow?.path}", expected "${EXPECTED.workflowPath}"`
    );
  }
  if (workflow?.ref !== EXPECTED.ref) {
    problems.push(
      `built from ref "${workflow?.ref}", expected "${EXPECTED.ref}"`
    );
  }
  if (builder !== EXPECTED.builder) {
    problems.push(`builder is "${builder}", expected "${EXPECTED.builder}"`);
  }
  // SECURITY.md promises provenance links the tarball to the exact commit and
  // CI run. Those two fields are what make that true, so they are checked
  // rather than merely quoted: the run must belong to this repository, and a
  // commit must be stated. The commit's *value* cannot be pinned here — it is
  // whatever was on main at release — so its presence and shape are what is
  // available to assert.
  if (
    typeof invocationId !== 'string' ||
    !invocationId.startsWith(EXPECTED.invocationIdPrefix)
  ) {
    problems.push(
      `invocationId is "${invocationId}", expected one under "${EXPECTED.invocationIdPrefix}"`
    );
  }
  if (typeof gitCommit !== 'string' || !/^[0-9a-f]{40}$/.test(gitCommit)) {
    problems.push(
      source
        ? `source commit is "${gitCommit}", expected a 40-char sha`
        : `no resolved dependency describing ${EXPECTED.sourceUri}`
    );
  }
  return problems;
}

/** Verify one package end to end. Never throws; returns a result to report. */
export async function verifyPackage(pkg, { dir, retryOptions = {} }) {
  let version;
  let digest;
  try {
    version = installedVersion(dir, pkg);
    digest = installedDigest(dir, pkg);
  } catch (err) {
    return { pkg, ok: false, problems: [err.message] };
  }

  const res = await fetchWithRetry(attestationUrl(pkg, version), {
    backoffMs: ATTESTATION_BACKOFF_MS,
    ...retryOptions,
    // GET, because the payload is the whole point, and keepBody to get it.
    methods: ['GET'],
    keepBody: true,
    // A 404 here is retried rather than believed on sight. This job runs on
    // `release: published`, seconds after `npm publish`, and the registry
    // serves the attestations route separately from the packument — so a 404
    // is far more likely to be propagation lag than a missing attestation.
    // The shell loop this replaced spent three attempts for exactly this
    // reason ("a gate that cries wolf gets ignored"); without this the move to
    // a single-source fetch would have quietly thrown that away.
    alsoRetryable: [404],
  });
  if (res.outcome !== 'ok') {
    return {
      pkg,
      version,
      ok: false,
      problems: [
        `could not fetch the attestation (${res.detail ?? res.outcome})`,
      ],
    };
  }

  let statement;
  try {
    statement = extractProvenance(res.body);
  } catch (err) {
    return { pkg, version, ok: false, problems: [err.message] };
  }

  const problems = checkStatement(statement, { pkg, version, digest });
  return { pkg, version, ok: problems.length === 0, problems };
}

export async function main(
  argv = process.argv.slice(2),
  { retryOptions } = {}
) {
  let args;
  let packages;
  try {
    args = parseArgs(argv);
    // No names given means "whatever the install step put there", which is how
    // the workflow avoids listing the roster twice.
    packages =
      args.packages.length > 0 ? args.packages : packagesInTree(args.dir);
  } catch (err) {
    console.error(`::error::verify-attestation: ${err.message}`);
    return 2;
  }

  console.log(
    `verify-attestation: checking ${packages.length} package(s): ${packages.join(', ')}`
  );

  const results = await Promise.all(
    packages.map(pkg => verifyPackage(pkg, { dir: args.dir, retryOptions }))
  );

  let failed = 0;
  for (const r of results) {
    if (r.ok) {
      console.log(
        `ok: ${r.pkg}@${r.version} — built by ${EXPECTED.repository}`
      );
      continue;
    }
    failed += 1;
    console.error(
      `::error::${r.pkg}${r.version ? `@${r.version}` : ''} provenance does not check out`
    );
    for (const p of r.problems) console.error(`  - ${p}`);
  }
  if (failed > 0) {
    console.error(
      `verify-attestation: ${failed}/${results.length} package(s) failed. An ` +
        `attestation that exists and is validly signed still says who built ` +
        `what; these do not say what they should.`
    );
    return 1;
  }
  console.log(`verify-attestation: ${results.length} package(s) check out`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await main();
}
