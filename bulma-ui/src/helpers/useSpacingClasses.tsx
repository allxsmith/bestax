import { useMemo } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import { createBulmaClassHelpers, validSizes } from './bulmaClassHelpers';

/**
 * Props for applying Bulma margin and padding helper classes.
 */
export interface BulmaSpacingProps {
  /** Margin (e.g., '0', '1'). */
  m?: (typeof validSizes)[number];
  /** Margin top. */
  mt?: (typeof validSizes)[number];
  /** Margin right. */
  mr?: (typeof validSizes)[number];
  /** Margin bottom. */
  mb?: (typeof validSizes)[number];
  /** Margin left. */
  ml?: (typeof validSizes)[number];
  /** Margin horizontal (left and right). */
  mx?: (typeof validSizes)[number];
  /** Margin vertical (top and bottom). */
  my?: (typeof validSizes)[number];
  /** Padding (e.g., '0', '1'). */
  p?: (typeof validSizes)[number];
  /** Padding top. */
  pt?: (typeof validSizes)[number];
  /** Padding right. */
  pr?: (typeof validSizes)[number];
  /** Padding bottom. */
  pb?: (typeof validSizes)[number];
  /** Padding left. */
  pl?: (typeof validSizes)[number];
  /** Padding horizontal (left and right). */
  px?: (typeof validSizes)[number];
  /** Padding vertical (top and bottom). */
  py?: (typeof validSizes)[number];
}

/**
 * A hook that generates Bulma margin and padding helper classes.
 *
 * @function useSpacingClasses
 * @param props - Spacing-related Bulma helper props.
 * @returns A space-separated string of spacing helper classes.
 * @example
 * const spacingClasses = useSpacingClasses({ m: '2', px: '4' });
 * // spacingClasses: 'm-2 px-4'
 */
export const useSpacingClasses = (props: BulmaSpacingProps): string => {
  const { classPrefix } = useConfig();

  const { m, mt, mr, mb, ml, mx, my, p, pt, pr, pb, pl, px, py } = props;

  return useMemo(() => {
    const { classes, addClassNoViewport } =
      createBulmaClassHelpers(classPrefix);

    // Spacing (no viewport support in Bulma)
    addClassNoViewport('m', m, validSizes);
    addClassNoViewport('mt', mt, validSizes);
    addClassNoViewport('mr', mr, validSizes);
    addClassNoViewport('mb', mb, validSizes);
    addClassNoViewport('ml', ml, validSizes);
    addClassNoViewport('mx', mx, validSizes);
    addClassNoViewport('my', my, validSizes);
    addClassNoViewport('p', p, validSizes);
    addClassNoViewport('pt', pt, validSizes);
    addClassNoViewport('pr', pr, validSizes);
    addClassNoViewport('pb', pb, validSizes);
    addClassNoViewport('pl', pl, validSizes);
    addClassNoViewport('px', px, validSizes);
    addClassNoViewport('py', py, validSizes);

    return classNames(classes);
  }, [classPrefix, m, mt, mr, mb, ml, mx, my, p, pt, pr, pb, pl, px, py]);
};
