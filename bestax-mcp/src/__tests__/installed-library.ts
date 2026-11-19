import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Installs the library at `version` under `dir`, as the server's version probe
 * finds it: its manifest in `node_modules`. Only the manifest, since the probe
 * reads nothing else. `version` is untyped so a test can write one the probe
 * should refuse.
 */
export async function installLibrary(
  dir: string,
  version: unknown
): Promise<void> {
  const lib = join(dir, 'node_modules', '@allxsmith', 'bestax-bulma');
  await mkdir(lib, { recursive: true });
  await writeFile(
    join(lib, 'package.json'),
    JSON.stringify({ name: '@allxsmith/bestax-bulma', version })
  );
}
