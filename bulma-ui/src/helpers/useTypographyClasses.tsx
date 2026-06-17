import { useMemo } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import {
  createBulmaClassHelpers,
  validTextSizes,
  validAlignments,
  validTextTransforms,
  validTextWeights,
  validFontFamilies,
  BulmaViewportProps,
} from './bulmaClassHelpers';

/**
 * Props for applying Bulma typography helper classes.
 */
export interface BulmaTypographyProps extends BulmaViewportProps {
  /** Text size (e.g., '1', '2'). */
  textSize?: (typeof validTextSizes)[number];
  /** Text alignment (e.g., 'centered', 'left'). */
  textAlign?: (typeof validAlignments)[number];
  /** Text transformation (e.g., 'uppercase', 'italic'). */
  textTransform?: (typeof validTextTransforms)[number];
  /** Text weight (e.g., 'light', 'bold'). */
  textWeight?: (typeof validTextWeights)[number];
  /** Font family (e.g., 'sans-serif', 'code'). */
  fontFamily?: (typeof validFontFamilies)[number];
  /** Text size for mobile viewport (up to 768px). */
  textSizeMobile?: (typeof validTextSizes)[number];
  /** Text size for tablet viewport (769px - 1023px). */
  textSizeTablet?: (typeof validTextSizes)[number];
  /** Text size for desktop viewport (1024px - 1215px). */
  textSizeDesktop?: (typeof validTextSizes)[number];
  /** Text size for widescreen viewport (1216px - 1407px). */
  textSizeWidescreen?: (typeof validTextSizes)[number];
  /** Text size for fullhd viewport (1408px and above). */
  textSizeFullhd?: (typeof validTextSizes)[number];
  /** Text alignment for mobile viewport (up to 768px). */
  textAlignMobile?: (typeof validAlignments)[number];
  /** Text alignment for tablet viewport (769px - 1023px). */
  textAlignTablet?: (typeof validAlignments)[number];
  /** Text alignment for desktop viewport (1024px - 1215px). */
  textAlignDesktop?: (typeof validAlignments)[number];
  /** Text alignment for widescreen viewport (1216px - 1407px). */
  textAlignWidescreen?: (typeof validAlignments)[number];
  /** Text alignment for fullhd viewport (1408px and above). */
  textAlignFullhd?: (typeof validAlignments)[number];
}

/**
 * A hook that generates Bulma typography helper classes, including
 * viewport-specific text size and alignment variants.
 *
 * @function useTypographyClasses
 * @param props - Typography-related Bulma helper props.
 * @returns A space-separated string of typography helper classes.
 * @example
 * const typographyClasses = useTypographyClasses({
 *   textSize: '3',
 *   textWeight: 'bold',
 * });
 * // typographyClasses: 'is-size-3 has-text-weight-bold'
 */
export const useTypographyClasses = (props: BulmaTypographyProps): string => {
  const { classPrefix } = useConfig();

  const {
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
  } = props;

  return useMemo(() => {
    const { classes, addPrefixedClass, addClass, addClassNoViewport } =
      createBulmaClassHelpers(classPrefix, viewport);

    // Typography
    addClass('is-size', textSize, validTextSizes, true); // supports viewport
    addClass('has-text', textAlign, validAlignments, true); // supports viewport
    addClassNoViewport('is', textTransform, validTextTransforms); // no viewport support
    addClassNoViewport('has-text-weight', textWeight, validTextWeights); // no viewport support
    addClassNoViewport('is-family', fontFamily, validFontFamilies); // no viewport support

    // Viewport-specific text sizes
    const addViewportSpecificTextSizeClass = (
      value: string | undefined,
      viewportSuffix: string
    ) => {
      if (value && (validTextSizes as readonly string[]).includes(value)) {
        addPrefixedClass(`is-size-${value}${viewportSuffix}`);
      }
    };

    addViewportSpecificTextSizeClass(textSizeMobile, '-mobile');
    addViewportSpecificTextSizeClass(textSizeTablet, '-tablet');
    addViewportSpecificTextSizeClass(textSizeDesktop, '-desktop');
    addViewportSpecificTextSizeClass(textSizeWidescreen, '-widescreen');
    addViewportSpecificTextSizeClass(textSizeFullhd, '-fullhd');

    // Viewport-specific text alignment
    const addViewportSpecificTextAlignClass = (
      value: string | undefined,
      viewportSuffix: string
    ) => {
      if (value && (validAlignments as readonly string[]).includes(value)) {
        addPrefixedClass(`has-text-${value}${viewportSuffix}`);
      }
    };

    addViewportSpecificTextAlignClass(textAlignMobile, '-mobile');
    addViewportSpecificTextAlignClass(textAlignTablet, '-tablet');
    addViewportSpecificTextAlignClass(textAlignDesktop, '-desktop');
    addViewportSpecificTextAlignClass(textAlignWidescreen, '-widescreen');
    addViewportSpecificTextAlignClass(textAlignFullhd, '-fullhd');

    return classNames(classes);
  }, [
    classPrefix,
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
  ]);
};
