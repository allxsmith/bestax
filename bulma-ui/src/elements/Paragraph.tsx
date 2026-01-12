import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Paragraph component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Content to be rendered inside the paragraph.
 */
export interface ParagraphProps
  extends
    React.HTMLAttributes<HTMLParagraphElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Paragraph component for rendering a styled paragraph element.
 *
 * A Paragraph wraps the HTML `<p>` element with Bulma helper class integration.
 * Supports Bulma helper classes for additional styling like text color, background color,
 * typography, and spacing utilities.
 *
 * @function
 * @param {ParagraphProps} props - Props for the Paragraph component.
 * @returns {JSX.Element} The rendered paragraph element.
 */
export const Paragraph: React.FC<ParagraphProps> = ({
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
  const paragraphClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <p className={paragraphClasses || undefined} {...rest}>
      {children}
    </p>
  );
};
