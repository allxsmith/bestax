#!/usr/bin/env node
/**
 * Refuses a publish driven by anything other than pnpm (#436).
 *
 * bestax-migrate keeps `"@allxsmith/bestax-bulma": "workspace:^"` in
 * devDependencies. `pnpm publish` rewrites that to a real range at pack time;
 * `npm publish` ships the protocol verbatim, which is what made 1.0.0
 * uninstallable (#412).
 *
 * That used to be covered twice over: a `prepack` hook rewrote the specifier
 * for whatever was packing, and `check:conformance` refused to let the
 * specifier exist without those hooks wired. #436 removed the hook, because
 * hand-rolling pnpm's rewrite is the bug class it exists to stop owning, and
 * the conformance rule now EXEMPTS this package precisely because pnpm handles
 * it. Both of those are right, and together they left the specifier with no
 * mechanical guard at all: correct in the release pipeline, and a prose rule in
 * CLAUDE.md everywhere else.
 *
 * So guard the packer instead of the specifier. `pnpm publish` runs
 * `prepublishOnly` (verified against pnpm 11.9.0, which invokes it alongside
 * `prepublish` before packing), and so does `npm publish`, so this hook sees
 * both and can tell them apart by the user agent each sets:
 *
 *   pnpm/11.9.0 npm/? node/v25.2.1 darwin arm64
 *   npm/11.6.2 node/v25.2.1 darwin arm64 workspaces/false
 *
 * Scope, stated plainly rather than implied: this covers `npm publish` run in
 * the package directory, which is the realistic mistake. It does NOT cover
 * `npm pack` (which runs `prepack`/`prepare`, not `prepublishOnly`) or
 * publishing a pre-built tarball (which runs none of the package's scripts).
 * Inspect the tarball with `pnpm -C bestax-migrate pack` if you are unsure what
 * a manifest will ship.
 */
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/**
 * The publish is pnpm's if the user agent says so. An ABSENT user agent is
 * treated as allowed: `prepublishOnly` only runs under a package manager, so a
 * missing value means someone invoked this script directly, and failing there
 * would be a confusing no-op refusal rather than a caught mistake.
 */
export function isPnpmPublish(userAgent) {
  if (!userAgent) return true;
  return /^pnpm\//.test(String(userAgent).trim());
}

export function main(env = process.env, log = console.error) {
  if (isPnpmPublish(env.npm_config_user_agent)) return 0;
  log(
    'This package must be published with `pnpm publish`, not ' +
      `\`npm publish\` (agent: ${env.npm_config_user_agent}).\n` +
      '\n' +
      'It declares "@allxsmith/bestax-bulma": "workspace:^" in ' +
      'devDependencies. pnpm resolves the workspace: protocol at pack time; ' +
      'npm ships it verbatim, and the published package is then uninstallable ' +
      'for everyone (EUNSUPPORTEDPROTOCOL, #412 shipped exactly this as ' +
      '1.0.0).\n' +
      '\n' +
      'Releases are automated and run from CI. If you really are publishing ' +
      'by hand, use `pnpm publish` and check the tarball first with ' +
      '`pnpm -C bestax-migrate pack`.'
  );
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
