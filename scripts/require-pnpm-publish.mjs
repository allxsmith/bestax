#!/usr/bin/env node
/**
 * Refuses a publish driven by anything other than pnpm (#436, #532).
 *
 * Every package in this workspace publishes with `pnpm publish`. `npm publish`
 * resolves none of pnpm's pack-time protocols, so a `workspace:^` reaches the
 * registry verbatim and the published package is uninstallable for everyone —
 * which is exactly what shipped as bestax-migrate@1.0.0 (#412).
 *
 * That used to be covered twice over for the one package that carried such a
 * specifier: a `prepack` hook rewrote it for whatever was packing, and
 * `check:conformance` refused to let the specifier exist without those hooks
 * wired. #436 removed the hook, because hand-rolling pnpm's rewrite is the bug
 * class it exists to stop owning, and the conformance rule now EXEMPTS a
 * declared pnpm publisher precisely because pnpm handles it. Both of those are
 * right, and together they left the exemption resting on an assumption —
 * "pnpm packs this" — that nothing outside CI enforced.
 *
 * So guard the packer instead of the specifier. `pnpm publish` runs
 * `prepublishOnly` (verified against pnpm 11.9.0, which invokes it alongside
 * `prepublish` before packing), and so does `npm publish`, so this hook sees
 * both and can tell them apart.
 *
 * It is wired into every publishable package, not only the one with a
 * `workspace:` specifier. Two reasons, and the second is the load-bearing one:
 * a package that gains such a dependency should not also have to remember to
 * add a guard, and the flags the release passes (`--provenance`,
 * `--embed-readme`) are not pnpm's defaults, so a hand `npm publish` degrades
 * every package here, not just that one.
 *
 * Scope, stated plainly rather than implied. Each package wires this to BOTH
 * `prepack` and `prepublishOnly`, which between them cover `npm publish` and
 * `npm pack` — the latter matters because `npm publish <tarball>` runs no
 * scripts at all, so a tarball packed by npm could otherwise be published with
 * nothing left to refuse it. What it does NOT cover:
 *
 *   - `--ignore-scripts`, which skips these hooks entirely. Both npm and pnpm
 *     gate lifecycle scripts on it (pnpm 11.9.0 wraps the `prepublishOnly` /
 *     `prepublish` call in `if (!opts.ignoreScripts)`), so `npm publish
 *     --ignore-scripts` ships whatever the manifest says with no signal at all.
 *     Worth naming rather than leaving implied, because a repo whose
 *     supply-chain policy is built on blocking install scripts is exactly the
 *     kind of place that reaches for that flag out of habit.
 *   - a tarball packed before this guard existed, or packed elsewhere.
 *
 * A hook cannot cover those, so this is a guard against the likely mistake, not
 * a proof. Inspect the tarball with `pnpm -C <package> pack` if you are unsure
 * what a manifest will ship.
 */
import fs from 'node:fs';
import path from 'node:path';
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

/**
 * Restated here rather than imported from check-conformance.mjs, and the
 * difference in consequence is why that is acceptable. THERE the list is a
 * rule: it decides whether a manifest is a violation. HERE it only decides
 * whether the refusal can name a specific offending specifier. If the two
 * drift, this message gets less specific; it does not get a wrong verdict. The
 * alternative is importing a 60KB check into a lifecycle hook that runs on
 * every pack, to improve one sentence.
 */
const PACK_TIME_PROTOCOLS = [
  'workspace:',
  'catalog:',
  'jsr:',
  'link:',
  'portal:',
  'file:',
];

const DEP_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/** Every specifier in `pkg` that only means something inside this workspace. */
export function packTimeSpecifiers(pkg) {
  const found = [];
  for (const section of DEP_SECTIONS) {
    for (const [name, spec] of Object.entries(pkg?.[section] ?? {})) {
      if (typeof spec !== 'string') continue;
      if (PACK_TIME_PROTOCOLS.some(p => spec.startsWith(p))) {
        found.push({ section, name, spec });
      }
    }
  }
  return found;
}

/**
 * What is being packed, read from the cwd — lifecycle hooks run in the package
 * root. Never throws: this is called only to write a better error message, and
 * a guard that crashed while explaining itself would report the wrong problem.
 */
function describePackage(cwd) {
  const dir = path.basename(cwd);
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')));
    return { dir, name: pkg.name ?? dir, specifiers: packTimeSpecifiers(pkg) };
  } catch {
    return { dir, name: dir, specifiers: [] };
  }
}

export function main(
  env = process.env,
  log = console.error,
  cwd = process.cwd()
) {
  if (isPnpmPublish(env.npm_execpath)) {
    // A hand-run `pnpm publish` is allowed, and silently produces neither
    // provenance nor an embedded README: those flags live in the shared
    // publishCmd, and no package here carries a publishConfig.provenance for
    // pnpm to fall back on. CI passes them, so say nothing there; a human gets
    // one line before the tarball goes out.
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

  const { dir, name, specifiers } = describePackage(cwd);
  // Named only when the manifest actually carries one. Inventing a specifier
  // for a package that has none would send the reader looking for something
  // that is not there, and the rule holds for that package either way.
  const declared = specifiers.length
    ? `${name} declares ` +
      specifiers
        .map(s => `"${s.name}": "${s.spec}" in ${s.section}`)
        .join(', ') +
      ', which npm would ship verbatim.\n\n'
    : '';

  log(
    `This package must be published with \`pnpm publish\`, not ` +
      `\`npm publish\` (packer: ${env.npm_execpath}).\n` +
      '\n' +
      declared +
      'Every package in this workspace publishes with pnpm, because ' +
      "`npm publish` resolves none of pnpm's pack-time protocols — a " +
      '`workspace:` specifier reaches the registry verbatim, and #412 shipped ' +
      'exactly that as bestax-migrate@1.0.0, uninstallable ' +
      '(EUNSUPPORTEDPROTOCOL).\n' +
      '\n' +
      'Releases are automated and run from CI. If you really are publishing ' +
      'by hand, the flags are not optional either, because no package here ' +
      'carries a publishConfig.provenance for pnpm to read:\n' +
      '\n' +
      '  pnpm publish --provenance --embed-readme --access public\n' +
      '\n' +
      `Check what it would ship first with \`pnpm -C ${dir} pack\`.`
  );
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
