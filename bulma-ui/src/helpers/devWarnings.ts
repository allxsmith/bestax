// INTERNAL: deliberately not exported from src/index.ts.

const warnedKeys = new Set<string>();

/** Test-only: re-arm the warn-once registry. */
export const resetDevWarnings = (): void => {
  warnedKeys.clear();
};

// Local declaration because the library tsconfig has no Node types. The
// reference must stay a bare `process.env.NODE_ENV` so bundlers can replace
// it statically.
declare const process: { env: { NODE_ENV?: string } };

/**
 * Whether this is a development build. Fail closed: with no bundler and no
 * Node (raw CDN ESM), reading `process` throws and this is false, so
 * production can never warn by accident. Exported for a caller whose
 * development-only check costs something before it reaches `warnOnce`, so it
 * can skip that work in production too.
 */
export const isDev = (): boolean => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
};

/**
 * Logs a console warning in development, once per `key` for the life of the
 * page. Safe to call during render: a re-render, or a second instance hitting
 * the same case, finds the key already recorded and stays quiet.
 */
export const warnOnce = (key: string, message: string): void => {
  if (!isDev() || warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(message);
};
