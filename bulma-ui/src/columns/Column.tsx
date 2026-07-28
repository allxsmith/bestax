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
 */
export interface ColumnProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes for the column. */
  className?: string;
  /** Text color (Bulma color, 'inherit', or 'current'). */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the column. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color (Bulma color, 'inherit', or 'current'). */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';

  /** Column size (see Bulma docs). */
  size?: BulmaColumnSize;
  /** Size for mobile breakpoint. */
  sizeMobile?: BulmaColumnSize;
  /** Size for tablet breakpoint. */
  sizeTablet?: BulmaColumnSize;
  /** Size for desktop breakpoint. */
  sizeDesktop?: BulmaColumnSize;
  /** Size for widescreen breakpoint. */
  sizeWidescreen?: BulmaColumnSize;
  /** Size for fullhd breakpoint. */
  sizeFullhd?: BulmaColumnSize;

  /** Offset for column. */
  offset?: BulmaColumnSize;
  /** Mobile column offset. */
  offsetMobile?: BulmaColumnSize;
  /** Tablet column offset. */
  offsetTablet?: BulmaColumnSize;
  /** Desktop column offset. */
  offsetDesktop?: BulmaColumnSize;
  /** Widescreen column offset. */
  offsetWidescreen?: BulmaColumnSize;
  /** FullHD column offset. */
  offsetFullhd?: BulmaColumnSize;

  /** Column is only as wide as its content. */
  isNarrow?: boolean;
  /** The column is narrow on mobile. */
  isNarrowMobile?: boolean;
  /** The column is narrow on tablet. */
  isNarrowTablet?: boolean;
  /** The column is narrow on touch devices. */
  isNarrowTouch?: boolean;
  /** The column is narrow on desktop. */
  isNarrowDesktop?: boolean;
  /** The column is narrow on widescreen. */
  isNarrowWidescreen?: boolean;
  /** The column is narrow on fullhd. */
  isNarrowFullhd?: boolean;

  /** Children to render inside the column. */
  children?: React.ReactNode;
}

/**
 * The `Column` component provides a single responsive layout column using Bulma's flexbox-based column system.
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
