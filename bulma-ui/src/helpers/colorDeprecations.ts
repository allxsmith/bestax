// INTERNAL — deliberately not exported from src/index.ts.

/**
 * Color values that emit an `is-<color>` modifier no shipped Bulma 1.0.4 rule
 * matches on `.progress`/`.notification`/`.hero`. The `has-text-*` and
 * `has-background-*` helpers DO cover these values — only the
 * component-modifier form is dead.
 */
export const UNSTYLED_MODIFIER_COLORS = [
  'black-bis',
  'black-ter',
  'grey-darker',
  'grey-dark',
  'grey',
  'grey-light',
  'grey-lighter',
] as const;

const CSS_BACKED =
  'primary, link, info, success, warning, danger, black, white, light, dark';

const warnedKeys = new Set<string>();

/** Test-only: re-arm the warn-once registry. */
export const resetColorDeprecationWarnings = (): void => {
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

const warnOnce = (key: string, message: string): void => {
  if (!isDev() || warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(message);
};

/**
 * Dev warning for a `color` value whose `is-<color>` modifier has no shipped
 * CSS. `extraUnstyled` covers per-component dead values beyond the shared
 * list (e.g. Hero's `inherit`/`current`).
 */
export const warnUnstyledColor = (
  component: string,
  value: string | undefined,
  extraUnstyled: readonly string[] = []
): void => {
  if (!value) return;
  if (
    !(UNSTYLED_MODIFIER_COLORS as readonly string[]).includes(value) &&
    !extraUnstyled.includes(value)
  ) {
    return;
  }
  warnOnce(
    `${component}:${value}`,
    `[bestax-bulma] <${component} color="${value}">: Bulma ships no ` +
      `"is-${value}" CSS for ${component}, so it renders unstyled. This ` +
      `value is deprecated and will be removed from the ${component} color ` +
      `union in the next major version. CSS-backed values: ${CSS_BACKED}.`
  );
};

/** Dev warning for a `color` prop that has no shipped CSS for any value. */
export const warnDeprecatedColorProp = (
  component: string,
  value: string | undefined,
  hint: string
): void => {
  if (value === undefined) return;
  warnOnce(
    `${component}:color-prop`,
    `[bestax-bulma] The ${component} "color" prop is deprecated: Bulma ` +
      `ships no ${component.toLowerCase()} color CSS, so it has never had ` +
      `a visual effect. It will be removed in the next major version. ${hint}`
  );
};
