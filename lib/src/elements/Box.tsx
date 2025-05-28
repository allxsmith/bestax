import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Box component for rendering a styled Bulma box element.
 *
 * Supports Bulma helper classes for styling and layout, with optional shadow control.
 */
export interface BoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  hasShadow?: boolean;
}

export const Box: React.FC<BoxProps> = ({
  className,
  textColor,
  bgColor,
  hasShadow = true,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const boxClasses = classNames('box', className, bulmaHelperClasses, {
    'is-shadowless': !hasShadow,
  });

  return (
    <div className={boxClasses} {...rest}>
      {children}
    </div>
  );
};
