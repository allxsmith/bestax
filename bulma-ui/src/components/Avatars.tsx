import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Avatar, AvatarProps } from './Avatar';

/** Valid overlap spacing values for the Avatars component. */
export type AvatarsSpacing = 'sm' | 'md' | 'lg';

/**
 * Props for the Avatars component.
 */
export interface AvatarsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Show only the first `max` children, replacing the overflow with a "+N" surplus avatar. A single overflow avatar is shown directly rather than as a pointless "+1". */
  max?: number;
  /** Uniform size applied to every child `Avatar` (and the surplus avatar). */
  size?: AvatarProps['size'];
  /** Uniform shape applied to every child `Avatar` (and the surplus avatar); a child's own `shape` wins when this is unset. */
  shape?: AvatarProps['shape'];
  /** Space between avatars: a preset or a pixel `number`. The overlap distance, or the gap when `spaced`. */
  spacing?: AvatarsSpacing | number;
  /** Lay the avatars out side by side (non-overlapping), using `spacing` as the gap. */
  spaced?: boolean;
  /** Builds the surplus avatar's accessible name from the hidden count, for localization. Default: `` `${count} more` ``. */
  surplusLabel?: (count: number) => string;
  /** `Avatar` elements to render inside the group. */
  children?: React.ReactNode;
}

/**
 * Flattens Fragment children (recursively) into a flat element array so they
 * participate in max clamping and size/shape injection. Children.toArray keys
 * restart at ".0" inside each fragment, so fragment children are re-keyed by
 * prefixing the fragment's own key — otherwise a fragment sibling of a direct
 * child would collide (both ".0") and trigger duplicate-key warnings.
 */
function flattenChildren(
  children: React.ReactNode,
  keyPrefix = ''
): React.ReactElement<AvatarProps>[] {
  return React.Children.toArray(children).flatMap(child => {
    if (!React.isValidElement(child)) return [];
    if (child.type === React.Fragment) {
      return flattenChildren(
        (child.props as { children?: React.ReactNode }).children,
        keyPrefix + child.key
      );
    }
    const el = child as React.ReactElement<AvatarProps>;
    return [
      keyPrefix ? React.cloneElement(el, { key: keyPrefix + el.key }) : el,
    ];
  });
}

/**
 * The `Avatars` component renders an overlapping/stacked group of `Avatar`s, the "members" list pattern.
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
const AvatarsComponent: React.FC<AvatarsProps> = ({
  className,
  max,
  size,
  shape,
  spacing = 'md',
  spaced = false,
  surplusLabel,
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

  const childArray = flattenChildren(children);

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
          alt={
            // `||` (not a plain ternary): an empty string from surplusLabel
            // would make the bubble decorative (alt="") and hide the count
            // from assistive tech — fall back to the default label instead.
            surplusLabel?.(overflowCount) || `${overflowCount} more`
          }
          size={size}
          shape={shape}
          className={surplusClass}
        />
      )}
    </div>
  );
};

export const Avatars = withSubComponents(
  AvatarsComponent,
  { Avatar },
  'Avatars'
);

export default Avatars;
