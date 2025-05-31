import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Button component for rendering a styled button element.
 *
 * Supports Bulma-style modifiers for color, size, and various states, plus additional Bulma helper classes.
 *
 * @param {ButtonProps} props - Props for the Button component.
 * @param {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [props.color] - Bulma color modifier.
 * @param {'small' | 'normal' | 'medium' | 'large'} [props.size] - Bulma size modifier.
 * @param {boolean} [props.isLight] - Use the light color variant.
 * @param {boolean} [props.isRounded] - Use rounded corners.
 * @param {boolean} [props.isLoading] - Show a loading spinner.
 * @param {boolean} [props.isStatic] - Make the button static (unclickable).
 * @param {boolean} [props.isFullWidth] - Make the button take the full width of its container.
 * @param {boolean} [props.isOutlined] - Use the outlined style.
 * @param {boolean} [props.isInverted] - Use the inverted color scheme.
 * @param {boolean} [props.isFocused] - Apply the focused style.
 * @param {boolean} [props.isActive] - Apply the active style.
 * @param {boolean} [props.isHovered] - Apply the hovered style.
 * @param {boolean} [props.isDisabled] - Disable the button.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {React.ReactNode} [props.children] - Button content.
 * @param {string} [props.textColor] - Text color (Bulma color or 'inherit'/'current').
 * @param {string} [props.bgColor] - Background color (Bulma color or 'inherit'/'current').
 * @returns {JSX.Element} The rendered button element.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'normal' | 'medium' | 'large';
  isLight?: boolean;
  isRounded?: boolean;
  isLoading?: boolean;
  isStatic?: boolean;
  isFullWidth?: boolean;
  isOutlined?: boolean;
  isInverted?: boolean;
  isFocused?: boolean;
  isActive?: boolean;
  isHovered?: boolean;
  isDisabled?: boolean;
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
}

/**
 * Renders a Bulma-styled button with various modifiers and helper classes.
 */
export const Button: React.FC<ButtonProps> = ({
  color,
  size,
  isLight,
  isRounded,
  isLoading,
  isStatic,
  isFullWidth,
  isOutlined,
  isInverted,
  isFocused,
  isActive,
  isHovered,
  isDisabled,
  className,
  children,
  textColor,
  bgColor,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const buttonClasses = classNames('button', className, bulmaHelperClasses, {
    [`is-${color}`]: color,
    [`is-${size}`]: size && size !== 'normal',
    'is-light': isLight,
    'is-rounded': isRounded,
    'is-loading': isLoading,
    'is-static': isStatic,
    'is-fullwidth': isFullWidth,
    'is-outlined': isOutlined,
    'is-inverted': isInverted,
    'is-focused': isFocused,
    'is-active': isActive,
    'is-hovered': isHovered,
    'is-disabled': isDisabled,
  });

  return (
    <button className={buttonClasses} disabled={isDisabled} {...rest}>
      {children}
    </button>
  );
};
