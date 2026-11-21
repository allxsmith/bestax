// INTERNAL — deliberately not exported from src/index.ts.

import { resetDevWarnings, warnOnce } from './devWarnings';

/**
 * Color values that emit an `is-<color>` modifier no shipped Bulma 1.0.4 rule
 * matches on `.progress`/`.notification`/`.hero`. The `has-text-*` and
 * `has-background-*` helpers DO cover these values — only the
 * component-modifier form is dead.
 */
export const UNSTYLED_MODIFIER_COLORS = [
  'black-bis',
  'black-ter',
  'white-bis',
  'white-ter',
  'grey-darker',
  'grey-dark',
  'grey',
  'grey-light',
  'grey-lighter',
] as const;

const CSS_BACKED =
  'primary, link, info, success, warning, danger, black, white, light, dark';

/**
 * Test-only: re-arm the warn-once registry. The registry lives in
 * `devWarnings`, shared with the other dev warnings, so this re-arms those too.
 */
export const resetColorDeprecationWarnings = resetDevWarnings;

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

/** Warns once that `component`'s `color` prop is deprecated, and why. */
const warnColorProp = (component: string, reason: string, hint: string) =>
  warnOnce(
    `${component}:color-prop`,
    `[bestax-bulma] The ${component} "color" prop is deprecated: ${reason}. ` +
      `It will be removed in the next major version. ${hint}`
  );

/** Dev warning for a `color` prop that has no shipped CSS for any value. */
export const warnDeprecatedColorProp = (
  component: string,
  value: string | undefined,
  hint: string
): void => {
  if (value === undefined) return;
  warnColorProp(
    component,
    `Bulma ships no ${component.toLowerCase()} color CSS, so it has no ` +
      'visual effect',
    hint
  );
};

/**
 * Dev warning for a deprecated `color` prop that renders the text color
 * helper in `textColor`'s place, rather than a modifier. It takes the part's
 * props, since a `color` key takes that place even with an undefined value.
 */
export const warnTextHelperColorProp = (
  component: string,
  props: { color?: string | undefined }
): void => {
  if (!('color' in props)) return;
  warnColorProp(
    component,
    'it renders the text color helper (has-text-<color>), not a modifier, ' +
      'in place of textColor, and passed as undefined it still keeps ' +
      'textColor from rendering',
    'Use the textColor prop instead.'
  );
};
