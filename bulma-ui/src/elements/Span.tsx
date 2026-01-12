import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Span component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Content to be rendered inside the span.
 */
export interface SpanProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Span component for rendering a styled inline element.
 *
 * A Span wraps the HTML `<span>` element with Bulma helper class integration.
 * Useful for styling inline text with Bulma's color, typography, and spacing utilities.
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
