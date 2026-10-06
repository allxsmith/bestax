/**
 * Whether a module is the script node was started with, for the guard at the
 * bottom of a script that is also imported by its tests.
 *
 * Both sides are compared as real paths. Node resolves symbolic links in the
 * main module's path before it sets import.meta.url, while process.argv[1]
 * keeps the path as it was typed. Compared as URLs, the two differ in a
 * checkout reached through a link, and the script then exits 0 having done
 * nothing.
 */
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * True when `importMetaUrl` (a module's import.meta.url) names the same file
 * as `argv1`, which defaults to process.argv[1]. False when either path is
 * missing or cannot be resolved, as under `node -e` or in a REPL.
 */
export function isMainModule(importMetaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  try {
    return realpathSync(fileURLToPath(importMetaUrl)) === realpathSync(argv1);
  } catch {
    return false;
  }
}
