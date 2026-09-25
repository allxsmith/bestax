/**
 * package.json migration for an app that styled plain markup with Bulma:
 * bestax-bulma comes in, and nothing goes out. Pure data-in/data-out: no
 * package manager is ever invoked.
 *
 * Under the default `--css keep` the app's styling stack is left as it is:
 * converted elements render the same classes, which the app's own Bulma
 * stylesheet already styles, so its Bulma version and Sass compiler stay.
 * `--css bestax` or `--css bulma` asks for the move to Bulma v1, so only then
 * is a pre-1 Bulma bumped and node-sass swapped for sass.
 */

import path from 'node:path';
import type { DependenciesUpdate } from '../../types.js';
import {
  addBestax,
  DEP_SECTIONS,
  moveBulmaToV1,
  openManifest,
  replaceNodeSass,
  reportPeerRanges,
} from '../_shared/deps-common.js';
import { isPreV1 } from '../_shared/semver-range.js';
import { runtimeOf } from './project.js';

/** Packages that run PurgeCSS over the app's source. */
const PURGECSS = [
  'purgecss',
  '@fullhuman/postcss-purgecss',
  'purgecss-webpack-plugin',
  'gulp-purgecss',
];

export const updateDependencies: DependenciesUpdate = (
  filePath,
  pkg,
  collector,
  options
) => {
  const manifest = openManifest(filePath, pkg, collector);
  // Peers too: a shared UI package declares its runtime as one.
  const deps: Record<string, string | undefined> = {
    ...(pkg.peerDependencies as Record<string, string> | undefined),
  };
  for (const name of DEP_SECTIONS) Object.assign(deps, manifest.section(name));

  // A Preact, Solid or other non-React package gets no React library.
  const runtime = runtimeOf(path.dirname(path.resolve(filePath)), deps);
  if (runtime !== null && runtime !== 'react') {
    manifest.report(
      'deps',
      `left package.json alone: this package's JSX renders through \`${runtime}\`, and @allxsmith/bestax-bulma is a React library`
    );
    return manifest.result();
  }

  addBestax(manifest);
  if ((options.cssMode ?? 'keep') === 'keep') {
    for (const name of DEP_SECTIONS) {
      const range = manifest.section(name)?.bulma;
      if (range && isPreV1(range)) {
        manifest.report(
          'deps',
          `left bulma ${range} in ${name} as it is: under --css keep the app's own stylesheet styles the converted elements, which render the same classes; move to Bulma v1 when you are ready (--css bestax, or the Bulma 0.9 to 1 guide)`
        );
      }
    }
  } else {
    moveBulmaToV1(manifest, options.bulmaReferenced);
    replaceNodeSass(manifest);
  }
  reportPeerRanges(manifest);

  const purger = PURGECSS.find(name => deps[name]);
  if (purger) {
    manifest.report(
      'deps',
      `this app runs PurgeCSS (${purger}), and a converted element's Bulma classes are now written by @allxsmith/bestax-bulma, some of them built from props at runtime (\`mt="4"\` renders \`mt-4\`), so your source no longer spells them out; add ./node_modules/@allxsmith/bestax-bulma/dist/**/*.js to its content and safelist the patterns in https://bestax.io/docs/guides/getting-started/optimizing-css, or those styles are purged from production builds`
    );
  }
  return manifest.result();
};
