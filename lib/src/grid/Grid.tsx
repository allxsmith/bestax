import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Allowed gap values for Bulma grid.
 */
export type BulmaGapValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
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
/**
 * Allowed fixed grid columns prop for Bulma grid.
 */
export type BulmaFixedGridColsProp = BulmaFixedGridCols | 'auto';

/**
 * Props for the Grid component.
 *
 * @property {boolean} [isFixed] - Use a fixed grid layout (Bulma's .fixed-grid > .grid).
 * @property {BulmaGapValue} [gap] - Main gap for grid (applies is-gap-X, 0-8).
 * @property {BulmaGapValue} [columnGap] - Column gap for grid (applies is-column-gap-X, 0-8).
 * @property {BulmaGapValue} [rowGap] - Row gap for grid (applies is-row-gap-X, 0-8).
 * @property {BulmaMinColValue} [minCol] - Minimum column width for the grid (applies is-col-min-X, 1-32).
 * @property {BulmaFixedGridColsProp} [fixedCols] - For fixed grid only: explicit column count (applies has-X-cols, 0-12), or 'auto' for has-auto-count.
 * @property {BulmaFixedGridCols} [fixedColsMobile] - For fixed grid only: explicit column count for mobile.
 * @property {BulmaFixedGridCols} [fixedColsTablet] - For fixed grid only: explicit column count for tablet.
 * @property {BulmaFixedGridCols} [fixedColsDesktop] - For fixed grid only: explicit column count for desktop.
 * @property {BulmaFixedGridCols} [fixedColsWidescreen] - For fixed grid only: explicit column count for widescreen.
 * @property {BulmaFixedGridCols} [fixedColsFullhd] - For fixed grid only: explicit column count for fullhd.
 * @property {string} [className] - Additional CSS class names.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier for the grid.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Children to render inside the grid.
 */
export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  isFixed?: boolean;
  gap?: BulmaGapValue;
  columnGap?: BulmaGapValue;
  rowGap?: BulmaGapValue;
  minCol?: BulmaMinColValue;
  fixedCols?: BulmaFixedGridColsProp;
  fixedColsMobile?: BulmaFixedGridCols;
  fixedColsTablet?: BulmaFixedGridCols;
  fixedColsDesktop?: BulmaFixedGridCols;
  fixedColsWidescreen?: BulmaFixedGridCols;
  fixedColsFullhd?: BulmaFixedGridCols;
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Builds Bulma grid inner classes for the Grid component.
 */
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

/**
 * Builds Bulma fixed grid classes for the Grid component.
 */
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

/**
 * Bulma Grid component for CSS Grid layouts, supports both fixed and responsive grid modes.
 *
 * @function
 * @param {GridProps} props - Props for the Grid component.
 * @returns {JSX.Element} The rendered grid.
 * @see {@link https://bulma.io/documentation/grid/ | Bulma Grid documentation}
 */
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
