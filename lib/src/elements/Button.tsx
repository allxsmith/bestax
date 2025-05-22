import React from 'react';
import classNames from 'classnames';

/**
 * Button component for rendering a styled button element.
 *
 * Supports Bulma-style modifiers for color, size, and various states.
 *
 * @param {ButtonProps} props - The props for the Button component.
 * @param {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [props.color] - Button color.
 * @param {'small' | 'normal' | 'medium' | 'large'} [props.size] - Button size.
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
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} [props.props] - Other button attributes.
 *
 * @returns {JSX.Element} The rendered button element.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
}

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
  ...props
}) => {
  const classes = classNames('button', className, {
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
    <button className={classes} disabled={isDisabled} {...props}>
      {children}
    </button>
  );
};
