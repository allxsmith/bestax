import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Button component.
 *
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger' | 'white' | 'light' | 'dark' | 'black' | 'text' | 'ghost'} [color] - Bulma color modifier for the button.
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
 * @property {React.ElementType} [as] - Render as a `<button>`, `<a>`, or a custom component (e.g. a router `Link`). Defaults to `'button'`; anything else (including `'a'`) uses anchor-style prop handling.
 * @property {string} [href] - Specifies the URL for anchor buttons.
 * @property {React.MouseEventHandler<HTMLButtonElement> | React.MouseEventHandler<HTMLAnchorElement>} [onClick] - Click handler for the button or anchor.
 * @property {string} [target] - Target for anchor element.
 * @property {string} [rel] - Rel attribute for anchor element.
 * @property {React.ReactNode} [children] - Content to be rendered inside the button.
 */
export interface ButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'onClick'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  color?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'white'
    | 'light'
    | 'dark'
    | 'black'
    | 'text'
    | 'ghost';
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
  as?: React.ElementType;
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
const validButtonColors = [...validColors, 'text', 'ghost'] as const;

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
  as: Component = 'button',
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

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('button', {
    [`is-${color}`]:
      color &&
      validButtonColors.includes(color as (typeof validButtonColors)[number]),
    [`is-${size}`]: size,
    'is-outlined': isOutlined,
    'is-light': isLight,
    'is-loading': isLoading,
    'is-static': isStatic,
    'is-disabled': isDisabled,
    'is-rounded': isRounded,
    'is-hovered': isHovered,
    'is-focused': isFocused,
    'is-active': isActive,
    'is-inverted': isInverted,
    'is-fullwidth': isFullWidth,
  });

  // Combine prefixed Bulma classes with unprefixed user className and prefixed helper classes
  const buttonClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  if (Component !== 'button') {
    // Create anchor-specific props by excluding button-specific ones, so
    // native/custom link-like elements (an <a>, a router Link, ...) don't
    // receive button-only HTML attributes.
    const {
      type: _type,
      disabled: _disabled,
      form: _form,
      formAction: _formAction,
      formEncType: _formEncType,
      formMethod: _formMethod,
      formNoValidate: _formNoValidate,
      formTarget: _formTarget,
      name: _name,
      value: _value,
      autoFocus: _autoFocus,
      ...anchorRest
    } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;

    return (
      <Component
        className={buttonClasses}
        href={href}
        target={target}
        rel={rel}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={
          isDisabled
            ? (e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault()
            : (onClick as
                React.MouseEventHandler<HTMLAnchorElement> | undefined)
        }
        {...(anchorRest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Component>
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
