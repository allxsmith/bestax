import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Span component.
 */
export interface SpanProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content to be rendered inside the span. */
  children?: React.ReactNode;
}

/**
 * The `Span` component renders a styled inline `<span>` element with Bulma helper class integration.
 *
 * @function
 * @param {SpanProps} props - Props for the Span component.
 * @returns {JSX.Element} The rendered span element.
 */
export const Span: React.FC<SpanProps> = ({
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
  const spanClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <span className={spanClasses || undefined} {...rest}>
      {children}
    </span>
  );
};
