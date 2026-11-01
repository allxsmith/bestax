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
   * it does. Give the glyph here or as `children`, not both: with both, it
   * draws `icon` and warns in development.
   */
  icon?: React.ReactNode;
  /**
   * The glyph as children, the way Mantine, MUI and Chakra take it: an
   * `<Icon>` renders as given, and any other node, such as an SVG, goes
   * inside an `Icon`, as with `icon`. Left out when `icon` is given, which
   * warns in development. Text warns too, since `aria-label` replaces it as
   * the name: a button with text is a `Button`.
   */
  children?: React.ReactNode;
}

/** Names an IconButton by the text of another element. */
export interface IconButtonLabelledBy {
  /** The id of the element whose text names the button, in place of `aria-label`. */
  'aria-labelledby': string;
  /**
   * @internal Not with `aria-labelledby`, which already names the button.
   * Declared so the two can't be passed together.
   */
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
  /**
   * @internal Not with `aria-label`. Declared so the two can't be passed
   * together.
   */
  'aria-labelledby'?: undefined;
}

/**
 * How an IconButton gets its name: `aria-label`, or `aria-labelledby` in its
 * place. `IconButtonLabel` comes last because TypeScript names the union's
 * last member when neither is given: under "No overload matches this call",
 * each overload's error ends "Property ''aria-label'' is missing … but
 * required in type 'IconButtonLabel'".
 */
export type IconButtonName = IconButtonLabelledBy | IconButtonLabel;

/**
 * Props for the IconButton component. The DOM attributes and the `ref` follow
 * `as`, exactly as they do on `Button`.
 *
 * @extraProp {string} [type='button'] - On a `<button>`, `'button'`, `'submit'` or `'reset'`, and `'button'` unless you pass one of the other two, so it never submits a form by accident. With another `as`, whatever that element or component takes, passed through as given, such as an `<a>`'s MIME type.
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

/** Whether a string is only spaces, which JSX leaves between elements. */
const isBlank = (node: React.ReactNode) =>
  typeof node === 'string' && node.trim() === '';

/**
 * The glyph in one `.icon`, which is what Bulma keeps square: an `<Icon>` as
 * given, Fragments opened up and blank text left out, and anything else
 * inside an `Icon`. Null when there's nothing to draw, so an empty Fragment
 * or array counts as no glyph.
 */
function iconOf(node: React.ReactNode) {
  const items = flattenChildren(node).filter(item => !isBlank(item));
  if (items.length === 0) return null;
  const [only] = items;
  if (items.length === 1 && React.isValidElement(only) && only.type === Icon) {
    return only;
  }
  return <Icon>{items}</Icon>;
}

/** The glyph `icon` draws: a string is an `Icon` name, the rest as `iconOf`. */
function iconFromProp(icon: React.ReactNode) {
  if (typeof icon !== 'string') return iconOf(icon);
  return hasText(icon) ? <Icon name={icon} /> : null;
}

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
  // Each way of giving the glyph counts only if it draws something, so an
  // empty Fragment or array as `icon` doesn't hide real children, and an
  // empty one as children doesn't warn.
  const fromIcon = iconFromProp(icon);
  const fromChildren = iconOf(children);
  const both = fromIcon !== null && fromChildren !== null;
  // Only top-level text, Fragments opened up, and only in development, where
  // the warning below can say something about it.
  const textInside =
    isDev() &&
    flattenChildren(children).some(
      child => typeof child === 'number' || hasText(child)
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
    if (both) {
      warnOnce(
        'IconButton:icon-and-children',
        '[bestax-bulma] <IconButton> was given both icon and children. It ' +
          'draws icon and leaves the children out: give the glyph one way.'
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
  }, [unnamed, both, textInside]);

  // One glyph, from `icon` or else from `children`, so the button's only
  // child is one `.icon`, which Bulma keeps square, and round with
  // `isRounded`.
  const glyph = fromIcon ?? fromChildren;

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
    </Button>
  );
}) as PolymorphicComponent<IconButtonOwnProps & IconButtonName, 'button'>;

IconButton.displayName = 'IconButton';

export default IconButton;
