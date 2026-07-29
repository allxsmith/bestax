import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { ListItem } from './ListItem';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the OrderedList component.
 * @extraProp {'1' | 'a' | 'A' | 'i' | 'I'} [type='1'] - The numbering type for the list.
 * @extraProp {number} [start] - The starting number for the list.
 * @extraProp {boolean} [reversed] - Whether to reverse the list numbering.
 */
export interface OrderedListProps
  extends
    React.OlHTMLAttributes<HTMLOListElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** List items to render inside the list. */
  children?: React.ReactNode;
}

/**
 * The `OrderedList` component renders a styled ordered list (`<ol>`) element with Bulma helper class integration.
 *
 * @function
 * @param {OrderedListProps} props - Props for the OrderedList component.
 * @returns {JSX.Element} The rendered ol element.
 */
const OrderedListComponent: React.FC<OrderedListProps> = ({
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

export const OrderedList = withSubComponents(
  OrderedListComponent,
  { Item: ListItem },
  'OrderedList'
);
