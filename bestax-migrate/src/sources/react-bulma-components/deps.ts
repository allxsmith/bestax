/**
 * package.json migration: swap react-bulma-components for
 * @allxsmith/bestax-bulma, move Bulma to v1, and replace the dead node-sass
 * with dart-sass. Pure data-in/data-out — the CLI owns file IO, and no
 * package manager is ever invoked (the report tells the user to install).
 */

import type { DependenciesUpdate } from '../../types.js';

const BESTAX_RANGE = '^5';
const BULMA_RANGE = '^1.0.4';
// Bulma v1's sass tree uses `color.channel(…)` — needs dart-sass ≥ 1.79.
const SASS_RANGE = '^1.79.0';

const DEP_SECTIONS = ['dependencies', 'devDependencies'] as const;

function isPreV1(range: string): boolean {
  return /^[~^]?0[.x]/.test(range.trim());
}

export const updateDependencies: DependenciesUpdate = (
  filePath,
  pkg,
  collector,
  options
) => {
  const changes: string[] = [];
  const next = pkg as Record<string, Record<string, string> | unknown>;
  const section = (name: (typeof DEP_SECTIONS)[number]) =>
    (next[name] ?? undefined) as Record<string, string> | undefined;

  const note = (message: string) => {
    changes.push(message);
    collector?.add({ file: filePath, line: null, rule: 'deps', message });
  };

  // react-bulma-components goes away entirely.
  for (const name of DEP_SECTIONS) {
    const deps = section(name);
    if (deps && 'react-bulma-components' in deps) {
      delete deps['react-bulma-components'];
      note(`removed react-bulma-components from ${name}`);
    }
  }

  // @allxsmith/bestax-bulma comes in (runtime dependency).
  const dependencies = (next.dependencies ??= {}) as Record<string, string>;
  if (
    !dependencies['@allxsmith/bestax-bulma'] &&
    !section('devDependencies')?.['@allxsmith/bestax-bulma']
  ) {
    dependencies['@allxsmith/bestax-bulma'] = BESTAX_RANGE;
    note(`added @allxsmith/bestax-bulma ${BESTAX_RANGE} to dependencies`);
  }

  // Bulma: bump a pre-1 range; add only when sources still reference bulma/…
  // directly (otherwise it arrives transitively via bestax-bulma).
  let bulmaDeclared = false;
  for (const name of DEP_SECTIONS) {
    const deps = section(name);
    if (deps?.bulma) {
      bulmaDeclared = true;
      if (isPreV1(deps.bulma)) {
        deps.bulma = BULMA_RANGE;
        note(`bumped bulma to ${BULMA_RANGE} in ${name} (was pre-1.0)`);
      }
    }
  }
  if (!bulmaDeclared && options.bulmaReferenced) {
    dependencies.bulma = BULMA_RANGE;
    note(
      `added bulma ${BULMA_RANGE} to dependencies (sources import bulma/… directly)`
    );
  }

  // bestax-bulma requires React 18/19; RBC v4 also ran on 17. Report only —
  // a React major upgrade is the app's own migration step.
  for (const name of DEP_SECTIONS) {
    const range = section(name)?.react;
    if (range && /^[~^]?(?:[0-9]|1[0-7])(?:[.x]|$)/.test(range.trim())) {
      collector?.add({
        file: filePath,
        line: null,
        rule: 'peer-deps',
        message: `react ${range} predates bestax-bulma's peer range (^18 || ^19) — upgrade react and react-dom to 18 or 19 before installing`,
      });
    }
  }

  // Font Awesome older than 6 conflicts with bestax-bulma's optional peer
  // range and makes `npm install` fail with ERESOLVE. Report only — icon
  // names change across FA majors, so upgrading is the app's decision.
  for (const name of DEP_SECTIONS) {
    const range = section(name)?.['@fortawesome/fontawesome-free'];
    if (range && /^[~^]?[0-5](?:[.x]|$)/.test(range.trim())) {
      collector?.add({
        file: filePath,
        line: null,
        rule: 'peer-deps',
        message: `@fortawesome/fontawesome-free ${range} predates bestax-bulma's optional peer range (^6.7.2 || ^7.0.0) — upgrade it, or install with \`npm install --legacy-peer-deps\``,
      });
    }
  }

  // node-sass is dead; dart-sass replaces it in the same section.
  for (const name of DEP_SECTIONS) {
    const deps = section(name);
    if (deps && 'node-sass' in deps) {
      delete deps['node-sass'];
      note(`removed node-sass from ${name}`);
      const sassDeclared = DEP_SECTIONS.some(s => section(s)?.sass);
      if (!sassDeclared) {
        deps.sass = SASS_RANGE;
        note(`added sass ${SASS_RANGE} to ${name} (replaces node-sass)`);
      }
    }
  }

  return changes.length > 0 ? (next as Record<string, unknown>) : null;
};
