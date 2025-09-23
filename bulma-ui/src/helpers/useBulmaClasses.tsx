import { useMemo } from 'react';
import { classNames } from '../helpers/classNames';
import { useConfig } from './Config';

/**
 * Valid Bulma color classes.
 * @example 'primary', 'link', 'info'
 */
export const validColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'black-bis',
  'black-ter',
  'grey-darker',
  'grey-dark',
  'grey',
  'grey-light',
  'grey-lighter',
  'white',
  'light',
  'dark',
] as const;

/**
 * Valid Bulma color shade suffixes.
<<<<<<< HEAD
 * @example '00', '05', 'invert', 'light', 'dark'
=======
 * @example '00', '05', 'invert', 'light', 'dark', 'soft', 'bold', 'on-scheme'
>>>>>>> af5b1f7 (fix(bulma-ui): resolve flex item properties and Card compound component issues (#55))
 */
export const validColorShades = [
  '00',
  '05',
  '10',
  '15',
  '20',
  '25',
  '30',
  '35',
  '40',
  '45',
  '50',
  '55',
  '60',
  '65',
  '70',
  '75',
  '80',
  '85',
  '90',
  '95',
  'invert',
  'light',
  'dark',
  'soft',
  'bold',
  'on-scheme',
] as const;

/**
 * Valid Bulma size classes for margins and paddings.
 * @example '0', '1', 'auto'
 */
export const validSizes = ['0', '1', '2', '3', '4', '5', '6', 'auto'] as const;

/**
 * Valid Bulma text size classes.
 * @example '1', '2', '3'
 */
export const validTextSizes = ['1', '2', '3', '4', '5', '6', '7'] as const;

/**
 * Valid Bulma text alignment classes.
 * @example 'centered', 'left', 'right'
 */
export const validAlignments = [
  'centered',
  'justified',
  'left',
  'right',
] as const;

/**
 * Valid Bulma text transformation classes.
 * @example 'capitalized', 'uppercase', 'italic'
 */
export const validTextTransforms = [
  'capitalized',
  'lowercase',
  'uppercase',
  'italic',
] as const;

/**
 * Valid Bulma text weight classes.
 * @example 'light', 'normal', 'bold'
 */
export const validTextWeights = [
  'light',
  'normal',
  'medium',
  'semibold',
  'bold',
] as const;

/**
 * Valid Bulma font family classes.
 * @example 'sans-serif', 'monospace', 'code'
 */
export const validFontFamilies = [
  'sans-serif',
  'monospace',
  'primary',
  'secondary',
  'code',
] as const;

/**
 * Valid Bulma display classes.
 * @example 'block', 'flex', 'inline'
 */
export const validDisplays = [
  'block',
  'flex',
  'inline',
  'inline-block',
  'inline-flex',
] as const;

/**
 * Valid Bulma visibility classes.
<<<<<<< HEAD
=======
 * These are all the valid visibility options available in Bulma.
>>>>>>> af5b1f7 (fix(bulma-ui): resolve flex item properties and Card compound component issues (#55))
 * @example 'hidden', 'sr-only', 'invisible'
 */
export const validVisibilities = ['hidden', 'sr-only', 'invisible'] as const;

/**
 * Valid Bulma flex direction classes.
 * @example 'row', 'column', 'row-reverse'
 */
export const validFlexDirections = [
  'row',
  'row-reverse',
  'column',
  'column-reverse',
] as const;

/**
 * Valid Bulma flex wrap classes.
 * @example 'nowrap', 'wrap', 'wrap-reverse'
 */
export const validFlexWraps = ['nowrap', 'wrap', 'wrap-reverse'] as const;

/**
 * Valid Bulma justify-content classes.
 * @example 'flex-start', 'center', 'space-between'
 */
export const validJustifyContents = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
  'start',
  'end',
  'left',
  'right',
] as const;

/**
 * Valid Bulma align-content classes.
 * @example 'flex-start', 'center', 'stretch'
 */
export const validAlignContents = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
  'stretch',
] as const;

/**
 * Valid Bulma align-items classes.
 * @example 'stretch', 'flex-start', 'center'
 */
