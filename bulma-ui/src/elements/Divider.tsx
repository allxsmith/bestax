import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Divider component.
 */
export interface DividerProps
  extends
    React.HTMLAttributes<HTMLHRElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * The `Divider` component renders a styled horizontal rule (`<hr>`) element with Bulma helper class integration.
 *
 * @function
 * @param {DividerProps} props - Props for the Divider component.
 * @returns {JSX.Element} The rendered hr element.
 */
export const Divider: React.FC<DividerProps> = ({
  className,
  bgColor,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    backgroundColor: bgColor,
    ...props,
  } as BulmaClassesProps & typeof props);

  const bulmaClasses = usePrefixedClassNames();
  const dividerClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return <hr className={dividerClasses || undefined} {...rest} />;
};
