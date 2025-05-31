import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Tags component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {boolean} [hasAddons] - Group tags together as addons.
 * @property {boolean} [isMultiline] - Allow tags to wrap onto multiple lines.
 * @property {React.ReactNode} [children] - Tag elements to render inside the container.
 */
export interface TagsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  hasAddons?: boolean;
  isMultiline?: boolean;
  children?: React.ReactNode;
}

/**
 * Tags component for rendering a styled Bulma tags container.
 *
 * Supports addons and multiline variants.
 *
 * @function
 * @param {TagsProps} props - Props for the Tags component.
 * @returns {JSX.Element} The rendered tags container.
 */
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
