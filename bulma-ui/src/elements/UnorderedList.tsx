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
 *
 * @extraProp {React.AriaRole} [role='list'] - The list's role. It's `list`, the role a `<ul>` already has, written out because Safari stops treating a `<ul>` as a list once its bullets are hidden, and Bulma's reset hides them outside `Content`. A role you pass replaces it, such as `tablist` for a list of tabs.
 */
export interface UnorderedListProps
  extends
    React.HTMLAttributes<HTMLUListElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string | undefined;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** List items to render inside the list. */
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
  role,
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

  // WebKit exposes a `<ul>` whose markers are hidden as a group, not a list,
  // unless it has role="list", and Bulma's reset hides a `<ul>`'s bullets
  // everywhere but `Content`. A caller's role still wins, and a spread
  // carrying `role: undefined` keeps the list's own.
  return (
    <ul className={listClasses || undefined} role={role ?? 'list'} {...rest}>
      {children}
    </ul>
  );
};

export const UnorderedList = withSubComponents(
  UnorderedListComponent,
  { Item: ListItem },
  'UnorderedList'
);
