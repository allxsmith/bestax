import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import type { BulmaGapValue } from '../grid/Grid';

/**
 * Possible values for the Bulma columns gap size.
 * @deprecated Use {@link BulmaGapValue} instead — `gapSize*` and `gap*` share
 * the same 0-8 scale.
 */
export type BulmaGapSize = BulmaGapValue;

/**
 * Props for the Columns component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier for columns.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {boolean} [isCentered] - Center the columns container.
 * @property {boolean} [isGapless] - Remove all column gaps.
 * @property {boolean} [isMultiline] - Allow columns to wrap to multiple lines.
 * @property {boolean} [isVCentered] - Vertically center columns.
 * @property {boolean} [isMobile] - Only apply columns styles on mobile.
 * @property {boolean} [isDesktop] - Only apply columns styles on desktop.
 * @property {BulmaGapValue} [gap] - Gap size for all breakpoints. Wins over `gapSize` if both are set.
 * @property {BulmaGapValue} [gapMobile] - Gap size for mobile. Wins over `gapSizeMobile` if both are set.
 * @property {BulmaGapValue} [gapTablet] - Gap size for tablet. Wins over `gapSizeTablet` if both are set.
 * @property {BulmaGapValue} [gapDesktop] - Gap size for desktop. Wins over `gapSizeDesktop` if both are set.
 * @property {BulmaGapValue} [gapWidescreen] - Gap size for widescreen. Wins over `gapSizeWidescreen` if both are set.
 * @property {BulmaGapValue} [gapFullhd] - Gap size for fullhd. Wins over `gapSizeFullhd` if both are set.
 * @property {BulmaGapSize} [gapSize] - Gap size for all breakpoints. @deprecated Use `gap` instead.
 * @property {BulmaGapSize} [gapSizeMobile] - Gap size for mobile. @deprecated Use `gapMobile` instead.
 * @property {BulmaGapSize} [gapSizeTablet] - Gap size for tablet. @deprecated Use `gapTablet` instead.
 * @property {BulmaGapSize} [gapSizeDesktop] - Gap size for desktop. @deprecated Use `gapDesktop` instead.
 * @property {BulmaGapSize} [gapSizeWidescreen] - Gap size for widescreen. @deprecated Use `gapWidescreen` instead.
 * @property {BulmaGapSize} [gapSizeFullhd] - Gap size for fullhd. @deprecated Use `gapFullhd` instead.
 * @property {React.ReactNode} [children] - Columns to render within the container.
 */
export interface ColumnsProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  isCentered?: boolean;
  isGapless?: boolean;
  isMultiline?: boolean;
  isVCentered?: boolean;
  isMobile?: boolean;
  isDesktop?: boolean;

  gap?: BulmaGapValue;
  gapMobile?: BulmaGapValue;
  gapTablet?: BulmaGapValue;
  gapDesktop?: BulmaGapValue;
  gapWidescreen?: BulmaGapValue;
  gapFullhd?: BulmaGapValue;

  /** @deprecated Use `gap` instead — `gap` wins if both are set. */
  gapSize?: BulmaGapSize;
  /** @deprecated Use `gapMobile` instead — `gapMobile` wins if both are set. */
  gapSizeMobile?: BulmaGapSize;
  /** @deprecated Use `gapTablet` instead — `gapTablet` wins if both are set. */
  gapSizeTablet?: BulmaGapSize;
  /** @deprecated Use `gapDesktop` instead — `gapDesktop` wins if both are set. */
  gapSizeDesktop?: BulmaGapSize;
  /** @deprecated Use `gapWidescreen` instead — `gapWidescreen` wins if both are set. */
  gapSizeWidescreen?: BulmaGapSize;
  /** @deprecated Use `gapFullhd` instead — `gapFullhd` wins if both are set. */
  gapSizeFullhd?: BulmaGapSize;

  children?: React.ReactNode;
}

/**
 * Bulma Columns container for flexible, responsive layouts.
 *
 * @function
 * @param {ColumnsProps} props - Props for the Columns component.
 * @returns {JSX.Element} The rendered columns container.
 * @see {@link https://bulma.io/documentation/columns/ | Bulma Columns documentation}
 */
export const Columns: React.FC<ColumnsProps> = ({
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
