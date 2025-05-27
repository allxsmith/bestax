import { useMemo } from 'react';
import classNames from 'classnames';

// Constants (unchanged)
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
] as const;
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
export const validSizes = ['0', '1', '2', '3', '4', '5', '6', 'auto'] as const;
export const validTextSizes = ['1', '2', '3', '4', '5', '6', '7'] as const;
export const validAlignments = [
  'centered',
  'justified',
  'left',
  'right',
] as const;
export const validTextTransforms = [
  'capitalized',
  'lowercase',
  'uppercase',
  'italic',
] as const;
export const validTextWeights = [
  'light',
  'normal',
  'medium',
  'semibold',
  'bold',
] as const;
export const validFontFamilies = [
  'sans-serif',
  'monospace',
  'primary',
  'secondary',
  'code',
] as const;
export const validDisplays = [
  'block',
  'flex',
  'inline',
  'inline-block',
  'inline-flex',
] as const;
export const validVisibilities = ['hidden', 'sr-only'] as const;
export const validFlexDirections = [
  'row',
  'row-reverse',
  'column',
  'column-reverse',
] as const;
export const validFlexWraps = ['nowrap', 'wrap', 'wrap-reverse'] as const;
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
export const validAlignContents = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
  'stretch',
] as const;
export const validAlignItems = [
  'stretch',
  'flex-start',
  'flex-end',
  'center',
  'baseline',
  'start',
  'end',
] as const;
export const validAlignSelfs = [
  'auto',
  'flex-start',
  'flex-end',
  'center',
  'baseline',
  'stretch',
] as const;
export const validFlexGrowShrink = ['0', '1'] as const;
export const validViewports = [
  'mobile',
  'tablet',
  'desktop',
  'widescreen',
  'fullhd',
] as const;

// Interface for Bulma-specific props with renamed margin and padding props
export interface BulmaClassesProps {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  backgroundColor?: (typeof validColors)[number] | 'inherit' | 'current';
  colorShade?: (typeof validColorShades)[number];
  m?: (typeof validSizes)[number];
  mt?: (typeof validSizes)[number];
  mr?: (typeof validSizes)[number];
  mb?: (typeof validSizes)[number];
  ml?: (typeof validSizes)[number];
  mx?: (typeof validSizes)[number];
  my?: (typeof validSizes)[number];
  p?: (typeof validSizes)[number];
  pt?: (typeof validSizes)[number];
  pr?: (typeof validSizes)[number];
  pb?: (typeof validSizes)[number];
  pl?: (typeof validSizes)[number];
  px?: (typeof validSizes)[number];
  py?: (typeof validSizes)[number];
  textSize?: (typeof validTextSizes)[number];
  textAlign?: (typeof validAlignments)[number];
  textTransform?: (typeof validTextTransforms)[number];
  textWeight?: (typeof validTextWeights)[number];
  fontFamily?: (typeof validFontFamilies)[number];
  display?: (typeof validDisplays)[number];
  visibility?: (typeof validVisibilities)[number];
  flexDirection?: (typeof validFlexDirections)[number];
  flexWrap?: (typeof validFlexWraps)[number];
  justifyContent?: (typeof validJustifyContents)[number];
  alignContent?: (typeof validAlignContents)[number];
  alignItems?: (typeof validAlignItems)[number];
  alignSelf?: (typeof validAlignSelfs)[number];
  flexGrow?: (typeof validFlexGrowShrink)[number];
  flexShrink?: (typeof validFlexGrowShrink)[number];
  float?: 'left' | 'right';
  overflow?: 'clipped';
  overlay?: boolean;
  interaction?: 'unselectable' | 'clickable';
  radius?: 'radiusless';
  shadow?: 'shadowless';
  responsive?: 'mobile' | 'narrow';
  viewport?: (typeof validViewports)[number];
}

// Hook that returns both classes (as bulmaHelperClasses) and unhandled props (rest)
export const useBulmaClasses = <T extends Record<string, unknown>>(
  props: BulmaClassesProps & T
): { bulmaHelperClasses: string; rest: Omit<T, keyof BulmaClassesProps> } => {
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
    ...rest
  } = props;

  const bulmaHelperClasses = useMemo(() => {
    const classes: string[] = [];

    // Helper to add class with optional viewport
    const addClass = (
      prefix: string,
      value: string | undefined,
      validValues: readonly string[] = []
    ) => {
      if (value && (!validValues.length || validValues.includes(value))) {
        const className =
          viewport && validViewports.includes(viewport)
            ? `${prefix}-${value}-${viewport}`
            : `${prefix}-${value}`;
        classes.push(className);
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
        classes.push(className);
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

    // Visibility
    addClass('is', display, validDisplays);
    if (visibility) {
      if (
        visibility === 'hidden' &&
        viewport &&
        validViewports.includes(viewport)
      ) {
        classes.push(`is-hidden-${viewport}`);
      } else if (validVisibilities.includes(visibility)) {
        classes.push(`is-${visibility}`);
      }
    }

    // Flexbox
    if (display === 'flex' || display === 'inline-flex') {
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
      classes.push('is-overlay');
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

    return classNames(classes);
  }, [
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
  ]);

  return { bulmaHelperClasses, rest };
};
