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
 */
function resolveSpecifier(name, spec) {
  const rest = spec.slice('workspace:'.length);
  if (rest === '^' || rest === '~')
    return `${rest}${resolveWorkspaceVersion(name)}`;
  if (rest === '*') return resolveWorkspaceVersion(name);
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
      if (typeof spec !== 'string' || !spec.startsWith('workspace:')) continue;
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
