#!/usr/bin/env node
/**
 * Resolves pnpm `workspace:` specifiers in package.json while the tarball is
 * packed (issue #412).
 *
 * `pnpm publish` rewrites `workspace:^` to the real semver range at pack time;
 * `npm publish` does NOT — and the release pipeline runs `@semantic-release/npm`,
 * which shells out to `npm publish`. That shipped `bestax-migrate@1.0.0` with a
 * literal `"workspace:^"` in its manifest, making it uninstallable by every
 * package manager (`EUNSUPPORTEDPROTOCOL`).
 *
 * So do the rewrite ourselves. The repo file must come back untouched — the
 * release commits package.json — so `prepack` backs it up and `postpack`
 * restores it, exactly like bulma-ui/scripts/pack-pointer-files.mjs.
 *
 * This runs over EVERY dependency section, not just `dependencies`: a
 * `workspace:` specifier is meaningless outside the workspace wherever it
 * appears. The companion guard is the `publishable-manifests` sub-check in
 * scripts/check-conformance.mjs, which fails CI if a published package ever
 * declares a workspace dep in `dependencies` (a runtime dep the tarball would
 * need) rather than `devDependencies`.
 *
 * Note for reviewers: the published manifest still carries the `prepack` /
 * `postpack` hooks pointing here, while `files: ["dist"]` keeps this script out
 * of the tarball. That is deliberate and inert — npm runs those hooks on
 * pack/publish, never on install from a tarball, so the path is never followed
 * by a consumer. Shipping `scripts/` to fix the dangling reference would add
 * dead weight to every install, and stripping the hooks during `prepack` would
 * risk npm not running `postpack` and leaving the repo manifest rewritten for
 * @semantic-release/git to commit — the exact failure the backup below exists
 * to prevent.
 *
 * The per-specifier decision is exported and takes its version lookup as an
 * argument, and `main` only runs when this file is executed directly. That
 * seam exists for one reason (#435): this script and
 * scripts/check-conformance.mjs encode the same rule about which pnpm shapes
 * are resolvable, and a shape this script REFUSES but the check EXCUSES is a
 * green CI with a red release. That inversion happened twice during review of
 * #417 — once for `catalog:`, once for the alias form — so a test now drives
 * both real implementations and asserts they agree shape for shape. It can
 * only do that if the decision is callable without packing anything.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultPkgRoot = path.dirname(
  path.dirname(fileURLToPath(import.meta.url))
);

const DEP_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/**
 * Raised for a specifier this script will not resolve. Thrown rather than
 * exited so the decision can be exercised by a test; `main` turns it back into
 * the same message-and-exit-1 the CLI has always produced.
 */
export class UnsupportedSpecifierError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsupportedSpecifierError';
  }
}

/**
 * Version of a workspace package, read through the linked node_modules entry.
 * Curried over the package root so a test can supply its own lookup instead of
 * needing a real pnpm-linked tree.
 */
export function makeWorkspaceVersionResolver(pkgRoot = defaultPkgRoot) {
  return name => {
    const linked = path.join(pkgRoot, 'node_modules', name, 'package.json');
    if (!fs.existsSync(linked)) {
      throw new UnsupportedSpecifierError(
        `pack-manifest: cannot resolve the workspace dependency "${name}" — ` +
          `${path.relative(pkgRoot, linked)} does not exist.\n` +
          'Run `pnpm install` from the repo root before packing.'
      );
    }
    const { version } = JSON.parse(fs.readFileSync(linked, 'utf8'));
    if (!version) {
      throw new UnsupportedSpecifierError(
        `pack-manifest: "${name}" has no version in its manifest`
      );
    }
    return version;
  };
}

/**
 * `workspace:^` / `workspace:~` / `workspace:*` take the prefix from the
 * protocol and the version from the linked package; `workspace:<range>`
 * (e.g. `workspace:^5.0.0`) already carries its own range, so just unwrap it.
 * A bare `workspace:` is pnpm's shorthand for `workspace:*` — leaving it to the
 * unwrap branch would emit an empty specifier.
 */
