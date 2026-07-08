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
 * @property {number} [max] - Show only the first `max` children, replacing the rest with a "+N" surplus avatar.
 * @property {AvatarProps['size']} [size] - Uniform size applied to every child `Avatar` (and the surplus avatar).
 * @property {AvatarsSpacing} [spacing] - Overlap amount between avatars. Default `'md'`.
 * @property {React.ReactNode} [children] - `Avatar` elements to render inside the group.
 */
export interface AvatarsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  className?: string;
  max?: number;
  size?: AvatarProps['size'];
  spacing?: AvatarsSpacing;
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
export const Avatars: React.FC<AvatarsProps> = ({
  className,
  max,
  size,
  spacing = 'md',
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const avatarsClasses = usePrefixedClassNames('avatars', {
    [`is-spacing-${spacing}`]: spacing,
  });

  const surplusClass = usePrefixedClassNames('is-surplus');

  const combinedClasses = classNames(
    avatarsClasses,
    bulmaHelperClasses,
    className
  );

  const childArray = React.Children.toArray(children).filter(
    React.isValidElement
  ) as React.ReactElement<AvatarProps>[];

  const maxCount = typeof max === 'number' && max >= 0 ? max : undefined;
  const visibleChildren =
    maxCount !== undefined ? childArray.slice(0, maxCount) : childArray;
  const overflowCount =
    maxCount !== undefined ? Math.max(childArray.length - maxCount, 0) : 0;

  return (
    <div className={combinedClasses} {...rest}>
      {visibleChildren.map(child =>
        React.cloneElement(child, {
          size: size ?? child.props.size,
        })
      )}
      {overflowCount > 0 && (
        <Avatar
          initials={`+${overflowCount}`}
          alt={`${overflowCount} more`}
          size={size}
          color="light"
          className={surplusClass}
        />
      )}
    </div>
  );
};

Avatars.displayName = 'Avatars';

export default Avatars;
