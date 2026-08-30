/**
 * package.json migration: swap rbx for @allxsmith/bestax-bulma and clear out
 * the stylesheet dependencies rbx dragged in with it. Pure data-in/data-out —
 * the CLI owns file IO, and no package manager is ever invoked (the report
 * tells the user to install).
 *
 * This is the step with the biggest visible payoff for an rbx app. Unlike
 * react-bulma-components, which peer-depends on Bulma and lets the app pick a
 * version, rbx ships `bulma@0.7.5` as a *direct* dependency plus four Bulma
 * extensions — so an rbx app cannot move to Bulma v1 at all while rbx is
 * installed. Migrating deletes five dependencies outright, and the report
 * says so by name.
 */

import type { DependenciesUpdate } from '../../types.js';

const BESTAX_RANGE = '^5';
const BULMA_RANGE = '^1.0.4';
// Bulma v1's sass tree uses `color.channel(…)` — needs dart-sass ≥ 1.79.
const SASS_RANGE = '^1.79.0';

/**
 * The Bulma extensions rbx depends on directly. Bulma v1 and bestax cover all
 * four: badge and tooltip became bestax components, the page loader became
 * `Loading`, and the divider became `Divider`.
 */
const RBX_STYLE_DEPS = [
  'bulma-badge',
  'bulma-divider',
  'bulma-pageloader',
  'bulma-tooltip',
] as const;

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

  // rbx goes away entirely.
  const removed: string[] = [];
  for (const name of DEP_SECTIONS) {
    const deps = section(name);
    if (deps && 'rbx' in deps) {
      delete deps.rbx;
      removed.push('rbx');
      note(`removed rbx from ${name}`);
    }
  }

  // …and so do the four Bulma extensions it pulled in. These are only ever
  // removed alongside rbx itself: an app that added `bulma-tooltip` on its own
  // may still be using it outside rbx components.
  if (removed.includes('rbx')) {
    for (const name of DEP_SECTIONS) {
      const deps = section(name);
      if (!deps) continue;
      for (const extension of RBX_STYLE_DEPS) {
        if (extension in deps) {
          delete deps[extension];
          removed.push(extension);
          note(`removed ${extension} from ${name} (rbx pulled it in)`);
        }
      }
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

  // Bulma: rbx pinned 0.7.5 as a direct dependency, so this almost always
  // fires. Add it back only when sources still reference bulma/… directly —
  // otherwise it arrives transitively via bestax-bulma.
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

  // The headline: say the count out loud so it lands in the run summary.
  if (removed.length > 1) {
    collector?.add({
      file: filePath,
      line: null,
      rule: 'deps',
      message: `removed ${removed.length} dependencies (${removed.join(', ')}) — rbx pinned Bulma 0.7.5 and its extensions, so the app can now choose its own Bulma v1`,
    });
  }

  // bestax-bulma requires React 18/19; rbx peer-depends on ^16.8.6, and React
  // 19 removed the `defaultProps` its forwardRefAs base is built on — so this
  // is the other half of why an rbx app is stuck. Report only: a React major
  // upgrade is the app's own migration step.
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

  // node-sass is dead; dart-sass replaces it in the same section. rbx's own
  // customisation guide told people to install node-sass, so this is common.
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
