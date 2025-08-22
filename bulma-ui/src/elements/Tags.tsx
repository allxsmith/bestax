import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
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
 * @see {@link https://bulma.io/documentation/elements/tag/#list-of-tags | Bulma Tags documentation}
 */
export const Tags: React.FC<TagsProps> = ({
  className,
  hasAddons,
  isMultiline,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const bulmaClasses = usePrefixedClassNames('tags', {
    'has-addons': hasAddons,
    'are-multiline': isMultiline,
  });

  const tagsClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <div className={tagsClasses} {...rest}>
      {children}
    </div>
  );
};