export const validAlignItems = [
  'stretch',
  'flex-start',
  'flex-end',
  'center',
  'baseline',
  'start',
  'end',
] as const;

/**
 * Valid Bulma align-self classes.
 * @example 'auto', 'flex-start', 'center'
 */
export const validAlignSelfs = [
  'auto',
  'flex-start',
  'flex-end',
  'center',
  'baseline',
  'stretch',
] as const;

/**
 * Valid Bulma flex grow and shrink values.
 * @example '0', '1', '2', '3', '4', '5'
 */
export const validFlexGrowShrink = ['0', '1', '2', '3', '4', '5'] as const;

/**
 * Valid Bulma viewport classes for responsive design.
 * @example 'mobile', 'tablet', 'desktop'
 */
export const validViewports = [
  'mobile',
  'tablet',
  'desktop',
  'widescreen',
  'fullhd',
] as const;

/**
 * Props for applying Bulma helper classes to components.
 */
export interface BulmaClassesProps {
  /** Text color class (e.g., 'primary', 'info'). */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color class (e.g., 'primary', 'info'). */
  backgroundColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color shade suffix (e.g., '00', 'invert'). */
  colorShade?: (typeof validColorShades)[number];
  /** Background color shade suffix (e.g., '00', 'invert'). */
  backgroundColorShade?: (typeof validColorShades)[number];
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
  /** Display type (e.g., 'block', 'flex'). */
  display?: (typeof validDisplays)[number] | 'none';
  /** Visibility (e.g., 'hidden', 'sr-only'). */
  visibility?: (typeof validVisibilities)[number];
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
  /** Float direction (e.g., 'left', 'right'). */
  float?: 'left' | 'right';
  /** Overflow behavior (e.g., 'clipped'). */
  overflow?: 'clipped';
  /** Applies overlay styling if true. */
  overlay?: boolean;
  /** Interaction behavior (e.g., 'unselectable', 'clickable'). */
  interaction?: 'unselectable' | 'clickable';
  /** Border radius style (e.g., 'radiusless'). */
  radius?: 'radiusless';
  /** Shadow style (e.g., 'shadowless'). */
  shadow?: 'shadowless';
  /** Responsive behavior (e.g., 'mobile', 'narrow'). */
  responsive?: 'mobile' | 'narrow';
  /** Viewport for responsive classes (e.g., 'mobile', 'desktop'). */
  viewport?: (typeof validViewports)[number];
  /** Display type for mobile viewport (up to 768px). */
  displayMobile?: (typeof validDisplays)[number] | 'none';
  /** Display type for tablet viewport (769px - 1023px). */
  displayTablet?: (typeof validDisplays)[number] | 'none';
  /** Display type for desktop viewport (1024px - 1215px). */
  displayDesktop?: (typeof validDisplays)[number] | 'none';
  /** Display type for widescreen viewport (1216px - 1407px). */
  displayWidescreen?: (typeof validDisplays)[number] | 'none';
  /** Display type for fullhd viewport (1408px and above). */
  displayFullhd?: (typeof validDisplays)[number] | 'none';
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
  /** Visibility for mobile viewport (up to 768px). */
  visibilityMobile?: (typeof validVisibilities)[number];
  /** Visibility for tablet viewport (769px - 1023px). */
  visibilityTablet?: (typeof validVisibilities)[number];
  /** Visibility for desktop viewport (1024px - 1215px). */
  visibilityDesktop?: (typeof validVisibilities)[number];
  /** Visibility for widescreen viewport (1216px - 1407px). */
  visibilityWidescreen?: (typeof validVisibilities)[number];
  /** Visibility for fullhd viewport (1408px and above). */
  visibilityFullhd?: (typeof validVisibilities)[number];
  /** Add Bulma skeleton class if true. */
  skeleton?: boolean;
  /** Applies clearfix to fix floating children if true. */
  clearfix?: boolean;
  /** Applies position: relative if true. */
  relative?: boolean;
}

