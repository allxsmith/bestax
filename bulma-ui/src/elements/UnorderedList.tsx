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
 * Props for the UnorderedList component.
 */
export interface UnorderedListProps
  extends
    React.HTMLAttributes<HTMLUListElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** List items to be rendered inside the list. */
  children?: React.ReactNode;
}

/**
 * The `UnorderedList` component renders a styled unordered list (`<ul>`) element with Bulma helper class integration.
 *
 * @function
 * @param {UnorderedListProps} props - Props for the UnorderedList component.
 * @returns {JSX.Element} The rendered ul element.
 */
const UnorderedListComponent: React.FC<UnorderedListProps> = ({
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

export const UnorderedList = withSubComponents(
  UnorderedListComponent,
  { Item: ListItem },
  'UnorderedList'
);
