/**
 * package.json migration: swap bloomer for @allxsmith/bestax-bulma, move the
 * app's own Bulma to v1, and replace the dead node-sass with dart-sass. Pure
 * data-in/data-out — the CLI owns file IO, and no package manager is ever
 * invoked (the report tells the user to install).
 *
 * bloomer is the react-bulma-components case, not the rbx one: it never
 * depended on Bulma itself (its README says "npm install bulma"), so there is
 * no pinned Bulma to free and no extension package to report — the manifest
 * carries whatever 0.6-era `bulma` the app declared, and that is what gets
 * bumped. `create-react-class` and `prop-types` were bloomer's dependencies,
 * not the app's; if they appear here the app declared them for its own
 * reasons, so they are left alone.
 */

import type { DependenciesUpdate } from '../../types.js';
import { isPreV1 } from '../_shared/semver-range.js';

const BESTAX_RANGE = '^5';
const BULMA_RANGE = '^1.0.4';
// Bulma v1's sass tree uses `color.channel(…)` — needs dart-sass ≥ 1.79.
const SASS_RANGE = '^1.79.0';

const DEP_SECTIONS = ['dependencies', 'devDependencies'] as const;

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

  // bloomer goes away entirely.
  let removedSource = false;
  for (const name of DEP_SECTIONS) {
    const deps = section(name);
    if (deps && 'bloomer' in deps) {
      delete deps.bloomer;
      removedSource = true;
      note(`removed bloomer from ${name}`);
    }
  }

  // The transform deliberately RETAINS imports for components with no bestax
  // equivalent (Tile, the Bulma 0.4 Nav family) so a partially migrated app
  // still runs. Removing the package from the manifest strands exactly those
  // imports once the user runs the install the report asks for, so say so
  // rather than letting them find out at build time.
  if (removedSource && options.sourceStillImported) {
    collector?.add({
      file: filePath,
      line: null,
      rule: 'deps',
      message:
        'bloomer was removed from package.json, but some files still import it for components with no bestax equivalent — resolve those `TODO(bestax-migrate)` imports before installing, or re-add bloomer until you have',
    });
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

  // bestax-bulma requires React 18/19; bloomer peer-depended on React ^16.2.
  // Report only — a React major upgrade is the app's own migration step.
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
  // names change across FA majors, so upgrading is the app's decision. (A
  // bloomer-era app more often loads Font Awesome 4 from a CDN <link>, which
  // no manifest pass can see; the Icon conversion flags those in the code.)
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
