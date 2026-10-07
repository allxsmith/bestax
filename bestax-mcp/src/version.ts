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
 * Set BESTAX_MCP_NO_VERSION_CHECK=1 to skip this entirely, and
 * BESTAX_MCP_PROJECT_DIR to look somewhere other than the working directory.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join, parse, resolve } from 'node:path';

import { attributed } from './format.js';

const PACKAGE = '@allxsmith/bestax-bulma';

export interface VersionInfo {
  /** The version this server's index was generated from. */
  indexed: string;
  /** The version resolved in the user's project, if one was found. */
  installed: string | null;
  /** How far apart they are. */
  drift: 'none' | 'patch' | 'minor' | 'major' | 'unknown';
  /** Whether a project was looked in at all, which opting out turns off. */
  checked: boolean;
}

/**
 * Where to look for the installed library. A client starts a stdio server in a
 * directory of its choosing, which is not always the project, and not every
 * client's config can say otherwise; every one can set an environment variable.
 */
export function projectDir(): string {
  const dir = process.env.BESTAX_MCP_PROJECT_DIR?.trim();
  return dir ? resolve(dir) : process.cwd();
}

/**
 * The one string in this server that does not come from its own committed data.
 *
 * `version` is read out of a `package.json` in the user's project and then quoted back into
 * a note that rides along with every successful tool result — so it lands in a model's
 * context wearing this server's authority. A tampered or typosquatted package at that path
 * can put anything there, and it does not need to execute: the manifest is read, never
 * required, so a payload works even under `--ignore-scripts`.
 *
 * Anything that is not a plain semver-shaped string is therefore treated as "no version
 * found", which is already a normal, non-error state (see the header comment). The length
 * cap is belt and braces — a conforming version cannot approach it.
 */
const SEMVER_ISH = /^\d+\.\d+\.\d+[\w.+-]*$/;
const MAX_VERSION_LENGTH = 64;

export function sanitizeVersion(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (value.length > MAX_VERSION_LENGTH) return null;
  return SEMVER_ISH.test(value) ? value : null;
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
  cwd: string = projectDir()
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
      const pkg = JSON.parse(await readFile(manifest, 'utf8')) as unknown;
      const version = sanitizeVersion(
        (pkg as { version?: unknown } | null)?.version
      );
      if (version) return version;
    } catch {
      // Not here — keep walking.
    }
    if (dir === root) return null;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/**
 * How long the probe above may take before we stop caring.
 *
 * `readFile` on a FIFO blocks forever and a stalled network mount blocks for as long as the
 * mount does; the try/catch around it catches throws, not hangs. Since the probe runs before
 * the stdio transport connects, a hang there presents as "the MCP server never came up" with
 * no output at all — the exact failure this package's entry point is written to avoid. A
 * missing version is a supported state, so giving up is always safe.
 */
const PROBE_TIMEOUT_MS = 500;

function withTimeout<T>(work: Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>(resolve => {
    const timer = setTimeout(() => resolve(fallback), PROBE_TIMEOUT_MS);
    timer.unref?.();
    work.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

/**
 * Opting out takes any non-empty value, so `=0` and `=false` also disable the check. That
 * reads backwards, so those two are treated as "leave it on" — an explicit off switch should
 * not be something you trip by writing the word for "no".
 */
function versionCheckDisabled(): boolean {
  const flag = process.env.BESTAX_MCP_NO_VERSION_CHECK;
  if (!flag) return false;
  return !['0', 'false', 'no', 'off'].includes(flag.trim().toLowerCase());
}

export async function resolveVersions(
  indexed: string,
  cwd?: string
): Promise<VersionInfo> {
  if (versionCheckDisabled()) {
    return { indexed, installed: null, drift: 'none', checked: false };
  }
  // Never let a version probe decide whether the docs server starts. Everything below is
  // best-effort by design, and the caller runs it before the transport connects.
  const installed = await withTimeout(
    findInstalledVersion(cwd).catch(() => null),
    null
  );
  return {
    indexed,
    installed,
    drift: installed ? compare(indexed, installed) : 'none',
    checked: true,
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
    `${attributed('https://bestax.io/docs')} before relying on anything above.`
  );
}

/**
 * What to say, once, when the check found no installed library to compare with.
 *
 * Not finding it is a normal state for someone trying the library before
 * installing it, but it is also what a client that starts the server outside
 * the project looks like, and that one used to get answers for whichever
 * version the index documents with no word that nothing had been checked
 * (#935). Said once per session rather than on every answer, for the reason
 * patch drift is silent: a line on every response is a line a model skips.
 */
export function missingInstallNote(info: VersionInfo): string | null {
  if (!info.checked || info.installed) return null;
  return (
    `Note: no installed ${PACKAGE} was found, so these answers describe ` +
    `${info.indexed} and were not checked against your project. If it is ` +
    `installed, this server is looking in the wrong directory: start it in ` +
    `your project, or set BESTAX_MCP_PROJECT_DIR to the project's path.`
  );
}
