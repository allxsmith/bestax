import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Emphasis component.
 */
export interface EmphasisProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content to render inside the em element. */
  children?: React.ReactNode;
}

/**
 * The `Emphasis` component renders a styled `<em>` element with Bulma helper class integration.
 *
 * @function
 * @param {EmphasisProps} props - Props for the Emphasis component.
 * @returns {JSX.Element} The rendered em element.
 */
export const Emphasis: React.FC<EmphasisProps> = ({
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
  const emphasisClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <em className={emphasisClasses || undefined} {...rest}>
      {children}
    </em>
  );
};
