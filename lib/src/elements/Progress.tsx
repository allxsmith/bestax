import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Progress component for rendering a styled Bulma progress bar.
 *
 * Supports colors, sizes, value/max attributes, and optional custom content.
 */
export interface ProgressProps
  extends React.ProgressHTMLAttributes<HTMLProgressElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number];
  size?: 'small' | 'medium' | 'large';
  value?: number;
  max?: number;
  children?: React.ReactNode;
}

export const Progress: React.FC<ProgressProps> = ({
  className,
  color,
  size,
  value,
  max,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  const progressClasses = classNames(
    'progress',
    className,
    bulmaHelperClasses,
    {
      [`is-${color}`]: color && validColors.includes(color),
      [`is-${size}`]: size,
    }
  );

  return (
    <progress className={progressClasses} value={value} max={max} {...rest}>
      {children}
    </progress>
  );
};
