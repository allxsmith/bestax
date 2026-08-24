export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

// Exported so check:conformance can compare it against the telemetry
// worker's allowlist by importing it, rather than regex-scraping the source.
export const KNOWN_PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
const KNOWN = KNOWN_PACKAGE_MANAGERS;

/** Detect the package manager that invoked the CLI from npm_config_user_agent
 *  (e.g. "pnpm/9.12.0 npm/? node/v22 darwin arm64"). Falls back to npm. */
export function detectPackageManager(
  userAgent: string | undefined = process.env.npm_config_user_agent
): PackageManager {
  const name = userAgent?.split('/')[0] ?? '';
  return (KNOWN as readonly string[]).includes(name)
    ? (name as PackageManager)
    : 'npm';
}
