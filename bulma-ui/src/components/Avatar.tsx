import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { buttonType } from '../helpers/buttonType';
import {
  isCustomElement,
  type PolymorphicComponent,
} from '../helpers/polymorphic';
import { warnOnce } from '../helpers/devWarnings';

const avatarColors = [
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

/** Valid color values for the Avatar component. */
export type AvatarColor = (typeof avatarColors)[number];

const autoAvatarColors: AvatarColor[] = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
];

const avatarSizes = [
  '16x16',
  '24x24',
  '32x32',
  '48x48',
  '64x64',
  '96x96',
  '128x128',
] as const;

/** Valid preset size values for the Avatar component. */
export type AvatarSize = (typeof avatarSizes)[number];

/**
 * The roles a caller can use to say "this avatar is not a control", and so claim
 * the non-interactive treatment for a custom `as` target we would otherwise have
 * to guess about.
 *
 * Read by VALUE, not by presence. Any role at all used to count, which let
 * `role="button"` — a claim of the opposite — route a real control into the
 * decorative branch and come out `aria-hidden` and nameless. `img` is what the
 * fallback itself applies; `presentation` and `none` are the standard ways to say
 * an element carries no semantics, which is what pairs with `alt=""`.
 */
const NON_INTERACTIVE_ROLES: readonly string[] = [
  'img',
  'presentation',
  'none',
];

/**
 * Elements other than `a` that declare `target` themselves, so on them it is
 * the element's own attribute and not a link attribute Avatar withholds for
 * want of one. The link attribute warning leaves `target` out on these, the way
 * it leaves `rel` out everywhere. `area` and `base` are void elements, which
 * Avatar's content rules out, so `form` is the one a caller can reach.
 */
const ELEMENTS_WITH_OWN_TARGET: readonly React.ElementType[] = [
  'form',
  'area',
  'base',
];

/** Valid shape values for the Avatar component. */
export type AvatarShape = 'circle' | 'rounded' | 'square';

/**
 * Derives a small set of initials from a name (e.g. "Ada Lovelace" -> "AL").
 */
function getInitialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  // Iterate by code point (Array.from) so astral-plane characters (emoji, some
  // CJK) don't get split into half surrogates.
  if (words.length === 1) {
    return Array.from(words[0]).slice(0, 2).join('').toUpperCase();
  }
  const first = Array.from(words[0])[0];
  const last = Array.from(words[words.length - 1])[0];
  return (first + last).toUpperCase();
}

/**
 * Deterministically hashes a string to pick one of the auto avatar colors.
 */
function getAutoColor(name: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % autoAvatarColors.length;
  return autoAvatarColors[index];
}

/**
 * Default generic avatar icon shown when there is no image, name, initials, or icon.
 */
function DefaultAvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-9 2.24-9 5v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2c0-2.76-4.58-5-9-5Z"
      />
    </svg>
  );
}

/**
 * The Avatar component's own props — everything it adds on top of the
 * attributes of whatever element `as` renders.
 */
