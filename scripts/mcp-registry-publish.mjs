#!/usr/bin/env node
/**
 * Publish bestax-mcp's listing to the official MCP Registry
 * (registry.modelcontextprotocol.io) for one release.
 *
 * Called by .github/workflows/mcp-registry.yml, which carries the trust
 * reasoning: why it is a workflow of its own, why this file is read from
 * `main` rather than from the release tag, and what its egress list allows.
 * This file carries the logic rule 9 of .github/CLAUDE.md wants out of YAML
 * and under `node --test`. Two modes, run in this order:
 *
 *   prepare  turn the release tag into a version, check the committed
 *            bestax-mcp/server.json against bestax-mcp/package.json, and
 *            write the version into both of server.json's version fields
 *   publish  exit 0 if the registry already has that version; otherwise log
 *            in with GitHub OIDC and publish, retrying while npm catches up
 *
 * ## Why the version is written here rather than committed
 *
 * semantic-release bumps bestax-mcp/package.json in its release commit and
 * nothing else. A real version committed in server.json would be wrong from
 * the next release on, and teaching the release config to bump a second file
 * adds a step that can fail a release. So the committed server.json carries
 * VERSION_PLACEHOLDER in both fields, a value that says what happens to it,
 * and `prepare` writes the release version over it in the runner's copy.
 * Nothing is committed back. The test sibling holds the committed file to the
 * placeholder, so a hand-set version fails CI instead of going stale.
 *
 * ## Why `publish` retries, and retries the publish itself
 *
 * The registry checks ownership by fetching bestax-mcp@<version> from npm and
 * reading its `mcpName`. The `release` event fires seconds after the publish
 * step, and npm can take minutes to serve a new version: consumer-sbom waits
 * on the same clock, and #716 has the measurements behind the budget both
 * jobs share (DEFAULT_BUDGET_SECONDS in npm-install-retry.mjs). The lookup
 * that has to succeed is the registry's own, so this retries the publish
 * rather than polling npm from the job, which would also put
 * registry.npmjs.org on the job's egress list for no gain.
 *
 * Every failed attempt is retried until the budget runs out, as in
 * npm-install-retry.mjs. The registry's answer for "not on npm yet" is prose
 * in a 400 body, and keying a retry on a third party's wording would turn a
 * rephrased message into a failed release. The cost lands on a run that was
 * going to fail anyway: a permanent error spends the budget before it is
 * reported. `prepare` checks everything that can be checked offline first,
 * so the failures we can predict stop before any of that.
 *
 * Each attempt logs in again, because the registry's tokens are short-lived
 * (internal/auth/jwt.go at the pinned publisher release) and the budget is
 * longer than one. Before each attempt, and once more before giving up, the
 * registry is asked whether it already has the version: a re-run, a
 * concurrent run, or an attempt whose response was lost after the registry
 * committed it all end there with exit 0.
 *
 * Exit codes: 0 published, or the registry already had this version
 *             1 a check failed, or the budget ran out
 *             2 bad usage, or the publisher binary could not be started
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import {
  assertVersion,
  forLog,
  parseReleaseTag,
} from './consumer-sbom-meta.mjs';
import {
  DEFAULT_BUDGET_SECONDS,
  FATAL_SPAWN_CODES,
} from './npm-install-retry.mjs';

/**
 * The deployment both the OIDC login and the existence check talk to. Passed
 * to `login` explicitly, rather than left to the publisher's default, because
 * the login derives its OIDC audience from it and the check below has to ask
 * the same registry the token was minted for.
 */
export const REGISTRY_URL = 'https://registry.modelcontextprotocol.io';

/** What the committed server.json carries in both version fields. */
export const VERSION_PLACEHOLDER = '0.0.0-set-from-release-tag';

/** server.schema.json's `description.maxLength`. */
export const DESCRIPTION_MAX = 100;

/**
 * server.schema.json's `name.pattern`. Checked here as well as by the
 * registry because the name goes into a URL path and into log lines, and this
 * grammar leaves nothing in it that either could misread.
 */
export const SERVER_NAME = /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/;

/** The npm registry the official MCP Registry accepts, and nothing else. */
export const NPM_REGISTRY = 'https://registry.npmjs.org';

/** One home for the propagation budget; see the header. */
export const BUDGET_SECONDS = DEFAULT_BUDGET_SECONDS;

/**
 * Longer than npm-install-retry's interval on purpose: each attempt here mints
 * an OIDC token, logs in, and makes the registry fetch from npm, so it is a
 * heavier request against somebody else's service.
 */
export const SLEEP_SECONDS = 30;

