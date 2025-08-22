import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';

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
 * @see https://bulma.io/documentation/features/skeletons/
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
