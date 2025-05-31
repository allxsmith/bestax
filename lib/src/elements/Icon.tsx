import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Icon component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the icon.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {string} name - Icon class name(s), e.g., 'fas fa-star' for Font Awesome.
 * @property {'small' | 'medium' | 'large'} [size] - Size modifier for the icon.
 * @property {string} [ariaLabel='icon'] - ARIA label for accessibility (default: 'icon').
 */
export interface IconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    BulmaClassesProps {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  name: string; // e.g., 'fas fa-star' for Font Awesome
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
}

/**
 * Icon component for rendering a Bulma-styled icon container.
 *
 * Supports Bulma helper classes for styling, color, and size, and renders an <i></i> element for the icon itself.
 *
 * @function
 * @param {IconProps} props - Props for the Icon component.
 * @returns {JSX.Element} The rendered icon element.
 */
export const Icon: React.FC<IconProps> = ({
  className,
  textColor,
  bgColor,
  name,
  size,
  ariaLabel = 'icon',
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const iconContainerClasses = classNames(
    'icon',
    {
      [`is-${size}`]: size,
    },
    bulmaHelperClasses,
    className
  );

  return (
    <span className={iconContainerClasses} aria-label={ariaLabel} {...rest}>
      <i className={name} />
    </span>
  );
};
