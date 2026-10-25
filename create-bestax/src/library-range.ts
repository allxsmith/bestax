import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/** The library every template is built on. */
export const LIBRARY = '@allxsmith/bestax-bulma';

const WORKSPACE = 'workspace:';

// dist/ and src/ both sit directly under the package root.
const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

interface Manifest {
  version: string;
  dependencies?: Record<string, string>;
}

function readManifest(dir: string): Manifest {
  return JSON.parse(
    readFileSync(path.join(dir, 'package.json'), 'utf8')
  ) as Manifest;
}

/**
 * The range a scaffolded app gives @allxsmith/bestax-bulma: the one this
 * CLI's own manifest declares, so the app is floored at the release the CLI
 * was built with (#1240). The manifest spells it `workspace:^`, which
 * `pnpm publish` rewrites to a caret on the library's version in the checkout
 * it packs, and CI releases bulma-ui first in the same job. A published CLI
 * therefore reads a plain range, the one `npm create bestax` installed the
 * library from beside it. Run from this repo, the protocol is still there,
 * and it is resolved the way `pnpm publish` resolves it, from the version of
 * the library the workspace links, so a scaffold made with a checkout's build
 * gets that checkout's release.
 */
export function libraryRange(packageRoot: string = PACKAGE_ROOT): string {
  const declared = readManifest(packageRoot).dependencies?.[LIBRARY];
  if (declared === undefined) {
    throw new Error(
      `${path.join(packageRoot, 'package.json')} declares no ${LIBRARY} dependency.`
    );
  }
  if (!declared.startsWith(WORKSPACE)) return declared;

  const { version } = readManifest(
    path.join(packageRoot, 'node_modules', LIBRARY)
  );
  // What pnpm publish writes for each form: `*` the version itself, `^` and
  // `~` that operator on it, and a range as written.
  const spec = declared.slice(WORKSPACE.length);
  if (spec === '*') return version;
  if (spec === '^' || spec === '~') return `${spec}${version}`;
  return spec;
}
