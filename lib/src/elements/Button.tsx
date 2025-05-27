import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
  validSizes,
} from '../helpers/useBulmaClasses';

/**
 * Button component for rendering a styled button element.
 *
 * Supports Bulma-style modifiers for color, size, and various states, plus additional Bulma helper classes.
 */
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<
      BulmaClassesProps,
      | 'color'
      | 'backgroundColor'
      | 'size'
      | 'm'
      | 'mt'
      | 'mr'
      | 'mb'
      | 'ml'
      | 'mx'
      | 'my'
      | 'p'
      | 'pt'
      | 'pr'
      | 'pb'
      | 'pl'
      | 'px'
      | 'py'
    > {
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
  m?: (typeof validSizes)[number];
  mt?: (typeof validSizes)[number];
  mr?: (typeof validSizes)[number];
  mb?: (typeof validSizes)[number];
  ml?: (typeof validSizes)[number];
  mx?: (typeof validSizes)[number];
  my?: (typeof validSizes)[number];
  p?: (typeof validSizes)[number];
  pt?: (typeof validSizes)[number];
  pr?: (typeof validSizes)[number];
  pb?: (typeof validSizes)[number];
  pl?: (typeof validSizes)[number];
  px?: (typeof validSizes)[number];
  py?: (typeof validSizes)[number];
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
  m,
  mt,
  mr,
  mb,
  ml,
  mx,
  my,
  p,
  pt,
  pr,
  pb,
  pl,
  px,
  py,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    m,
    mt,
    mr,
    mb,
    ml,
    mx,
    my,
    p,
    pt,
    pr,
    pb,
    pl,
    px,
    py,
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
