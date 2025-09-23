import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Possible values for Bulma column size.
 */
export type BulmaColumnSize =
  | number
  | 'full'
  | 'half'
  | 'one-third'
  | 'two-thirds'
  | 'one-quarter'
  | 'three-quarters'
  | 'one-fifth'
  | 'two-fifths'
  | 'three-fifths'
  | 'four-fifths';

/**
 * Props for the Column component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier for the column.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 *
 * @property {BulmaColumnSize} [size] - Column size.
 * @property {BulmaColumnSize} [sizeMobile] - Mobile column size.
 * @property {BulmaColumnSize} [sizeTablet] - Tablet column size.
 * @property {BulmaColumnSize} [sizeDesktop] - Desktop column size.
 * @property {BulmaColumnSize} [sizeWidescreen] - Widescreen column size.
 * @property {BulmaColumnSize} [sizeFullhd] - FullHD column size.
 *
 * @property {BulmaColumnSize} [offset] - Column offset.
 * @property {BulmaColumnSize} [offsetMobile] - Mobile column offset.
 * @property {BulmaColumnSize} [offsetTablet] - Tablet column offset.
 * @property {BulmaColumnSize} [offsetDesktop] - Desktop column offset.
 * @property {BulmaColumnSize} [offsetWidescreen] - Widescreen column offset.
 * @property {BulmaColumnSize} [offsetFullhd] - FullHD column offset.
 *
 * @property {boolean} [isNarrow] - The column is narrow.
 * @property {boolean} [isNarrowMobile] - The column is narrow on mobile.
 * @property {boolean} [isNarrowTablet] - The column is narrow on tablet.
 * @property {boolean} [isNarrowTouch] - The column is narrow on touch devices.
 * @property {boolean} [isNarrowDesktop] - The column is narrow on desktop.
 * @property {boolean} [isNarrowWidescreen] - The column is narrow on widescreen.
 * @property {boolean} [isNarrowFullhd] - The column is narrow on fullhd.
 *
 * @property {React.ReactNode} [children] - Children to render inside the column.
 */
export interface ColumnProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';

  size?: BulmaColumnSize;
  sizeMobile?: BulmaColumnSize;
  sizeTablet?: BulmaColumnSize;
  sizeDesktop?: BulmaColumnSize;
  sizeWidescreen?: BulmaColumnSize;
  sizeFullhd?: BulmaColumnSize;

  offset?: BulmaColumnSize;
  offsetMobile?: BulmaColumnSize;
  offsetTablet?: BulmaColumnSize;
  offsetDesktop?: BulmaColumnSize;
  offsetWidescreen?: BulmaColumnSize;
  offsetFullhd?: BulmaColumnSize;

  isNarrow?: boolean;
  isNarrowMobile?: boolean;
  isNarrowTablet?: boolean;
  isNarrowTouch?: boolean;
  isNarrowDesktop?: boolean;
  isNarrowWidescreen?: boolean;
  isNarrowFullhd?: boolean;

  children?: React.ReactNode;
}

/**
 * Bulma Column component for responsive grid layouts.
 *
 * @function
 * @param {ColumnProps} props - Props for the Column component.
 * @returns {JSX.Element} The rendered column.
 * @see {@link https://bulma.io/documentation/columns/ | Bulma Columns documentation}
 */
export const Column: React.FC<ColumnProps> = ({
  className,
  textColor,
  color: _fieldColor,
  bgColor,
  size,
  sizeMobile,
  sizeTablet,
  sizeDesktop,
  sizeWidescreen,
  sizeFullhd,
  offset,
  offsetMobile,
  offsetTablet,
  offsetDesktop,
  offsetWidescreen,
  offsetFullhd,
  isNarrow,
  isNarrowMobile,
  isNarrowTablet,
  isNarrowTouch,
  isNarrowDesktop,
  isNarrowWidescreen,
  isNarrowFullhd,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('column');

  // Build column-specific classes with prefixes
  const columnSpecificClasses = usePrefixedClassNames('', {
    [`is-${size}`]: size !== undefined && size !== null,
    [`is-${sizeMobile}-mobile`]:
      sizeMobile !== undefined && sizeMobile !== null,
    [`is-${sizeTablet}-tablet`]:
      sizeTablet !== undefined && sizeTablet !== null,
    [`is-${sizeDesktop}-desktop`]:
      sizeDesktop !== undefined && sizeDesktop !== null,
    [`is-${sizeWidescreen}-widescreen`]:
      sizeWidescreen !== undefined && sizeWidescreen !== null,
    [`is-${sizeFullhd}-fullhd`]:
      sizeFullhd !== undefined && sizeFullhd !== null,
    [`is-offset-${offset}`]: offset !== undefined && offset !== null,
    [`is-offset-${offsetMobile}-mobile`]:
      offsetMobile !== undefined && offsetMobile !== null,
    [`is-offset-${offsetTablet}-tablet`]:
      offsetTablet !== undefined && offsetTablet !== null,
    [`is-offset-${offsetDesktop}-desktop`]:
      offsetDesktop !== undefined && offsetDesktop !== null,
    [`is-offset-${offsetWidescreen}-widescreen`]:
      offsetWidescreen !== undefined && offsetWidescreen !== null,
    [`is-offset-${offsetFullhd}-fullhd`]:
      offsetFullhd !== undefined && offsetFullhd !== null,
    'is-narrow': !!isNarrow,
    'is-narrow-mobile': !!isNarrowMobile,
    'is-narrow-tablet': !!isNarrowTablet,
    'is-narrow-touch': !!isNarrowTouch,
    'is-narrow-desktop': !!isNarrowDesktop,
    'is-narrow-widescreen': !!isNarrowWidescreen,
    'is-narrow-fullhd': !!isNarrowFullhd,
  });

  const columnClasses = classNames(
    mainClass,
    columnSpecificClasses,
    className,
    bulmaHelperClasses
  );

  return (
    <div className={columnClasses} {...rest}>
      {children}
    </div>
  );
};
