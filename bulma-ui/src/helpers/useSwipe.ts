// INTERNAL: deliberately not exported from src/index.ts.
import { useCallback, useState } from 'react';
import type React from 'react';

/** Which way a finished swipe went, on screen: where the pointer travelled. */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/** How far, in CSS pixels, a drag has to travel along an axis to count. */
const SWIPE_THRESHOLD = 50;

/** Options for `useSwipe`. */
export interface UseSwipeOptions {
  /**
   * Whether a press starts a drag. A drag already under way still finishes.
   * @defaultValue true
   */
  enabled?: boolean;
  /**
   * Follow the vertical axis too, so a swipe up or down is reported. Off,
   * only the horizontal distance counts and `offsetY` stays `0`.
   * @defaultValue false
   */
  vertical?: boolean;
  /**
   * Called when a drag ends more than 50px from where it started along an
   * axis. With `vertical`, the axis it travelled further along decides.
   * The direction is physical, so a caller that follows the reading
   * direction maps it itself.
   */
  onSwipe: (direction: SwipeDirection) => void;
}

/** The mouse and touch handlers `useSwipe` hands back, to spread on the surface. */
export interface SwipeHandlers<T extends Element = Element> {
  /** Starts a drag. Calls `preventDefault()`, so the press neither selects text nor drags an image. */
  onMouseDown: (event: React.MouseEvent<T>) => void;
  /** Follows a drag. */
  onMouseMove: (event: React.MouseEvent<T>) => void;
  /** Ends a drag. */
  onMouseUp: () => void;
  /** Ends a drag when the pointer leaves the surface, as a release would. */
  onMouseLeave: () => void;
  /** Starts a drag with the first finger. */
  onTouchStart: (event: React.TouchEvent<T>) => void;
  /** Follows the first finger. */
  onTouchMove: (event: React.TouchEvent<T>) => void;
  /** Ends a drag. */
  onTouchEnd: () => void;
}

/** What `useSwipe` returns. */
export interface UseSwipeResult<T extends Element = Element> {
  /** Whether a drag is under way. */
  isSwiping: boolean;
  /** How far the drag has gone across, in CSS pixels, `0` between drags. */
  offsetX: number;
  /** How far the drag has gone down (up is negative), `0` without `vertical`. */
  offsetY: number;
  /** The handlers to put on the surface that takes the drag. */
  handlers: SwipeHandlers<T>;
  /** Drops the drag under way without reporting a swipe, as when a second finger lands. */
  cancel: () => void;
}

const AT_REST = { x: 0, y: 0 };

/**
 * Follows a mouse or touch drag on a surface and reports a swipe when it
 * ends far enough from where it started. Carousel's drag, shared: it hands
 * back the handlers to put on the surface and the live offset to draw the
 * drag with, and leaves what a swipe does to the component.
 *
 * @function
 * @param {UseSwipeOptions} options - Whether it's on, the axes, and the callback.
 * @returns {UseSwipeResult} The drag's state, its handlers, and a way to drop it.
 */
export function useSwipe<T extends Element = Element>({
  enabled = true,
  vertical = false,
  onSwipe,
}: UseSwipeOptions): UseSwipeResult<T> {
  const [isSwiping, setIsSwiping] = useState(false);
  const [start, setStart] = useState(AT_REST);
  const [offset, setOffset] = useState(AT_REST);

  const begin = useCallback(
    (x: number, y: number) => {
      if (!enabled) return;
      setIsSwiping(true);
      setStart({ x, y: vertical ? y : 0 });
      setOffset(AT_REST);
    },
    [enabled, vertical]
  );

  const follow = useCallback(
    (x: number, y: number) => {
      if (!isSwiping) return;
      setOffset({ x: x - start.x, y: vertical ? y - start.y : 0 });
    },
    [isSwiping, start, vertical]
  );

  const end = useCallback(() => {
    if (!isSwiping) return;
    setIsSwiping(false);

    if (vertical && Math.abs(offset.y) > Math.abs(offset.x)) {
      if (offset.y > SWIPE_THRESHOLD) onSwipe('down');
      else if (offset.y < -SWIPE_THRESHOLD) onSwipe('up');
    } else if (offset.x < -SWIPE_THRESHOLD) {
      onSwipe('left');
    } else if (offset.x > SWIPE_THRESHOLD) {
      onSwipe('right');
    }

    setOffset(AT_REST);
  }, [isSwiping, vertical, offset, onSwipe]);

  const cancel = useCallback(() => {
    setIsSwiping(false);
    setOffset(AT_REST);
  }, []);

  return {
    isSwiping,
    offsetX: offset.x,
    offsetY: offset.y,
    handlers: {
      onMouseDown: event => {
        event.preventDefault();
        begin(event.clientX, event.clientY);
      },
      onMouseMove: event => follow(event.clientX, event.clientY),
      onMouseUp: end,
      onMouseLeave: end,
      onTouchStart: event =>
        begin(event.touches[0].clientX, event.touches[0].clientY),
      onTouchMove: event =>
        follow(event.touches[0].clientX, event.touches[0].clientY),
      onTouchEnd: end,
    },
    cancel,
  };
}