/** A hung publisher is killed and counted as a failed attempt. */
export const ATTEMPT_TIMEOUT_MS = 120_000;

/** The existence check gives up after this and reports "unknown". */
export const LOOKUP_TIMEOUT_MS = 15_000;

export const LOGIN_ARGS = ['login', 'github-oidc', '--registry', REGISTRY_URL];

export function publishArgs(serverJsonPath) {
  return ['publish', serverJsonPath];
}

/**
 * Check what this script relies on in a server.json and the package.json it
 * describes. Throws on the first problem; returns nothing.
 *
 * Deliberately not a schema validator: the registry validates the schema and
 * reports every issue at once. These are the cross-file facts it cannot see
 * until npm answers (the name has to equal `mcpName`, the package has to be
 * this one) plus the field this file writes into, so a mistake in either file
 * fails in seconds, offline, instead of after the whole retry budget.
 */
export function checkServer(server, manifest) {
  if (!manifest || typeof manifest.name !== 'string' || !manifest.name) {
    throw new Error('package.json has no name');
  }
  if (typeof manifest.mcpName !== 'string' || !manifest.mcpName) {
    throw new Error(
      `${manifest.name}'s package.json has no mcpName. The registry reads it ` +
        `from the published package to prove ownership, so it has to ship ` +
        `in the release being listed.`
    );
  }
  if (!server || typeof server !== 'object') {
    throw new Error('server.json is not a JSON object');
  }
  if (typeof server.name !== 'string' || !SERVER_NAME.test(server.name)) {
    throw new Error(
      `server.json name ${forLog(server.name)} is not a registry name ` +
        `(namespace/name)`
    );
  }
  if (server.name !== manifest.mcpName) {
    throw new Error(
      `server.json name ${forLog(server.name)} does not match package.json ` +
        `mcpName ${forLog(manifest.mcpName)}; the registry requires them equal`
    );
  }
  const description = server.description;
  const length = typeof description === 'string' ? [...description].length : 0;
  if (length < 1 || length > DESCRIPTION_MAX) {
    throw new Error(
      `server.json description must be 1 to ${DESCRIPTION_MAX} characters ` +
        `(has ${length})`
    );
  }
  if (!Array.isArray(server.packages) || server.packages.length !== 1) {
    throw new Error(
      'server.json must list exactly one package: this script writes the ' +
        'release version into packages[0] and nowhere else'
    );
  }
  const [pkg] = server.packages;
  if (pkg?.registryType !== 'npm' || pkg.identifier !== manifest.name) {
    throw new Error(
      `server.json packages[0] must be the npm package ${forLog(manifest.name)}`
    );
  }
  if (
    pkg.registryBaseUrl !== undefined &&
    pkg.registryBaseUrl !== NPM_REGISTRY
  ) {
    throw new Error(
      `server.json packages[0].registryBaseUrl must be ${NPM_REGISTRY} or ` +
        `absent; the official registry accepts no other npm registry`
    );
  }
  if (pkg.transport?.type !== 'stdio') {
    throw new Error('server.json packages[0].transport.type must be stdio');
  }
}

/** A copy of `server` with the release version in both version fields. */
export function stampVersion(server, version) {
  const stamped = structuredClone(server);
  stamped.version = version;
  stamped.packages[0].version = version;
  return stamped;
}

/**
 * The version a release tag names, checked against the package it must name.
 *
 * The tag is the only input here that does not come from `main`, and on a
 * dispatch it is typed by hand, so it is parsed with the same helpers
 * consumer-sbom uses for the same tags: the last-`@` split, semver, and a
 * character check, so it cannot break a URL or a log line.
 */
export function versionFromTag(tag, packageName) {
  const parsed = parseReleaseTag(tag);
  if (!parsed || parsed.package !== packageName) {
    throw new Error(
      `${forLog(tag)} is not a ${packageName}@<version> release tag`
    );
  }
  return assertVersion(parsed.version, `release tag ${forLog(tag)}`);
}

/** Parse a JSON file, naming the file in either failure. */
export function readJson(file) {
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
    throw new Error(`${file} is not valid JSON: ${forLog(err.message)}`, {
      cause: err,
    });
  }
}

/**
 * `<dir>/server.json` and `<dir>/package.json`, read and held to each other
 * by checkServer. scripts/gen-skills-repo.mjs builds the bestax plugin's
 * launch config from the same pair, so the plugin and the registry listing
 * start the same package the same way.
 */
export function readServer(dir) {
  const manifest = readJson(path.join(dir, 'package.json'));
  const server = readJson(path.join(dir, 'server.json'));
  checkServer(server, manifest);
  return { server, manifest };
}

