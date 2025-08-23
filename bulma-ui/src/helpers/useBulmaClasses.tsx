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
 * @example '00', '05', 'invert'
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
 * @example 'hidden', 'sr-only'
 */
export const validVisibilities = ['hidden', 'sr-only'] as const;

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
  /** Color shade suffix (e.g., '00', 'invert'). */
  colorShade?: (typeof validColorShades)[number];
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
  /** Add Bulma skeleton class if true. */
  skeleton?: boolean;
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
      validValues: readonly string[]
    ) => {
      if (value && (!validValues.length || validValues.includes(value))) {
        const className =
          viewport && validViewports.includes(viewport)
            ? `${prefix}-${value}-${viewport}`
            : `${prefix}-${value}`;
        addPrefixedClass(className);
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
        const className =
          prefix === 'has-text' && viewport && validViewports.includes(viewport)
            ? `${prefix}-${value}-${shade}-${viewport}`
            : `${prefix}-${value}-${shade}`;
        addPrefixedClass(className);
      } else {
        addClass(prefix, value, [...validColors, 'inherit', 'current']);
      }
    };

    // Color
    addColorClass('has-text', color, colorShade);
    addColorClass('has-background', backgroundColor, colorShade);

    // Spacing
    addClass('m', m, validSizes);
    addClass('mt', mt, validSizes);
    addClass('mr', mr, validSizes);
    addClass('mb', mb, validSizes);
    addClass('ml', ml, validSizes);
    addClass('mx', mx, validSizes);
    addClass('my', my, validSizes);
    addClass('p', p, validSizes);
    addClass('pt', pt, validSizes);
    addClass('pr', pr, validSizes);
    addClass('pb', pb, validSizes);
    addClass('pl', pl, validSizes);
    addClass('px', px, validSizes);
    addClass('py', py, validSizes);

    // Typography
    addClass('is-size', textSize, validTextSizes);
    addClass('has-text', textAlign, validAlignments);
    addClass('is', textTransform, validTextTransforms);
    addClass('has-text-weight', textWeight, validTextWeights);
    addClass('is-family', fontFamily, validFontFamilies);

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
        addClass('is', display, [...validDisplays]);
      }
    }

    // Visibility (always applied regardless of display settings)
    if (visibility) {
      if (
        visibility === 'hidden' &&
        viewport &&
        validViewports.includes(viewport)
      ) {
        addPrefixedClass(`is-hidden-${viewport}`);
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
      addClass('is-flex-direction', flexDirection, validFlexDirections);
      addClass('is-flex-wrap', flexWrap, validFlexWraps);
      addClass('is-justify-content', justifyContent, validJustifyContents);
      addClass('is-align-content', alignContent, validAlignContents);
      addClass('is-align-items', alignItems, validAlignItems);
      addClass('is-align-self', alignSelf, validAlignSelfs);
      addClass('is-flex-grow', flexGrow, validFlexGrowShrink);
      addClass('is-flex-shrink', flexShrink, validFlexGrowShrink);
    }

    // Other Helpers
    if (float) {
      addClass('is-pulled', float, ['left', 'right']);
    }
    if (overflow) {
      addClass('is', overflow, ['clipped']);
    }
    if (overlay) {
      addPrefixedClass('is-overlay');
    }
    if (interaction) {
      addClass('is', interaction, ['unselectable', 'clickable']);
    }
    if (radius) {
      addClass('is', radius, ['radiusless']);
    }
    if (shadow) {
      addClass('is', shadow, ['shadowless']);
    }
    if (responsive) {
      addClass('is', responsive, ['mobile', 'narrow']);
    }

    // Bulma Skeleton Helper
    if (skeleton) {
      addPrefixedClass('is-skeleton');
    }

    return classNames(classes);
  }, [
    classPrefix,
    color,
    backgroundColor,
    colorShade,
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
  ]);

  return { bulmaHelperClasses, rest };
};
