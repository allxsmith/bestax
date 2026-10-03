#!/usr/bin/env node
/**
 * Check, bump and publish bestax-migrate's package in the Codemod Registry
 * (app.codemod.com), which lives in bestax-migrate/codemod/.
 *
 * The registry has no jscodeshift engine, so that package holds no transform
 * code. Its workflows run `npx --yes bestax-migrate@<version>`, the release
 * already on npm, as a Codemod shell step.
 *
 * .github/workflows/codemod-registry.yml calls this file and carries the trust
 * reasoning: why it is a workflow of its own, why it checks out `main`, and
 * what its egress list allows. This file holds the logic rule 9 of
 * .github/CLAUDE.md wants out of YAML and under `node --test`. Its modes:
 *
 *   check    codemod.yaml's version, every bestax-migrate pin in the package
 *            and bestax-migrate/package.json name one release, the committed
 *            CLI lockfile pins the codemod CLI exactly, and npm serves the
 *            bestax-migrate release with a provenance attestation
 *   publish  pick a credential (the CODEMOD_API_KEY secret when it is set,
 *            otherwise a GitHub OIDC token), mask it, run `codemod publish`
 *   bump     rewrite codemod.yaml's version and every pin to package.json's
 *            version. Run by hand, see below
 *
 * ## Why the pins are committed and moved by hand
 *
 * The wrapper has to name a bestax-migrate version, and the registry will not
 * take the same package version twice, so codemod.yaml's version follows the
 * release it runs. semantic-release bumps bestax-migrate/package.json in its
 * release commit and nothing else. Making it bump these files too would add a
 * step to ci.yml's credentialed publish job, the job this workflow is kept
 * away from. So the pins move by hand: `bump`, commit it as
 * `build(bestax-migrate): ...` (which releases nothing), merge, then dispatch
 * the workflow. Until then the registry keeps serving the release it has,
 * which still works.
 *
 * `check` fails when the pins and package.json disagree, so a dispatch cannot
 * publish a stale pin. The test sibling holds the committed files to less:
 * they agree with each other and name no release ahead of package.json.
 * Requiring equality there would turn every open PR red after each
 * bestax-migrate release, over files none of them touched.
 *
 * ## The codemod CLI's own pin
 *
 * The workflow installs the CLI with `npm ci` from .github/codemod-cli/, a
 * package.json and package-lock.json committed for nothing else. The lockfile
 * fixes every package in the CLI's tree, its transitive `detect-libc`
 * included, to one version and one integrity hash. It lives under .github/,
 * outside the registry package (whose every file `codemod publish` uploads)
 * and outside bestax-migrate/ (so no npm tarball can carry it), and under
 * CODEOWNERS. `check` holds it to an exact `codemod` pin, every entry to
 * registry.npmjs.org with a sha512 integrity, and nothing that would run on
 * install. To move the CLI: change the pin in that package.json, then in that
 * directory run `npm install --package-lock-only --ignore-scripts --before
 * <3 days ago>`, which writes the lockfile and installs nothing.
 *
 * Exit codes: 0 ok
 *             1 a check failed, or `codemod publish` failed
 *             2 bad usage, or the codemod CLI could not be started
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SEMVER, assertVersion, forLog } from './consumer-sbom-meta.mjs';
import { fetchWithRetry } from './lib/fetch-retry.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The registry package's name, unscoped, and the npm package it runs. */
export const PACKAGE_NAME = 'bestax-migrate';

/** The registry package, relative to the repository root. */
export const PACKAGE_DIR = 'bestax-migrate/codemod';

/** The npm manifest semantic-release bumps. */
export const NPM_MANIFEST = 'bestax-migrate/package.json';

/** The codemod CLI's manifest and lockfile, for `npm ci`. See the header. */
export const CLI_DIR = '.github/codemod-cli';

export const NPM_REGISTRY = 'https://registry.npmjs.org';

