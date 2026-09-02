import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Tag } from './Tag';

const validTagsSizes = ['medium', 'large'] as const;
/**
 * Valid size values for the Tags component (Bulma tag group sizes).
 */
export type TagsSize = (typeof validTagsSizes)[number];

/**
 * Props for the Tags component.
 */
export interface TagsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color' | 'size'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Group tags together as add-ons (no spacing). */
  hasAddons?: boolean;
  /** Allow tags to wrap onto multiple lines. */
  isMultiline?: boolean;
  /** Size of every tag in the group. */
  size?: TagsSize;
  /** Tag elements to render inside the container. */
  children?: React.ReactNode;
}

/**
 * The `Tags` component groups multiple `Tag` components together in a horizontal (or multiline) Bulma-styled container.
 *
 * @function
 * @param {TagsProps} props - Props for the Tags component.
 * @returns {JSX.Element} The rendered tags container.
 * @see {@link https://bulma.io/documentation/elements/tag/#list-of-tags | Bulma Tags documentation}
 */
const TagsComponent: React.FC<TagsProps> = ({
  className,
  hasAddons,
  isMultiline,
  size,
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
    [`are-${size}`]: size && validTagsSizes.includes(size),
  });

  const tagsClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <div className={tagsClasses} {...rest}>
      {children}
    </div>
  );
};

export const Tags = withSubComponents(TagsComponent, { Tag }, 'Tags');
