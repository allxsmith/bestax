import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Possible values for the Bulma columns gap size.
 */
export type BulmaGapSize =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8';

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
 * @property {BulmaGapSize} [gapSize] - Gap size for all breakpoints.
 * @property {BulmaGapSize} [gapSizeMobile] - Gap size for mobile.
 * @property {BulmaGapSize} [gapSizeTablet] - Gap size for tablet.
 * @property {BulmaGapSize} [gapSizeDesktop] - Gap size for desktop.
 * @property {BulmaGapSize} [gapSizeWidescreen] - Gap size for widescreen.
 * @property {BulmaGapSize} [gapSizeFullhd] - Gap size for fullhd.
 * @property {React.ReactNode} [children] - Columns to render within the container.
 */
export interface ColumnsProps
  extends React.HTMLAttributes<HTMLDivElement>,
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

  gapSize?: BulmaGapSize;
  gapSizeMobile?: BulmaGapSize;
  gapSizeTablet?: BulmaGapSize;
  gapSizeDesktop?: BulmaGapSize;
  gapSizeWidescreen?: BulmaGapSize;
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
  gapSize,
  gapSizeMobile,
  gapSizeTablet,
  gapSizeDesktop,
  gapSizeWidescreen,
  gapSizeFullhd,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('columns');

  // Build gap classes with prefixes
  const gapClasses = usePrefixedClassNames('', {
    [`is-${gapSize}`]: gapSize !== undefined && gapSize !== null,
    [`is-${gapSizeMobile}-mobile`]:
      gapSizeMobile !== undefined && gapSizeMobile !== null,
    [`is-${gapSizeTablet}-tablet`]:
      gapSizeTablet !== undefined && gapSizeTablet !== null,
    [`is-${gapSizeDesktop}-desktop`]:
      gapSizeDesktop !== undefined && gapSizeDesktop !== null,
    [`is-${gapSizeWidescreen}-widescreen`]:
      gapSizeWidescreen !== undefined && gapSizeWidescreen !== null,
    [`is-${gapSizeFullhd}-fullhd`]:
      gapSizeFullhd !== undefined && gapSizeFullhd !== null,
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
