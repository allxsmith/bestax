import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Progress component.
 */
export interface ProgressProps
  extends
    React.ProgressHTMLAttributes<HTMLProgressElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Bulma color modifier for the progress bar. */
  color?: (typeof validColors)[number];
  /** Size modifier for the progress bar. */
  size?: 'small' | 'medium' | 'large';
  /** Current value of the progress bar. */
  value?: number;
  /** Maximum value of the progress bar. */
  max?: number;
  /** Optional custom content inside the progress bar. Optional custom content inside the progress element. */
  children?: React.ReactNode;
}

/**
 * The `Progress` component displays a Bulma-styled progress bar.
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

  const bulmaClasses = usePrefixedClassNames('progress', {
    [`is-${color}`]: color && validColors.includes(color),
    [`is-${size}`]: size,
  });

  const progressClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <progress className={progressClasses} value={value} max={max} {...rest}>
      {children}
    </progress>
  );
};
