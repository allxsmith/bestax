import { useMemo } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import {
  createBulmaClassHelpers,
  cursorClasses,
  validCursors,
  validFloats,
  validInteractions,
  validOverflows,
  validRadii,
  validResponsives,
  validShadows,
} from './bulmaClassHelpers';

/**
 * Props for applying miscellaneous Bulma helper classes.
 */
export interface BulmaOtherProps {
  /** Float direction (e.g., 'left', 'right'). */
  float?: (typeof validFloats)[number];
  /** Overflow behavior (e.g., 'clipped'). */
  overflow?: (typeof validOverflows)[number];
  /** Applies overlay styling if true. */
  overlay?: boolean;
  /** Interaction behavior (e.g., 'unselectable', 'clickable'). */
  interaction?: (typeof validInteractions)[number];
  /** Cursor style (e.g., 'pointer', 'help'). */
  cursor?: (typeof validCursors)[number];
  /** Border radius style (e.g., 'radiusless'). */
  radius?: (typeof validRadii)[number];
  /** Shadow style (e.g., 'shadowless'). */
  shadow?: (typeof validShadows)[number];
  /** Responsive behavior (e.g., 'mobile', 'narrow'). */
  responsive?: (typeof validResponsives)[number];
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
      addClassNoViewport('is-pulled', float, validFloats);
    }
    if (overflow) {
      addClassNoViewport('is', overflow, validOverflows);
    }
    if (overlay) {
      addPrefixedClass('is-overlay');
    }
    if (interaction) {
      addClassNoViewport('is', interaction, validInteractions);
    }
    if (cursor && validCursors.includes(cursor)) {
      addPrefixedClass(cursorClasses[cursor]);
    }
    if (radius) {
      addClassNoViewport('is', radius, validRadii);
    }
    if (shadow) {
      addClassNoViewport('is', shadow, validShadows);
    }
    if (responsive) {
      addClassNoViewport('is', responsive, validResponsives);
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
