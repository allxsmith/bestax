import { useMemo } from 'react';
import { classNames } from './classNames';
import { useConfig } from './Config';
import {
  createBulmaClassHelpers,
  validGaps,
  validSizes,
  type BulmaGapStep,
} from './bulmaClassHelpers';

/**
 * Props for applying Bulma margin, padding and gap helper classes.
 */
export interface BulmaSpacingProps {
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
  /**
   * Space between the children of a flex or grid container (`is-gap-<value>`),
   * on Bulma's gap scale: each whole step is 0.5rem, so `gap="2"` is 1rem, with
   * half steps such as `"1.5"` between them. Also takes the step as a number.
   *
   * It sets the CSS `gap`, which does nothing unless the element lays its
   * children out as flex or grid, so pair it with `display="flex"` on most
   * components. The scale is not the margin scale: `m="2"` is 0.5rem.
   *
   * `Grid` and `Columns` declare their own `gap`. `Grid`'s renders the same
   * class; `Columns`' is the columns gutter (`is-<value>`) and takes whole
   * steps only.
   */
  gap?: BulmaGapStep;
  /**
   * Space between columns only (`is-column-gap-<value>`), on the same scale as
   * `gap`. Beside `gap` or `gapless`, it wins on its own axis.
   */
  columnGap?: BulmaGapStep;
  /**
   * Space between rows only (`is-row-gap-<value>`), on the same scale as
   * `gap`. Beside `gap` or `gapless`, it wins on its own axis.
   */
  rowGap?: BulmaGapStep;
  /**
   * Removes the gap between children (`is-gapless`), the shortcut for
   * `gap="0"`; a valid `gap` wins when both are set. `Columns` is the
   * exception: its `gap` is its gutter, and there `gapless` is Bulma's gapless
   * columns modifier, the same as `isGapless`.
   */
  gapless?: boolean;
}

/**
 * A gap step as the class reads it. Numbers are accepted for the steps, so
 * `2` and `'2'` both become `'2'`; anything else is checked against
 * `validGaps` by the caller.
 */
const gapValue = (value: BulmaGapStep | undefined): string | undefined =>
  typeof value === 'number' ? String(value) : value;

/**
 * A hook that generates Bulma margin, padding and gap helper classes.
 *
 * @function useSpacingClasses
 * @param props - Spacing-related Bulma helper props.
 * @returns A space-separated string of spacing helper classes.
 * @example
 * const spacingClasses = useSpacingClasses({ m: '2', px: '4' });
 * // spacingClasses: 'm-2 px-4'
 */
export const useSpacingClasses = (props: BulmaSpacingProps): string => {
  const { classPrefix } = useConfig();

  const {
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
    gap,
    columnGap,
    rowGap,
    gapless,
  } = props;

  return useMemo(() => {
    const { classes, addClassNoViewport, addPrefixedClass } =
      createBulmaClassHelpers(classPrefix);

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

    // Gap (no viewport support in Bulma). `gapless` and `is-gap-*` both set
    // the `gap` shorthand at one class of specificity, so beside each other
    // the stylesheet's rule order would decide. A valid `gap` settles it on
    // its own. The axis props need no such care: Bulma declares every
    // `is-column-gap-*` and `is-row-gap-*` after the shorthands, so each wins
    // its own axis over `gap` and `gapless` alike.
    const gapStep = gapValue(gap);
    const hasGap = validGaps.some(v => v === gapStep);
    addClassNoViewport('is-gap', gapStep, validGaps);
    if (gapless && !hasGap) {
      addPrefixedClass('is-gapless');
    }
    addClassNoViewport('is-column-gap', gapValue(columnGap), validGaps);
    addClassNoViewport('is-row-gap', gapValue(rowGap), validGaps);

    return classNames(classes);
  }, [
    classPrefix,
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
    gap,
    columnGap,
    rowGap,
    gapless,
  ]);
};
