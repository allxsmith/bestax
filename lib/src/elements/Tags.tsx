import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Tags component for rendering a styled Bulma tags container.
 *
 * Supports addons and multiline variants.
 */
export interface TagsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  hasAddons?: boolean;
  isMultiline?: boolean;
}

export const Tags: React.FC<TagsProps> = ({
  className,
  hasAddons,
  isMultiline,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const tagsClasses = classNames('tags', className, bulmaHelperClasses, {
    'has-addons': hasAddons,
    'are-multiline': isMultiline,
  });

  return (
    <div className={tagsClasses} {...rest}>
      {children}
    </div>
  );
};
