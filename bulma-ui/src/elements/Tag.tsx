import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { buttonType } from '../helpers/buttonType';
import {
  type AnchorOnlyAttributes,
  type ButtonOnlyAttributes,
  ANCHOR_ONLY_ATTRS,
  BUTTON_ONLY_ATTRS,
  omitAttrs,
} from '../helpers/anchorAttrs';

const validTagColors = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
] as const;

/**
 * Valid color values for the Tag component (Bulma tag colors).
 */
export type TagColor = (typeof validTagColors)[number];

const validTagSizes = ['normal', 'medium', 'large'] as const;
/**
 * Valid size values for the Tag component (Bulma tag sizes).
 */
export type TagSize = (typeof validTagSizes)[number];

/**
 * The set withheld from a button Tag, a delete tag's included: the
 * anchor-only attributes, minus
 * `type` (a button takes one too, and its branch reads it), plus `rel` (React
 * declares it on every element, so the derived set alone would not withhold
 * it), as `Card.FooterItem` withholds them.
 */
const STRIP_FROM_BUTTON: Readonly<
  Record<Exclude<keyof AnchorOnlyAttributes, 'type'> | 'rel', true>
> = (() => {
  const { type: _type, ...rest } = ANCHOR_ONLY_ATTRS;
  return { ...rest, rel: true };
})();

/**
 * Props for the Tag component.
 *
 * The anchor and button attributes arrive at every `as`. A link tag withholds
 * the button's (`BUTTON_ONLY_ATTRS`) and a button tag, a delete tag's
 * included, the link's (`STRIP_FROM_BUTTON`). A span tag passes on what it's
 * given, as it always has.
 */
export interface TagProps
  extends
    AnchorOnlyAttributes,
    ButtonOnlyAttributes,
    Omit<
      React.HTMLAttributes<
        HTMLSpanElement | HTMLAnchorElement | HTMLButtonElement
      >,
      'color'
    >,
    Omit<BulmaClassesProps, 'color'> {
  /**
   * Element to render (default `span`). A tag that does something, a filter
   * someone clicks or a topic it links to, takes `button` or `a`, so a
   * keyboard reaches it and a screen reader announces it as a button or a
   * link. Bulma styles both, and bestax's stylesheets give a button tag the
   * font and text a span takes from the text around it. A button renders
   * `type="button"`
   * unless you pass `submit` or `reset`. A link's attributes, such as `href`,
   * need `as="a"`, and a button's, such as `disabled`, `as="button"`. With
   * `isDelete`, the tag renders its delete button whatever this says.
   */
  as?: 'span' | 'a' | 'button' | undefined;
  /** Additional CSS classes to apply. */
  className?: string | undefined;
  /**
   * Bulma color modifier for the tag.
   *
   * `light` takes the light color's own text from bestax's stylesheets. With
   * Bulma's CSS alone, a light tag's text inherits the color around it, which
   * on a dark page is hard to read.
   */
  color?: TagColor | undefined;
  /** Tag size. */
  size?: TagSize | undefined;
  /**
   * Use the light color variant. The light color has none, so
   * `color="light"` with `isLight` looks the same as without it.
   *
   * `white`, `black` and `dark` with `isLight` keep Bulma's light
   * background, and bestax's stylesheets give their text the lightness a
   * light tag's text has. With Bulma's CSS alone, their text inherits the
   * color around it, which on a dark page is hard to read.
   */
  isLight?: boolean;
  /** Renders a rounded tag. */
  isRounded?: boolean;
  /**
   * Renders a delete-style tag (delete button). The button renders
   * `type="button"`, so it does not submit a form around it, and is named
   * "Delete tag" unless you pass an `aria-label`. An empty one, or a spread
   * carrying `'aria-label': undefined`, keeps that name rather than leaving
   * the button unnamed.
   *
   * "Delete tag" doesn't say which tag the button removes, so pass a name
   * that does, such as `aria-label="Remove React"`.
   */
  isDelete?: boolean;
  /**
   * Adds Bulma's hover shade and pointer cursor. It's only a look: a span tag
   * stays out of the keyboard's reach, so a tag that does something takes
   * `as="button"` or `as="a"` instead.
   */
  isHoverable?: boolean;
  /** Callback for delete tag/button. */
  onDelete?: () => void;
  /** Tag content. */
  children?: React.ReactNode;
}

/**
 * The `Tag` component renders a Bulma-styled label or badge.
 *
 * @function
 * @param {TagProps} props - Props for the Tag component.
 * @returns {JSX.Element} The rendered tag element.
 * @see {@link https://bulma.io/documentation/elements/tag/ | Bulma Tag documentation}
 */
export const Tag: React.FC<TagProps> = ({
  as = 'span',
  className,
  color,
  size,
  isLight,
  isRounded,
  isDelete,
  isHoverable,
  onDelete,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const bulmaClasses = usePrefixedClassNames('tag', {
    [`is-${color}`]: color && validTagColors.includes(color),
    [`is-${size}`]: size && size !== 'normal' && validTagSizes.includes(size),
    // The light color's own class is this key too, and this one comes later,
    // so it has to set the class for `light` as well or it erases it.
    'is-light': isLight || color === 'light',
    'is-rounded': isRounded,
    'is-delete': isDelete,
    'is-hoverable': isHoverable,
  });

  const tagClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  if (as === 'a' && !isDelete) {
    return (
      <a className={tagClasses} {...omitAttrs(rest, BUTTON_ONLY_ATTRS)}>
        {children}
      </a>
    );
  }

  // What a button takes, for a delete tag and a button tag alike.
  const forwarded = omitAttrs(rest, STRIP_FROM_BUTTON);

  if (isDelete) {
    return (
      <button
        className={tagClasses}
        onClick={onDelete}
        {...forwarded}
        // After the spread, reading through it: a key the spread carries with
        // no value would otherwise erase the default, leaving a nameless
        // button that submits the form around it. An empty label falls back
        // too: the button is drawn as an icon, so `''` would leave it unnamed.
        // A caller's own value still wins; `buttonType` says more.
        aria-label={forwarded['aria-label'] || 'Delete tag'}
        type={buttonType((forwarded as { type?: unknown }).type)}
      />
    );
  }

  if (as === 'button') {
    return (
      <button
        className={tagClasses}
        {...forwarded}
        // After the spread, so a `type` the spread carries with no value
        // still gets `button`; `buttonType` says more.
        type={buttonType((forwarded as { type?: unknown }).type)}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={tagClasses} {...rest}>
      {children}
    </span>
  );
};
