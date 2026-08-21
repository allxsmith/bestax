/**
 * Specifier protocols that mean something inside this workspace and are not a
 * plain installable specifier once published (#412, #436, #532).
 *
 * One copy, because there were two: check-conformance.mjs uses this to decide
 * whether a manifest is a violation, and scripts/require-pnpm-publish.mjs uses
 * it to name the offending specifier when it refuses a packer. The second copy
 * carried a comment conceding that the two could drift and arguing the drift
 * was cheap. It was, but only because the list happened to be right — add a
 * seventh protocol to one and the other goes quiet about it.
 */

/**
 * `link:`, `portal:` and `file:` are here because NEITHER publisher rewrites
 * them: pnpm's export converter chain is workspace/catalog/jsr (verified in the
 * 11.9.0 bundle), and npm has no notion of the first two at all. A published
 * manifest carrying one points at a path that does not exist on any consumer's
 * machine.
 */
export const PACK_TIME_PROTOCOLS = [
  'workspace:',
  'catalog:',
  'jsr:',
  'link:',
  'portal:',
  'file:',
];

/**
 * The subset `pnpm publish` turns into a plain, installable semver range. That
 * is what makes a pnpm publisher safe to exempt, and it is not all of them:
 * pnpm rewrites `jsr:@scope/pkg@^1` to `npm:@jsr/scope__pkg@^1`, which resolves
 * only for a consumer who has configured the @jsr registry.
 */
export const PNPM_RESOLVES_TO_PLAIN_RANGE = ['workspace:', 'catalog:'];

export const DEP_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/** Sections a consumer of the published package resolves. */
export const CONSUMER_SECTIONS = DEP_SECTIONS.filter(
  s => s !== 'devDependencies'
);

/** The pack-time protocol `spec` uses, or undefined if it is a plain range. */
export const packTimeProtocol = spec =>
  typeof spec === 'string'
    ? PACK_TIME_PROTOCOLS.find(p => spec.startsWith(p))
    : undefined;
