import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Block component for rendering a styled Bulma block element.
 *
 * A block is a simple utility element that adds spacing (margin-bottom) between elements.
 * Supports Bulma helper classes for additional styling like text color, background color, and layout.
 */
export interface BlockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

export const Block: React.FC<BlockProps> = ({
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
  });

  const blockClasses = classNames('block', className, bulmaHelperClasses);

  return (
    <div className={blockClasses} {...rest}>
      {children}
    </div>
  );
};
