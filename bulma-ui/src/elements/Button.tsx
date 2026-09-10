import React, { forwardRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import type { PolymorphicComponent } from '../helpers/polymorphic';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * The Button component's own props — everything it adds on top of the
 * attributes of whatever element `as` renders.
 */
export interface ButtonOwnProps extends Omit<
  BulmaClassesProps,
  'color' | 'backgroundColor' | 'size'
> {
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
  /** Button content. */
  children?: React.ReactNode;
}

/**
 * Props for the Button component. The DOM attributes and the `ref` both follow
 * `as`: with `as="a"` the anchor attributes are accepted, with `as="div"` they
 * are not.
 *
 * @extraProp {React.Ref} [ref] - Ref forwarded to the element `as` renders.
 */
export type ButtonProps<T extends React.ElementType = 'button'> =
  ButtonOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonOwnProps | 'as'> & {
      /** Render as a `<button>`, `<a>`, or a custom component (e.g. a router `Link`). Defaults to `'button'`; anything else (including `'a'`) uses anchor-style prop handling. */
      as?: T;
    };

/**
 * The shape the implementation destructures. The public contract is the generic
 * `ButtonProps<T>` above — the body cannot see through `T`, so it reads the
 * widest form of the props it actually touches.
 */
type ButtonImplProps = ButtonOwnProps & {
  as?: React.ElementType;
  href?: string;
  target?: string;
  rel?: string;
  onClick?:
    | React.MouseEventHandler<HTMLButtonElement>
    | React.MouseEventHandler<HTMLAnchorElement>;
};

const validButtonColors = [...validColors, 'text', 'ghost'] as const;

/**
 * The `Button` component provides a flexible and highly customizable button for your Bulma React UI.
 *
 * @function
 * @param {ButtonProps} props - Props for the Button component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The rendered button, anchor, or custom element.
 * @see {@link https://bulma.io/documentation/elements/button/ | Bulma Button documentation}
 */

export const Button = forwardRef(function Button(
  props: ButtonProps,
  ref: React.Ref<HTMLElement>
) {
  const {
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
    ...bulmaProps
  } = props as ButtonImplProps;

  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...bulmaProps,
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
    // Strip button-only attributes so a native link-like element (an <a>, a
    // <span>) doesn't receive them — React would render them as invalid HTML
    // attributes. The types no longer allow them through, but a JavaScript
    // consumer or a spread object still can.
    //
    // Only for INTRINSIC tags. A custom component (a router Link, ...) owns its
    // prop contract, and `ComponentPropsWithoutRef<T>` promises the caller that
    // its props reach it. Stripping eleven names by their spelling alone broke
    // that promise silently: `<Button as={Custom} name="x" />` type-checked
    // while `Custom` never received the `name` it requires.
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
      ...intrinsicRest
    } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    const forwardedRest =
      typeof Component === 'string' ? intrinsicRest : (rest as object);

    return (
      <Component
        ref={ref as React.Ref<HTMLAnchorElement>}
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
        {...(forwardedRest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Component>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
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
}) as PolymorphicComponent<ButtonOwnProps, 'button'>;

Button.displayName = 'Button';

export default Button;
