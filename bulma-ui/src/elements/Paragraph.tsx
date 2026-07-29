import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Paragraph component.
 */
export interface ParagraphProps
  extends
    React.HTMLAttributes<HTMLParagraphElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content to render inside the paragraph. */
  children?: React.ReactNode;
}

/**
 * The `Paragraph` component renders a styled `<p>` element with Bulma helper class integration.
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