/**
 * The audience of the GitHub OIDC token sent to the registry.
 *
 * Codemod's publishing guide says `https://codemod.com`, while its own
 * codemod/publish-action requests the registry URL, `https://app.codemod.com`,
 * which is also the CLI's default registry. This follows the action, because
 * it is the publishing path `codemod init` scaffolds. No run has exercised
 * either value from this repository yet. If the registry answers "Token
 * audience mismatch", try the other one here.
 */
export const OIDC_AUDIENCE = 'https://app.codemod.com';

export const OIDC_TIMEOUT_MS = 15_000;

/** A hung `codemod publish` is killed and reported as a failure. */
export const PUBLISH_TIMEOUT_MS = 300_000;

export const BUMP_COMMAND = 'node scripts/codemod-registry.mjs bump';

/**
 * Every `bestax-migrate@<spec>` in a file. The spec stops at whitespace or a
 * quote, so a pin in a `run:` line or in prose is read the same way. An empty
 * spec is captured too, and fails the check like any other wrong one.
 */
const PIN = /bestax-migrate@([^\s"'`]*)/g;

/** Files in the package that are read for pins. */
const TEXT_FILE = /\.(ya?ml|md)$/;
const WORKFLOW_FILE = /\.ya?ml$/;

export function findPins(text) {
  return [...String(text).matchAll(PIN)].map(match => match[1]);
}

/**
 * Every value of a top-level `key: value` line, with one pair of quotes and a
 * trailing comment removed. Line-based on purpose: this runs on the runner's
 * Node with no dependencies installed, and codemod.yaml is a flat file that
 * `codemod workflow validate` parses properly later in the same job. More
 * than one value is reported by the caller rather than resolved here.
 */
export function topLevelScalars(yaml, key) {
  const line = new RegExp(`^${key}:[ \\t]*(.*)$`, 'gm');
  return [...String(yaml).matchAll(line)].map(match => {
    const value = match[1].replace(/\s+#.*$/, '').trim();
    const quoted = value.match(/^(["'])(.*)\1$/);
    return quoted ? quoted[2] : value;
  });
}

/**
 * Order two versions by major, minor and patch, then a release above its own
 * prereleases. Prereleases of the same version compare as strings, which is
 * enough for "is the pin ahead of package.json" and is not full semver
 * precedence. Both arguments must already have passed assertVersion.
 */
export function compareVersions(a, b) {
  const [, ...pa] = a.match(SEMVER);
  const [, ...pb] = b.match(SEMVER);
  for (let i = 0; i < 3; i++) {
    const diff = Number(pa[i]) - Number(pb[i]);
    if (diff) return Math.sign(diff);
  }
  const [preA, preB] = [pa[3], pb[3]];
  if (preA === preB) return 0;
  if (preA === undefined) return 1;
  if (preB === undefined) return -1;
  return preA < preB ? -1 : 1;
}

/** Package-relative paths of every file under `dir`, sorted. */
function listFiles(dir, prefix = '') {
  return fs
    .readdirSync(path.join(dir, prefix), { withFileTypes: true })
    .flatMap(entry => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      return entry.isDirectory() ? listFiles(dir, rel) : [rel];
    })
    .sort();
}

/**
 * The package's files that are read for pins: every YAML and Markdown file
 * except codemod.yaml, whose version line is handled on its own.
 */
function pinnedFiles(dir) {
  return listFiles(dir).filter(
    rel => TEXT_FILE.test(rel) && rel !== 'codemod.yaml'
  );
}

/** What `packageProblems` judges, read from a checkout. */
export function readPackage(root = REPO) {
  const dir = path.join(root, PACKAGE_DIR);
  const read = rel => fs.readFileSync(path.join(dir, rel), 'utf8');
  return {
    manifest: read('codemod.yaml'),
    texts: pinnedFiles(dir).map(rel => [rel, read(rel)]),
    npmVersion: JSON.parse(
      fs.readFileSync(path.join(root, NPM_MANIFEST), 'utf8')
    ).version,
  };
}

/**
 * Everything wrong with the package as committed, offline.
 *
 * `requireCurrent` is the workflow's rule: the pins must name the release
 * package.json is at. Without it (the test sibling's rule) they must only not
 * be ahead of it. Values read from files go through forLog before they reach
 * a message, since `check` prints messages as workflow commands.
 */
export function packageProblems(
  { manifest, texts, npmVersion },
  { requireCurrent = true } = {}
) {
  const problems = [];
  const attempt = fn => {
    try {
      return fn();
    } catch (err) {
      problems.push(err.message);
      return null;
    }
  };

  const names = topLevelScalars(manifest, 'name');
  if (names.length !== 1 || names[0] !== PACKAGE_NAME) {
    problems.push(
      `codemod.yaml must have one top-level name, ${forLog(PACKAGE_NAME)}; ` +
        `it has ${names.map(forLog).join(', ') || 'none'}. The registry ` +
        'package and its Trusted Publisher are keyed on that name.'
    );
  }

  const versions = topLevelScalars(manifest, 'version');
  let version = null;
  if (versions.length !== 1) {
    problems.push(
      `codemod.yaml must have one top-level version; it has ${versions.length}.`
    );
  } else {
    version = attempt(() => assertVersion(versions[0], 'codemod.yaml version'));
  }
  if (version?.includes('+')) {
    // npm drops build metadata when it resolves a version, so a pin carrying
    // it would not run the release it names.
    problems.push(
      `codemod.yaml version ${forLog(version)} carries build metadata.`
    );
    version = null;
  }

  if (!texts.some(([rel]) => WORKFLOW_FILE.test(rel))) {
    problems.push(`${PACKAGE_DIR} has no workflow file besides codemod.yaml.`);
  }
  for (const [rel, text] of texts) {
    const pins = findPins(text);
    if (WORKFLOW_FILE.test(rel) && pins.length === 0) {
      problems.push(
        `${PACKAGE_DIR}/${rel} runs no pinned release: it has no ` +
          '"bestax-migrate@<version>".'
      );
    }
    for (const pin of pins) {
      if (version !== null && pin !== version) {
        problems.push(
          `${PACKAGE_DIR}/${rel} pins bestax-migrate@${forLog(pin)}, but ` +
            `codemod.yaml's version is ${version}. Every pin must be that ` +
            'exact version.'
        );
      }
    }
  }

  const npm = attempt(() =>
    assertVersion(npmVersion, `${NPM_MANIFEST} version`)
  );
  if (version !== null && npm !== null) {
    if (requireCurrent && version !== npm) {
      problems.push(
        `The registry package names bestax-migrate ${version}, but ` +
          `${NPM_MANIFEST} is at ${npm}. Run \`${BUMP_COMMAND}\`, commit it ` +
          'as build(bestax-migrate), and dispatch again once it is on main.'
      );
    } else if (!requireCurrent && compareVersions(version, npm) > 0) {
      problems.push(
        `The registry package names bestax-migrate ${version}, ahead of ` +
          `${NPM_MANIFEST} (${npm}). It must name a release that exists.`
      );
    }
  }
  return { version, problems };
}

/** What `cliProblems` judges, read from a checkout. */
export function readCli(root = REPO) {
  const read = name =>
    JSON.parse(fs.readFileSync(path.join(root, CLI_DIR, name), 'utf8'));
  return { manifest: read('package.json'), lock: read('package-lock.json') };
}

/** Manifest fields that could add a package or run code on install. */
const CLI_FORBIDDEN_FIELDS = [
  'scripts',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
  'bundleDependencies',
  'bundledDependencies',
  'overrides',
  'workspaces',
];

/**
 * Everything wrong with the committed CLI manifest and lockfile, offline.
 *
 * `npm ci` already refuses a lockfile that disagrees with its package.json.
 * This checks what it does not: the codemod pin is one exact version, every
 * locked package comes from registry.npmjs.org with a sha512 integrity, none
 * is a link or declares an install script, and the manifest can neither be
 * published nor add packages or scripts of its own.
 */
export function cliProblems({ manifest, lock }) {
  const problems = [];
  const where = `${CLI_DIR}/package.json`;
  const lockWhere = `${CLI_DIR}/package-lock.json`;
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { version: null, problems: [`${where} is not a JSON object.`] };
  }
  if (manifest.private !== true) {
    problems.push(
      `${where} must say "private": true, so it is never published.`
    );
  }
  for (const field of CLI_FORBIDDEN_FIELDS) {
    if (manifest[field] !== undefined) {
      problems.push(`${where} must not have "${field}".`);
    }
  }

  const deps = manifest.dependencies ?? {};
  const names = Object.keys(deps);
  let version = null;
  if (names.length !== 1 || names[0] !== 'codemod') {
    problems.push(
      `${where} must depend on codemod and nothing else; it names ` +
        `${names.map(forLog).join(', ') || 'nothing'}.`
    );
  } else {
    try {
      version = assertVersion(deps.codemod, `${where} codemod version`);
    } catch (err) {
      problems.push(`${err.message} It must be one exact version.`);
    }
  }

  if (lock?.lockfileVersion !== 3) {
    problems.push(
      `${lockWhere} must be lockfileVersion 3; it is ` +
        `${forLog(lock?.lockfileVersion)}.`
    );
  }
  const packages = lock?.packages ?? {};
  if (
    JSON.stringify(packages['']?.dependencies ?? null) !==
    JSON.stringify(manifest.dependencies ?? null)
  ) {
    problems.push(
      `${lockWhere} was not written from ${where}: their dependencies ` +
        'differ. Regenerate it as the header of scripts/codemod-registry.mjs ' +
        'says.'
    );
  }
  const locked = packages['node_modules/codemod']?.version;
  if (version !== null && locked !== version) {
    problems.push(
      `${lockWhere} locks codemod ${forLog(locked)}, not ${version}.`
    );
  }
  const entries = Object.entries(packages).filter(([key]) => key !== '');
  if (!entries.length) problems.push(`${lockWhere} locks no packages.`);
  for (const [key, entry] of entries) {
    const name = forLog(key);
    if (!String(entry?.resolved ?? '').startsWith(`${NPM_REGISTRY}/`)) {
      problems.push(
        `${lockWhere}: ${name} does not resolve to ${NPM_REGISTRY}.`
      );
    }
    if (!/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(String(entry?.integrity ?? ''))) {
      problems.push(`${lockWhere}: ${name} has no sha512 integrity.`);
    }
    if (entry?.link || entry?.hasInstallScript) {
      problems.push(
        `${lockWhere}: ${name} is a link or declares an install script.`
      );
    }
  }
  return { version, problems };
}

/**
 * What npm says about the pinned release: it exists, and npm records a SLSA
 * provenance attestation for it. This reads npm's record of the attestation
 * and does not verify it. The workflow's `npm audit signatures` verifies the
 * codemod CLI's, and supply-chain.yml's verify-provenance job verifies the
 * published bestax packages'.
 *
 * Fails closed: a lookup that never got an answer is a problem, not a pass.
 */
export async function npmProblems(version, fetchOptions = {}) {
  const spec = `${PACKAGE_NAME}@${version}`;
  const url = `${NPM_REGISTRY}/${PACKAGE_NAME}/${encodeURIComponent(version)}`;
  const res = await fetchWithRetry(url, {
    methods: ['GET'],
    keepBody: true,
    ...fetchOptions,
  });
  if (res.outcome === 'dead') {
    return [
      `npm has no ${spec} (${forLog(res.detail)}). The pin must name a ` +
        'release ci.yml has already published.',
    ];
  }
  if (res.outcome !== 'ok') {
    return [
      `Could not ask npm about ${spec} (${forLog(res.detail)}). Nothing was ` +
        'published; run the workflow again.',
    ];
  }
  let doc;
  try {
    doc = JSON.parse(res.body);
  } catch {
    return [`npm's answer for ${spec} was not JSON.`];
  }
  const problems = [];
  if (doc?.name !== PACKAGE_NAME || doc?.version !== version) {
    problems.push(
      `npm answered for ${forLog(doc?.name)}@${forLog(doc?.version)}, ` +
        `not ${spec}.`
    );
  }
  const predicate = doc?.dist?.attestations?.provenance?.predicateType;
  if (
    typeof predicate !== 'string' ||
    !predicate.startsWith('https://slsa.dev/provenance/')
  ) {
    problems.push(
      `npm records no SLSA provenance attestation for ${spec}. The registry ` +
        'package tells users the release it runs carries one.'
    );
  }
  if (doc?.deprecated) {
    problems.push(`npm marks ${spec} deprecated: ${forLog(doc.deprecated)}.`);
  }
  return problems;
}

/**
 * Ask the runner for a GitHub OIDC token with `audience`, the way
 * @actions/core's getIDToken does. The request URL already carries a query
 * string, so the audience is added to it rather than appended by hand.
 */
export async function requestOidcToken(env, audience, fetchImpl = fetch) {
  const requestUrl = env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const bearer = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !bearer) {
    throw new Error(
      'There is no CODEMOD_API_KEY and no GitHub OIDC context to fall back ' +
        'on. The job needs `id-token: write`, or the codemod-registry ' +
        'environment needs the CODEMOD_API_KEY secret.'
    );
  }
  const url = new URL(requestUrl);
  url.searchParams.set('audience', audience);
  let res;
  try {
    res = await fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(OIDC_TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(
      `The OIDC token request failed: ${forLog(err?.cause?.message ?? err?.message)}.`,
      { cause: err }
    );
  }
  if (!res.ok) {
    throw new Error(`The OIDC token request answered ${res.status}.`);
  }
  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error('The OIDC token response was not JSON.');
  }
  if (typeof body?.value !== 'string' || !body.value) {
    throw new Error('The OIDC token response carried no token.');
  }
  return body.value;
}

/**
 * The CODEMOD_API_KEY secret when it is set, otherwise a GitHub OIDC token.
 * The key comes first because the first publish of an unscoped package needs
 * it: a Trusted Publisher can only be attached to a package that exists.
 * Deleting the secret afterwards is what moves the job to OIDC.
 */
export async function chooseCredential(env, fetchImpl = fetch) {
  const key = String(env.CODEMOD_API_KEY ?? '').trim();
  const credential = key
    ? { token: key, source: 'api-key' }
    : {
        token: await requestOidcToken(env, OIDC_AUDIENCE, fetchImpl),
        source: 'oidc',
      };
  // `::add-mask::` masks one line. A token spanning two would leave the
  // second half printable, so refuse it rather than mask half of it.
  if (/[\r\n]/.test(credential.token)) {
    throw new Error(`The ${credential.source} credential spans lines.`);
  }
  return credential;
}

/** Variables the codemod CLI does not need, left out of its environment. */
export const WITHHELD_FROM_CLI = [
  'CODEMOD_API_KEY',
  'ACTIONS_ID_TOKEN_REQUEST_URL',
  'ACTIONS_ID_TOKEN_REQUEST_TOKEN',
];

/**
 * Publish the package with the codemod CLI at `cli`. The CLI reads its
 * credential from CODEMOD_AUTH_TOKEN. It is not handed the API key or the
 * OIDC request variables, which it does not use. That is tidiness, not a
 * boundary: a process running as the runner user can read its parent's
 * environment.
 */
export async function publish({
  cli,
  root = REPO,
  env = process.env,
  spawn = spawnSync,
  fetchImpl = fetch,
  log = console.log,
  warn = console.error,
}) {
  let credential;
  try {
    credential = await chooseCredential(env, fetchImpl);
  } catch (err) {
    warn(`::error::${err.message}`);
    return 1;
  }
  log(`::add-mask::${credential.token}`);
  log(
    credential.source === 'api-key'
      ? '::notice::Publishing with the CODEMOD_API_KEY secret. Once a ' +
          'Trusted Publisher is set up for this package, delete the secret ' +
          'and this job uses GitHub OIDC instead.'
      : 'Publishing with a GitHub OIDC token.'
  );
  const childEnv = { ...env, CODEMOD_AUTH_TOKEN: credential.token };
  for (const name of WITHHELD_FROM_CLI) delete childEnv[name];

  const result = spawn(cli, ['publish', path.join(root, PACKAGE_DIR)], {
    stdio: 'inherit',
    env: childEnv,
    timeout: PUBLISH_TIMEOUT_MS,
  });
  if (result.error) {
    warn(
      `::error::codemod publish did not run to completion: ` +
        `${forLog(result.error.code ?? result.error.message)}.`
    );
    return result.error.code === 'ETIMEDOUT' ? 1 : 2;
  }
  if (result.status !== 0) {
    warn(
      `::error::codemod publish exited ${result.status ?? result.signal}. ` +
        'If it says the version already exists, the registry has this ' +
        `release; \`${BUMP_COMMAND}\` after the next bestax-migrate release.`
    );
    return 1;
  }
  return 0;
}

/**
 * Point codemod.yaml and every pin at package.json's version. Returns the
 * package-relative paths it rewrote; an up-to-date package returns [].
 */
export function bump(root = REPO) {
  const dir = path.join(root, PACKAGE_DIR);
  const version = assertVersion(
    JSON.parse(fs.readFileSync(path.join(root, NPM_MANIFEST), 'utf8')).version,
    `${NPM_MANIFEST} version`
  );
  const rewrites = [
    [
      'codemod.yaml',
      text => text.replace(/^version:.*$/m, `version: "${version}"`),
    ],
    ...pinnedFiles(dir).map(rel => [
      rel,
      text => text.replace(PIN, `bestax-migrate@${version}`),
    ]),
  ];
  const changed = [];
  for (const [rel, rewrite] of rewrites) {
    const file = path.join(dir, rel);
    const before = fs.readFileSync(file, 'utf8');
    const after = rewrite(before);
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed.push(rel);
    }
  }
  return changed;
}

const USAGE =
  'Usage: node scripts/codemod-registry.mjs check [--offline]\n' +
  '       node scripts/codemod-registry.mjs publish --cli <path to codemod>\n' +
  '       node scripts/codemod-registry.mjs bump';

export async function main(argv = process.argv.slice(2), deps = {}) {
  const {
    root = REPO,
    log = console.log,
    warn = console.error,
    fetchOptions,
  } = deps;
  const [mode, ...rest] = argv;

  if (mode === 'check' && rest.every(arg => arg === '--offline')) {
    const { version, problems } = packageProblems(readPackage(root));
    let cli = { version: null, problems: [] };
    try {
      cli = cliProblems(readCli(root));
    } catch (err) {
      cli.problems.push(
        `${CLI_DIR} could not be read: ${forLog(err.message)}.`
      );
    }
    problems.push(...cli.problems);
    if (!problems.length && !rest.length) {
      problems.push(...(await npmProblems(version, fetchOptions)));
    }
    if (problems.length) {
      for (const problem of problems) warn(`::error::${problem}`);
      return 1;
    }
    log(
      `codemod.yaml, every pin and ${NPM_MANIFEST} name ${PACKAGE_NAME} ` +
        `${version}` +
        (rest.length ? '' : ', npm serves it with provenance,') +
        ` and ${CLI_DIR} locks codemod ${cli.version}.`
    );
    return 0;
  }

  if (mode === 'publish' && rest.length === 2 && rest[0] === '--cli') {
    return publish({ cli: rest[1], root, log, warn, ...deps });
  }

  if (mode === 'bump' && rest.length === 0) {
    const changed = bump(root);
    log(
      changed.length
        ? `Rewrote ${changed.map(rel => `${PACKAGE_DIR}/${rel}`).join(', ')}.`
        : `${PACKAGE_DIR} already names ${NPM_MANIFEST}'s version.`
    );
    return 0;
  }

  warn(USAGE);
  return 2;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await main();
}
