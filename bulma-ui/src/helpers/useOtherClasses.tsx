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
   *
   * Beside `overflowX` or `overflowY`, the axis prop wins on its own axis and
   * `overflow` sets only the other one, with `clipped` counting as `hidden`:
   * `overflow="hidden" overflowY="auto"` clips sideways and scrolls down.
   */
  overflow?: (typeof validOverflows)[number];
  /**
   * Horizontal overflow behavior (e.g., 'auto', 'hidden'). Wins over
   * `overflow` on this axis.
   */
  overflowX?: (typeof validAxisOverflows)[number];
  /**
   * Vertical overflow behavior (e.g., 'auto', 'scroll'). Wins over `overflow`
   * on this axis.
   */
  overflowY?: (typeof validAxisOverflows)[number];
  /**
   * Covers the nearest positioned ancestor (`is-overlay`): `position:
   * absolute` with `top`, `right`, `bottom` and `left` at 0.
   *
   * `pos` and `relative` set `position` with `!important`, so beside
   * `overlay` either one replaces the `absolute` and keeps the zero offsets.
   * `pos="fixed"` then covers the viewport instead of the ancestor. `sticky`,
   * `relative` and `static` put the element back in the normal flow, where it
   * covers nothing, and a sticky one sticks at every edge of its scroll
   * container.
   */
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
   * `<select>` in `Select`, that element keeps its own. The sizes are not
   * `!important`, unlike `radiusless`, so a component rule more specific than
   * one class still wins: an `isRounded` control stays a pill, and a joined
   * addon keeps its square inner corners.
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
   * Beside `overlay` it replaces the overlay's `absolute` but not its zero
   * offsets; see `overlay`.
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
    // Bulma's overflow helpers are all `!important` at the same specificity
    // and ordered by value rather than by axis, so a both-axes class beside an
    // axis class would be settled by which value comes later in the
    // stylesheet. Once an axis prop is set, both axes are written per axis
    // instead: the axis prop wins its own, and `overflow` fills in the other,
    // `clipped` being `overflow: hidden`.
    const axisX = validAxisOverflows.find(v => v === overflowX);
    const axisY = validAxisOverflows.find(v => v === overflowY);
    if (axisX || axisY) {
      const rest = overflow === 'clipped' ? 'hidden' : overflow;
      addClassNoViewport('is-overflow-x', axisX ?? rest, validAxisOverflows);
      addClassNoViewport('is-overflow-y', axisY ?? rest, validAxisOverflows);
    } else if (overflow === 'clipped') {
      // The older helper, which keeps its own class.
      addPrefixedClass('is-clipped');
    } else {
      addClassNoViewport('is-overflow', overflow, validAxisOverflows);
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
