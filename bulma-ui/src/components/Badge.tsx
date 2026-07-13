import React, { useMemo } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

const badgeColors = [
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

/** Valid color values for the Badge component. */
export type BadgeColor = (typeof badgeColors)[number];

/** Valid corner position values for the Badge component. */
export type BadgePosition =
  'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/** Valid overlap adjustment values for the Badge component. */
export type BadgeOverlap = 'circle' | 'square';

/**
 * Props for the Badge component.
 *
 * @property {string} [className] - Additional CSS classes applied to the root (the wrapper when `children` are present, else the badge pill).
 * @property {string} [badgeClassName] - Additional CSS classes applied to the badge pill itself.
 * @property {React.ReactNode} [content] - Count, short text, or a custom node to display; omit with `dot` for a plain dot. `max`/`showZero` apply only to numeric content.
 * @property {number} [max] - Numeric `content` above this renders as `"{max}+"`. Default `99`; a
 * negative or non-integer value falls back to the default.
 * @property {boolean} [dot] - Render a small dot with no content.
 * @property {boolean} [showZero] - Show the badge when `content` is `0`. Default `false`.
 * @property {BadgeColor} [color] - Status color. Default `'danger'`.
 * @property {BadgePosition} [position] - Corner to overlay the badge on, relative to `children`. Default `'top-right'`.
 * @property {BadgeOverlap} [overlap] - Nudges the offset for a round (`'circle'`) vs rectangular (`'square'`) child. Default `'square'`.
 * @property {boolean} [pulse] - Processing/pulse animation; no-ops under `prefers-reduced-motion: reduce`.
 * @property {boolean} [invisible] - Hide the badge without unmounting it.
 * @property {React.ReactNode} [children] - The element the badge overlays. Omit to render a standalone badge.
 */
export interface BadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'content'>,
    Omit<BulmaClassesProps, 'color'> {
  className?: string;
  badgeClassName?: string;
  content?: React.ReactNode;
  max?: number;
  dot?: boolean;
  showZero?: boolean;
  color?: BadgeColor;
  position?: BadgePosition;
  overlap?: BadgeOverlap;
  pulse?: boolean;
  invisible?: boolean;
  children?: React.ReactNode;
}

/**
 * Badge component for a small status/count indicator overlaid on the corner of another
 * element (or rendered standalone).
 *
 * Renders `{max}+` when a numeric `content` exceeds `max`, hides at `0` unless `showZero`,
 * and no-ops its `pulse` animation under `prefers-reduced-motion: reduce`.
 *
 * @function
 * @param {BadgeProps} props - Props for the Badge component.
 * @returns {JSX.Element | null} The rendered badge (and children, if provided).
 *
 * @example
 * <Badge dot color="success" overlap="circle">
 *   <Avatar src="/users/ada.jpg" name="Ada" />
 * </Badge>
 * @example
 * <Badge content={128} max={99} color="danger">
 *   <Icon name="bell" />
 * </Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  className,
  badgeClassName,
  content,
  max = 99,
  dot = false,
  showZero = false,
  color = 'danger',
  position = 'top-right',
  overlap = 'square',
  pulse = false,
  invisible = false,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  const hasChildren = children != null && children !== false;

  const isZero = typeof content === 'number' && content === 0;
  const hasContent =
    content != null &&
    content !== false &&
    content !== true &&
    content !== '' &&
    (!isZero || showZero);
  const shouldRender = dot || hasContent || invisible;

  // A negative or non-integer max is nonsensical; fall back to the default
  // rather than render e.g. "-1+" (mirrors Avatars' max sanitization).
  const sanitizedMax = Number.isInteger(max) && max >= 0 ? max : 99;

  const displayValue = useMemo<React.ReactNode>(() => {
    if (dot || !hasContent) return undefined;
    // max only applies to numeric content; any other node renders verbatim.
    if (typeof content === 'number') {
      return content > sanitizedMax ? `${sanitizedMax}+` : String(content);
    }
    return content;
  }, [dot, hasContent, content, sanitizedMax]);

  // Only primitive content produces a meaningful aria-label; a custom node
  // supplies its own accessible text, so we leave role="status" unlabeled.
  const ariaLabel =
    typeof displayValue === 'string' || typeof displayValue === 'number'
      ? String(displayValue)
      : undefined;

  // Both prefixed-classname hooks stay above the early returns (Rules of Hooks).
  const wrapperClass = usePrefixedClassNames('badge-wrapper');
  const badgeClasses = usePrefixedClassNames('badge', {
    [`is-${color}`]: !!color && badgeColors.includes(color),
    // Corner position / overlap only mean anything inside a wrapper; emitting
    // them on a standalone badge shifts it out of normal flow via the transform.
    [`is-${position}`]: !!position && hasChildren,
    [`is-overlap-${overlap}`]: !!overlap && hasChildren,
    'is-standalone': !hasChildren,
    'is-dot': dot,
    'is-pulse': pulse,
    'is-invisible': invisible,
  });

  // badgeClassName is a plain (unprefixed) slot merged onto the pill, mirroring
  // Tooltip's tooltipClassName. Standalone badges have no wrapper, so the pill
  // is the root and takes className/helpers/rest directly.
  const pillClass = hasChildren
    ? classNames(badgeClasses, badgeClassName)
    : classNames(badgeClasses, badgeClassName, bulmaHelperClasses, className);

  const a11yProps = dot
    ? { 'aria-hidden': true as const }
    : {
        role: 'status' as const,
        ...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {}),
      };

  const indicator = shouldRender ? (
    <span className={pillClass} {...a11yProps} {...(hasChildren ? {} : rest)}>
      {!dot && displayValue}
    </span>
  ) : null;

  if (!hasChildren) {
    return indicator;
  }

  // Always render the wrapper when there are children so the root keeps
  // className/helpers/rest (data-testid, id, onClick, ...) even when the badge
  // itself is hidden.
  return (
    <span
      className={classNames(wrapperClass, bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
      {indicator}
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
