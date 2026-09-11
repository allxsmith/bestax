import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import {
  isCustomElement,
  type PolymorphicComponent,
} from '../helpers/polymorphic';

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
  /** Alternate text for the image (used for the accessible name in every render mode). An explicit `alt=""` marks a non-interactive avatar as decorative. */
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
  /** When set, renders the avatar as a link. */
  href?: string;
  /** Anchor target — forwarded only when rendering a link (an `a` or a custom `as` component). */
  target?: string;
  /** Anchor rel — forwarded only when rendering a link (an `a` or a custom `as` component). */
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
 * Props for the Avatar component. The DOM attributes and the `ref` both follow
 * `as`.
 *
 * `href`, `target` and `rel` stay Avatar's own props rather than being derived:
 * they are what *chooses* the element when `as` is absent (an `<a>` with an
 * `href`, a `<figure>` without one), so they have to be accepted before `as` is
 * known.
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
export type AvatarProps<T extends React.ElementType = 'figure'> =
  AvatarOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof AvatarOwnProps | 'as'> & {
      /** Element/component to render as. Defaults to `'a'` when `href` is set, else `'figure'`. */
      as?: T;
    };

/**
 * The shape the implementation destructures. The public contract is the generic
 * `AvatarProps<T>` above — the body cannot see through `T`.
 */
type AvatarImplProps = AvatarOwnProps & { as?: React.ElementType };

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
  // A custom `as` component given an href is being used as a link — the same
  // condition under which isLinkLike forwards href/target/rel below — so it
  // counts as interactive too. Otherwise alt="" would mark a real link
  // decorative (aria-hidden) and it could render nameless.
  const isInteractive =
    Tag === 'a' ||
    Tag === 'button' ||
    ((typeof Tag !== 'string' || isCustomElement(Tag)) && href != null);

  // Only forward link attributes when rendering an anchor or a custom (non-DOM)
  // component; a plain `as="div"` must not receive a stray `href`/`target`/`rel`.
  const isLinkLike =
    Tag === 'a' || typeof Tag !== 'string' || isCustomElement(Tag);
  const linkProps = isLinkLike ? { href, target, rel } : {};

  // alt coalesces with ?? (not ||) so an explicit alt="" survives as the
  // standard decorative marker instead of being overridden by name.
  const accessibleName = alt ?? name;
  // The decorative opt-out never applies to an interactive avatar — a link or
  // button must always expose an accessible name.
  const isDecorative = alt === '' && !isInteractive;

  const a11yProps = showImage
    ? isInteractive && !accessibleName
      ? // The img alt normally names the control; with no alt/name (an API
        // returning only a photo URL) the link/button would be nameless.
        { 'aria-label': name || 'Avatar' }
      : {}
    : isDecorative
      ? { 'aria-hidden': true as const }
      : {
          ...(isInteractive ? {} : { role: 'img' as const }),
          'aria-label': accessibleName || name || 'Avatar',
        };

  // A clickable avatar inside a form must not submit it; default the native
  // button type (an explicit type passed through rest still wins).
  const buttonTypeProps = Tag === 'button' ? { type: 'button' as const } : {};

  return (
    <Tag
      ref={ref}
      className={combinedClasses}
      style={{ ...sizeStyle, ...style }}
      {...buttonTypeProps}
      {...linkProps}
      {...a11yProps}
      {...rest}
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
}) as PolymorphicComponent<AvatarOwnProps, 'figure'>;

Avatar.displayName = 'Avatar';

export default Avatar;
