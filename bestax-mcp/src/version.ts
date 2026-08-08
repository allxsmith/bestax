/**
 * Which `@allxsmith/bestax-bulma` is the user actually building against?
 *
 * The index shipped in this tarball documents one specific release. Mantine's
 * server fetches always-latest docs from the network, which means it will
 * happily describe a prop that does not exist in the version installed in the
 * project — the failure is silent and lands as a runtime error much later.
 *
 * Pinning the index avoids serving the wrong version by accident, but it does
 * not avoid the user having a different one installed. So: look for it, and say
 * so when they disagree. Not finding it is not an error — someone evaluating
 * the library before installing it is a normal thing to be doing.
 *
 * Set BESTAX_MCP_NO_VERSION_CHECK=1 to skip this entirely.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';

const PACKAGE = '@allxsmith/bestax-bulma';

export interface VersionInfo {
  /** The version this server's index was generated from. */
  indexed: string;
  /** The version resolved in the user's project, if one was found. */
  installed: string | null;
  /** How far apart they are. */
  drift: 'none' | 'patch' | 'minor' | 'major' | 'unknown';
}

const majorMinor = (v: string) => v.replace(/^[^\d]*/, '').split('.');

function compare(indexed: string, installed: string): VersionInfo['drift'] {
  if (indexed === installed) return 'none';
  const a = majorMinor(indexed);
  const b = majorMinor(installed);
  if (!a[0] || !b[0]) return 'unknown';
  if (a[0] !== b[0]) return 'major';
  if (a[1] !== b[1]) return 'minor';
  return 'patch';
}

/**
 * Walk up from `cwd` looking for the package in a node_modules directory.
 *
 * Deliberately a filesystem walk rather than `createRequire(cwd).resolve`:
 * pnpm's isolated linker puts the real package under `.pnpm` and exposes it
 * through a symlink, and `resolve` from a directory that is not itself a
 * package can throw for reasons that have nothing to do with the answer.
 */
export async function findInstalledVersion(
  cwd: string = process.cwd()
): Promise<string | null> {
  let dir = cwd;
  const { root } = parse(dir);
  for (;;) {
    try {
      const manifest = join(
        dir,
        'node_modules',
        ...PACKAGE.split('/'),
        'package.json'
      );
      const pkg = JSON.parse(await readFile(manifest, 'utf8')) as {
        version?: string;
      };
      if (pkg.version) return pkg.version;
    } catch {
      // Not here — keep walking.
    }
    if (dir === root) return null;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

export async function resolveVersions(
  indexed: string,
  cwd?: string
): Promise<VersionInfo> {
  if (process.env.BESTAX_MCP_NO_VERSION_CHECK) {
    return { indexed, installed: null, drift: 'none' };
  }
  const installed = await findInstalledVersion(cwd);
  return {
    indexed,
    installed,
    drift: installed ? compare(indexed, installed) : 'none',
  };
}

/**
 * A one-line warning to append to a response, or null when there is nothing
 * worth saying.
 *
 * Patch drift is deliberately silent: a patch release of this library does not
 * move props, and a line on every single response is a line a model learns to
 * skip — which is exactly what must not happen when the drift is real.
 */
export function versionNote(info: VersionInfo): string | null {
  if (!info.installed || info.drift === 'none' || info.drift === 'patch') {
    return null;
  }
  return (
    `⚠ This index documents ${PACKAGE} ${info.indexed}; this project has ` +
    `${info.installed}. Props, defaults and CSS variables may differ — check ` +
    `https://bestax.io/docs before relying on anything above.`
  );
}
