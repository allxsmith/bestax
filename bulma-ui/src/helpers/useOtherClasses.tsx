import { useMemo } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import { createBulmaClassHelpers } from './bulmaClassHelpers';

/**
 * Props for applying miscellaneous Bulma helper classes.
 */
export interface BulmaOtherProps {
  /** Float direction (e.g., 'left', 'right'). */
  float?: 'left' | 'right';
  /** Overflow behavior (e.g., 'clipped'). */
  overflow?: 'clipped';
  /** Applies overlay styling if true. */
  overlay?: boolean;
  /** Interaction behavior (e.g., 'unselectable', 'clickable'). */
  interaction?: 'unselectable' | 'clickable';
  /** Cursor style (e.g., 'pointer', 'help'). */
  cursor?: 'pointer' | 'help';
  /** Border radius style (e.g., 'radiusless'). */
  radius?: 'radiusless';
  /** Shadow style (e.g., 'shadowless'). */
  shadow?: 'shadowless';
  /** Responsive behavior (e.g., 'mobile', 'narrow'). */
  responsive?: 'mobile' | 'narrow';
  /** Add Bulma skeleton class if true. */
  skeleton?: boolean;
  /** Applies clearfix to fix floating children if true. */
  clearfix?: boolean;
  /** Applies position: relative if true. */
  relative?: boolean;
  /** Applies height: 100% if true. */
  fullHeight?: boolean;
}

/**
 * A hook that generates miscellaneous Bulma helper classes (float, overflow,
 * overlay, interaction, cursor, radius, shadow, responsive, skeleton,
 * clearfix, relative, and full height).
 *
 * @function useOtherClasses
 * @param props - Miscellaneous Bulma helper props.
 * @returns A space-separated string of helper classes.
 * @example
 * const otherClasses = useOtherClasses({ float: 'left', skeleton: true });
 * // otherClasses: 'is-pulled-left is-skeleton'
 */
export const useOtherClasses = (props: BulmaOtherProps): string => {
  const { classPrefix } = useConfig();

  const {
    float,
    overflow,
    overlay,
    interaction,
    cursor,
    radius,
    shadow,
    responsive,
    skeleton,
    clearfix,
    relative,
    fullHeight,
  } = props;

  return useMemo(() => {
    const { classes, addPrefixedClass, addClassNoViewport } =
      createBulmaClassHelpers(classPrefix);

    // Other Helpers (no viewport support)
    if (float) {
      addClassNoViewport('is-pulled', float, ['left', 'right']);
    }
    if (overflow) {
      addClassNoViewport('is', overflow, ['clipped']);
    }
    if (overlay) {
      addPrefixedClass('is-overlay');
    }
    if (interaction) {
      addClassNoViewport('is', interaction, ['unselectable', 'clickable']);
    }
    if (cursor) {
      if (cursor === 'pointer') {
        addPrefixedClass('is-clickable');
      } else if (cursor === 'help') {
        addPrefixedClass('is-cursor-help');
      }
    }
    if (radius) {
      addClassNoViewport('is', radius, ['radiusless']);
    }
    if (shadow) {
      addClassNoViewport('is', shadow, ['shadowless']);
    }
    if (responsive) {
      addClassNoViewport('is', responsive, ['mobile', 'narrow']);
    }

    // Bulma Skeleton Helper
    if (skeleton) {
      addPrefixedClass('is-skeleton');
    }

    // Clearfix Helper
    if (clearfix) {
      addPrefixedClass('is-clearfix');
    }

    // Position Relative Helper
    if (relative) {
      addPrefixedClass('is-relative');
    }

    // Full Height Helper
    if (fullHeight) {
      addPrefixedClass('is-full-height');
    }

    return classNames(classes);
  }, [
    classPrefix,
    float,
    overflow,
    overlay,
    interaction,
    cursor,
    radius,
    shadow,
    responsive,
    skeleton,
    clearfix,
    relative,
    fullHeight,
  ]);
};
