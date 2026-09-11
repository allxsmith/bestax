import React, { forwardRef } from 'react';
import { Button, ButtonOwnProps } from './Button';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import type { PolymorphicComponent } from '../helpers/polymorphic';

/**
 * The LinkButton component's own props — everything it adds on top of the
 * attributes of whatever element `as` renders.
 */
export interface LinkButtonOwnProps extends Omit<
  ButtonOwnProps,
  'color' | 'isOutlined' | 'isInverted' | 'isLight'
> {
  /** Display mode. `text` has no underline and highlights its background on hover; `ghost` uses the default text color and underlines on hover; `underline` drops the button chrome entirely (transparent background and border) and underlines on hover or focus. */
  variant?: 'text' | 'ghost' | 'underline';
  /** Text color override for the button. */
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
    | 'black';
  /**
   * Not available on `LinkButton`, and declared so that a custom `as` target
   * cannot reintroduce it. `Button` consumes these three for styling variants
   * `LinkButton` does not offer, and strips them before rendering the target —
   * so without this a component requiring one would type-check and silently
   * never receive it.
   * @internal
   */
  isOutlined?: never;
  /** @internal Not available on `LinkButton` — see `isOutlined`. */
  isInverted?: never;
  /** @internal Not available on `LinkButton` — see `isOutlined`. */
  isLight?: never;
}

/**
 * Props for the LinkButton component. The DOM attributes and the `ref` both
 * follow `as`, exactly as they do on `Button`.
 *
 * @extraProp {PolymorphicRef<React.ElementType>} [ref] - Ref forwarded to the element `as` renders, typed from `as`: the DOM node for an intrinsic tag, or whatever handle a custom component exposes.
 */
export type LinkButtonProps<T extends React.ElementType = 'button'> =
  LinkButtonOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof LinkButtonOwnProps | 'as'> & {
      /**
       * Render as a `<button>`, `<a>`, or a custom component (e.g. a router `Link`).
       * @defaultValue 'button'
       */
      as?: T;
    };

/**
 * The `LinkButton` component renders a `<button>` that visually looks like text or a link.
 *
 * @function
 * @param {LinkButtonProps} props - Props for the LinkButton component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The rendered link-styled button element.
 *
 * @example
 * // Text variant (default)
 * <LinkButton onClick={handleClick}>Click me</LinkButton>
 *
 * @example
 * // Underline variant with color
 * <LinkButton variant="underline" color="primary">Learn more</LinkButton>
 */
export const LinkButton = forwardRef(function LinkButton(
  { variant = 'text', color, className, ...props }: LinkButtonProps,
  ref: React.Ref<HTMLElement>
) {
  const buttonColor = variant === 'underline' ? 'text' : variant;

  const prefixedClasses = usePrefixedClassNames(
    'link-button',
    color && `link-button-${color}`,
    variant === 'underline' && 'link-button-underline'
  );

  return (
    <Button
      // LinkButton is polymorphic through to Button, which resolves the element
      // from `as`. TS cannot infer that through the spread below.
      ref={ref as React.Ref<HTMLButtonElement>}
      color={buttonColor}
      className={classNames(prefixedClasses, className)}
      {...props}
    />
  );
}) as PolymorphicComponent<LinkButtonOwnProps, 'button'>;

LinkButton.displayName = 'LinkButton';

export default LinkButton;
