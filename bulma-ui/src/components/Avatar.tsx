import React, { useEffect, useRef, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

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
 * Props for the Avatar component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {string} [src] - Image URL. On load error (or if absent), falls back to initials, then icon.
 * @property {string} [alt] - Alternate text for the image (required for meaningful images).
 * @property {string} [name] - Derives initials and a deterministic background color when no `src`/`initials` is shown.
 * @property {string} [initials] - Explicit initials override (else derived from `name`).
 * @property {React.ReactNode} [icon] - Final fallback rendered when there is no `src`, `name`, or `initials`.
 * @property {AvatarSize | number} [size] - Preset size, or a pixel size when a number.
 * @property {AvatarShape} [shape] - Avatar shape. Default `'circle'`.
 * @property {AvatarColor} [color] - Background color for initials/icon avatars (else auto-derived from `name`).
 * @property {React.ElementType} [as] - Element/component to render as. Defaults to `'a'` when `href` is set, else `'figure'`.
 * @property {string} [href] - When set, renders the avatar as a link.
 * @property {string} [target] - Anchor target (forwarded only when rendering a link).
 * @property {string} [rel] - Anchor rel (forwarded only when rendering a link).
 * @property {React.ImgHTMLAttributes<HTMLImageElement>} [imageProps] - Extra props forwarded to the underlying `<img>` (e.g. `loading`, `crossOrigin`); its `onError` is chained before the fallback fires.
 */
export interface AvatarProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  className?: string;
  src?: string;
  alt?: string;
  name?: string;
  initials?: string;
  icon?: React.ReactNode;
  size?: AvatarSize | number;
  shape?: AvatarShape;
  color?: AvatarColor;
  as?: React.ElementType;
  href?: string;
  target?: string;
  rel?: string;
  imageProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

/**
 * Avatar component for representing a person or entity as a compact image.
 *
 * Falls back automatically: `src` (image) -> initials (from `initials`/`name`) -> `icon` ->
 * a generic default icon. Initials avatars get a stable auto background color derived from
 * `name` unless `color` is set.
 *
 * @function
 * @param {AvatarProps} props - Props for the Avatar component.
 * @returns {JSX.Element} The rendered avatar element.
 *
 * @example
 * <Avatar src="/users/ada.jpg" name="Ada Lovelace" size="64x64" />
 * @example
 * <Avatar name="Grace Hopper" />
 */
export const Avatar: React.FC<AvatarProps> = ({
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
}) => {
  // Tracks the src that failed to load (rather than a plain boolean) so a
  // new src is shown again without needing an effect to reset the flag.
  const [erroredSrc, setErroredSrc] = useState<string | undefined>(undefined);
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
  const isInteractive = Tag === 'a' || Tag === 'button';

  // Only forward link attributes when rendering an anchor or a custom (non-DOM)
  // component; a plain `as="div"` must not receive a stray `href`/`target`/`rel`.
  const isLinkLike = Tag === 'a' || typeof Tag !== 'string';
  const linkProps = isLinkLike ? { href, target, rel } : {};

  const a11yProps = showImage
    ? {}
    : {
        ...(isInteractive ? {} : { role: 'img' as const }),
        'aria-label': alt || name || 'Avatar',
      };

  return (
    <Tag
      className={combinedClasses}
      style={{ ...sizeStyle, ...style }}
      {...linkProps}
      {...a11yProps}
      {...rest}
    >
      {showImage && (
        <img
          {...imageProps}
          ref={imgRef}
          src={src}
          alt={alt || name || ''}
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
};

Avatar.displayName = 'Avatar';

export default Avatar;
