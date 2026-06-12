import { useMemo } from 'react';
import { classNames } from '../helpers/classNames';
import { BulmaDisplayProps, BulmaViewportProps } from './bulmaClassHelpers';
import { useColorClasses, BulmaColorProps } from './useColorClasses';
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
 * A hook that generates Bulma helper classes from props and separates unhandled props.
 *
 * Composed from the per-concern mini hooks (useColorClasses, useSpacingClasses,
 * useTypographyClasses, useVisibilityClasses, useFlexboxClasses, and
 * useOtherClasses), which can also be used individually.
 *
 * @function useBulmaClasses
 * @param props - Combination of BulmaClassesProps and additional props.
 * @returns An object containing the Bulma helper classes and unhandled props.
 * @example
 * const { bulmaHelperClasses, rest } = useBulmaClasses({
 *   color: 'primary',
 *   textSize: '3',
 *   className: 'custom-class'
 * });
 * // bulmaHelperClasses: 'has-text-primary is-size-3'
 * // rest: { className: 'custom-class' }
 */
export const useBulmaClasses = <T extends Record<string, unknown>>(
  props: BulmaClassesProps & T
): { bulmaHelperClasses: string; rest: Omit<T, keyof BulmaClassesProps> } => {
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
    displayDesktop,
    displayWidescreen,
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
    visibilityDesktop,
    visibilityWidescreen,
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
    visibilityDesktop,
    visibilityWidescreen,
    visibilityFullhd,
    display,
    displayMobile,
    displayTablet,
    displayDesktop,
    displayWidescreen,
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
    displayDesktop,
    displayWidescreen,
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

  return { bulmaHelperClasses, rest };
};

export {
  validColors,
  validColorShades,
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
