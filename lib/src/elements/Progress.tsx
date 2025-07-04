import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Progress component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number]} [color] - Bulma color modifier for the progress bar.
 * @property {'small' | 'medium' | 'large'} [size] - Size modifier for the progress bar.
 * @property {number} [value] - Current value of the progress bar.
 * @property {number} [max] - Maximum value of the progress bar.
 * @property {React.ReactNode} [children] - Optional custom content inside the progress element.
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

/**
 * Progress component for rendering a styled Bulma progress bar.
 *
 * Supports Bulma color and size modifiers, value/max attributes, and optional custom content.
 *
 * @function
 * @param {ProgressProps} props - Props for the Progress component.
 * @returns {JSX.Element} The rendered progress bar element.
 * @see {@link https://bulma.io/documentation/elements/progress/ | Bulma Progress documentation}
 */
export const Progress: React.FC<ProgressProps> = ({
  className,
  color,
  size,
  value,
  max,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
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
