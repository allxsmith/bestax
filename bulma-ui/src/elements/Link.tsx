import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Link component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {string} [href] - The URL the link points to.
 * @property {string} [target] - Where to open the linked document.
 * @property {string} [rel] - Relationship between the current and linked document.
 * @property {boolean} [isActive] - Whether the link appears active.
 * @property {React.ReactNode} [children] - Content to be rendered inside the link.
 */
export interface LinkProps
  extends
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  isActive?: boolean;
  children?: React.ReactNode;
}

/**
 * Link component for rendering a styled Bulma anchor element.
 *
 * A Link wraps the HTML `<a>` element with Bulma styling support and helper class integration.
 * Supports Bulma helper classes for additional styling like text color, background color, and layout.
 *
 * @function
 * @param {LinkProps} props - Props for the Link component.
 * @returns {JSX.Element} The rendered anchor element.
 * @see {@link https://bulma.io/documentation/elements/content/ | Bulma Content documentation}
 */
export const Link: React.FC<LinkProps> = ({
  className,
  textColor,
  bgColor,
  isActive,
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

  const bulmaClasses = usePrefixedClassNames({
    'is-active': isActive,
  });
  const linkClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <a className={linkClasses || undefined} {...rest}>
      {children}
    </a>
  );
};
