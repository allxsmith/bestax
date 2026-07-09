import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Avatar, AvatarProps } from './Avatar';

/** Valid overlap spacing values for the Avatars component. */
export type AvatarsSpacing = 'sm' | 'md' | 'lg';

/**
 * Props for the Avatars component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {number} [max] - Show only the first `max` children, replacing the overflow with a "+N" surplus avatar. A single overflow avatar is shown directly rather than as a pointless "+1".
 * @property {AvatarProps['size']} [size] - Uniform size applied to every child `Avatar` (and the surplus avatar).
 * @property {AvatarProps['shape']} [shape] - Uniform shape applied to every child `Avatar` (and the surplus avatar).
 * @property {AvatarsSpacing | number} [spacing] - Space between avatars: a `'sm'`/`'md'`/`'lg'` preset or a pixel `number`. Default `'md'`.
 * @property {boolean} [spaced] - Lay the avatars out side by side (non-overlapping) with `spacing` as the gap. Default `false`.
 * @property {React.ReactNode} [children] - `Avatar` elements to render inside the group.
 */
export interface AvatarsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  max?: number;
  size?: AvatarProps['size'];
  shape?: AvatarProps['shape'];
  spacing?: AvatarsSpacing | number;
  spaced?: boolean;
  children?: React.ReactNode;
}

/**
 * Avatars component for rendering an overlapping/stacked group of `Avatar`s.
 *
 * Clamps to `max`, rendering the overflow as a single "+N" surplus avatar. Mirrors the
 * `Tags`/`Buttons` sibling-plural-container convention.
 *
 * @function
 * @param {AvatarsProps} props - Props for the Avatars component.
 * @returns {JSX.Element} The rendered avatars group.
 *
 * @example
 * <Avatars max={3} size="48x48">
 *   {members.map(m => <Avatar key={m.id} src={m.photo} name={m.name} />)}
 * </Avatars>
 */
export const Avatars: React.FC<AvatarsProps> & { Avatar: typeof Avatar } = ({
  className,
  max,
  size,
  shape,
  spacing = 'md',
  spaced = false,
  style,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  // A preset spacing maps to a class; a numeric spacing sets the CSS var inline
  // (mirrors Sidebar's inline --bulma-* width var).
  const isPresetSpacing = typeof spacing === 'string';
  const avatarsClasses = usePrefixedClassNames('avatars', {
    [`is-spacing-${spacing}`]: isPresetSpacing,
    'is-spaced': spaced,
  });
  const spacingStyle: React.CSSProperties | undefined =
    typeof spacing === 'number'
      ? ({ '--bulma-avatars-spacing': `${spacing}px` } as React.CSSProperties)
      : undefined;

  const surplusClass = usePrefixedClassNames('is-surplus');

  const combinedClasses = classNames(
    avatarsClasses,
    bulmaHelperClasses,
    className
  );

  const childArray = React.Children.toArray(children).filter(
    React.isValidElement
  ) as React.ReactElement<AvatarProps>[];

  const maxCount =
    typeof max === 'number' && Number.isInteger(max) && max >= 0
      ? max
      : undefined;
  const overshoot = maxCount !== undefined ? childArray.length - maxCount : 0;
  // A "+1" surplus bubble occupies the same slot the hidden avatar would, so
  // only collapse into a surplus when it stands in for two or more avatars; a
  // single overflow avatar is shown directly.
  const clamp = maxCount !== undefined && overshoot >= 2;
  const visibleChildren = clamp ? childArray.slice(0, maxCount) : childArray;
  const overflowCount = clamp ? overshoot : 0;

  return (
    <div
      className={combinedClasses}
      style={{ ...spacingStyle, ...style }}
      {...rest}
    >
      {visibleChildren.map(child =>
        // Conditional-spread so an unset group size/shape doesn't clobber a
        // child that set its own.
        React.cloneElement(child, {
          ...(size !== undefined ? { size } : {}),
          ...(shape !== undefined ? { shape } : {}),
        })
      )}
      {overflowCount > 0 && (
        <Avatar
          initials={`+${overflowCount}`}
          alt={`${overflowCount} more`}
          size={size}
          shape={shape}
          color="light"
          className={surplusClass}
        />
      )}
    </div>
  );
};

Avatars.displayName = 'Avatars';
Avatars.Avatar = Avatar;

export default Avatars;
