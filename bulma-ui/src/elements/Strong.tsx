import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Strong component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Content to be rendered inside the strong element.
 */
export interface StrongProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Strong component for rendering semantically important bold text.
 *
 * A Strong wraps the HTML `<strong>` element with Bulma helper class integration.
 * Use it for text that has strong importance, seriousness, or urgency.
 * For visual-only bold styling without semantic meaning, use Span with textWeight="bold".
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
