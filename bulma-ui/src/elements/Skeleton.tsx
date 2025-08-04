import React from 'react';
import classNames from '../helpers/classNames';
import { useConfig } from '../helpers/Config';

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
  const { classPrefix } = useConfig();

  if (variant === 'lines') {
    const linesClass = classPrefix
      ? `${classPrefix}skeleton-lines`
      : 'skeleton-lines';
    return (
      <div className={classNames(linesClass, className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} />
        ))}
      </div>
    );
  }

  const blockClass = classPrefix
    ? `${classPrefix}skeleton-block`
    : 'skeleton-block';
  return (
    <div className={classNames(blockClass, className)} {...props}>
      {children}
    </div>
  );
};
