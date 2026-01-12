import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Code component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Code content to be rendered inside the element.
 */
export interface CodeProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Code component for rendering inline code snippets.
 *
 * A Code wraps the HTML `<code>` element with Bulma helper class integration.
 * Use it for short inline code snippets, variable names, or technical terms.
 * For multi-line code blocks, use the Pre component.
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
