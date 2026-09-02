import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Tag } from './Tag';

/**
 * Props for the Tags component.
 */
export interface TagsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Group tags together as add-ons (no spacing). */
  hasAddons?: boolean;
  /**
   * Allow tags to wrap onto multiple lines.
   *
   * @deprecated Bulma's `.tags` wraps by default (no shipped `are-multiline`
   * CSS exists for it) — this prop has never had a visual effect and will be
   * removed in the next major version.
   */
  isMultiline?: boolean;
  /** Tag elements to render inside the container. */
  children?: React.ReactNode;
}

/**
 * The `Tags` component groups multiple `Tag` components together in a Bulma-styled container that wraps onto multiple lines by default.
 *
 * @function
 * @param {TagsProps} props - Props for the Tags component.
 * @returns {JSX.Element} The rendered tags container.
 * @see {@link https://bulma.io/documentation/elements/tag/#list-of-tags | Bulma Tags documentation}
 */
const TagsComponent: React.FC<TagsProps> = ({
  className,
  hasAddons,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- accepted for backwards compatibility, deprecated no-op (no `are-multiline` CSS ships)
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
  });

  const tagsClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <div className={tagsClasses} {...rest}>
      {children}
    </div>
  );
};

export const Tags = withSubComponents(TagsComponent, { Tag }, 'Tags');
