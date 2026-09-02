import { useMemo, type CSSProperties } from 'react';
import { classNames } from '../helpers/classNames';
import { BulmaDisplayProps, BulmaViewportProps } from './bulmaClassHelpers';
import {
  useColorClasses,
  useColorStyles,
  BulmaColorProps,
  BulmaColorPropsWithScheme,
} from './useColorClasses';
import { useSpacingClasses, BulmaSpacingProps } from './useSpacingClasses';
import {
  useTypographyClasses,
  BulmaTypographyProps,
} from './useTypographyClasses';
import {
  useVisibilityClasses,
  BulmaVisibilityProps,
} from './useVisibilityClasses';
import { useFlexboxClasses, BulmaFlexboxProps } from './useFlexboxClasses';
import { useOtherClasses, BulmaOtherProps } from './useOtherClasses';

/**
 * Props for applying Bulma helper classes to components.
 */
export interface BulmaClassesProps
  extends
    BulmaColorProps,
    BulmaSpacingProps,
    BulmaTypographyProps,
    BulmaVisibilityProps,
    BulmaFlexboxProps,
    BulmaOtherProps {}

/**
 * {@link BulmaClassesProps} with `backgroundColor` widened to also accept the
 * scheme color names from `validSchemeColors` (see
 * {@link BulmaColorPropsWithScheme}). This is the input type of
 * `useBulmaClasses`; scheme values surface as the `bulmaHelperStyles` return
 * member instead of a class.
 */
export type BulmaClassesPropsWithScheme = Omit<
  BulmaClassesProps,
  keyof BulmaColorProps
> &
  BulmaColorPropsWithScheme;

/**
 * A hook that generates Bulma helper classes from props and separates unhandled props.
 *
 * Composed from the per-concern mini hooks (useColorClasses, useSpacingClasses,
 * useTypographyClasses, useVisibilityClasses, useFlexboxClasses, and
 * useOtherClasses), which can also be used individually.
 *
 * Scheme background values (`backgroundColor: 'scheme-main-bis'`, …) emit no
 * class; they are returned as `bulmaHelperStyles` — a dark-mode-safe inline
 * `background-color: var(--bulma-scheme-*)` style (`undefined` for all other
 * inputs). Merge it with a user `style` prop via `mergeBulmaStyles`.
 *
 * @function useBulmaClasses
 * @param props - Combination of BulmaClassesPropsWithScheme and additional props.
 * @returns An object containing the Bulma helper classes, optional helper
 * styles, and unhandled props.
 * @example
 * const { bulmaHelperClasses, bulmaHelperStyles, rest } = useBulmaClasses({
 *   color: 'primary',
 *   backgroundColor: 'scheme-main-bis',
 *   className: 'custom-class'
 * });
 * // bulmaHelperClasses: 'has-text-primary'
 * // bulmaHelperStyles: { backgroundColor: 'var(--bulma-scheme-main-bis)' }
 * // rest: { className: 'custom-class' }
 */
export const useBulmaClasses = <T extends object>(
  props: BulmaClassesPropsWithScheme & T
): {
  bulmaHelperClasses: string;
  bulmaHelperStyles?: CSSProperties;
  rest: Omit<T, keyof BulmaClassesProps>;
} => {
  const {
    color,
    backgroundColor,
    colorShade,
    backgroundColorShade,
    m,
    mt,
    mr,
    mb,
    ml,
    mx,
    my,
    p,
    pt,
    pr,
    pb,
    pl,
    px,
    py,
    textSize,
    textAlign,
    textTransform,
    textWeight,
    fontFamily,
    display,
    visibility,
    flexDirection,
    flexWrap,
    justifyContent,
    alignContent,
    alignItems,
    alignSelf,
    flexGrow,
    flexShrink,
    float,
    overflow,
    overlay,
    interaction,
    cursor,
    radius,
    shadow,
    responsive,
    viewport,
    displayMobile,
    displayTablet,
    displayTabletOnly,
    displayTouch,
    displayDesktop,
    displayDesktopOnly,
    displayWidescreen,
    displayWidescreenOnly,
    displayFullhd,
    textSizeMobile,
    textSizeTablet,
    textSizeDesktop,
    textSizeWidescreen,
    textSizeFullhd,
    textAlignMobile,
    textAlignTablet,
    textAlignDesktop,
    textAlignWidescreen,
    textAlignFullhd,
    visibilityMobile,
    visibilityTablet,
    visibilityTabletOnly,
    visibilityTouch,
    visibilityDesktop,
    visibilityDesktopOnly,
    visibilityWidescreen,
    visibilityWidescreenOnly,
    visibilityFullhd,
    skeleton,
    clearfix,
    relative,
    fullHeight,
    ...rest
  } = props;

  const colorClasses = useColorClasses({
    color,
    colorShade,
    backgroundColor,
    backgroundColorShade,
  });

  const bulmaHelperStyles = useColorStyles({ backgroundColor });

  const spacingClasses = useSpacingClasses({
    m,
    mt,
    mr,
    mb,
    ml,
    mx,
    my,
    p,
    pt,
    pr,
    pb,
    pl,
    px,
    py,
  });

  const typographyClasses = useTypographyClasses({
    textSize,
    textAlign,
    textTransform,
    textWeight,
    fontFamily,
    viewport,
    textSizeMobile,
    textSizeTablet,
    textSizeDesktop,
    textSizeWidescreen,
    textSizeFullhd,
    textAlignMobile,
    textAlignTablet,
    textAlignDesktop,
    textAlignWidescreen,
    textAlignFullhd,
  });

  const visibilityClasses = useVisibilityClasses({
    visibility,
    visibilityMobile,
    visibilityTablet,
    visibilityTabletOnly,
    visibilityTouch,
    visibilityDesktop,
    visibilityDesktopOnly,
    visibilityWidescreen,
    visibilityWidescreenOnly,
    visibilityFullhd,
    display,
    displayMobile,
    displayTablet,
    displayTabletOnly,
    displayTouch,
    displayDesktop,
    displayDesktopOnly,
    displayWidescreen,
    displayWidescreenOnly,
    displayFullhd,
    viewport,
  });

  const flexboxClasses = useFlexboxClasses({
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
    displayTabletOnly,
    displayTouch,
    displayDesktop,
    displayDesktopOnly,
    displayWidescreen,
    displayWidescreenOnly,
    displayFullhd,
  });

  const otherClasses = useOtherClasses({
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
  });

  const bulmaHelperClasses = useMemo(
    () =>
      classNames(
        colorClasses,
        spacingClasses,
        typographyClasses,
        visibilityClasses,
        flexboxClasses,
        otherClasses
      ),
    [
      colorClasses,
      spacingClasses,
      typographyClasses,
      visibilityClasses,
      flexboxClasses,
      otherClasses,
    ]
  );

  return { bulmaHelperClasses, bulmaHelperStyles, rest };
};

export {
  validColors,
  validColorShades,
  validSchemeColors,
  validSizes,
  validTextSizes,
  validAlignments,
  validTextTransforms,
  validTextWeights,
  validFontFamilies,
  validDisplays,
  validVisibilities,
  validFlexDirections,
  validFlexWraps,
  validJustifyContents,
  validAlignContents,
  validAlignItems,
  validAlignSelfs,
  validFlexGrowShrink,
  validViewports,
} from './bulmaClassHelpers';
export type { BulmaViewportProps, BulmaDisplayProps };
export * from './useColorClasses';
export * from './useSpacingClasses';
export * from './useTypographyClasses';
export * from './useVisibilityClasses';
export * from './useFlexboxClasses';
export * from './useOtherClasses';
