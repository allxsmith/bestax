import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

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

function getGapClasses(props: ColumnsProps): string[] {
  const gapClassMap = [
    { prop: 'gapSize', prefix: 'is' },
    { prop: 'gapSizeMobile', prefix: 'is', suffix: 'mobile' },
    { prop: 'gapSizeTablet', prefix: 'is', suffix: 'tablet' },
    { prop: 'gapSizeDesktop', prefix: 'is', suffix: 'desktop' },
    { prop: 'gapSizeWidescreen', prefix: 'is', suffix: 'widescreen' },
    { prop: 'gapSizeFullhd', prefix: 'is', suffix: 'fullhd' },
  ];

  return gapClassMap.flatMap(({ prop, prefix, suffix }) => {
    const val = props[prop as keyof ColumnsProps] as BulmaGapSize | undefined;
    if (val !== undefined && val !== null) {
      let className = `${prefix}-${val}`;
      if (suffix) className += `-${suffix}`;
      return [className];
    }
    return [];
  });
}

export const Columns: React.FC<ColumnsProps> = ({
  className,
  textColor,
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

  const columnsClasses = classNames(
    'columns',
    {
      'is-centered': isCentered,
      'is-gapless': isGapless,
      'is-multiline': isMultiline,
      'is-vcentered': isVCentered,
      'is-mobile': isMobile,
      'is-desktop': isDesktop,
    },
    ...getGapClasses({
      gapSize,
      gapSizeMobile,
      gapSizeTablet,
      gapSizeDesktop,
      gapSizeWidescreen,
      gapSizeFullhd,
    } as ColumnsProps),
    className,
    bulmaHelperClasses
  );

  return (
    <div className={columnsClasses} {...rest}>
      {children}
    </div>
  );
};
