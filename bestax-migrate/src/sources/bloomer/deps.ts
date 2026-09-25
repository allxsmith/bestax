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
import {
  DEP_SECTIONS,
  addBestax,
  moveBulmaToV1,
  openManifest,
  replaceNodeSass,
  reportPeerRanges,
} from '../_shared/deps-common.js';

export const updateDependencies: DependenciesUpdate = (
  filePath,
  pkg,
  collector,
  options
) => {
  const manifest = openManifest(filePath, pkg, collector);

  // bloomer goes away entirely.
  let removedSource = false;
  for (const name of DEP_SECTIONS) {
    const deps = manifest.section(name);
    if (deps && 'bloomer' in deps) {
      delete deps.bloomer;
      removedSource = true;
      manifest.note(`removed bloomer from ${name}`);
    }
  }

  // The transform deliberately RETAINS imports for components with no bestax
  // equivalent (Tile, the Bulma 0.4 Nav family) so a partially migrated app
  // still runs. Removing the package from the manifest strands exactly those
  // imports once the user runs the install the report asks for, so say so
  // rather than letting them find out at build time.
  if (removedSource && options.sourceStillImported) {
    manifest.report(
      'deps',
      'bloomer was removed from package.json, but some files still import it for components with no bestax equivalent — resolve those `TODO(bestax-migrate)` imports before installing, or re-add bloomer until you have'
    );
  }

  addBestax(manifest);
  moveBulmaToV1(manifest, options.bulmaReferenced);
  // bloomer peer-depended on React ^16.2. A bloomer-era app more often loads
  // Font Awesome 4 from a CDN <link>, which no manifest pass can see; the Icon
  // conversion flags those in the code.
  reportPeerRanges(manifest);
  replaceNodeSass(manifest);

  return manifest.result();
};
