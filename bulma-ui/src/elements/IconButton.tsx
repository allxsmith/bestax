import React, { forwardRef, useEffect } from 'react';
import { Button, type ButtonOwnProps, type ButtonProps } from './Button';
import { Icon } from './Icon';
import { buttonType } from '../helpers/buttonType';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { isDev, warnOnce } from '../helpers/devWarnings';
import { flattenChildren } from '../helpers/flattenChildren';
import type { PolymorphicComponent } from '../helpers/polymorphic';

/**
 * The IconButton component's own props: everything `Button` takes, plus the
 * icon.
 */
export interface IconButtonOwnProps extends ButtonOwnProps {
  /**
   * The glyph. A string is an `Icon` name, drawn from the icon library
   * `ConfigProvider` sets. An `<Icon>` renders as given, so it can carry its
   * own `variant` or `library`. Any other node, such as an SVG or a component
   * from an icon package, goes inside an `Icon`, which gives it the `.icon`
   * wrapper Bulma keeps square. It's decorative: the button's name says what
   * it does.
   */
  icon?: React.ReactNode;
  /**
   * The glyph as children, rendered as given after `icon`: an `<Icon>`, or a
   * node inside one. A bare `<svg>` here isn't wrapped and loses Bulma's
   * square, so pass it as `icon` instead. Text warns in development, since
   * `aria-label` replaces it as the name: a button with text is a `Button`.
   */
  children?: React.ReactNode;
}

/** Names an IconButton by the text of another element. */
export interface IconButtonLabelledBy {
  /** The id of the element whose text names the button, in place of `aria-label`. */
  'aria-labelledby': string;
  /** Not with `aria-labelledby`, which already names the button. */
  'aria-label'?: undefined;
}

/** Names an IconButton with `aria-label`, the usual way. */
export interface IconButtonLabel {
  /**
   * The button's name: what a screen reader announces and what a voice
   * control user says to press it. Required, or `aria-labelledby` in its
   * place, since an icon has no text to name it by. Name the action
   * ("Delete"), not the picture ("Trash"). An empty or blank one warns in
   * development.
   */
  'aria-label': string;
  /** Not with `aria-label`. */
  'aria-labelledby'?: undefined;
}

/**
 * How an IconButton gets its name: `aria-label`, or `aria-labelledby` in its
 * place. `IconButtonLabel` comes last, so a button with neither reports
 * "Property 'aria-label' is missing".
 */
export type IconButtonName = IconButtonLabelledBy | IconButtonLabel;

/**
 * Props for the IconButton component. The DOM attributes and the `ref` follow
 * `as`, exactly as they do on `Button`.
 *
 * @extraProp {'button' | 'submit' | 'reset'} [type=button] - On a `<button>`, `button` unless you pass `submit` or `reset`, so it never submits a form by accident. With another `as`, it passes through as given.
 * @extraProp {PolymorphicRef<React.ElementType>} [ref] - Ref forwarded to the element `as` renders, typed from `as`.
 */
export type IconButtonProps<T extends React.ElementType = 'button'> =
  IconButtonOwnProps &
    IconButtonName &
    Omit<
      React.ComponentPropsWithoutRef<T>,
      keyof IconButtonOwnProps | 'aria-label' | 'aria-labelledby' | 'as'
    > & {
      /**
       * Render as a `<button>`, an `<a>`, or a custom component such as a
       * router `Link`, as on `Button`.
       * @defaultValue 'button'
       */
      as?: T;
    };

/**
 * The shape the implementation destructures. The public contract is the
 * generic `IconButtonProps<T>` above, and the body can't see through `T`, so
 * it reads the widest form of the props it touches.
 */
type IconButtonImplProps = IconButtonOwnProps & {
  as?: React.ElementType;
  type?: unknown;
  'aria-label'?: unknown;
  'aria-labelledby'?: unknown;
};

/** Whether a string has something in it besides spaces. */
const hasText = (value: unknown) =>
  typeof value === 'string' && value.trim() !== '';

/** Whether a node draws anything, the way EmptyState and Timeline ask it. */
const isGiven = (
  node: React.ReactNode
): node is Exclude<React.ReactNode, null | undefined | boolean> =>
  node !== undefined &&
  node !== null &&
  typeof node !== 'boolean' &&
  node !== '';

/**
 * The `IconButton` component renders a button that shows only an icon, and requires a name for it.
 *
 * It renders through `Button`, so it takes everything `Button` takes, and
 * adds the icon and a name the types require: `aria-label`, or
 * `aria-labelledby` in its place. Bulma keeps a button whose only child is an
 * `.icon` square at every size, and `isRounded` makes it a circle. It has no
 * tooltip of its own: wrap it in `Tooltip` for a description.
 *
 * @function
 * @param {IconButtonProps} props - Props for the IconButton component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The rendered button, anchor, or custom element.
 * @see {@link https://bulma.io/documentation/elements/button/ | Bulma Button documentation}
 *
 * @example
 * <IconButton icon="trash" aria-label="Delete" color="danger" />
 *
 * @example
 * <IconButton aria-label="Settings">
 *   <Icon name="cog" />
 * </IconButton>
 */
export const IconButton = forwardRef(function IconButton(
  props: IconButtonProps,
  ref: React.Ref<HTMLElement>
) {
  const { icon, children, className, ...rest } = props as IconButtonImplProps;

  const iconButtonClass = usePrefixedClassNames('icon-button');

  const unnamed =
    !hasText(rest['aria-label']) && !hasText(rest['aria-labelledby']);
  // Only top-level text, Fragments opened up, and only in development, where
  // the warning below can say something about it.
  const textInside =
    isDev() &&
    flattenChildren(children).some(
      child =>
        typeof child === 'number' ||
        (typeof child === 'string' && child.trim() !== '')
    );
  useEffect(() => {
    if (unnamed) {
      warnOnce(
        'IconButton:unnamed',
        '[bestax-bulma] <IconButton> has no accessible name. Pass ' +
          'aria-label naming what it does ("Delete"), or aria-labelledby, ' +
          'so a screen reader has something to announce.'
      );
    }
    if (textInside) {
      warnOnce(
        'IconButton:text',
        '[bestax-bulma] <IconButton> was given text as children. Its ' +
          'aria-label replaces the text as its name, so a button with text ' +
          'is a <Button>.'
      );
    }
  }, [unnamed, textInside]);

  const glyph = !isGiven(icon) ? null : typeof icon === 'string' ? (
    <Icon name={icon} />
  ) : React.isValidElement(icon) && icon.type === Icon ? (
    icon
  ) : (
    <Icon>{icon}</Icon>
  );

  // `type` is a button's only on a `<button>`. On an `<a>` it's the MIME hint,
  // and a custom component owns what it means, so those get it as given.
  const tag = rest.as ?? 'button';
  const typeProp =
    tag === 'button' ? { type: buttonType(rest.type) } : undefined;

  return (
    <Button
      // IconButton is polymorphic through to Button, which resolves the
      // element from `as`. TS can't infer that through the spread, so the
      // props and the ref are read at Button's default element.
      {...(rest as ButtonProps)}
      {...typeProp}
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classNames(iconButtonClass, className)}
    >
      {glyph}
      {children}
    </Button>
  );
}) as PolymorphicComponent<IconButtonOwnProps & IconButtonName, 'button'>;

IconButton.displayName = 'IconButton';

export default IconButton;
