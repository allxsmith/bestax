import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

export type BulmaGapValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
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
export type BulmaFixedGridCols =
  | 0
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
  | 12;
export type BulmaFixedGridColsProp = BulmaFixedGridCols | 'auto';

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * Use a fixed grid layout (Bulma's .fixed-grid > .grid).
   * If false, renders a plain .grid.
   */
  isFixed?: boolean;
  /**
   * Main gap for grid (applies is-gap-X, 0-8)
   */
  gap?: BulmaGapValue;
  /**
   * Column gap for grid (applies is-column-gap-X, 0-8)
   */
  columnGap?: BulmaGapValue;
  /**
   * Row gap for grid (applies is-row-gap-X, 0-8)
   */
  rowGap?: BulmaGapValue;
  /**
   * Minimum column width for the grid (applies is-col-min-X, 1-32)
   */
  minCol?: BulmaMinColValue;
  /**
   * For fixed grid only: explicit column count (applies has-X-cols, 0-12), or 'auto' for has-auto-count
   */
  fixedCols?: BulmaFixedGridColsProp;
  /**
   * For fixed grid only: explicit column count per breakpoint (0-12)
   */
  fixedColsMobile?: BulmaFixedGridCols;
  fixedColsTablet?: BulmaFixedGridCols;
  fixedColsDesktop?: BulmaFixedGridCols;
  fixedColsWidescreen?: BulmaFixedGridCols;
  fixedColsFullhd?: BulmaFixedGridCols;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Text color (Bulma color, 'inherit', or 'current')
   */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Bulma color modifier for the cell text
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /**
   * Background color (Bulma color, 'inherit', or 'current')
   */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Children to render inside the cell
   */
  children?: React.ReactNode;
}

function getGridInnerClasses({
  gap,
  columnGap,
  rowGap,
  minCol,
}: Pick<GridProps, 'gap' | 'columnGap' | 'rowGap' | 'minCol'>): string[] {
  const classes: string[] = [];
  if (gap !== undefined) classes.push(`is-gap-${gap}`);
  if (columnGap !== undefined) classes.push(`is-column-gap-${columnGap}`);
  if (rowGap !== undefined) classes.push(`is-row-gap-${rowGap}`);
  if (minCol !== undefined) classes.push(`is-col-min-${minCol}`);
  return classes;
}

function getFixedGridClasses({
  fixedCols,
  fixedColsMobile,
  fixedColsTablet,
  fixedColsDesktop,
  fixedColsWidescreen,
  fixedColsFullhd,
}: Pick<
  GridProps,
  | 'fixedCols'
  | 'fixedColsMobile'
  | 'fixedColsTablet'
  | 'fixedColsDesktop'
  | 'fixedColsWidescreen'
  | 'fixedColsFullhd'
>): string[] {
  const classes: string[] = [];
  if (fixedCols === 'auto') {
    // 'auto' overrides all other column settings
    classes.push('has-auto-count');
    return classes;
  }
  if (fixedCols !== undefined) classes.push(`has-${fixedCols}-cols`);
  if (fixedColsMobile !== undefined)
    classes.push(`has-${fixedColsMobile}-cols-mobile`);
  if (fixedColsTablet !== undefined)
    classes.push(`has-${fixedColsTablet}-cols-tablet`);
  if (fixedColsDesktop !== undefined)
    classes.push(`has-${fixedColsDesktop}-cols-desktop`);
  if (fixedColsWidescreen !== undefined)
    classes.push(`has-${fixedColsWidescreen}-cols-widescreen`);
  if (fixedColsFullhd !== undefined)
    classes.push(`has-${fixedColsFullhd}-cols-fullhd`);
  return classes;
}

export const Grid: React.FC<GridProps> = ({
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

  const gridClasses = classNames(
    'grid',
    ...getGridInnerClasses({ gap, columnGap, rowGap, minCol }),
    bulmaHelperClasses,
    className
  );

  if (isFixed) {
    // Apply has-X-cols and responsive column count classes to the outer fixed-grid container
    const fixedGridClasses = classNames(
      'fixed-grid',
      ...getFixedGridClasses({
        fixedCols,
        fixedColsMobile,
        fixedColsTablet,
        fixedColsDesktop,
        fixedColsWidescreen,
        fixedColsFullhd,
      })
    );
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
