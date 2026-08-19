#!/usr/bin/env node
/**
 * Pre-flight for the packages that publish with `pnpm publish` (#436).
 *
 * bestax-migrate hands its publish step to `@semantic-release/exec` running
 * `pnpm publish`, because `npm publish` does not resolve pnpm's `workspace:`
 * protocol and shipped an uninstallable 1.0.0 (#412). Doing that costs one
 * thing worth replacing: `@semantic-release/npm` performed a real OIDC token
 * exchange inside `verifyConditions`, so a job missing `id-token: write` failed
 * before semantic-release had written anything. With `npmPublish: false` that
 * check is switched off entirely.
 *
 * That matters because of the order semantic-release runs things in: EVERY
 * `prepare` step (changelog, version bump, `@semantic-release/git`'s commit and
 * tag) completes before ANY `publish` step. An auth failure discovered at
 * publish time therefore leaves a release commit and a tag on main with no
 * package behind them, and that version number is spent.
 *
 * So assert the cheap half early. This checks that a GitHub Actions OIDC
 * context EXISTS — nothing more. It does not mint a token, does not contact the
 * registry, and does not establish that npm will accept this repository as a
 * trusted publisher for the package.
 *
 * What earns it its place is purely the TIMING, not the check. pnpm vendors
 * libnpmpublish, whose `ensureProvenanceGeneration` already throws EUSAGE on a
 * missing ACTIONS_ID_TOKEN_REQUEST_URL — the same variable, the same verdict.
 * But it throws during `publish`, which is after the release commit and tag
 * have been pushed. Reaching the same conclusion during `verifyConditions`
 * costs nothing and leaves the repository untouched.
 *
 * The residual risk this does NOT cover — the registry rejecting an otherwise
 * well-formed token — is only knowable from a real release. It is tolerable
 * because pnpm's OIDC failure path warns and falls back to configured
 * credentials, of which the publish job deliberately has none: the fallback is
 * a hard auth error, not a quiet unsigned publish.
 *
 * Outside CI this is a no-op — a maintainer running `semantic-release --dry-run`
 * locally has no OIDC context and is not about to publish.
 */
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const VARS = ['ACTIONS_ID_TOKEN_REQUEST_URL', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN'];

/**
 * Keyed on GITHUB_ACTIONS rather than CI, and the difference is which way this
 * fails when the signal is absent.
 *
 * `CI` is set by convention, not by contract: a container image, a composite
 * action, or a job-level `env:` can leave it unset, and keying on it made this
 * guard a silent no-op in exactly that case. Wrong direction for something
 * whose whole job is to fail early, since the fallback is discovering the
 * problem at publish time with the tag already pushed.
 *
 * GITHUB_ACTIONS is guaranteed by the runner, and it is what pnpm's own
 * `ensureProvenanceGeneration` keys on when deciding whether to demand an OIDC
 * context. Using the same signal means this cannot disagree with the thing it
 * front-runs. Its value is the string 'true', so compare it.
 */
const inCI = env => String(env.GITHUB_ACTIONS).toLowerCase() === 'true';

export function checkOidcContext(env = process.env) {
  if (!inCI(env)) return { ok: true, skipped: true };
  const missing = VARS.filter(name => !env[name]);
  return { ok: missing.length === 0, skipped: false, missing };
}

export function main(env = process.env, log = console.error) {
  const { ok, skipped, missing } = checkOidcContext(env);
  if (skipped || ok) return 0;
  log(
    `verify-oidc-context: ${missing.join(' and ')} ${
      missing.length > 1 ? 'are' : 'is'
    } unset, so this job has no OIDC context and ` +
      '`pnpm publish --provenance` has nothing to authenticate with.\n' +
      'The usual cause is a publish job that lost `permissions: id-token: ' +
      'write`.\n' +
      'This check only proves the context exists — not that npm will accept ' +
      'the token for this package.'
  );
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
