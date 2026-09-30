import { useMemo } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import {
  createBulmaClassHelpers,
  cursorClasses,
  validAspectRatios,
  validAxisOverflows,
  validCursors,
  validFloats,
  validInteractions,
  validOverflows,
  validPositions,
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
  /**
   * Overflow behavior on both axes. `clipped` renders `is-clipped`; the CSS
   * keywords (`auto`, `clip`, `hidden`, `scroll`, `visible`) render
   * `is-overflow-<value>`.
   */
  overflow?: (typeof validOverflows)[number];
  /** Horizontal overflow behavior (e.g., 'auto', 'hidden'). */
  overflowX?: (typeof validAxisOverflows)[number];
  /** Vertical overflow behavior (e.g., 'auto', 'scroll'). */
  overflowY?: (typeof validAxisOverflows)[number];
  /** Applies overlay styling if true. */
  overlay?: boolean;
  /** Interaction behavior (e.g., 'unselectable', 'clickable'). */
  interaction?: (typeof validInteractions)[number];
  /** Cursor style (e.g., 'pointer', 'help'). */
  cursor?: (typeof validCursors)[number];
  /**
   * Border radius. `radiusless` removes it (`is-radiusless`). `small`,
   * `normal`, `large` and `rounded` set one from Bulma's radius scale
   * (`has-radius-<value>`), where `rounded` is the pill shape.
   *
   * The class lands on the component's root element, so where an inner
   * element draws the radius, such as the `<img>` in `Image` or the
   * `<select>` in `Select`, that element keeps its own.
   */
  radius?: (typeof validRadii)[number];
  /** Shadow style (e.g., 'shadowless'). */
  shadow?: (typeof validShadows)[number];
  /** Responsive behavior (e.g., 'mobile', 'narrow'). */
  responsive?: (typeof validResponsives)[number];
  /** Add Bulma skeleton class if true. */
  skeleton?: boolean;
  /** Applies clearfix to fix floating children if true. */
  clearfix?: boolean;
  /**
   * CSS `position` (`is-position-<value>`).
   *
   * Named `pos` because several components already have a `position` prop
   * of their own, for where they place a popup or a toast.
   *
   * It sets `position` and nothing else, so an element that is `absolute`,
   * `fixed` or `sticky` still needs its offsets (`top`, `left`, …) from your
   * own CSS. `sticky` in particular does nothing until one is set.
   *
   * When `pos` is set it decides the position, and `relative` adds nothing.
   */
  pos?: (typeof validPositions)[number];
  /**
   * Applies position: relative if true (`is-relative`). The shortcut for
   * `pos="relative"`, kept working as it always has; `pos` wins when both are
   * set.
   */
  relative?: boolean;
  /** Applies height: 100% if true. */
  fullHeight?: boolean;
  /**
   * Fixed width-to-height ratio (`is-aspect-ratio-<value>`), e.g. `16by9`.
   * The height follows the width, so leave the height unset. Content taller
   * than the ratio allows grows the element unless `overflow` or `overflowY`
   * makes it scroll or clip.
   *
   * On `Image`, prefer its own `size` ratios, which also fit the picture to
   * the box; this class sizes only the wrapper.
   */
  aspectRatio?: (typeof validAspectRatios)[number];
}

/**
 * A hook that generates miscellaneous Bulma helper classes (float, overflow,
 * overlay, interaction, cursor, radius, shadow, responsive, skeleton,
 * clearfix, position, full height, and aspect ratio).
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
    overflowX,
    overflowY,
    overlay,
    interaction,
    cursor,
    radius,
    shadow,
    responsive,
    skeleton,
    clearfix,
    pos,
    relative,
    fullHeight,
    aspectRatio,
  } = props;

  return useMemo(() => {
    const { classes, addPrefixedClass, addClassNoViewport } =
      createBulmaClassHelpers(classPrefix);

    // Other Helpers (no viewport support)
    if (float) {
      addClassNoViewport('is-pulled', float, validFloats);
    }
    // `clipped` is the older helper and keeps its own class; the CSS keywords
    // share the `is-overflow-` stem.
    if (overflow === 'clipped') {
      addPrefixedClass('is-clipped');
    } else {
      addClassNoViewport('is-overflow', overflow, validAxisOverflows);
    }
    addClassNoViewport('is-overflow-x', overflowX, validAxisOverflows);
    addClassNoViewport('is-overflow-y', overflowY, validAxisOverflows);
    if (overlay) {
      addPrefixedClass('is-overlay');
    }
    if (interaction) {
      addClassNoViewport('is', interaction, validInteractions);
    }
    if (cursor && validCursors.includes(cursor)) {
      addPrefixedClass(cursorClasses[cursor]);
    }
    // `radiusless` is an `is-` helper that removes the radius; the sizes are
    // Bulma's `has-radius-` helpers.
    if (radius === 'radiusless') {
      addPrefixedClass('is-radiusless');
    } else {
      addClassNoViewport('has-radius', radius, validRadii);
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

    // Position Helpers. A valid `pos` decides the position on its own, so a
    // `relative` beside it cannot add a second, conflicting one.
    if (pos && validPositions.includes(pos)) {
      addPrefixedClass(`is-position-${pos}`);
    } else if (relative) {
      addPrefixedClass('is-relative');
    }

    // Full Height Helper
    if (fullHeight) {
      addPrefixedClass('is-full-height');
    }

    addClassNoViewport('is-aspect-ratio', aspectRatio, validAspectRatios);

    return classNames(classes);
  }, [
    classPrefix,
    float,
    overflow,
    overflowX,
    overflowY,
    overlay,
    interaction,
    cursor,
    radius,
    shadow,
    responsive,
    skeleton,
    clearfix,
    pos,
    relative,
    fullHeight,
    aspectRatio,
  ]);
};
