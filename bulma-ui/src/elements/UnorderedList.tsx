import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the UnorderedList component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - List items to be rendered inside the list.
 */
export interface UnorderedListProps
  extends
    React.HTMLAttributes<HTMLUListElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * UnorderedList component for rendering a styled unordered list element.
 *
 * An UnorderedList wraps the HTML `<ul>` element with Bulma helper class integration.
 * Supports Bulma helper classes for additional styling like text color, background color,
 * and spacing utilities.
 *
 * @function
 * @param {UnorderedListProps} props - Props for the UnorderedList component.
 * @returns {JSX.Element} The rendered ul element.
 */
export const UnorderedList: React.FC<UnorderedListProps> = ({
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
    <ul className={listClasses || undefined} {...rest}>
      {children}
    </ul>
  );
};
