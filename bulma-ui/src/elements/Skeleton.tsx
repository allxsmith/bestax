import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';

/**
 * Props for the Skeleton component.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes to apply */
  className?: string;
  /** Skeleton variant: block (single block) or lines. Variant of skeleton: 'block' (default) or 'lines' */
  variant?: 'block' | 'lines';
  /** Number of lines (only used if variant="lines") */
  lines?: number;
  /** Render content inside the skeleton (block variant only) */
  children?: React.ReactNode;
}

/**
 * The `Skeleton` component provides a Bulma-styled skeleton loader for React applications, useful for indicating that content is loading.
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
