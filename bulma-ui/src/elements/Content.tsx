import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the Content component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the content.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {'small' | 'normal' | 'medium' | 'large'} [size] - Size modifier for the content.
 * @property {React.ReactNode} [children] - Content to be rendered inside the block.
 */
interface ContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  size?: 'small' | 'normal' | 'medium' | 'large';
  children?: React.ReactNode;
}

// Valid size modifiers for the content class
const validSizes = ['small', 'medium', 'large'] as const;

/**
 * Content component for rendering a styled Bulma content block.
 *
 * Applies typographic styles to HTML content (e.g., paragraphs, headings, lists) with Bulma's content class.
 * Supports size modifiers and Bulma helper classes for additional styling.
 *
 * @function
 * @param {ContentProps} props - Props for the Content component.
 * @returns {JSX.Element} The rendered content block.
 * @see {@link https://bulma.io/documentation/elements/content/ | Bulma Content documentation}
 */
export const Content: React.FC<ContentProps> = ({
  className,
  textColor,
  bgColor,
  size,
  children,
  ...props
}) => {
  const { classPrefix } = useConfig();

  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = classPrefix ? `${classPrefix}content` : 'content';
  const contentClasses = classNames(mainClass, className, bulmaHelperClasses, {
    [`is-${size}`]: size && size !== 'normal' && validSizes.includes(size),
  });

  return (
    <div className={contentClasses} {...rest}>
      {children}
    </div>
  );
};

export default Content;
