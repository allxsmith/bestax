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
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = path.join(pkgRoot, 'package.json');
const backup = path.join(pkgRoot, 'package.json.pack-backup');

const DEP_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/** Version of a workspace package, read through the linked node_modules entry. */
function resolveWorkspaceVersion(name) {
  const linked = path.join(pkgRoot, 'node_modules', name, 'package.json');
  if (!fs.existsSync(linked)) {
    console.error(
      `pack-manifest: cannot resolve the workspace dependency "${name}" — ` +
        `${path.relative(pkgRoot, linked)} does not exist.\n` +
        'Run `pnpm install` from the repo root before packing.'
    );
    process.exit(1);
  }
  const { version } = JSON.parse(fs.readFileSync(linked, 'utf8'));
  if (!version) {
    console.error(`pack-manifest: "${name}" has no version in its manifest`);
    process.exit(1);
  }
  return version;
}

/**
 * `workspace:^` / `workspace:~` / `workspace:*` take the prefix from the
 * protocol and the version from the linked package; `workspace:<range>`
 * (e.g. `workspace:^5.0.0`) already carries its own range, so just unwrap it.
 * A bare `workspace:` is pnpm's shorthand for `workspace:*` — leaving it to the
 * unwrap branch would emit an empty specifier.
 */
function resolveSpecifier(name, spec) {
  const rest = spec.slice('workspace:'.length);
  if (rest === '*' || rest === '') return resolveWorkspaceVersion(name);
  if (rest === '^' || rest === '~')
    return `${rest}${resolveWorkspaceVersion(name)}`;
  return rest;
}

const mode = process.argv[2];

if (mode === 'prepack') {
  if (fs.existsSync(backup)) {
    console.error(
      'pack-manifest: package.json.pack-backup already exists — a previous ' +
        'pack did not finish.\n' +
        'Restore the workspace manifest first: mv package.json.pack-backup package.json'
    );
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const rewritten = [];

  for (const section of DEP_SECTIONS) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      if (typeof spec !== 'string') continue;
      // `catalog:` is the other protocol `pnpm publish` resolves and
      // `npm publish` ships verbatim — the exact shape of #412. This script
      // cannot resolve it (the range lives in pnpm-workspace.yaml, not in the
      // linked package), so fail the release rather than pack a broken tarball.
      if (spec.startsWith('catalog:')) {
        console.error(
          `pack-manifest: ${section}.${name} is "${spec}", and this script ` +
            `cannot resolve the catalog: protocol.\n` +
            'Give it a plain semver range, or teach pack-manifest.mjs to read ' +
            '`catalog`/`catalogs` from pnpm-workspace.yaml.'
        );
        process.exit(1);
      }
      if (!spec.startsWith('workspace:')) continue;
      const resolved = resolveSpecifier(name, spec);
      pkg[section][name] = resolved;
      rewritten.push(`${section}.${name}: ${spec} -> ${resolved}`);
    }
  }

  if (!rewritten.length) {
    console.log('pack-manifest: no workspace: specifiers to resolve');
    process.exit(0);
  }

  fs.copyFileSync(manifest, backup);
  // Keep npm's own formatting (2-space + trailing newline) so the restored
  // file and the packed one differ only in the specifiers.
  fs.writeFileSync(manifest, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(
    `pack-manifest: resolved ${rewritten.length} workspace specifier(s)`
  );
  for (const line of rewritten) console.log(`  ${line}`);
} else if (mode === 'postpack') {
  if (!fs.existsSync(backup)) {
    // prepack exits early when there is nothing to rewrite; that is not an error.
    console.log('pack-manifest: no backup to restore');
    process.exit(0);
  }
  fs.copyFileSync(backup, manifest);
  fs.rmSync(backup);
  console.log('pack-manifest: workspace manifest restored');
} else {
  console.error('Usage: node scripts/pack-manifest.mjs <prepack|postpack>');
  process.exit(1);
}
