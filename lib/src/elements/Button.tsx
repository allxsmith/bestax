import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

// Omit onClick from button props so we can define our own
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
  // Accept both button and anchor click handlers
  onClick?:
    | React.MouseEventHandler<HTMLButtonElement>
    | React.MouseEventHandler<HTMLAnchorElement>;
  target?: string;
  rel?: string;
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
  textColor,
  bgColor,
  as = 'button',
  href,
  onClick,
  target,
  rel,
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
