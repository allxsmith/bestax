import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the ListItem component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Content to be rendered inside the list item.
 */
export interface ListItemProps
  extends
    React.LiHTMLAttributes<HTMLLIElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * ListItem component for rendering a styled list item element.
 *
 * A ListItem wraps the HTML `<li>` element with Bulma helper class integration.
 * Use it inside UnorderedList or OrderedList components.
 * Supports Bulma helper classes for additional styling like text color, background color,
 * and spacing utilities.
 *
 * @function
 * @param {ListItemProps} props - Props for the ListItem component.
 * @returns {JSX.Element} The rendered li element.
 */
export const ListItem: React.FC<ListItemProps> = ({
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
  const itemClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <li className={itemClasses || undefined} {...rest}>
      {children}
    </li>
  );
};
