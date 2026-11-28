/**
 * package.json migration: swap react-bulma-components for
 * @allxsmith/bestax-bulma, move Bulma to v1, and replace the dead node-sass
 * with dart-sass. Pure data-in/data-out — the CLI owns file IO, and no
 * package manager is ever invoked (the report tells the user to install).
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

  // react-bulma-components goes away entirely.
  let removedSource = false;
  for (const name of DEP_SECTIONS) {
    const deps = manifest.section(name);
    if (deps && 'react-bulma-components' in deps) {
      delete deps['react-bulma-components'];
      removedSource = true;
      manifest.note(`removed react-bulma-components from ${name}`);
    }
  }

  // Files can still import the library after the run: a trimmed import the
  // transform kept, so a partially migrated app still runs, one it couldn't
  // rewrite, a file it couldn't parse or doesn't read (`.vue`, `.astro`).
  // Removing the package from the manifest strands those imports once the
  // user runs the install the report asks for, so say so rather than letting
  // them find out at build time. rbx has carried this warning since it
  // shipped; this source retains imports the same way and did not.
  if (removedSource && options.sourceStillImported) {
    manifest.report(
      'deps',
      'react-bulma-components was removed from package.json, but some files still import it, and installing would leave those imports unresolved: migrate every remaining import of react-bulma-components (the ones the codemod kept are marked `TODO(bestax-migrate)`) before installing, or re-add react-bulma-components until you have'
    );
  }

  addBestax(manifest);
  moveBulmaToV1(manifest, options.bulmaReferenced);
  // RBC v4 also ran on React 17, which bestax-bulma's peer range excludes.
  reportPeerRanges(manifest);
  replaceNodeSass(manifest);

  return manifest.result();
};
