/**
 * The package.json steps every source's manifest pass takes once the source
 * library itself is dealt with: bring in bestax-bulma, move the app's Bulma to
 * v1, report peer ranges bestax-bulma cannot install beside, and swap the
 * dead node-sass for dart-sass. Pure data-in/data-out, like the passes that
 * call it: no package manager is ever invoked.
 */

import type { TodoCollector } from '../../types.js';
import { isPreV1 } from './semver-range.js';

const BESTAX_RANGE = '^5';
export const BULMA_RANGE = '^1.0.4';
// Bulma v1's sass tree uses `color.channel(…)` — needs dart-sass ≥ 1.79.
const SASS_RANGE = '^1.79.0';

export const DEP_SECTIONS = ['dependencies', 'devDependencies'] as const;
type Section = (typeof DEP_SECTIONS)[number];

export interface Manifest {
  /** The manifest being edited in place. */
  next: Record<string, Record<string, string> | unknown>;
  section(name: Section): Record<string, string> | undefined;
  /** Record a change: it counts as an edit and lands in the report. */
  note(message: string): void;
  /** Report without counting as an edit. */
  report(rule: string, message: string): void;
  /** The edited manifest, or null when nothing changed. */
  result(): Record<string, unknown> | null;
}

export function openManifest(
  filePath: string,
  pkg: Record<string, unknown>,
  collector: TodoCollector | undefined
): Manifest {
  const changes: string[] = [];
  const next = pkg as Record<string, Record<string, string> | unknown>;
  const report = (rule: string, message: string) =>
    collector?.add({ file: filePath, line: null, rule, message });
  return {
    next,
    section: name =>
      (next[name] ?? undefined) as Record<string, string> | undefined,
    note: message => {
      changes.push(message);
      report('deps', message);
    },
    report,
    result: () =>
      changes.length > 0 ? (next as Record<string, unknown>) : null,
  };
}

/** @allxsmith/bestax-bulma comes in as a runtime dependency. */
export function addBestax(manifest: Manifest): void {
  const dependencies = (manifest.next.dependencies ??= {}) as Record<
    string,
    string
  >;
  if (
    !dependencies['@allxsmith/bestax-bulma'] &&
    !manifest.section('devDependencies')?.['@allxsmith/bestax-bulma']
  ) {
    dependencies['@allxsmith/bestax-bulma'] = BESTAX_RANGE;
    manifest.note(
      `added @allxsmith/bestax-bulma ${BESTAX_RANGE} to dependencies`
    );
  }
}

export interface BulmaOutcome {
  /** The declared range before any bump, or null when none was declared. */
  declared: string | null;
  bumped: boolean;
  added: boolean;
}

/**
 * Bump a pre-1 Bulma range; add one only when sources still reference
 * bulma/… directly (otherwise it arrives transitively via bestax-bulma).
 */
export function moveBulmaToV1(
  manifest: Manifest,
  bulmaReferenced: boolean | undefined
): BulmaOutcome {
  const outcome: BulmaOutcome = { declared: null, bumped: false, added: false };
  for (const name of DEP_SECTIONS) {
    const deps = manifest.section(name);
    if (deps?.bulma) {
      outcome.declared = deps.bulma;
      if (isPreV1(deps.bulma)) {
        deps.bulma = BULMA_RANGE;
        outcome.bumped = true;
        manifest.note(
          `bumped bulma to ${BULMA_RANGE} in ${name} (was pre-1.0)`
        );
      }
    }
  }
  if (outcome.declared === null && bulmaReferenced) {
    const dependencies = (manifest.next.dependencies ??= {}) as Record<
      string,
      string
    >;
    dependencies.bulma = BULMA_RANGE;
    outcome.added = true;
    manifest.note(
      `added bulma ${BULMA_RANGE} to dependencies (sources import bulma/… directly)`
    );
  }
  return outcome;
}

/**
 * Report ranges bestax-bulma's peers cannot install beside. Report only: a
 * React major and a Font Awesome major (whose icon names change) are the
 * app's own migration steps.
 */
export function reportPeerRanges(manifest: Manifest): void {
  for (const name of DEP_SECTIONS) {
    const range = manifest.section(name)?.react;
    if (range && /^[~^]?(?:[0-9]|1[0-7])(?:[.x]|$)/.test(range.trim())) {
      manifest.report(
        'peer-deps',
        `react ${range} predates bestax-bulma's peer range (^18 || ^19) — upgrade react and react-dom to 18 or 19 before installing`
      );
    }
  }
  // Font Awesome older than 6 conflicts with bestax-bulma's optional peer
  // range and makes `npm install` fail with ERESOLVE.
  for (const name of DEP_SECTIONS) {
    const range = manifest.section(name)?.['@fortawesome/fontawesome-free'];
    if (range && /^[~^]?[0-5](?:[.x]|$)/.test(range.trim())) {
      manifest.report(
        'peer-deps',
        `@fortawesome/fontawesome-free ${range} predates bestax-bulma's optional peer range (^6.7.2 || ^7.0.0) — upgrade it, or install with \`npm install --legacy-peer-deps\``
      );
    }
  }
}

/** node-sass is dead; dart-sass replaces it in the same section. */
export function replaceNodeSass(manifest: Manifest): void {
  for (const name of DEP_SECTIONS) {
    const deps = manifest.section(name);
    if (deps && 'node-sass' in deps) {
      delete deps['node-sass'];
      manifest.note(`removed node-sass from ${name}`);
      const sassDeclared = DEP_SECTIONS.some(s => manifest.section(s)?.sass);
      if (!sassDeclared) {
        deps.sass = SASS_RANGE;
        manifest.note(
          `added sass ${SASS_RANGE} to ${name} (replaces node-sass)`
        );
      }
    }
  }
}
