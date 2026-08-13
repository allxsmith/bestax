import { useMemo, type CSSProperties } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import {
  createBulmaClassHelpers,
  validColors,
  validColorShades,
  validSchemeColors,
} from './bulmaClassHelpers';

/**
 * Props for applying Bulma text and background color helper classes.
 */
export interface BulmaColorProps {
  /** Text color class (e.g., 'primary', 'info'). */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color shade suffix (e.g., '00', 'invert'). */
  colorShade?: (typeof validColorShades)[number];
  /** Background color class (e.g., 'primary', 'info'). */
  backgroundColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color shade suffix (e.g., '00', 'invert'). */
  backgroundColorShade?: (typeof validColorShades)[number];
}

/**
 * {@link BulmaColorProps} with `backgroundColor` widened to also accept the
 * scheme color names from `validSchemeColors` (e.g., 'scheme-main-bis').
 *
 * Scheme values never emit a `has-background-*` class — pass them through
 * {@link useColorStyles} (or `useBulmaClasses`' `bulmaHelperStyles` return) to
 * get the dark-mode-safe inline `background-color: var(--bulma-scheme-*)`
 * style instead.
 */
export type BulmaColorPropsWithScheme = Omit<
  BulmaColorProps,
  'backgroundColor'
> & {
  /** Background color: a Bulma color class name or a scheme color name. */
  backgroundColor?:
    BulmaColorProps['backgroundColor'] | (typeof validSchemeColors)[number];
};

/**
 * A hook that generates Bulma text and background color helper classes.
 *
 * Scheme background values (`scheme-main`, `scheme-main-bis`, …) are dropped
 * from class emission — Bulma ships no `has-background-scheme-*` classes; use
 * {@link useColorStyles} to render them as an inline style.
 *
 * @function useColorClasses
 * @param props - Color-related Bulma helper props.
 * @returns A space-separated string of color helper classes.
 * @example
 * const colorClasses = useColorClasses({
 *   color: 'primary',
 *   backgroundColor: 'info',
 * });
 * // colorClasses: 'has-text-primary has-background-info'
 */
export const useColorClasses = (props: BulmaColorPropsWithScheme): string => {
  const { classPrefix } = useConfig();

  const { color, colorShade, backgroundColor, backgroundColorShade } = props;

  return useMemo(() => {
    const { classes, addPrefixedClass, addClass } =
      createBulmaClassHelpers(classPrefix);

    // Color handling
    const addColorClass = (
      prefix: 'has-text' | 'has-background',
      value: string | undefined,
      shade: (typeof validColorShades)[number] | undefined
    ) => {
      if (!value || ![...validColors, 'inherit', 'current'].includes(value))
        return;
      if (shade && validColorShades.includes(shade)) {
        // Color shades never support viewport modifiers in Bulma
        const className = `${prefix}-${value}-${shade}`;
        addPrefixedClass(className);
      } else {
        // Color classes never support viewport modifiers in Bulma
        addClass(
          prefix,
          value,
          [...validColors, 'inherit', 'current'],
          false // supportsViewport = false for all color classes
        );
      }
    };

    // Color
    addColorClass('has-text', color, colorShade);
    addColorClass('has-background', backgroundColor, backgroundColorShade);

    return classNames(classes);
  }, [classPrefix, color, colorShade, backgroundColor, backgroundColorShade]);
};

/**
 * A hook that generates inline styles for scheme-aware color props.
 *
 * When `backgroundColor` is one of the scheme color names in
 * `validSchemeColors`, returns `{ backgroundColor: 'var(--bulma-<value>)' }` —
 * an inline style that tracks Bulma's scheme CSS variables, so it adapts to
 * light/dark mode with no bestax-shipped CSS. For every other input it
 * returns `undefined` (never `{}`), so components that don't use scheme
 * values produce identical DOM to before.
 *
 * `backgroundColorShade` is ignored for scheme values — Bulma defines no
 * shaded scheme variables. Only the background is set: the `scheme-invert*`
 * values do not change text color, so pair them with a contrasting
 * foreground.
 *
 * @function useColorStyles
 * @param props - Color-related Bulma helper props (scheme-aware).
 * @returns An inline style object for scheme backgrounds, or `undefined`.
 * @example
 * const colorStyles = useColorStyles({ backgroundColor: 'scheme-main-bis' });
 * // colorStyles: { backgroundColor: 'var(--bulma-scheme-main-bis)' }
 */
export const useColorStyles = (
  props: BulmaColorPropsWithScheme
): CSSProperties | undefined => {
  const { backgroundColor } = props;

  return useMemo(() => {
    if (
      backgroundColor &&
      (validSchemeColors as readonly string[]).includes(backgroundColor)
    ) {
      return { backgroundColor: `var(--bulma-${backgroundColor})` };
    }
    return undefined;
  }, [backgroundColor]);
};
