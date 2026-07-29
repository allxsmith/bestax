import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Code component.
 */
export interface CodeProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Code content to be rendered inside the element. */
  children?: React.ReactNode;
}

/**
 * The `Code` component renders a styled `<code>` element with Bulma helper class integration.
 *
 * @function
 * @param {CodeProps} props - Props for the Code component.
 * @returns {JSX.Element} The rendered code element.
 */
export const Code: React.FC<CodeProps> = ({
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
  const codeClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <code className={codeClasses || undefined} {...rest}>
      {children}
    </code>
  );
};
