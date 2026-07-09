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
 * @property {number | string} [content] - Count or short text to display; omit with `dot` for a plain dot.
 * @property {number} [max] - Numeric `content` above this renders as `"{max}+"`. Default `99`.
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
  content?: number | string;
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
  const hasContent = content !== undefined && (!isZero || showZero);
  const shouldRender = dot || hasContent || invisible;

  const displayValue = useMemo(() => {
    if (dot || !hasContent) return undefined;
    if (typeof content === 'number') {
      return content > max ? `${max}+` : String(content);
    }
    return content;
  }, [dot, hasContent, content, max]);

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
    : { role: 'status' as const, 'aria-label': String(displayValue ?? '') };

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