export function resolveSpecifier(name, spec, resolveVersion, label = name) {
  const rest = spec.slice('workspace:'.length);
  if (rest === '*' || rest === '') return resolveVersion(name);
  if (rest === '^' || rest === '~') return `${rest}${resolveVersion(name)}`;
  // `workspace:<name>@<range>` is pnpm's alias form, and it does NOT publish as
  // a bare range: pnpm emits `npm:<name>@<version>`. Unwrapping it would write
  // "@scope/pkg@^5", which no package manager can install — #412 again, wearing
  // a different hat. A semver range never contains "/" or a non-leading "@",
  // so this only catches the alias form.
  if (rest.includes('/') || rest.lastIndexOf('@') > 0) {
    throw new UnsupportedSpecifierError(
      `pack-manifest: ${label} is "${spec}", pnpm's alias form, which ` +
        `publishes as \`npm:<name>@<version>\`.\n` +
        'This script does not synthesize that. Depend on the package under its ' +
        'real name, or teach pack-manifest.mjs the npm: alias rewrite.'
    );
  }
  return rest;
}

/**
 * The whole per-specifier decision, in one place: what this script does with
 * any one dependency entry.
 *
 * Returns the rewritten specifier, or `null` when the entry is none of this
 * script's business and should be left exactly as written. Throws
 * UnsupportedSpecifierError for the shapes it refuses.
 *
 * This is the function scripts/pack-manifest.test.mjs drives, and it is the
 * single source of "refused or resolved" that check-conformance.mjs's
 * UNRESOLVABLE_AT_PACK has to stay in step with (#435).
 */
export function rewriteSpecifier(name, spec, resolveVersion, label = name) {
  if (typeof spec !== 'string') return null;
  // `catalog:` is the other protocol `pnpm publish` resolves and `npm publish`
  // ships verbatim — the exact shape of #412. This script cannot resolve it
  // (the range lives in pnpm-workspace.yaml, not in the linked package), so
  // fail the release rather than pack a broken tarball.
  if (spec.startsWith('catalog:')) {
    throw new UnsupportedSpecifierError(
      `pack-manifest: ${label} is "${spec}", and this script cannot resolve ` +
        `the catalog: protocol.\n` +
        'Give it a plain semver range, or teach pack-manifest.mjs to read ' +
        '`catalog`/`catalogs` from pnpm-workspace.yaml.'
    );
  }
  if (!spec.startsWith('workspace:')) return null;
  return resolveSpecifier(name, spec, resolveVersion, label);
}

/**
 * The CLI. Wrapped in a function and guarded below so importing this module
 * for the agreement test does not pack anything, and so the refusals above can
 * throw (testable) while the command still exits 1 with the same message.
 */
export function main(
  argv = process.argv.slice(2),
  { pkgRoot = defaultPkgRoot } = {}
) {
  const manifest = path.join(pkgRoot, 'package.json');
  const backup = path.join(pkgRoot, 'package.json.pack-backup');
  const resolveVersion = makeWorkspaceVersionResolver(pkgRoot);
  const mode = argv[0];

  if (mode === 'prepack') {
    if (fs.existsSync(backup)) {
      console.error(
        'pack-manifest: package.json.pack-backup already exists — a previous ' +
          'pack did not finish.\n' +
          'Restore the workspace manifest first: mv package.json.pack-backup package.json'
      );
      return 1;
    }

    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    const rewritten = [];

    for (const section of DEP_SECTIONS) {
      for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
        let resolved;
        try {
          resolved = rewriteSpecifier(
            name,
            spec,
            resolveVersion,
            `${section}.${name}`
          );
        } catch (err) {
          if (!(err instanceof UnsupportedSpecifierError)) throw err;
          console.error(err.message);
          return 1;
        }
        if (resolved === null) continue;
        pkg[section][name] = resolved;
        rewritten.push(`${section}.${name}: ${spec} -> ${resolved}`);
      }
    }

    if (!rewritten.length) {
      console.log('pack-manifest: no workspace: specifiers to resolve');
      return 0;
    }

    fs.copyFileSync(manifest, backup);
    // Keep npm's own formatting (2-space + trailing newline) so the restored
    // file and the packed one differ only in the specifiers.
    fs.writeFileSync(manifest, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log(
      `pack-manifest: resolved ${rewritten.length} workspace specifier(s)`
    );
    for (const line of rewritten) console.log(`  ${line}`);
    return 0;
  }

  if (mode === 'postpack') {
    if (!fs.existsSync(backup)) {
      // prepack exits early when there is nothing to rewrite; not an error.
      console.log('pack-manifest: no backup to restore');
      return 0;
    }
    fs.copyFileSync(backup, manifest);
    fs.rmSync(backup);
    console.log('pack-manifest: workspace manifest restored');
    return 0;
  }

  console.error('Usage: node scripts/pack-manifest.mjs <prepack|postpack>');
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
