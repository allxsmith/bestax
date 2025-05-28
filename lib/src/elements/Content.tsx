import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Content component for rendering a styled Bulma content block.
 *
 * Applies typographic styles to HTML content (e.g., paragraphs, headings, lists) with Bulma's content class.
 * Supports size modifiers and Bulma helper classes for additional styling.
 */
interface ContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  size?: 'small' | 'normal' | 'medium' | 'large';
}

// Valid size modifiers for the content class
const validSizes = ['small', 'medium', 'large'] as const;

export const Content: React.FC<ContentProps> = ({
  className,
  textColor,
  bgColor,
  size,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const contentClasses = classNames('content', className, bulmaHelperClasses, {
    [`is-${size}`]: size && size !== 'normal' && validSizes.includes(size),
  });

  return (
    <div className={contentClasses} {...rest}>
      {children}
    </div>
  );
};
