import type { CSSProperties } from 'react';

/**
 * Merges helper-emitted inline styles (e.g., `bulmaHelperStyles` from
 * `useBulmaClasses`) with a user-supplied `style` prop.
 *
 * The user's `style` wins on conflicting properties, and when both inputs are
 * absent the result is `undefined` — so components that receive neither
 * render with no `style` attribute at all, exactly as before.
 *
 * @function mergeBulmaStyles
 * @param helperStyles - Inline styles emitted by the Bulma helper hooks.
 * @param style - The component consumer's `style` prop.
 * @returns The merged style object, or `undefined` when both are absent.
 * @example
 * <section style={mergeBulmaStyles(bulmaHelperStyles, style)} />
 */
export const mergeBulmaStyles = (
  helperStyles?: CSSProperties,
  style?: CSSProperties
): CSSProperties | undefined =>
  helperStyles || style ? { ...helperStyles, ...style } : undefined;
