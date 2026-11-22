/**
 * The package.json files a run touches: the nearest one above each target,
 * which the CLI's manifest step writes, and every one below a folder target,
 * so a monorepo run from its root still finds `apps/web`.
 */

import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.e2e-tmp',
]);

/** The nearest package.json at or above `target`, or null. */
export function nearestManifest(target: string): string | null {
  let dir = path.resolve(target);
  if (fs.statSync(dir, { throwIfNoEntry: false })?.isFile()) {
    dir = path.dirname(dir);
  }
  for (;;) {
    const candidate = path.join(dir, 'package.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Every package.json below `dir`, past the folders no app keeps one in. */
export function manifestsBelow(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
      manifestsBelow(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name === 'package.json') {
      out.push(path.join(dir, entry.name));
    }
  }
}

export interface RunManifests {
  /** Every package.json the run touches, absolute and sorted. */
  manifests: string[];
  /** Those nearest above a target: the ones the manifest step writes. */
  nearest: Set<string>;
}

export function readManifests(targets: string[]): RunManifests {
  const all = new Set<string>();
  const nearest = new Set<string>();
  for (const target of targets) {
    const found = nearestManifest(target);
    if (found) {
      all.add(path.resolve(found));
      nearest.add(path.resolve(found));
    }
    if (fs.statSync(target, { throwIfNoEntry: false })?.isDirectory()) {
      const below: string[] = [];
      manifestsBelow(path.resolve(target), below);
      for (const manifest of below) all.add(manifest);
    }
  }
  return { manifests: [...all].sort(), nearest };
}

/**
 * The innermost of some packages, each named by its `dir`, around `file`, or
 * undefined when none is, or when `entries` isn't a list (facts a run didn't
 * read).
 */
export function innermostAround<T extends { dir: string }>(
  file: string,
  entries: unknown
): T | undefined {
  if (!Array.isArray(entries)) return undefined;
  const resolved = path.resolve(file);
  return (entries as T[])
    .filter(entry => resolved.startsWith(`${entry.dir}${path.sep}`))
    .sort((a, b) => b.dir.length - a.dir.length)[0];
}
