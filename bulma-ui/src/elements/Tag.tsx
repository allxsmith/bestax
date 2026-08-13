import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
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

/**
 * Valid color values for the Tag component (Bulma tag colors).
 */
export type TagColor = (typeof validTagColors)[number];

const validTagSizes = ['normal', 'medium', 'large'] as const;
/**
 * Valid size values for the Tag component (Bulma tag sizes).
 */
export type TagSize = (typeof validTagSizes)[number];

/**
 * Props for the Tag component.
 */
export interface TagProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Bulma color modifier for the tag. */
  color?: TagColor;
  /** Tag size. */
  size?: TagSize;
  /** Use the light color variant. */
  isLight?: boolean;
  /** Renders a rounded tag. */
  isRounded?: boolean;
  /** Renders a delete-style tag (delete button). */
  isDelete?: boolean;
  /** Adds hover effect to the tag. */
  isHoverable?: boolean;
  /** Callback for delete tag/button. */
  onDelete?: () => void;
  /** Tag content. */
  children?: React.ReactNode;
}

/**
 * The `Tag` component renders a Bulma-styled label or badge.
 *
 * @function
 * @param {TagProps} props - Props for the Tag component.
 * @returns {JSX.Element} The rendered tag element.
 * @see {@link https://bulma.io/documentation/elements/tag/ | Bulma Tag documentation}
 */
export const Tag: React.FC<TagProps> = ({
  className,
  color,
  size,
  isLight,
  isRounded,
  isDelete,
  isHoverable,
  onDelete,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const bulmaClasses = usePrefixedClassNames('tag', {
    [`is-${color}`]: color && validTagColors.includes(color),
    [`is-${size}`]: size && size !== 'normal' && validTagSizes.includes(size),
    'is-light': isLight,
    'is-rounded': isRounded,
    'is-delete': isDelete,
    'is-hoverable': isHoverable,
  });

  const tagClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

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
