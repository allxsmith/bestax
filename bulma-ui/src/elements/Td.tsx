/**
 * @group Table
 */
import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { TableAlignment, validTableAlignments } from './tableAlignment';

/**
 * The values the table `color` prop accepts, as a readonly tuple.
 *
 * `TableColor` is typed from it, and `Tr`, `Th` and `Td` all take a
 * `TableColor`, so the tuple and those props list the same values. Map over
 * it to build a color picker, or check a value that arrives at runtime before
 * passing it in: the components add no color class for a value outside the
 * tuple.
 *
 * @example
 * import { Tr, Td, validTableColors } from '@allxsmith/bestax-bulma';
 *
 * <Tr>
 *   {validTableColors.map(color => (
 *     <Td key={color} color={color}>
 *       {color}
 *     </Td>
 *   ))}
 * </Tr>;
 */
export const validTableColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
] as const;

/**
 * The color values `Tr`, `Th` and `Td` accept, typed from `validTableColors`.
 */
export type TableColor = (typeof validTableColors)[number];

/**
 * Props for the Td component.
 */
export interface TdProps
  extends
    Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text alignment for the table cell ('left', 'right', 'centered'). */
  isAligned?: TableAlignment;
  /**
   * Shrinks the cell to its content and keeps that on one line (Bulma's
   * `is-narrow`), as for a column of checkboxes or actions. Not the table's
   * own `isNarrow`, which tightens every cell's padding.
   */
  isNarrow?: boolean;
  /** Centers the content vertically (Bulma's `is-vcentered`). Cells sit at the top otherwise. */
  isVcentered?: boolean;
  /** Bulma color modifier for the table cell. */
  color?: TableColor;
  /** Table cell content. */
  children?: React.ReactNode;
}

/**
 * Td component for rendering a styled Bulma table cell.
 *
 * Supports alignment, narrow and vertically centered cells, Bulma color modifiers, and helper classes for additional styling.
 *
 * @function
 * @param {TdProps} props - Props for the Td component.
 * @returns {JSX.Element} The rendered table cell element.
 * @see {@link https://bulma.io/documentation/elements/table/#table-body | Bulma Table documentation}
 */
export const Td: React.FC<TdProps> = ({
  className,
  isAligned,
  isNarrow,
  isVcentered,
  color,
  children,
  ...props
}) => {
  const bulmaClasses = usePrefixedClassNames('', {
    [`has-text-${isAligned}`]:
      isAligned && validTableAlignments.includes(isAligned),
    [`is-${color}`]: color && validTableColors.includes(color),
    'is-narrow': isNarrow,
    'is-vcentered': isVcentered,
  });

  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tdClasses = classNames(bulmaClasses, className, bulmaHelperClasses);

  return (
    <td className={tdClasses || undefined} {...rest}>
      {children}
    </td>
  );
};
