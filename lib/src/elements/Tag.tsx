import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

const validTagColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
] as const;

export type TagColor = (typeof validTagColors)[number];

const validTagSizes = ['normal', 'medium', 'large'] as const;
export type TagSize = (typeof validTagSizes)[number];

/**
 * Tag component for rendering a styled Bulma tag.
 *
 * Supports colors, sizes, rounded, delete, and hoverable variants.
 */
export interface TagProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  color?: TagColor;
  size?: TagSize;
  isRounded?: boolean;
  isDelete?: boolean;
  isHoverable?: boolean;
  onDelete?: () => void;
}

export const Tag: React.FC<TagProps> = ({
  className,
  color,
  size,
  isRounded,
  isDelete,
  isHoverable,
  onDelete,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tagClasses = classNames('tag', className, bulmaHelperClasses, {
    [`is-${color}`]: color && validTagColors.includes(color),
    [`is-${size}`]: size && size !== 'normal' && validTagSizes.includes(size),
    'is-rounded': isRounded,
    'is-delete': isDelete,
    'is-hoverable': isHoverable,
  });

  if (isDelete) {
    return (
      <button
        className={tagClasses}
        onClick={onDelete}
        aria-label="Delete tag"
        {...rest}
      />
    );
  }

  return (
    <span className={tagClasses} {...rest}>
      {children}
    </span>
  );
};
