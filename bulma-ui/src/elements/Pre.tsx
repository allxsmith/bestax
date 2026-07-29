import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Pre component.
 */
export interface PreProps
  extends
    React.HTMLAttributes<HTMLPreElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Preformatted content to be rendered inside the element. */
  children?: React.ReactNode;
}

/**
 * The `Pre` component renders a styled `<pre>` element with Bulma helper class integration.
 *
 * @function
 * @param {PreProps} props - Props for the Pre component.
 * @returns {JSX.Element} The rendered pre element.
 */
export const Pre: React.FC<PreProps> = ({
  className,
  textColor,
  bgColor,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  } as BulmaClassesProps & typeof props);

  const bulmaClasses = usePrefixedClassNames();
  const preClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <pre className={preClasses || undefined} {...rest}>
      {children}
    </pre>
  );
};
