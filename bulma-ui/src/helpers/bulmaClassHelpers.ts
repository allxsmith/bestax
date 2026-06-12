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
 * @example '00', '05', 'invert', 'light', 'dark', 'soft', 'bold', 'on-scheme'
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
 * These are all the valid visibility options available in Bulma.
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
 * Props for applying a Bulma viewport modifier to viewport-aware helper classes.
 */
export interface BulmaViewportProps {
  /** Viewport for responsive classes (e.g., 'mobile', 'desktop'). */
  viewport?: (typeof validViewports)[number];
}

/**
 * Props for applying Bulma display helper classes, including viewport-specific
 * display variants.
 */
export interface BulmaDisplayProps {
  /** Display type (e.g., 'block', 'flex'). */
  display?: (typeof validDisplays)[number] | 'none';
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
}

/**
 * Creates the shared class-building helpers used by the Bulma helper hooks.
 *
 * Returns a mutable `classes` array along with the helper functions that push
 * (optionally prefixed, optionally viewport-suffixed) class names onto it.
 *
 * @internal
 * @param classPrefix - Optional prefix applied to all generated class names.
 * @param viewport - Optional viewport modifier for viewport-aware classes.
 */
export const createBulmaClassHelpers = (
  classPrefix?: string,
  viewport?: (typeof validViewports)[number]
) => {
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

  return { classes, addPrefixedClass, addClass, addClassNoViewport };
};