/**
 * `prepare`: stamp `<dir>/server.json` in place for the release `tag`.
 *
 * In place is safe because the file is the runner's checkout, and nothing in
 * the job commits or pushes.
 */
export function prepare({ tag, dir, log = console.log }) {
  const { server, manifest } = readServer(dir);
  const serverPath = path.join(dir, 'server.json');
  const version = versionFromTag(tag, manifest.name);
  const stamped = stampVersion(server, version);
  const json = `${JSON.stringify(stamped, null, 2)}\n`;
  fs.writeFileSync(serverPath, json);
  // The whole document, so the run log records exactly what was sent.
  log(`prepared ${serverPath} for ${stamped.name} ${version}:\n${json}`);
  return { name: stamped.name, version };
}

/**
 * Read a prepared server.json back, refusing one `prepare` has not stamped.
 * That would publish the placeholder, which the registry rejects anyway, but
 * only after spending the budget on it.
 */
export function readPrepared(serverJsonPath) {
  const server = readJson(serverJsonPath);
  const name = server?.name;
  if (typeof name !== 'string' || !SERVER_NAME.test(name)) {
    throw new Error(`${serverJsonPath} has no valid name`);
  }
  const version = server.version;
  if (version === VERSION_PLACEHOLDER) {
    throw new Error(
      `${serverJsonPath} still carries the placeholder version; run ` +
        `\`prepare\` first`
    );
  }
  assertVersion(version, `${serverJsonPath} version`);
  const pkg = server.packages?.[0];
  if (pkg?.version !== version) {
    throw new Error(
      `${serverJsonPath} has packages[0].version ${forLog(pkg?.version)} ` +
        `but version ${forLog(version)}`
    );
  }
  return { name, version, identifier: String(pkg.identifier) };
}

/** The registry's detail endpoint for one version of one server. */
export function versionUrl(name, version) {
  return (
    `${REGISTRY_URL}/v0.1/servers/${encodeURIComponent(name)}` +
    `/versions/${encodeURIComponent(version)}?include_deleted=true`
  );
}

/**
 * Whether the registry already has `name` at `version`: 'yes', 'no', or
 * 'unknown'.
 *
 * `include_deleted=true` because a version whose status was set to deleted
 * still exists, and publishing it again is refused as a duplicate.
 *
 * 'unknown' covers everything that is not a clean answer (a network error, a
 * timeout, a 5xx, a 200 naming something else). The caller treats it as "go
 * ahead and try", which is safe: the registry refuses a duplicate version on
 * its own, so this check only saves a doomed attempt and turns a re-run into
 * a clean exit 0.
 */
