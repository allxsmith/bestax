import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Button component.
 *
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the button.
 * @property {'small' | 'normal' | 'medium' | 'large'} [size] - Button size.
 * @property {boolean} [isLight] - Use the light version of the color.
 * @property {boolean} [isRounded] - Button is fully rounded.
 * @property {boolean} [isLoading] - Button shows a loading spinner.
 * @property {boolean} [isStatic] - Button is static and non-interactive.
 * @property {boolean} [isFullWidth] - Button takes the full width of parent.
 * @property {boolean} [isOutlined] - Use outlined button style.
 * @property {boolean} [isInverted] - Use inverted color style.
 * @property {boolean} [isFocused] - Button is styled as focused.
 * @property {boolean} [isActive] - Button is styled as active.
 * @property {boolean} [isHovered] - Button is styled as hovered.
 * @property {boolean} [isDisabled] - Button is disabled.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {'a' | 'button'} [as] - Render as an anchor or button element.
 * @property {string} [href] - Specifies the URL for anchor buttons.
 * @property {React.MouseEventHandler<HTMLButtonElement> | React.MouseEventHandler<HTMLAnchorElement>} [onClick] - Click handler for the button or anchor.
 * @property {string} [target] - Target for anchor element.
 * @property {string} [rel] - Rel attribute for anchor element.
 * @property {React.ReactNode} [children] - Content to be rendered inside the button.
 */
export interface ButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'color' | 'onClick'
    >,
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
  as?: 'a' | 'button';
  href?: string;
  onClick?:
    | React.MouseEventHandler<HTMLButtonElement>
    | React.MouseEventHandler<HTMLAnchorElement>;
  target?: string;
  rel?: string;
  children?: React.ReactNode;
}

/**
 * Button component for rendering a Bulma-styled button or anchor.
 *
 * Supports Bulma helper classes for colors, sizes, and various button states and modifiers.
 *
 * @function
 * @param {ButtonProps} props - Props for the Button component.
 * @returns {JSX.Element} The rendered button or anchor element.
 * @see {@link https://bulma.io/documentation/elements/button/ | Bulma Button documentation}
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
  as = 'button',
  href,
  onClick,
  target,
  rel,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
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

  if (as === 'a') {
    // Remove button-specific props (like 'type') from rest
    const { ...anchorRest } =
      rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        className={buttonClasses}
        href={href}
        target={target}
        rel={rel}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={
          isDisabled
            ? e => e.preventDefault()
            : (onClick as
                | React.MouseEventHandler<HTMLAnchorElement>
                | undefined)
        }
        {...anchorRest}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      onClick={
        onClick as React.MouseEventHandler<HTMLButtonElement> | undefined
      }
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
