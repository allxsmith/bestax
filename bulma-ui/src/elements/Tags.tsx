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
  /**
   * No-op retained for backwards compatibility.
   *
   * @deprecated Bulma's `.tags` wraps by default (no shipped `are-multiline`
   * CSS exists for it) — this prop has never had a visual effect and will be
   * removed in the next major version.
   */
  isMultiline?: boolean;
  /** Size of every tag in the group. */
  size?: TagsSize;
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
