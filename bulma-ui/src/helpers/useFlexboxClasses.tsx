import { useMemo } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import {
  createBulmaClassHelpers,
  validFlexDirections,
  validFlexWraps,
  validJustifyContents,
  validAlignContents,
  validAlignItems,
  validAlignSelfs,
  validFlexGrowShrink,
  BulmaDisplayProps,
} from './bulmaClassHelpers';

/**
 * Props for applying Bulma flexbox helper classes. The display props are read
 * only to gate the flex container helpers; this hook never emits display
 * classes itself.
 */
export interface BulmaFlexboxProps extends BulmaDisplayProps {
  /** Flex direction (e.g., 'row', 'column'). */
  flexDirection?: (typeof validFlexDirections)[number];
  /** Flex wrap (e.g., 'wrap', 'nowrap'). */
  flexWrap?: (typeof validFlexWraps)[number];
  /** Justify content (e.g., 'center', 'space-between'). */
  justifyContent?: (typeof validJustifyContents)[number];
  /** Align content (e.g., 'center', 'stretch'). */
  alignContent?: (typeof validAlignContents)[number];
  /** Align items (e.g., 'center', 'flex-start'). */
  alignItems?: (typeof validAlignItems)[number];
  /** Align self (e.g., 'auto', 'center'). */
  alignSelf?: (typeof validAlignSelfs)[number];
  /** Flex grow value (e.g., '0', '1', '2', '3', '4', '5'). */
  flexGrow?: (typeof validFlexGrowShrink)[number];
  /** Flex shrink value (e.g., '0', '1', '2', '3', '4', '5'). */
  flexShrink?: (typeof validFlexGrowShrink)[number];
}

/**
 * A hook that generates Bulma flexbox helper classes. Flex container helpers
 * (direction, wrap, justify/align content, align items) are only emitted when
 * one of the display props indicates a flex display; flex item helpers
 * (align self, grow, shrink) are always emitted.
 *
 * Note: this hook reads the display props purely as a gate and never emits
 * display classes — `is-flex` and friends come from useVisibilityClasses (or
 * the useBulmaClasses aggregate).
 *
 * @function useFlexboxClasses
 * @param props - Flexbox-related Bulma helper props.
 * @returns A space-separated string of flexbox helper classes.
 * @example
 * const flexboxClasses = useFlexboxClasses({
 *   display: 'flex', // gates the container helpers, but emits no 'is-flex'
 *   justifyContent: 'center',
 * });
 * // flexboxClasses: 'is-justify-content-center'
 * // ('is-flex' itself comes from useVisibilityClasses/useBulmaClasses)
 */
export const useFlexboxClasses = (props: BulmaFlexboxProps): string => {
  const { classPrefix } = useConfig();

  const {
    flexDirection,
    flexWrap,
    justifyContent,
    alignContent,
    alignItems,
    alignSelf,
    flexGrow,
    flexShrink,
    display,
    displayMobile,
    displayTablet,
    displayDesktop,
    displayWidescreen,
    displayFullhd,
  } = props;

  return useMemo(() => {
    const { classes, addClassNoViewport } =
      createBulmaClassHelpers(classPrefix);

    // Flexbox
    const hasFlexDisplay =
      display === 'flex' ||
      display === 'inline-flex' ||
      displayMobile === 'flex' ||
      displayMobile === 'inline-flex' ||
      displayTablet === 'flex' ||
      displayTablet === 'inline-flex' ||
      displayDesktop === 'flex' ||
      displayDesktop === 'inline-flex' ||
      displayWidescreen === 'flex' ||
      displayWidescreen === 'inline-flex' ||
      displayFullhd === 'flex' ||
      displayFullhd === 'inline-flex';

    if (hasFlexDisplay) {
      // Flexbox container properties do not support viewport modifiers in Bulma
      addClassNoViewport(
        'is-flex-direction',
        flexDirection,
        validFlexDirections
      );
      addClassNoViewport('is-flex-wrap', flexWrap, validFlexWraps);
      addClassNoViewport(
        'is-justify-content',
        justifyContent,
        validJustifyContents
      );
      addClassNoViewport('is-align-content', alignContent, validAlignContents);
      addClassNoViewport('is-align-items', alignItems, validAlignItems);
    }

    // Flex item properties (can be applied to any element that is a flex item)
    // These don't require the element itself to have display: flex
    addClassNoViewport('is-align-self', alignSelf, validAlignSelfs);
    addClassNoViewport('is-flex-grow', flexGrow, validFlexGrowShrink);
    addClassNoViewport('is-flex-shrink', flexShrink, validFlexGrowShrink);

    return classNames(classes);
  }, [
    classPrefix,
    flexDirection,
    flexWrap,
    justifyContent,
    alignContent,
    alignItems,
    alignSelf,
    flexGrow,
    flexShrink,
    display,
    displayMobile,
    displayTablet,
    displayDesktop,
    displayWidescreen,
    displayFullhd,
  ]);
};
