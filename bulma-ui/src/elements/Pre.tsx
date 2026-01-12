import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Pre component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Preformatted content to be rendered inside the element.
 */
export interface PreProps
  extends
    React.HTMLAttributes<HTMLPreElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Pre component for rendering preformatted text blocks.
 *
 * A Pre wraps the HTML `<pre>` element with Bulma helper class integration.
 * Use it for multi-line code blocks, ASCII art, or any content where whitespace
 * formatting must be preserved. Often used together with the Code component.
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
