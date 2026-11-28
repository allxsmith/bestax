/**
 * Which @allxsmith/bestax-bulma release the migrated code is written for, and
 * which one an app has installed (#2314).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rangeFloor } from './semver-range.js';

const NAME = '@allxsmith/bestax-bulma';
const WORKSPACE = 'workspace:';

// src/ and dist/ both sit directly under the package root, and this file is
// in sources/_shared/ under each.
const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

function readManifest(file: string): {
  version?: unknown;
  dependencies?: Record<string, unknown>;
} {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * The bestax-bulma release the migrated code is written for: the lowest one
 * this CLI's own manifest depends on. The codemod writes every value the
 * library it was built against takes (its value-union tests hold it to
 * them), so an older release can drop one without a word.
 *
 * The manifest spells the dependency `workspace:^`, which `pnpm publish`
 * rewrites to a caret on the library's version in the checkout it packs, and
 * CI releases bulma-ui first in the same job, so a published CLI reads the
 * release it was built with. Run from this repo, the protocol is still there,
 * and it resolves the way `pnpm publish` resolves it, from the version of the
 * library the workspace links. create-bestax's `libraryRange` (#1240) reads
 * the range a scaffold gets from the same entry.
 */
export function builtFor(packageRoot: string = PACKAGE_ROOT): string {
  const file = path.join(packageRoot, 'package.json');
  const declared = readManifest(file).dependencies?.[NAME];
  if (typeof declared !== 'string') {
    throw new Error(`${file} declares no ${NAME} dependency.`);
  }
  let range = declared;
  if (declared.startsWith(WORKSPACE)) {
    const spec = declared.slice(WORKSPACE.length);
    // `*`, `^` and `~` stand for the linked version, which `pnpm publish`
    // writes on its own or after that operator; a range stays as written.
    if (['*', '^', '~'].includes(spec)) {
      const { version } = readManifest(
        path.join(packageRoot, 'node_modules', NAME, 'package.json')
      );
      range = String(version);
    } else {
      range = spec;
    }
  }
  const floor = rangeFloor(range);
  if (floor === null) {
    throw new Error(
      `${file} depends on ${NAME} ${declared}, which names no lowest release.`
    );
  }
  return floor;
}

/**
 * The version of the bestax-bulma Node loads for a package in `dir`: the one
 * in the nearest `node_modules` at or above it. Undefined when none is
 * installed there, as in a fresh clone or under Yarn Plug'n'Play, or when its
 * manifest names no version this reads.
 */
export function installedVersion(dir: string): string | undefined {
  for (let at = path.resolve(dir); ; at = path.dirname(at)) {
    const file = path.join(at, 'node_modules', NAME, 'package.json');
    if (fs.existsSync(file)) {
      try {
        const { version } = readManifest(file);
        return typeof version === 'string'
          ? (rangeFloor(version) ?? undefined)
          : undefined;
      } catch {
        return undefined;
      }
    }
    if (path.dirname(at) === at) return undefined;
  }
}