export async function registryHasVersion(
  name,
  version,
  fetchImpl = globalThis.fetch
) {
  let res;
  try {
    res = await fetchImpl(versionUrl(name, version), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
  } catch {
    return 'unknown';
  }
  if (res.status === 404) return 'no';
  if (res.status !== 200) return 'unknown';
  try {
    const body = await res.json();
    return body?.server?.name === name && body?.server?.version === version
      ? 'yes'
      : 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Run the publisher once with `args`, inheriting stdio so its own diagnosis
 * lands in the job log. Returns whether it exited 0.
 *
 * An argument array, never a shell string. A spawn that could never start
 * (the codes in FATAL_SPAWN_CODES) throws, since no wait fixes a missing
 * binary; any other spawn error, including the timeout, is a failed attempt.
 */
export function runPublisher(
  binary,
  args,
  spawn = spawnSync,
  log = console.log
) {
  const result = spawn(binary, args, {
    stdio: 'inherit',
    timeout: ATTEMPT_TIMEOUT_MS,
  });
  if (result.error) {
    if (FATAL_SPAWN_CODES.has(result.error.code)) {
      throw new Error(
        `could not run ${forLog(binary)}: ${result.error.message}`
      );
    }
    log(
      `${forLog(binary)} did not finish (${result.error.code}), treating ` +
        `as a failed attempt`
    );
    return false;
  }
  return result.status === 0;
}

/**
 * Publish until it succeeds, the registry turns out to have the version, or
 * the budget is spent. `exists` and `attempt` are injected, and so are the
 * clock and the wait, so the policy runs in a test without a registry, a
 * subprocess, or real time.
 *
 * Returns { ok, outcome, attempts, waited } with outcome 'published',
 * 'present' or 'exhausted'.
 */
export async function publishWithRetry({
  exists,
  attempt,
  budgetSeconds = BUDGET_SECONDS,
  sleepSeconds = SLEEP_SECONDS,
  now = () => Date.now(),
  sleep,
  log = console.log,
}) {
  const started = now();
  const deadline = started + budgetSeconds * 1000;
  const elapsed = () => Math.round((now() - started) / 1000);
  const wait = sleepSeconds * 1000;
  let attempts = 0;
  for (;;) {
    if ((await exists()) === 'yes') {
      return { ok: true, outcome: 'present', attempts, waited: elapsed() };
    }
    attempts += 1;
    if (await attempt()) {
      return { ok: true, outcome: 'published', attempts, waited: elapsed() };
    }
    // Same deadline rule as npm-install-retry: the budget always buys one
    // attempt, and no wait is started that would end past the deadline.
    if (now() + wait > deadline) {
      // One last look. A publish can fail on our side after the registry
      // committed it, and that is a success.
      if ((await exists()) === 'yes') {
        return { ok: true, outcome: 'present', attempts, waited: elapsed() };
      }
      return { ok: false, outcome: 'exhausted', attempts, waited: elapsed() };
    }
    log(`publish attempt ${attempts} failed; retrying in ${sleepSeconds}s`);
    await sleep(wait);
  }
}

export function defaultSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const FLAGS = {
  prepare: ['tag', 'dir'],
  publish: ['server-json', 'publisher'],
};

/**
 * Parse `<mode> --flag value ...`. Every flag is required and an unknown one
 * is an error, so a typo cannot quietly drop an input.
 */
export function parseArgs(argv) {
  const [mode, ...rest] = argv;
  if (!Object.hasOwn(FLAGS, mode)) {
    throw new Error('usage: mcp-registry-publish.mjs <prepare|publish> ...');
  }
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    if (!key.startsWith('--')) {
      throw new Error(`unexpected argument ${forLog(key)}`);
    }
    if (i + 1 >= rest.length) throw new Error(`${key} needs a value`);
    flags[key.slice(2)] = rest[i + 1];
  }
  for (const name of Object.keys(flags)) {
    if (!FLAGS[mode].includes(name)) {
      throw new Error(`${mode} does not take --${name}`);
    }
  }
  for (const name of FLAGS[mode]) {
    if (!flags[name]) throw new Error(`${mode} requires --${name}`);
  }
  return { mode, ...flags };
}

/**
 * `deps` exists for the tests: `fetch`, `spawn`, `now`, `sleep` and `log`
 * replace the network, the publisher, the clock and the job log.
 */
export async function main(argv = process.argv.slice(2), deps = {}) {
  const {
    fetch: fetchImpl = globalThis.fetch,
    spawn = spawnSync,
    now,
    sleep = defaultSleep,
    log = console.log,
  } = deps;

  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    log(`::error::${err.message}`);
    return 2;
  }

  if (args.mode === 'prepare') {
    try {
      prepare({ tag: args.tag, dir: args.dir, log });
      return 0;
    } catch (err) {
      log(`::error::${err.message}`);
      return 1;
    }
  }

  let name;
  let version;
  let identifier;
  try {
    ({ name, version, identifier } = readPrepared(args['server-json']));
  } catch (err) {
    log(`::error::${err.message}`);
    return 1;
  }

  let result;
  try {
    result = await publishWithRetry({
      exists: () => registryHasVersion(name, version, fetchImpl),
      attempt: () =>
        runPublisher(args.publisher, LOGIN_ARGS, spawn, log) &&
        runPublisher(
          args.publisher,
          publishArgs(args['server-json']),
          spawn,
          log
        ),
      now,
      sleep,
      log,
    });
  } catch (err) {
    // Only runPublisher throws, and only when the binary never started.
    log(`::error::${err.message}`);
    return 2;
  }

  if (result.outcome === 'present') {
    // After a failed attempt this is most likely that attempt landing with
    // its response lost, so the message does not claim it was there before.
    log(
      result.attempts === 0
        ? `::notice::${name} ${version} is already in the MCP Registry; ` +
            `nothing to publish.`
        : `::notice::${name} ${version} is in the MCP Registry, found after ` +
            `${result.attempts} attempt(s) that reported failure.`
    );
    return 0;
  }
  if (result.ok) {
    log(`published ${name} ${version} after ${result.attempts} attempt(s)`);
    return 0;
  }
  log(
    `::error::${name} ${version} was not published within the budget ` +
      `(${result.waited}s of ${BUDGET_SECONDS}s, ${result.attempts} ` +
      `attempts). The publisher's own output above says why each attempt ` +
      `failed. If npm never served ${forLog(`${identifier}@${version}`)} ` +
      `with an mcpName, the release is where to look; otherwise re-run the ` +
      `job, or dispatch this workflow with the same tag.`
  );
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await main();
}
