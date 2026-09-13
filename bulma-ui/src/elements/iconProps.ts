import React from 'react';
import type { IconProps } from './Icon';

/**
 * Distinguishes an `IconProps` object from a plain custom node (an inline SVG, a
 * `react-icons` component, …) in a slot that accepts either — `Control`'s
 * `iconLeft`/`iconRight`, `IconText`'s `iconProps`.
 *
 * One copy, imported by both consumers: two hand-maintained copies, one per
 * consumer, is how the deprecated `icon` path came to crash both (#663).
 *
 * Its own module rather than `Icon.tsx` because `src/index.ts` wildcard-exports
 * that file, and everything published there is public forever. `polymorphic.ts`
 * makes the same call for `isCustomElement`: an internal discriminator is not
 * something to support for the life of the package.
 *
 * It tests each member's VALUE, not merely its key. `'icon' in value` was enough
 * to claim a Font Awesome `IconDefinition` — `{ prefix, iconName, icon: [w, h, …,
 * path] }` — whose `icon` is a path array rather than a class string. That object
 * is not a renderable node either, so the honest outcome is the one this slot has
 * always had for it: the node branch, and React's own "Objects are not valid as a
 * React child". Claiming it here instead rendered a blank container that still
 * reserved layout.
 *
 * A member added to `IconProps` needs a line here, and a missed one is a crash
 * rather than a fallthrough. That is the cost of a slot taking either a props
 * object or a node; keeping the guard in one place is what keeps the cost to a
 * single line.
 */
export function isIconProps(
  value: IconProps | React.ReactNode
): value is IconProps {
  if (typeof value !== 'object' || value === null) return false;
  if (React.isValidElement(value)) return false;
  const candidate = value as {
    name?: unknown;
    icon?: unknown;
    children?: unknown;
  };
  return (
    typeof candidate.name === 'string' ||
    typeof candidate.icon === 'string' ||
    'children' in candidate
  );
}
