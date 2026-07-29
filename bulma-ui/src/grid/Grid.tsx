import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { Cell } from './Cell';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Allowed gap values for Bulma's 0-8 spacing scale, shared by `Grid` and
 * `Columns`. Accepts the value as a number or a numeric string.
 */
export type BulmaGapValue =
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
 * Allowed minimum column values for Bulma grid.
 */
export type BulmaMinColValue =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32;
/**
 * Allowed fixed grid columns for Bulma grid.
 */
export type BulmaFixedGridCols =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
/**
 * Allowed fixed grid columns prop for Bulma grid.
 */
export type BulmaFixedGridColsProp = BulmaFixedGridCols | 'auto';

/**
 * Props for the Grid component.
 */
export interface GridProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Use a fixed grid layout (`.fixed-grid > .grid`). */
  isFixed?: boolean;
  /** Main gap for grid (Bulma `is-gap-X`). */
  gap?: BulmaGapValue;
  /** Column gap for grid (`is-column-gap-X`). */
  columnGap?: BulmaGapValue;
  /** Row gap for grid (`is-row-gap-X`). */
  rowGap?: BulmaGapValue;
  /** Minimum column width for the grid (`is-col-min-X`). */
  minCol?: BulmaMinColValue;
  /** For fixed grids: explicit column count (`has-X-cols`), or `'auto'` for auto-count. */
  fixedCols?: BulmaFixedGridColsProp;
  /** For fixed grids: explicit column count for mobile. */
  fixedColsMobile?: BulmaFixedGridCols;
  /** For fixed grids: explicit column count for tablet. */
  fixedColsTablet?: BulmaFixedGridCols;
  /** For fixed grids: explicit column count for desktop. */
  fixedColsDesktop?: BulmaFixedGridCols;
  /** For fixed grids: explicit column count for widescreen. */
  fixedColsWidescreen?: BulmaFixedGridCols;
  /** For fixed grids: explicit column count for fullhd. */
  fixedColsFullhd?: BulmaFixedGridCols;
  /** Additional CSS classes for the grid. */
  className?: string;
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the grid. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Children to render inside the grid (usually `Cell` components). */
  children?: React.ReactNode;
}

/**
 * The `Grid` component provides Bulma's advanced CSS Grid layout for complex, modern layouts.
 *
 * @function
 * @param {GridProps} props - Props for the Grid component.
 * @returns {JSX.Element} The rendered grid.
 * @see {@link https://bulma.io/documentation/grid/ | Bulma Grid documentation}
 */
const GridComponent: React.FC<GridProps> = ({
  isFixed = false,
  gap,
  columnGap,
  rowGap,
  minCol,
  fixedCols,
  fixedColsMobile,
  fixedColsTablet,
  fixedColsDesktop,
  fixedColsWidescreen,
  fixedColsFullhd,
  className,
  textColor,
  color: _fieldColor,
  bgColor,
  children,
  ...props
}) => {
  // Map textColor and bgColor to color and backgroundColor for useBulmaClasses
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('grid');

  // Build grid inner classes with prefixes
  const gridInnerClasses = usePrefixedClassNames('', {
    [`is-gap-${gap}`]: gap !== undefined && gap !== null,
    [`is-column-gap-${columnGap}`]:
      columnGap !== undefined && columnGap !== null,
    [`is-row-gap-${rowGap}`]: rowGap !== undefined && rowGap !== null,
    [`is-col-min-${minCol}`]: minCol !== undefined && minCol !== null,
  });

  // Build fixed grid classes with prefixes (always called, used conditionally)
  const fixedGridClasses = usePrefixedClassNames('fixed-grid', {
    'has-auto-count': fixedCols === 'auto',
    [`has-${fixedCols}-cols`]: fixedCols !== undefined && fixedCols !== 'auto',
    [`has-${fixedColsMobile}-cols-mobile`]:
      fixedColsMobile !== undefined && fixedColsMobile !== null,
    [`has-${fixedColsTablet}-cols-tablet`]:
      fixedColsTablet !== undefined && fixedColsTablet !== null,
    [`has-${fixedColsDesktop}-cols-desktop`]:
      fixedColsDesktop !== undefined && fixedColsDesktop !== null,
    [`has-${fixedColsWidescreen}-cols-widescreen`]:
      fixedColsWidescreen !== undefined && fixedColsWidescreen !== null,
    [`has-${fixedColsFullhd}-cols-fullhd`]:
      fixedColsFullhd !== undefined && fixedColsFullhd !== null,
  });

  const gridClasses = classNames(
    mainClass,
    gridInnerClasses,
    bulmaHelperClasses,
    className
  );

  if (isFixed) {
    return (
      <div className={fixedGridClasses}>
        <div className={gridClasses} {...rest}>
          {children}
        </div>
      </div>
    );
  }

  // Standard Bulma grid (not fixed)
  return (
    <div className={gridClasses} {...rest}>
      {children}
    </div>
  );
};

export const Grid = withSubComponents(GridComponent, { Cell }, 'Grid');
