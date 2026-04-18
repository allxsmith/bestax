import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';

/**
 * Props for the Skeleton component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {'block' | 'lines'} [variant] - Variant of skeleton: 'block' (default) or 'lines'.
 * @property {number} [lines] - Number of lines (only used if variant="lines").
 * @property {React.ReactNode} [children] - Render content inside the skeleton (block variant only).
 * @see {@link https://bulma.io/documentation/features/skeletons/ | Bulma Skeletons documentation}
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes to apply */
  className?: string;
  /** Variant of skeleton: 'block' (default) or 'lines' */
  variant?: 'block' | 'lines';
  /** Number of lines (only used if variant="lines") */
  lines?: number;
  /** Render content inside the skeleton (block variant only) */
  children?: React.ReactNode;
}

/**
 * Skeleton component for rendering a styled Bulma skeleton element.
 *
 * Renders an animated placeholder that indicates content is loading.
 * Supports block and multi-line variants.
 *
 * @function
 * @param {SkeletonProps} props - Props for the Skeleton component.
 * @returns {JSX.Element} The rendered skeleton element.
 *
 * @example
 * // Block skeleton
 * <Skeleton />
 *
 * @example
 * // Multi-line skeleton
 * <Skeleton variant="lines" lines={5} />
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'block',
  lines = 3,
  children,
  ...props
}) => {
  const linesClass = usePrefixedClassNames('skeleton-lines');
  const blockClass = usePrefixedClassNames('skeleton-block');

  if (variant === 'lines') {
    return (
      <div className={classNames(linesClass, className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={classNames(blockClass, className)} {...props}>
      {children}
    </div>
  );
};
