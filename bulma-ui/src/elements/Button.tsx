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
  /**
   * Not accepted under this name. `useBulmaClasses` consumes any
   * `backgroundColor` key before `rest` is spread, so a custom `as` target
   * declaring one would never receive it. Use `bgColor`.
   * @internal
   */
  backgroundColor?: never;
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
 * @extraProp {PolymorphicRef<React.ElementType>} [ref] - Ref forwarded to the element `as` renders, typed from `as`: the DOM node for an intrinsic tag, or whatever handle a custom component exposes.
 */
export type ButtonProps<T extends React.ElementType = 'button'> =
  ButtonOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonOwnProps | 'as'> & {
      /** Render as a `<button>`, `<a>`, or a custom component (e.g. a router `Link`). Defaults to `'button'`; anything else renders through the anchor path, which adds `href`/`target`/`rel` and withholds the submit-override attributes (`formAction` and friends) from an `<a>`. */
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
    // Strip the form-control attributes a link-like element cannot carry, so a
    // JavaScript consumer or a spread object doesn't put them on the DOM. The
    // types no longer allow them through; this is the runtime backstop.
    //
    // Only for INTRINSIC tags. A custom component (a router Link, ...) owns its
    // prop contract, and `ComponentPropsWithoutRef<T>` promises the caller that
    // its props reach it. Stripping names by their spelling alone broke that
    // promise silently: `<Button as={Custom} name="x" />` type-checked while
    // `Custom` never received the `name` it requires.
    //
    // `autoFocus` and `type` are deliberately NOT stripped: both are valid on
    // targets this list was filtering them from. `autoFocus` is a global
    // attribute (React decides per element whether to honour it, which is not
    // ours to pre-empt), and `type` on an anchor is the MIME hint that
    // `ButtonProps<'a'>` now types it as.
    //
    // The types already answer this for a TypeScript caller: `ButtonProps<T>`
    // derives from `ComponentPropsWithoutRef<T>`, so only what the target
    // accepts can be passed. What is left is a runtime backstop for JavaScript
    // consumers and spread objects.
    //
    // Keep it to the two cases where a stray attribute does something. The
    // submit-overrides belong to a submit control and never make sense on the
    // anchor path. `disabled` is the one that is VISIBLE: Bulma styles
    // `.button[disabled]` (background, border, shadow, opacity), so letting it
    // through to a `<span>` greys the element out — main stripped it, and not
    // stripping it would be a silent visual change on a types-only release.
    //
    // Everything else (`name`, `value`, `form`) is inert where it does not
    // belong, and enumerating which tags own it is what kept going wrong:
    // first all nine names on every non-button tag (so `<Button as="input"
    // name="query" value="Search">` submitted nothing), then a form-control
    // allowlist that still lost `formAction` on an input and `value` on an
    // option. Those now ride on the types instead.
    //
    // A custom component is exempt entirely — it owns its prop contract, and
    // `ComponentPropsWithoutRef<T>` promises the caller its props arrive.
    //
    // The elements that own `disabled`, per the HTML spec. A closed set, unlike
    // the open-ended question of which tag owns which attribute.
    const SUBMIT_OVERRIDES = [
      'formAction',
      'formEncType',
      'formMethod',
      'formNoValidate',
      'formTarget',
    ];
    const OWNS_DISABLED = [
      'button',
      'fieldset',
      'input',
      'optgroup',
      'option',
      'select',
      'textarea',
    ];

    // Two independent filters. They are not exclusive — an `<a>` owns neither
    // the submit-overrides nor `disabled`, so it takes both — and deriving them
    // from one destructure, or from one if/else, is what broke each of them in
    // turn: first the overrides came off every intrinsic (an `as="input"` lost
    // `formAction`), then scoping them to the anchor let `disabled` back onto
    // it.
    const forwardedRest: Record<string, unknown> = { ...rest };
    if (typeof Component === 'string') {
      // Meaningless anywhere but a submit control, and an anchor is not one.
      if (Component === 'a') {
        for (const key of SUBMIT_OVERRIDES) delete forwardedRest[key];
      }
      // Visible via Bulma's `.button[disabled]`, so withheld from any element
      // that does not own it.
      if (!OWNS_DISABLED.includes(Component)) delete forwardedRest.disabled;
    }

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
            ? // Guarded, because this handler is installed into whatever `as`
              // renders and a custom component's `onClick` need not be a DOM
              // event handler at all. One declaring `onClick: (v: string) =>
              // void` calls this with a string, and an unguarded
              // `e.preventDefault()` throws `is not a function`. Blocking the
              // real event is the point; a foreign payload is simply not ours
              // to act on.
              (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (typeof e?.preventDefault === 'function') e.preventDefault();
              }
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
