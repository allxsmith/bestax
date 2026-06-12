import { useMemo } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import {
  createBulmaClassHelpers,
  validColors,
  validColorShades,
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
 * A hook that generates Bulma text and background color helper classes.
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
export const useColorClasses = (props: BulmaColorProps): string => {
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
