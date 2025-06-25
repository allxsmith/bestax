import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

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

export interface ColumnProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';

  // Generic and responsive sizes
  size?: BulmaColumnSize;
  sizeMobile?: BulmaColumnSize;
  sizeTablet?: BulmaColumnSize;
  sizeDesktop?: BulmaColumnSize;
  sizeWidescreen?: BulmaColumnSize;
  sizeFullhd?: BulmaColumnSize;

  // Generic and responsive offsets
  offset?: BulmaColumnSize;
  offsetMobile?: BulmaColumnSize;
  offsetTablet?: BulmaColumnSize;
  offsetDesktop?: BulmaColumnSize;
  offsetWidescreen?: BulmaColumnSize;
  offsetFullhd?: BulmaColumnSize;

  // Generic and responsive isNarrow
  isNarrow?: boolean;
  isNarrowMobile?: boolean;
  isNarrowTablet?: boolean;
  isNarrowTouch?: boolean;
  isNarrowDesktop?: boolean;
  isNarrowWidescreen?: boolean;
  isNarrowFullhd?: boolean;

  children?: React.ReactNode;
}

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
