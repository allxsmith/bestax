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
 * Scope, stated plainly rather than implied. bestax-migrate wires this to BOTH
 * `prepack` and `prepublishOnly`, which between them cover `npm publish` and
 * `npm pack` — the latter matters because `npm publish <tarball>` runs no
 * scripts at all, so a tarball packed by npm could otherwise be published with
 * nothing left to refuse it. What it does NOT cover:
 *
 *   - `--ignore-scripts`, which skips these hooks entirely. Both npm and pnpm
 *     gate lifecycle scripts on it (pnpm 11.9.0 wraps the `prepublishOnly` /
 *     `prepublish` call in `if (!opts.ignoreScripts)`), so `npm publish
 *     --ignore-scripts` ships the unresolved specifier with no signal at all.
 *     Worth naming rather than leaving implied, because a repo whose
 *     supply-chain policy is built on blocking install scripts is exactly the
 *     kind of place that reaches for that flag out of habit.
 *   - a tarball packed before this guard existed, or packed elsewhere.
 *
 * A hook cannot cover those, so this is a guard against the likely mistake, not
 * a proof. Inspect the tarball with `pnpm -C bestax-migrate pack` if you are
 * unsure what a manifest will ship.
 */
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/**
 * Keyed on `npm_execpath`, NOT on `npm_config_user_agent`.
 *
 * The user agent is inherited. npm relays whatever it finds in the
 * environment, so `pnpm exec npm publish` runs this hook reporting
 * `pnpm/11.9.0 …` and an agent check waves it straight through — while npm,
 * not pnpm, assembles the tarball and ships `workspace:^` unresolved. That is
 * #412 through the guard written to stop it, via the most natural
 * hand-publish form in a pnpm monorepo. Measured:
 *
 *   pnpm publish          agent pnpm/…   execpath …/pnpm/11.9.0/bin/pnpm.mjs
 *   npm publish           agent npm/…    execpath …/npm/bin/npm-cli.js
 *   pnpm exec npm publish agent pnpm/…   execpath …/npm/bin/npm-cli.js
 *
 * `npm_execpath` is rewritten by whichever process actually runs the lifecycle
 * script, so it names the real packer where the agent only names an ancestor.
 *
 * An ABSENT execpath is treated as allowed: `prepublishOnly` only runs under a
 * package manager, so nothing there means the script was invoked directly, and
 * failing would be a confusing refusal rather than a caught mistake.
 */
export function isPnpmPublish(execPath) {
  if (!execPath) return true;
  const binary = String(execPath).trim().split(/[\\/]/).pop() ?? '';
  const name = binary.replace(/\.(c|m)?js$|\.cmd$|\.exe$|\.bat$|\.ps1$/i, '');

  // Refuse only what is POSITIVELY a different packer. Anything unrecognised is
  // allowed, and that asymmetry is deliberate: refusing an unknown value fails
  // a real release from inside a pack hook, after semantic-release has pushed
  // the commit and tag, and pnpm's own lifecycle runner can hand us one.
  // Verified in pnpm 11.9.0's bundle:
  //
  //   env.npm_execpath = process.pkg != null
  //     ? process.execPath
  //     : process.argv[1] || process.cwd()
  //
  // so a build where argv[1] is falsy reports the package DIRECTORY. Under a
  // known-good-only rule that reads as "not pnpm" and kills the release; here
  // it reads as unrecognised and passes, while `pnpm exec npm publish` — the
  // case this guard exists for — still names npm-cli and is still refused.
  const OTHER_PACKAGE_MANAGERS =
    /^(npm|npm-cli|npx|yarn|yarnpkg|bun|bunx|cnpm|tnpm)$/i;
  return !OTHER_PACKAGE_MANAGERS.test(name);
}

export function main(env = process.env, log = console.error) {
  if (isPnpmPublish(env.npm_execpath)) {
    // A hand-run `pnpm publish` is allowed, and silently produces neither
    // provenance nor an embedded README: those flags live in the release
    // config's publishCmd, and this package deliberately carries no
    // publishConfig.provenance for pnpm to fall back on. CI passes them, so say
    // nothing there; a human gets one line before the tarball goes out.
    if (!env.CI && !env.GITHUB_ACTIONS) {
      log(
        'require-pnpm-publish: publishing by hand. `--provenance ' +
          '--embed-readme` are not defaults here and CI passes them for you; ' +
          'without them this release ships unattested and its npm page loses ' +
          'its README.'
      );
    }
    return 0;
  }
  log(
    'This package must be published with `pnpm publish`, not ' +
      `\`npm publish\` (packer: ${env.npm_execpath}).\n` +
      '\n' +
      'It declares "@allxsmith/bestax-bulma": "workspace:^" in ' +
      'devDependencies. pnpm resolves the workspace: protocol at pack time; ' +
      'npm ships it verbatim, and the published package is then uninstallable ' +
      'for everyone (EUNSUPPORTEDPROTOCOL, #412 shipped exactly this as ' +
      '1.0.0).\n' +
      '\n' +
      'Releases are automated and run from CI. If you really are publishing ' +
      'by hand, the flags are not optional either, because this package no ' +
      'longer carries a publishConfig.provenance for pnpm to read:\n' +
      '\n' +
      '  pnpm publish --provenance --embed-readme --access public\n' +
      '\n' +
      'Check what it would ship first with `pnpm -C bestax-migrate pack`.'
  );
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
