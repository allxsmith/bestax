import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the ListItem component.
 * @extraProp {number} [value] - Custom value for ordered list items.
 */
export interface ListItemProps
  extends
    React.LiHTMLAttributes<HTMLLIElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content to be rendered inside the list item. */
  children?: React.ReactNode;
}

/**
 * The `ListItem` component renders a styled list item (`<li>`) element with Bulma helper class integration.
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
