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

// Fail closed: with no bundler and no Node (raw CDN ESM), reading `process`
// throws and warnings stay off, so production can never warn by accident.
const isDev = (): boolean => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
};

/**
 * Log `message` with `console.warn` the first time `key` is seen, in
 * development only. Keys are shared by every caller, so prefix them with the
 * component name.
 */
export const warnOnce = (key: string, message: string): void => {
  if (!isDev() || warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(message);
};