export interface AvatarOwnProps extends Omit<BulmaClassesProps, 'color'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Image URL. On load error (or if absent), falls back to initials, then `icon`. */
  src?: string;
  /**
   * Alternate text for the image (used for the accessible name in every render mode). An
   * explicit `alt=""` marks a non-interactive avatar as decorative.
   *
   * A link or button avatar is never decorative — it keeps an accessible name — and a custom
   * component passed to `as` counts as one unless it states otherwise, so `alt=""` on a custom
   * wrapper needs that signal alongside it. `as` documents which props carry it.
   */
  alt?: string;
  /** Derives initials and a deterministic background color when no `src` is shown. */
  name?: string;
  /** Explicit initials override (else derived from `name`). */
  initials?: string;
  /** Final fallback, rendered when there is no `src`, `name`, or `initials`. */
  icon?: React.ReactNode;
  /** Preset size, or a pixel size when a number. */
  size?: AvatarSize | number;
  /** Avatar shape. Default `'circle'`. */
  shape?: AvatarShape;
  /** Background color for initials/icon avatars (else auto-derived from `name`). */
  color?: AvatarColor;
  /**
   * When set, renders the avatar as a link: an `<a>` unless `as` names the element itself. An
   * `as` target declaring its own `href` supersedes this one, and its type and its requiredness
   * are what apply.
   *
   * It is passed on only to a target that can be a link: an `a`, a custom element, or a
   * component. Any other `as` you pass, such as `'figure'` or `'div'`, still accepts it but
   * renders without it, because an `href` is not valid HTML on those elements, and a
   * development build logs a console warning naming what was dropped. To make such an avatar a
   * link, render it `as="a"` or pass a link component to `as`. An empty `href` asks for no link:
   * with no `as` it renders a `<figure>`, and it draws no warning.
   */
  href?: string;
  /** Anchor target, passed on only where `href` is (an `a`, a custom element, or a component) and superseded by the target's own declaration the way `href` is. Any other `as` you pass renders without it, with the same development warning as `href`, except `'form'`: it declares its own `target`, so there the attribute is still withheld but draws no warning. */
  target?: string;
  /** Anchor rel, passed on only where `href` is (an `a`, a custom element, or a component) and superseded by the target's own declaration the way `href` is. */
  rel?: string;
  /** Extra props forwarded to the underlying `<img>` (e.g. `loading`, `crossOrigin`); its `onError` is chained before the fallback fires. */
  imageProps?: React.ImgHTMLAttributes<HTMLImageElement>;
  /** Inline styles, merged after the size style. */
  style?: React.CSSProperties;
  /**
   * Not accepted. Avatar always renders its own content — the image, the
   * initials, or the icon — so anything a caller passed would be replaced. It
   * is declared unavailable rather than derived from `as`, which would let a
   * target requiring `children` compel a value it then never receives.
   * @internal
   */
  children?: never;
}

/**
 * The own props Avatar hands to the element `as` names rather than consuming.
 *
 * They are what *chooses* the element when `as` is absent — an `<a>` with an
 * `href`, a `<figure>` without one — so Avatar has to accept them before `as` is
 * known. Declaring them is only half of it. `PolymorphicProps` explains what
 * naming them here buys, and what leaving them unnamed cost (#665).
 */
type AvatarForwardedProp = 'href' | 'target' | 'rel';

/**
 * Props for the Avatar component. The DOM attributes and the `ref` both follow
 * `as`.
 *
 * `href`, `target` and `rel` are Avatar's own props only for a target that has
 * none of its own: `<Avatar href="/x" />` needs no `as`, while
 * `<Avatar as={NextLink} />` takes `next/link`'s `href` — required, and a URL
 * object as readily as a string.
 *
 * The type parameter defaults to `'figure'`, not to `React.ElementType`.
 * Defaulting to the constraint sounds truer to a runtime default that is
 * conditional, but `ComponentPropsWithoutRef<React.ElementType>` spreads across
 * every element at once and accepts anything — which is the false-positive this
 * whole change exists to remove. `'figure'` is the element a no-`href` avatar
 * actually renders, and the anchor props it can additionally take are declared
 * above.
 *
 * @extraProp {PolymorphicRef<React.ElementType>} [ref] - Ref forwarded to the element `as` renders, typed from `as`: the DOM node for an intrinsic tag, or whatever handle a custom component exposes.
 */
export type AvatarProps<T extends React.ElementType = 'figure'> = Omit<
  AvatarOwnProps,
  Extract<AvatarForwardedProp, keyof React.ComponentPropsWithoutRef<T>>
> &
  Omit<
    React.ComponentPropsWithoutRef<T>,
    Exclude<keyof AvatarOwnProps, AvatarForwardedProp> | 'as'
  > & {
    /**
     * Element/component to render as. Defaults to `'a'` when `href` is set, else `'figure'`.
     *
     * This also decides whether the avatar is treated as interactive, which is what keeps
     * `role="img"` and the `alt=""` decorative opt-out off a link or button. A custom
     * component counts — a router link takes `to` rather than this component's `href`, so
     * its own props cannot say — while `'a'`, `'button'`, and a custom element given an
     * `href` count for the reason they read.
     *
     * If your custom component renders something that really is just a picture, say so with
     * `role="img"` and it is treated as one, `alt=""` included. A truthy `aria-hidden` says it
     * too, and so do `role="presentation"` and `role="none"` — though ARIA's own conflict
     * resolution drops those two whenever the avatar still carries a name, so prefer
     * `role="img"`. A role claiming the opposite, such as `"button"`, says nothing here, and
     * neither does an `href`: that settles it on its own. A genuine `'a'`/`'button'`/`href`
     * avatar keeps its accessible name either way.
     *
     * `'button'` renders `type="button"` unless you pass `type="submit"` or `type="reset"`, so
     * an avatar inside a form does not submit it.
     */
    as?: T;
  };

