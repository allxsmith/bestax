import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the OrderedList component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {'1' | 'a' | 'A' | 'i' | 'I'} [type] - The numbering type for the list.
 * @property {number} [start] - The starting number for the list.
 * @property {boolean} [reversed] - Whether to reverse the list numbering.
 * @property {React.ReactNode} [children] - List items to be rendered inside the list.
 */
export interface OrderedListProps
  extends
    React.OlHTMLAttributes<HTMLOListElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * OrderedList component for rendering a styled ordered list element.
 *
 * An OrderedList wraps the HTML `<ol>` element with Bulma helper class integration.
 * Supports Bulma helper classes for additional styling like text color, background color,
 * and spacing utilities. Also supports standard `<ol>` attributes like `type`, `start`, and `reversed`.
 *
 * @function
 * @param {OrderedListProps} props - Props for the OrderedList component.
 * @returns {JSX.Element} The rendered ol element.
 */
export const OrderedList: React.FC<OrderedListProps> = ({
  className,
  textColor,
  bgColor,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  } as BulmaClassesProps & typeof props);

  const bulmaClasses = usePrefixedClassNames();
  const listClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <ol className={listClasses || undefined} {...rest}>
      {children}
    </ol>
  );
};