/**
 * A hook that generates Bulma helper classes from props and separates unhandled props.
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
  const { classPrefix } = useConfig();

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
    ...rest
  } = props;

  const bulmaHelperClasses = useMemo(() => {
    const classes: string[] = [];

    // Helper function to add class with prefix support
    const addPrefixedClass = (className: string) => {
      classes.push(classPrefix ? `${classPrefix}${className}` : className);
    };

    // Helper to add class with optional viewport
    const addClass = (
      prefix: string,
      value: string | undefined,
      validValues: readonly string[],
      supportsViewport = false
    ) => {
      if (value && validValues.includes(value)) {
        const className =
          supportsViewport && viewport && validViewports.includes(viewport)
            ? `${prefix}-${value}-${viewport}`
            : `${prefix}-${value}`;
        addPrefixedClass(className);
      }
    };

    // Helper specifically for classes that never support viewport modifiers
    const addClassNoViewport = (
      prefix: string,
      value: string | undefined,
      validValues: readonly string[]
    ) => {
      if (value && (!validValues.length || validValues.includes(value))) {
        addPrefixedClass(`${prefix}-${value}`);
      }
    };

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

    // Viewport-specific visibility
    const addViewportSpecificVisibilityClass = (
      value: string | undefined,
      viewportSuffix: string
    ) => {
      if (value === 'hidden') {
        addPrefixedClass(`is-hidden${viewportSuffix}`);
      } else if (value === 'sr-only') {
        addPrefixedClass(`is-sr-only${viewportSuffix}`);
      } else if (value === 'invisible') {
        addPrefixedClass(`is-invisible${viewportSuffix}`);
      }
    };

    addViewportSpecificVisibilityClass(visibilityMobile, '-mobile');
    addViewportSpecificVisibilityClass(visibilityTablet, '-tablet');
    addViewportSpecificVisibilityClass(visibilityDesktop, '-desktop');
    addViewportSpecificVisibilityClass(visibilityWidescreen, '-widescreen');
    addViewportSpecificVisibilityClass(visibilityFullhd, '-fullhd');

    // Visibility and Display
    // Handle viewport-specific display properties first (they take precedence)
    const addDisplayClass = (
      displayValue: string | undefined,
      viewportSuffix: string
    ) => {
      if (displayValue) {
        if (displayValue === 'none') {
          addPrefixedClass(`is-hidden${viewportSuffix}`);
        } else if (
          (validDisplays as readonly string[]).includes(displayValue)
        ) {
          addPrefixedClass(`is-${displayValue}${viewportSuffix}`);
        }
      }
    };

    // Apply viewport-specific display classes
    addDisplayClass(displayMobile, '-mobile');
    addDisplayClass(displayTablet, '-tablet');
    addDisplayClass(displayDesktop, '-desktop');
    addDisplayClass(displayWidescreen, '-widescreen');
    addDisplayClass(displayFullhd, '-fullhd');

    // Apply legacy display/viewport combination if no viewport-specific display props are set
    const hasViewportSpecificDisplay = !!(
      displayMobile ||
      displayTablet ||
      displayDesktop ||
      displayWidescreen ||
      displayFullhd
    );

    if (!hasViewportSpecificDisplay) {
      // Legacy display handling
      if (display === 'none') {
        if (viewport && validViewports.includes(viewport)) {
          addPrefixedClass(`is-hidden-${viewport}`);
        } else {
          addPrefixedClass('is-hidden');
        }
      } else {
        addClass('is', display, [...validDisplays], true); // display supports viewport
      }
    }

    // Visibility (always applied regardless of display settings)
    if (visibility) {
      if (
        (visibility === 'hidden' || visibility === 'invisible') &&
        viewport &&
        validViewports.includes(viewport)
      ) {
        addPrefixedClass(`is-${visibility}-${viewport}`);
      } else if (validVisibilities.includes(visibility)) {
        addPrefixedClass(`is-${visibility}`);
      }
    }

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

    return classNames(classes);
  }, [
    classPrefix,
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
    radius,
    shadow,
    responsive,
    viewport,
    displayMobile,
    displayTablet,
    displayDesktop,
    displayWidescreen,
    displayFullhd,
    skeleton,
    clearfix,
    relative,
    // Viewport-specific properties
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
  ]);

  return { bulmaHelperClasses, rest };
};
