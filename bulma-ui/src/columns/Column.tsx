import React from 'react';
import classNames from '../helpers/classNames';
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
 * Builds Bulma column and offset class names for the Column component.
 */
function getColumnClassNames(props: ColumnProps): string[] {
  const classList: string[] = [];
  // Sizes
  const sizeProps = [
    { prop: 'size', prefix: 'is', suffix: '' },
    { prop: 'sizeMobile', prefix: 'is', suffix: 'mobile' },
    { prop: 'sizeTablet', prefix: 'is', suffix: 'tablet' },
    { prop: 'sizeDesktop', prefix: 'is', suffix: 'desktop' },
    { prop: 'sizeWidescreen', prefix: 'is', suffix: 'widescreen' },
    { prop: 'sizeFullhd', prefix: 'is', suffix: 'fullhd' },
  ];
  for (const { prop, prefix, suffix } of sizeProps) {
    const val = props[prop as keyof ColumnProps] as BulmaColumnSize | undefined;
    if (val !== undefined && val !== null) {
      let className = `${prefix}-${val}`;
      if (suffix) className += `-${suffix}`;
      classList.push(className);
    }
  }
  // Offsets
  const offsetProps = [
    { prop: 'offset', prefix: 'is-offset', suffix: '' },
    { prop: 'offsetMobile', prefix: 'is-offset', suffix: 'mobile' },
    { prop: 'offsetTablet', prefix: 'is-offset', suffix: 'tablet' },
    { prop: 'offsetDesktop', prefix: 'is-offset', suffix: 'desktop' },
    { prop: 'offsetWidescreen', prefix: 'is-offset', suffix: 'widescreen' },
    { prop: 'offsetFullhd', prefix: 'is-offset', suffix: 'fullhd' },
  ];
  for (const { prop, prefix, suffix } of offsetProps) {
    const val = props[prop as keyof ColumnProps] as BulmaColumnSize | undefined;
    if (val !== undefined && val !== null) {
      let className = `${prefix}-${val}`;
      if (suffix) className += `-${suffix}`;
      classList.push(className);
    }
  }
  // isNarrow (responsive)
  if (props.isNarrow) classList.push('is-narrow');
  if (props.isNarrowMobile) classList.push('is-narrow-mobile');
  if (props.isNarrowTablet) classList.push('is-narrow-tablet');
  if (props.isNarrowTouch) classList.push('is-narrow-touch');
  if (props.isNarrowDesktop) classList.push('is-narrow-desktop');
  if (props.isNarrowWidescreen) classList.push('is-narrow-widescreen');
  if (props.isNarrowFullhd) classList.push('is-narrow-fullhd');

  return classList;
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

  const columnClasses = classNames(
    'column',
    ...getColumnClassNames({
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
    }),
    className,
    bulmaHelperClasses
  );

  return (
    <div className={columnClasses} {...rest}>
      {children}
    </div>
  );
};
