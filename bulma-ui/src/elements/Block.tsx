import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the Block component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the block.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {React.ReactNode} [children] - Content to be rendered inside the block.
 */
export interface BlockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Block component for rendering a styled Bulma block element.
 *
 * A block is a simple utility element that adds spacing (margin-bottom) between elements.
 * Supports Bulma helper classes for additional styling like text color, background color, and layout.
 *
 * @function
 * @param {BlockProps} props - Props for the Block component.
 * @returns {JSX.Element} The rendered block element.
 * @see {@link https://bulma.io/documentation/elements/block/ | Bulma Block documentation}
 */
export const Block: React.FC<BlockProps> = ({
  className,
  textColor,
  bgColor,
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

  const mainClass = classPrefix ? `${classPrefix}block` : 'block';
  const blockClasses = classNames(mainClass, className, bulmaHelperClasses);

  return (
    <div className={blockClasses} {...rest}>
      {children}
    </div>
  );
};
