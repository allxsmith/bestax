/**
 * @group Table
 */
import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

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
  /** Bulma color modifier for the table cell. */
  color?: TableColor;
  /** Table cell content. */
  children?: React.ReactNode;
}

/**
 * Td component for rendering a styled Bulma table cell.
 *
 * Supports Bulma color modifiers and helper classes for additional styling.
 *
 * @function
 * @param {TdProps} props - Props for the Td component.
 * @returns {JSX.Element} The rendered table cell element.
 * @see {@link https://bulma.io/documentation/elements/table/#table-body | Bulma Table documentation}
 */
export const Td: React.FC<TdProps> = ({
  className,
  color,
  children,
  ...props
}) => {
  const colorClass = usePrefixedClassNames('', {
    [`is-${color}`]: color && validTableColors.includes(color),
  });

  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tdClasses = classNames(colorClass, className, bulmaHelperClasses);

  return (
    <td className={tdClasses || undefined} {...rest}>
      {children}
    </td>
  );
};
