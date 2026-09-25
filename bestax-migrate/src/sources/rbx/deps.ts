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
import {
  BULMA_RANGE,
  DEP_SECTIONS,
  addBestax,
  moveBulmaToV1,
  openManifest,
  replaceNodeSass,
  reportPeerRanges,
} from '../_shared/deps-common.js';
import { isRecognisedRange } from '../_shared/semver-range.js';

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

export const updateDependencies: DependenciesUpdate = (
  filePath,
  pkg,
  collector,
  options
) => {
  const manifest = openManifest(filePath, pkg, collector);

  // rbx goes away entirely.
  const removed: string[] = [];
  for (const name of DEP_SECTIONS) {
    const deps = manifest.section(name);
    if (deps && 'rbx' in deps) {
      delete deps.rbx;
      removed.push('rbx');
      manifest.note(`removed rbx from ${name}`);
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
      const deps = manifest.section(name);
      if (!deps) continue;
      for (const extension of RBX_STYLE_DEPS) {
        if (extension in deps) extensions.push(extension);
      }
    }
  }
  if (extensions.length > 0) {
    manifest.report(
      'deps',
      `${extensions.join(', ')} ${extensions.length === 1 ? 'is a Bulma extension' : 'are Bulma extensions'} rbx depended on, and bestax ships ${extensions.length === 1 ? 'its' : 'their'} equivalent${extensions.length === 1 ? '' : 's'} (Badge, Divider, Loading, Tooltip). Declared in this manifest, so removing ${extensions.length === 1 ? 'it' : 'them'} is your call — drop ${extensions.length === 1 ? 'it' : 'them'} unless your own Sass imports ${extensions.length === 1 ? 'it' : 'them'} directly`
    );
  }

  addBestax(manifest);
  // rbx pinned Bulma 0.7.5 as a direct dependency, so the bump almost always
  // fires.
  const bulma = moveBulmaToV1(manifest, options.bulmaReferenced);

  // The transform deliberately keeps a trimmed rbx import for components
  // with no bestax equivalent (Tile, Generic, List, …) so a partially
  // migrated app still runs. Removing the package from the manifest strands
  // exactly those imports once the user runs the install the report asks for,
  // so say so rather than letting them find out at build time.
  if (removed.includes('rbx') && options.sourceStillImported) {
    manifest.report(
      'deps',
      'rbx was removed from package.json, but some files still import it for components with no bestax equivalent — resolve those `TODO(bestax-migrate)` imports before installing, or re-add rbx until you have'
    );
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
    manifest.report(
      'deps',
      `removed rbx ${
        bulma.bumped
          ? `and bumped bulma to ${BULMA_RANGE}`
          : bulma.added
            ? `and added bulma ${BULMA_RANGE}`
            : bulma.declared !== null
              ? isRecognisedRange(bulma.declared)
                ? 'and left your declared bulma range alone (already v1)'
                : `and left your declared bulma specifier alone (${JSON.stringify(bulma.declared)} is not a version range this tool can read; make sure it resolves to Bulma 1.x)`
              : '— bulma now arrives transitively via @allxsmith/bestax-bulma'
      } — rbx pinned Bulma 0.7.5 as a direct dependency, so the app can now choose its own Bulma version${extensions.length > 0 ? `; ${extensions.length} Bulma extension(s) are reported above for you to remove` : ''}`
    );
  }

  // rbx peer-depends on React ^16.8.6, and React 19 removed the
  // `defaultProps` its forwardRefAs base is built on — so an old React is the
  // other half of why an rbx app is stuck.
  reportPeerRanges(manifest);
  // rbx's own customisation guide told people to install node-sass, so this
  // is common.
  replaceNodeSass(manifest);

  return manifest.result();
};
