// INTERNAL: deliberately not exported from src/index.ts.
import type { DOMAttributes, MouseEventHandler } from 'react';
import { chain } from './useHoverOpen';

/** The mouse events `hoverHandlers` reads the hover from. */
type HoverEvents = 'onMouseEnter' | 'onMouseOver' | 'onMouseLeave';

/**
 * Mouse handlers for an element that does something while the pointer is
 * over it, such as pausing. They tell `onHoverChange` `true` when the pointer
 * comes onto the element and `false` when it leaves, after the caller's own
 * handlers in `own` run, so neither replaces the other.
 *
 * Any `mouseover` inside counts as the pointer coming on, beside the enter.
 * React makes the enter out of the `mouseout` on the element the pointer
 * left. When the page around an element in a shadow root is React's too, as
 * through a portal, that `mouseout` names only the shadow host, so no enter
 * reaches the element, while React still fires the `mouseover`. The leave
 * needs nothing more: leaving for the page, the `mouseout` comes from inside
 * the shadow root, so React makes the leave. `useHoverOpen` handles the same
 * case for pointer events.
 *
 * @function hoverHandlers
 * @param onHoverChange - Told whether the pointer is over the element, and
 *   told `true` again on each `mouseover` while it is.
 * @param own - The caller's own handlers for these events, if any.
 * @returns The handlers to put on the element.
 */
export function hoverHandlers<T extends Element>(
  onHoverChange: (hovered: boolean) => void,
  own: Pick<DOMAttributes<T>, HoverEvents> = {}
): Record<HoverEvents, MouseEventHandler<T>> {
  const enter = () => onHoverChange(true);
  return {
    onMouseEnter: chain(own.onMouseEnter, enter),
    onMouseOver: chain(own.onMouseOver, enter),
    onMouseLeave: chain(own.onMouseLeave, () => onHoverChange(false)),
  };
}
