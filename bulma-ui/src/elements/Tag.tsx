import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

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
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {TagColor} [color] - Bulma color modifier for the tag.
 * @property {TagSize} [size] - Size modifier for the tag.
 * @property {boolean} [isRounded] - Whether the tag should have rounded corners.
 * @property {boolean} [isDelete] - Whether the tag is a delete button.
 * @property {boolean} [isHoverable] - Whether the tag is hoverable.
 * @property {() => void} [onDelete] - Callback fired when the delete button is clicked.
 * @property {React.ReactNode} [children] - Tag content.
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
  children?: React.ReactNode;
}

/**
 * Tag component for rendering a styled Bulma tag.
 *
 * Supports colors, sizes, rounded, delete, and hoverable variants.
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
  isRounded,
  isDelete,
  isHoverable,
  onDelete,
  children,
  ...props
}) => {
  const { classPrefix } = useConfig();

  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const mainClass = classPrefix ? `${classPrefix}tag` : 'tag';
  const tagClasses = classNames(mainClass, className, bulmaHelperClasses, {
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
