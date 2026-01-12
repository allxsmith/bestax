import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Divider component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 */
export interface DividerProps
  extends
    React.HTMLAttributes<HTMLHRElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Divider component for rendering a styled horizontal rule element.
 *
 * A Divider wraps the HTML `<hr>` element with Bulma helper class integration.
 * Use it to visually separate content sections with a horizontal line.
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
