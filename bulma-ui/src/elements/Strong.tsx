import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Strong component.
 */
export interface StrongProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content to render inside the strong element. */
  children?: React.ReactNode;
}

/**
 * The `Strong` component renders a styled `<strong>` element with Bulma helper class integration.
 *
 * @function
 * @param {StrongProps} props - Props for the Strong component.
 * @returns {JSX.Element} The rendered strong element.
 */
export const Strong: React.FC<StrongProps> = ({
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
  const strongClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <strong className={strongClasses || undefined} {...rest}>
      {children}
    </strong>
  );
};
