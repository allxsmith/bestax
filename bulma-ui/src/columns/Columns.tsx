import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import type { BulmaGapValue } from '../grid/Grid';
import { Column } from './Column';

/**
 * Possible values for the Bulma columns gap size.
 * @deprecated Use {@link BulmaGapValue} instead — `gapSize*` and `gap*` share
 * the same 0-8 scale.
 */
export type BulmaGapSize = BulmaGapValue;

/**
 * Props for the Columns component.
 */
export interface ColumnsProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes for the columns container. */
  className?: string;
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for all columns. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color for all columns. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Horizontally center columns within the container. */
  isCentered?: boolean;
  /** Remove gap between columns. */
  isGapless?: boolean;
  /** Allow columns to wrap to multiple lines. */
  isMultiline?: boolean;
  /** Vertically center columns within the container. */
  isVCentered?: boolean;
  /** Apply columns layout on mobile and up. */
  isMobile?: boolean;
  /** Apply columns layout on desktop and up. */
  isDesktop?: boolean;

  /** Gap size for all breakpoints. Same scale as `Grid`'s `gap` prop; wins over `gapSize` if both are set. */
  gap?: BulmaGapValue;
  /** Gap size for mobile. Wins over `gapSizeMobile` if both are set. */
  gapMobile?: BulmaGapValue;
  /** Gap size for tablet. Wins over `gapSizeTablet` if both are set. */
  gapTablet?: BulmaGapValue;
  /** Gap size for desktop. Wins over `gapSizeDesktop` if both are set. */
  gapDesktop?: BulmaGapValue;
  /** Gap size for widescreen. Wins over `gapSizeWidescreen` if both are set. */
  gapWidescreen?: BulmaGapValue;
  /** Gap size for fullhd. Wins over `gapSizeFullhd` if both are set. */
  gapFullhd?: BulmaGapValue;

  /** @deprecated Use `gap` instead — `gap` wins if both are set. */
  /** Gap size for all breakpoints. @deprecated Use `gap` instead. */
  gapSize?: BulmaGapSize;
  /** @deprecated Use `gapMobile` instead — `gapMobile` wins if both are set. */
  /** Gap size for mobile. @deprecated Use `gapMobile` instead. */
  gapSizeMobile?: BulmaGapSize;
  /** @deprecated Use `gapTablet` instead — `gapTablet` wins if both are set. */
  /** Gap size for tablet. @deprecated Use `gapTablet` instead. */
  gapSizeTablet?: BulmaGapSize;
  /** @deprecated Use `gapDesktop` instead — `gapDesktop` wins if both are set. */
  /** Gap size for desktop. @deprecated Use `gapDesktop` instead. */
  gapSizeDesktop?: BulmaGapSize;
  /** @deprecated Use `gapWidescreen` instead — `gapWidescreen` wins if both are set. */
  /** Gap size for widescreen. @deprecated Use `gapWidescreen` instead. */
  gapSizeWidescreen?: BulmaGapSize;
  /** @deprecated Use `gapFullhd` instead — `gapFullhd` wins if both are set. */
  /** Gap size for fullhd. @deprecated Use `gapFullhd` instead. */
  gapSizeFullhd?: BulmaGapSize;

  /** Columns to render within the container. */
  children?: React.ReactNode;
}

/**
 * The `Columns` component provides Bulma's flexible, responsive grid container for aligning and distributing [`Column`](./column.md) components.
 *
 * @function
 * @param {ColumnsProps} props - Props for the Columns component.
 * @returns {JSX.Element} The rendered columns container.
 * @see {@link https://bulma.io/documentation/columns/ | Bulma Columns documentation}
 */
const ColumnsComponent: React.FC<ColumnsProps> = ({
  className,
  textColor,
  color: _fieldColor,
  bgColor,
  isCentered,
  isGapless,
  isMultiline,
  isVCentered,
  isMobile,
  isDesktop,
  gap,
  gapMobile,
  gapTablet,
  gapDesktop,
  gapWidescreen,
  gapFullhd,
  gapSize,
  gapSizeMobile,
  gapSizeTablet,
  gapSizeDesktop,
  gapSizeWidescreen,
  gapSizeFullhd,
  children,
  ...props
}) => {
  const resolvedGap = gap ?? gapSize;
  const resolvedGapMobile = gapMobile ?? gapSizeMobile;
  const resolvedGapTablet = gapTablet ?? gapSizeTablet;
  const resolvedGapDesktop = gapDesktop ?? gapSizeDesktop;
  const resolvedGapWidescreen = gapWidescreen ?? gapSizeWidescreen;
  const resolvedGapFullhd = gapFullhd ?? gapSizeFullhd;

  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('columns');

  // Build gap classes with prefixes
  const gapClasses = usePrefixedClassNames('', {
    [`is-${resolvedGap}`]: resolvedGap !== undefined && resolvedGap !== null,
    [`is-${resolvedGapMobile}-mobile`]:
      resolvedGapMobile !== undefined && resolvedGapMobile !== null,
    [`is-${resolvedGapTablet}-tablet`]:
      resolvedGapTablet !== undefined && resolvedGapTablet !== null,
    [`is-${resolvedGapDesktop}-desktop`]:
      resolvedGapDesktop !== undefined && resolvedGapDesktop !== null,
    [`is-${resolvedGapWidescreen}-widescreen`]:
      resolvedGapWidescreen !== undefined && resolvedGapWidescreen !== null,
    [`is-${resolvedGapFullhd}-fullhd`]:
      resolvedGapFullhd !== undefined && resolvedGapFullhd !== null,
    'is-centered': !!isCentered,
    'is-gapless': !!isGapless,
    'is-multiline': !!isMultiline,
    'is-vcentered': !!isVCentered,
    'is-mobile': !!isMobile,
    'is-desktop': !!isDesktop,
  });

  const columnsClasses = classNames(
    mainClass,
    gapClasses,
    className,
    bulmaHelperClasses
  );

  return (
    <div className={columnsClasses} {...rest}>
      {children}
    </div>
  );
};

export const Columns = withSubComponents(
  ColumnsComponent,
  { Column },
  'Columns'
);
