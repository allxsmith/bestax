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

/** What a browser can take an element's name from, besides a `<label>`. */
const NAMING_ATTRIBUTES = ['aria-label', 'aria-labelledby', 'title'];

/**
 * Warns, as `warnOnce` does, about an element that nothing names: no
 * `<label>` of its own and none of `NAMING_ATTRIBUTES`. It reads the
 * rendered element, so call it after mount, from an effect: a label outside
 * the component can name an input, such as an outer `Field`'s or one wired
 * by hand with `htmlFor`. A label or an `aria-labelledby` counts whatever
 * it leads to, since reading the name it gives would misjudge one held in
 * an image's `alt` or another element's `aria-label`.
 */
export const warnIfUnnamed = (
  element: HTMLElement | null,
  key: string,
  message: string
): void => {
  if (!isDev() || !element || warnedKeys.has(key)) return;
  // Undefined on an element that takes no label, such as a dialog's root.
  const labels = (element as HTMLInputElement).labels;
  const named =
    (labels?.length ?? 0) > 0 ||
    NAMING_ATTRIBUTES.some(
      attribute => (element.getAttribute(attribute) ?? '').trim() !== ''
    );
  if (!named) warnOnce(key, message);
};