/**
 * The shape the implementation destructures. The public contract is the generic
 * `AvatarProps<T>` above — the body cannot see through `T`, so it names the
 * handful of DOM props it actually reads back off `rest`.
 */
type AvatarImplProps = AvatarOwnProps & {
  as?: React.ElementType;
  role?: React.AriaRole;
  'aria-hidden'?: React.AriaAttributes['aria-hidden'];
  'aria-label'?: string;
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
};

/**
 * The `Avatar` component represents a person or entity as a compact image.
 *
 * @function
 * @param {AvatarProps} props - Props for the Avatar component.
 * @param {React.Ref} ref - Forwarded ref to the element `as` renders.
 * @returns {JSX.Element} The rendered avatar element.
 *
 * @example
 * <Avatar src="/users/ada.jpg" name="Ada Lovelace" size="64x64" />
 * @example
 * <Avatar name="Grace Hopper" />
 */
export const Avatar = forwardRef(function Avatar(
  avatarProps: AvatarProps,
  ref: React.Ref<HTMLElement>
) {
  const {
    className,
    src,
    alt,
    name,
    initials,
    icon,
    size,
    shape = 'circle',
    color,
    as,
    href,
    target,
    rel,
    imageProps,
    style,
    ...props
  } = avatarProps as AvatarImplProps;
  // Tracks the src that failed to load. A src change clears the latch during
  // render (React's "reset state when props change" pattern) so a previously
  // failed src is retried when switched back to. The img is additionally
  // keyed by src so a swap discards the old DOM node — a late error event
  // from the previous request can't fire on a retained node and latch the
  // replacement src as failed.
  const [erroredSrc, setErroredSrc] = useState<string | undefined>(undefined);
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setErroredSrc(undefined);
  }
  const imgRef = useRef<HTMLImageElement>(null);

  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  const showImage = !!src && src !== erroredSrc;

  // Catch images that failed before hydration: in SSR/static pages a broken
  // image can finish loading before React attaches its onError, so it never
  // fires. A complete image with no intrinsic width is a load failure.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setErroredSrc(src);
    }
  }, [src]);

  const resolvedInitials = initials
    ? initials.toUpperCase()
    : name
      ? getInitialsFromName(name)
      : '';
  const showInitials = !showImage && !!resolvedInitials;
  const showIcon = !showImage && !showInitials && !!icon;
  const showDefaultIcon = !showImage && !showInitials && !showIcon;

  const resolvedColor = color ?? (name ? getAutoColor(name) : undefined);

  const isPresetSize = typeof size === 'string' && avatarSizes.includes(size);
  const sizeStyle =
    typeof size === 'number'
      ? { width: size, height: size, fontSize: size / 2.5 }
      : undefined;

  const avatarClasses = usePrefixedClassNames('avatar', {
    [`is-${size}`]: isPresetSize,
    [`is-${shape}`]: shape,
    [`is-${resolvedColor}`]:
      resolvedColor && !showImage && avatarColors.includes(resolvedColor),
  });

  const combinedClasses = classNames(
    avatarClasses,
    bulmaHelperClasses,
    className
  );

  const initialsClass = usePrefixedClassNames('avatar-initials');

  const Tag: React.ElementType = as ?? (href ? 'a' : 'figure');
  // A custom component counts as interactive whether or not it was given OUR
  // href: a router link takes `to`, creates the anchor itself, and cannot be
  // classified from the props it arrives with (#668). Marking a real link as a
  // picture is the worse failure — and `alt=""` would go further and mark it
  // decorative (aria-hidden), leaving it nameless.
  //
  // A custom ELEMENT still needs the href. A hyphenated tag renders a real DOM
  // element of that name, so nothing is hidden from us: without a link to follow
  // it is still a picture. `Navbar.Link` draws the same line for `role="button"`.
  //
  // Where we are guessing, the caller settles it: an explicit `role` or
  // `aria-hidden` states the semantics, so a custom component that really is a
  // wrapper gets `role="img"` and its `alt=""` opt-out back. `role` alone would
  // be a half-override — interactivity also drives the decorative opt-out and the
  // name fallback, and overriding one of the three is worse than overriding none.
  //
  // An `href` ENDS the guess, so it outranks the signal. `as="a"`, `as="button"`
  // and a target we were handed an href for are known to be interactive, and there
  // the rule that an interactive element always carries an accessible name is not
  // the caller's to waive: without this, `as={RouterLink} href="/x" role="img"`
  // with `alt=""` rendered a real anchor as `aria-hidden` and nameless — the very
  // failure #668 is about. `Navbar.Link` orders the same two the same way.
  //
  // The signal has to MEAN what it is used for, so both halves read a value rather
  // than a presence — the way `Navbar.Link` reads `role === 'button'`. A role only
  // claims to be a picture if it says so: `role="button"` or `role="link"` is the
  // opposite claim, and taking any role as the signal handed an interactive-role
  // element `aria-hidden` and no name. Likewise `aria-hidden={false}` denies
  // hiding, so only a truthy one counts.
  const ariaHidden = rest['aria-hidden'];
  const statesItIsNotAControl =
    (rest.role !== undefined && NON_INTERACTIVE_ROLES.includes(rest.role)) ||
    ariaHidden === true ||
    ariaHidden === 'true';

  const customTargetStatesSemantics =
    typeof Tag !== 'string' && href == null && statesItIsNotAControl;

  const isInteractive =
    Tag === 'a' ||
    Tag === 'button' ||
    (typeof Tag !== 'string' && !customTargetStatesSemantics) ||
    (isCustomElement(Tag) && href != null);

  // Only forward link attributes when rendering an anchor or a custom (non-DOM)
  // component; a plain `as="div"` must not receive a stray `href`/`target`/`rel`.
  const isLinkLike =
    Tag === 'a' || typeof Tag !== 'string' || isCustomElement(Tag);
  // A plain element like a `div` declares no `href` or `target`, so the type
  // accepts them as Avatar's own while the drop below withholds them, and
  // without this they would vanish in silence (#733). Forwarding them would put
  // them where HTML has no such attribute, so the drop stays and development
  // reports it instead, naming only the ones actually passed.
  //
  // `rel` is withheld too but left out here. React declares it on every
  // element, so on a plain `as` it is that element's own attribute, and
  // "render it as a link" would be the wrong advice for it. `target` is the
  // same on an element that declares it, such as `form`, so it is left out
  // there. Whether to forward either one to such an element is a separate
  // question from this warning.
  //
  // Only for an `as` the caller wrote. Without one the element is Avatar's own
  // choice, and a message naming an `as` they never passed sends them looking
  // for it. A value counts when it is truthy, the same test that picks `'a'`
  // over `'figure'`, so an empty `href` from data asks for no link and draws no
  // warning. The key is the element plus the attributes passed, so a re-render
  // or a list of avatars warns once, while a different combination on the same
  // element still gets its own warning rather than hiding behind the first.
  //
  // Development-only is `warnOnce`'s job, as it is for the colour warnings, so
  // this block has no production check of its own. One here would have to read
  // `process` safely, and a `typeof process` test is not something a bundler
  // replaces: in a browser it is false, and the warning never fired in the
  // development builds it exists for. The cost is that production still
  // collects the attributes and builds the message for an avatar that needs
  // it, which is small and limited to the case the warning is about.
  if (as != null && !isLinkLike) {
    const dropped = Object.entries({
      href,
      target: ELEMENTS_WITH_OWN_TARGET.includes(as) ? undefined : target,
    })
      .filter(([, value]) => value)
      .map(([key]) => key);
    if (dropped.length > 0) {
      warnOnce(
        `Avatar:link-props-on-${as}:${dropped.join('+')}`,
        `[bestax-bulma] <Avatar as="${as}" ${dropped.join(' ')}>: this ` +
          `<${as}> renders without ` +
          `${dropped.map(key => `"${key}"`).join(' and ')}, because Avatar ` +
          `passes link attributes on only to a target that can be a link (an ` +
          `"a", a custom element, or a component). To make it a link, render ` +
          `it as="a" or pass a link component to "as".`
      );
    }
  }
  // Present-only, not `{ href, target, rel }`. An unconditional spread hands the
  // target these keys whatever the caller passed, and a key existing is not free:
  // a target that tests for one sees a link where there is none, and one that
  // spreads its own `{...rest}` onward passes the nothing along. It is NOT about
  // a destructuring default, which an explicit `undefined` triggers just as an
  // absent key does. What stops a target that REQUIRES one from being rendered
  // without it is the type (#665) — this is the smaller half, and the backstop for
  // the callers a type does not reach: a plain-JavaScript one and a loose spread,
  // the same pair `Button` and `Menu.Item` keep their own filters for.
  const linkProps = isLinkLike
    ? {
        ...(href !== undefined && { href }),
        ...(target !== undefined && { target }),
        ...(rel !== undefined && { rel }),
      }
    : {};

  // alt coalesces with ?? (not ||) so an explicit alt="" survives as the
  // standard decorative marker instead of being overridden by name.
  const accessibleName = alt ?? name;
  // The decorative opt-out never applies to an interactive avatar — a link or
  // button must always expose an accessible name.
  const isDecorative = alt === '' && !isInteractive;

  const a11yDefaults: {
    'aria-label'?: string;
    role?: 'img';
    'aria-hidden'?: true;
  } = showImage
    ? isInteractive && !accessibleName
      ? // The img alt normally names the control; with no alt/name (an API
        // returning only a photo URL) the link/button would be nameless.
        { 'aria-label': name || 'Avatar' }
      : {}
    : isDecorative
      ? { 'aria-hidden': true }
      : {
          ...(isInteractive ? {} : { role: 'img' as const }),
          'aria-label': accessibleName || name || 'Avatar',
        };

  // Each default yields to a value the caller passed, and is applied after
  // `rest` reading through it rather than spread before it. React treats an
  // `undefined` attribute as "remove it", and a spread carrying the key with no
  // value is how that arrives, so a default spread first was erased by it: an
  // `aria-label: undefined` left a button avatar nameless, and `role` and
  // `aria-hidden` went the same way. The button `type` below has the same
  // shape (#690).
  const a11yProps = Object.fromEntries(
    Object.entries(a11yDefaults).map(([key, fallback]) => [
      key,
      rest[key as keyof typeof a11yDefaults] ?? fallback,
    ])
  );

  return (
    <Tag
      ref={ref}
      className={combinedClasses}
      style={{ ...sizeStyle, ...style }}
      {...linkProps}
      {...rest}
      {...a11yProps}
      // A clickable avatar inside a form must not submit it, and `<button>`
      // defaults to type="submit". A caller's `submit` or `reset` still wins.
      // Anything else becomes `button`, since HTML reads a value it does not
      // define for a button as submit too; `buttonType` says more.
      //
      // After `rest`, reading through it rather than before it: React treats
      // `type={undefined}` as "remove the attribute", and a spread carrying the
      // key with no value is how that arrives. Spreading the default first let
      // such a spread erase it (#690), so the guard only held for callers who
      // passed nothing. `Dropdown.Item` and `Menu.Item` apply their button
      // type after the spread too.
      {...(Tag === 'button' ? { type: buttonType(rest.type) } : {})}
    >
      {showImage && (
        <img
          key={src}
          {...imageProps}
          ref={imgRef}
          src={src}
          alt={accessibleName ?? ''}
          onError={e => {
            imageProps?.onError?.(e);
            setErroredSrc(src);
          }}
        />
      )}
      {showInitials && (
        <span className={initialsClass}>{resolvedInitials}</span>
      )}
      {showIcon && icon}
      {showDefaultIcon && <DefaultAvatarIcon />}
    </Tag>
  );
}) as PolymorphicComponent<AvatarOwnProps, 'figure', AvatarForwardedProp>;

Avatar.displayName = 'Avatar';

export default Avatar;
