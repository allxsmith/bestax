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
 * installed. Removing rbx is what frees that, and the report says so; its
 * four Bulma extensions are reported for the user to remove, not deleted —
 * see the note on that below.
 * says so by name.
 */

import type { DependenciesUpdate } from '../../types.js';
import { isPreV1, isRecognisedRange } from '../_shared/semver-range.js';

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

  // The four Bulma extensions are REPORTED, not removed.
  //
  // rbx declares them as its own dependencies, so an app gets them
  // transitively through the lockfile — they do not appear in the app's
  // manifest unless the author put them there deliberately. A manifest entry
  // is therefore a direct declaration, and an app may well be importing
  // `bulma-tooltip`'s Sass on its own, outside anything rbx rendered.
  // Deleting it because rbx happens to be present is precisely the
  // best-guess rewrite this package refuses to make.
  const extensions: string[] = [];
  if (removed.includes('rbx')) {
    for (const name of DEP_SECTIONS) {
      const deps = section(name);
      if (!deps) continue;
      for (const extension of RBX_STYLE_DEPS) {
        if (extension in deps) extensions.push(extension);
      }
    }
  }
  if (extensions.length > 0) {
    collector?.add({
      file: filePath,
      line: null,
      rule: 'deps',
      message: `${extensions.join(', ')} ${extensions.length === 1 ? 'is a Bulma extension' : 'are Bulma extensions'} rbx depended on, and bestax ships ${extensions.length === 1 ? 'its' : 'their'} equivalent${extensions.length === 1 ? '' : 's'} (Badge, Divider, Loading, Tooltip). Declared in this manifest, so removing ${extensions.length === 1 ? 'it' : 'them'} is your call — drop ${extensions.length === 1 ? 'it' : 'them'} unless your own Sass imports ${extensions.length === 1 ? 'it' : 'them'} directly`,
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

  // Bulma: rbx pinned 0.7.5 as a direct dependency, so this almost always
  // fires. Add it back only when sources still reference bulma/… directly —
  // otherwise it arrives transitively via bestax-bulma.
  let bulmaDeclared = false;
  let declaredBulma = '';
  let bulmaBumped = false;
  let bulmaAdded = false;
  for (const name of DEP_SECTIONS) {
    const deps = section(name);
    if (deps?.bulma) {
      bulmaDeclared = true;
      declaredBulma = deps.bulma;
      if (isPreV1(deps.bulma)) {
        deps.bulma = BULMA_RANGE;
        bulmaBumped = true;
        note(`bumped bulma to ${BULMA_RANGE} in ${name} (was pre-1.0)`);
      }
    }
  }
  if (!bulmaDeclared && options.bulmaReferenced) {
    dependencies.bulma = BULMA_RANGE;
    bulmaAdded = true;
    note(
      `added bulma ${BULMA_RANGE} to dependencies (sources import bulma/… directly)`
    );
  }

  // The transform deliberately keeps a trimmed rbx import for components
  // with no bestax equivalent (Tile, Generic, List, …) so a partially
  // migrated app still runs. Removing the package from the manifest strands
  // exactly those imports once the user runs the install the report asks for,
  // so say so rather than letting them find out at build time.
  if (removed.includes('rbx') && options.sourceStillImported) {
    collector?.add({
      file: filePath,
      line: null,
      rule: 'deps',
      message:
        'rbx was removed from package.json, but some files still import it for components with no bestax equivalent — resolve those `TODO(bestax-migrate)` imports before installing, or re-add rbx until you have',
    });
  }

  // The headline result: rbx pinned Bulma 0.7.5 as a DIRECT dependency, so
  // removing rbx is what frees the app to choose its own Bulma version.
  //
  // What it must NOT claim is a manifest change that did not happen. In the
  // common rbx-app shape — `{ "dependencies": { "rbx": "^2.2.0" } }` with no
  // direct `bulma/…` imports — bulma is neither bumped nor added, because it
  // arrives transitively via bestax-bulma. Saying "bumped bulma" there
  // described a pin the user would not find in their manifest.
  if (removed.includes('rbx')) {
    collector?.add({
      file: filePath,
      line: null,
      rule: 'deps',
      message: `removed rbx ${
        bulmaBumped
          ? `and bumped bulma to ${BULMA_RANGE}`
          : bulmaAdded
            ? `and added bulma ${BULMA_RANGE}`
            : bulmaDeclared
              ? isRecognisedRange(declaredBulma)
                ? 'and left your declared bulma range alone (already v1)'
                : `and left your declared bulma specifier alone (${JSON.stringify(declaredBulma)} is not a version range this tool can read; make sure it resolves to Bulma 1.x)`
              : '— bulma now arrives transitively via @allxsmith/bestax-bulma'
      } — rbx pinned Bulma 0.7.5 as a direct dependency, so the app can now choose its own Bulma version${extensions.length > 0 ? `; ${extensions.length} Bulma extension(s) are reported above for you to remove` : ''}`,
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
