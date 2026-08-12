import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Button component.
 */
export interface ButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'onClick'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  /** Bulma color variant for the button. `ghost` renders a link-like button; `text` renders a minimal text-only button. */
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
  /** Size of the button. */
  size?: 'small' | 'normal' | 'medium' | 'large';
  /** Applies a lighter color variant. */
  isLight?: boolean;
  /** Makes the button rounded. */
  isRounded?: boolean;
  /** Displays a loading spinner. */
  isLoading?: boolean;
  /** Makes the button non-interactive. */
  isStatic?: boolean;
  /** Makes the button full-width. */
  isFullwidth?: boolean;
  /** Makes the button full-width. @deprecated Use `isFullwidth` instead — `isFullwidth` wins if both are set. */
  isFullWidth?: boolean;
  /** Applies outlined styling (requires color). */
  isOutlined?: boolean;
  /** Applies inverted styling (requires color). */
  isInverted?: boolean;
  /** Applies focused styling (visual only). */
  isFocused?: boolean;
  /** Applies active styling (visual only). */
  isActive?: boolean;
  /** Applies hovered styling (visual only). */
  isHovered?: boolean;
  /** Applies disabled styling. */
  isDisabled?: boolean;
  /** Custom class name. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Render as a `<button>`, `<a>`, or a custom component (e.g. a router `Link`). Defaults to `'button'`; anything else (including `'a'`) uses anchor-style prop handling. */
  as?: React.ElementType;
  /** Href value (if rendering as `<a>`). */
  href?: string;
  /** Click event handler. */
  onClick?:
    | React.MouseEventHandler<HTMLButtonElement>
    | React.MouseEventHandler<HTMLAnchorElement>;
  /** Anchor tag target. */
  target?: string;
  /** Anchor tag rel. */
  rel?: string;
  /** Button content. */
  children?: React.ReactNode;
}

const validButtonColors = [...validColors, 'text', 'ghost'] as const;

/**
 * The `Button` component provides a flexible and highly customizable button for your Bulma React UI.
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
  isFullwidth,
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
    'is-fullwidth': isFullwidth ?? isFullWidth,
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
