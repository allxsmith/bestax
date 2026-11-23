/**
 * The oldest @allxsmith/bestax-bulma release a migrated file can count on,
 * for the conversions that need a release newer than the first 5.x
 * (#2178: `Pagination.Ellipsis` keeps its class beside a `className` from
 * 5.78.4 on). Read once per run from every package.json the run touches.
 *
 * A file can count on a release when the package around it declares
 * bestax-bulma, where the manifest step reads it (`dependencies` or
 * `devDependencies`), with ranges that can't resolve below it, or declares
 * none there and is a package that step writes, which adds `BESTAX_RANGE`.
 * Anything else, a range or a manifest this can't read, `--no-deps`, a file
 * with no package around it, counts on nothing, and those conversions stay
 * refused. An override (`overrides`, `resolutions`, `pnpm.overrides`) that
 * pins bestax-bulma lower isn't read.
 */

import fs from 'node:fs';
import path from 'node:path';
import { BESTAX_FLOOR } from './deps-common.js';
import {
  innermostAround,
  readManifests,
  type RunManifests,
} from './manifests.js';
import { compareVersions, rangeFloor } from './semver-range.js';

const NAME = '@allxsmith/bestax-bulma';
/** Where the manifest step looks for bestax-bulma (`addBestax`). */
const SECTIONS = ['dependencies', 'devDependencies'] as const;
/** The keys a package.json that only says how its files load holds. */
const FORMAT_KEYS = new Set([
  'type',
  'sideEffects',
  'main',
  'module',
  'browser',
  'types',
  'exports',
  'imports',
]);

export interface BestaxPackage {
  /** The package's directory, absolute. */
  dir: string;
  /**
   * The lowest release its declared bestax-bulma ranges admit, null when one
   * of them, or the manifest itself, can't be read, left out when it
   * declares none.
   */
  floor?: string | null;
  /** The run's manifest step writes this package.json. */
  written: boolean;
}

export function readBestaxPackages(targets: string[]): BestaxPackage[] {
  return bestaxPackagesOf(readManifests(targets));
}

/** The same, from the manifests a run has already found. */
export function bestaxPackagesOf({
  manifests,
  nearest,
}: RunManifests): BestaxPackage[] {
  const packages: BestaxPackage[] = [];
  for (const manifest of manifests) {
    const dir = path.dirname(manifest);
    const written = nearest.has(manifest);
    let pkg: Record<string, Record<string, unknown> | undefined>;
    try {
      // Read as the manifest step reads it, so one it can't update counts
      // on nothing.
      pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    } catch {
      packages.push({ dir, floor: null, written });
      continue;
    }
    // A package.json holding nothing but how its files load
    // (`{ "type": "module" }`) is no package: the one around it decides, and
    // a range the run writes into it installs nowhere.
    const keys = Object.keys(pkg);
    const formatOnly = keys.length > 0 && keys.every(k => FORMAT_KEYS.has(k));
    if (formatOnly && !written) continue;
    const declared = SECTIONS.map(section => pkg[section]?.[NAME]).filter(
      range => range !== undefined
    );
    const floors = declared.map(range =>
      typeof range === 'string' ? rangeFloor(range) : null
    );
    packages.push({
      dir,
      written: written && !formatOnly,
      ...(declared.length > 0 && {
        floor: floors.includes(null)
          ? null
          : (floors as string[]).sort(compareVersions)[0],
      }),
    });
  }
  return packages;
}

/**
 * The oldest bestax-bulma release `file` can count on, or undefined when it
 * can't count on one. `deps` is the run's manifest step, on unless false.
 */
export function bestaxFloorFor(
  file: string,
  packages: unknown,
  deps: unknown
): string | undefined {
  const around = innermostAround<BestaxPackage>(file, packages);
  if (!around) return undefined;
  if (around.floor !== undefined) return around.floor ?? undefined;
  return around.written && deps !== false ? BESTAX_FLOOR : undefined;
}
