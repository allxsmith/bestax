// INTERNAL: deliberately not exported from src/index.ts.
import { useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent, TouchEvent } from 'react';

/** A point in the viewport, in CSS pixels. */
export interface ContextMenuPoint {
  x: number;
  y: number;
}

/**
 * Options for `useContextMenuTrigger`.
 */
export interface UseContextMenuTriggerOptions {
  /**
   * Asks to open at `point`. `trigger` is the element the handlers are on,
   * for its document.
   */
  onOpen: (point: ContextMenuPoint, trigger: HTMLElement) => void;
  /** Leave the browser's own menu alone, and start no long press. */
  disabled: boolean;
}

/** Handlers for the trigger element. */
export interface ContextMenuTriggerHandlers {
  onContextMenu: (event: MouseEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
}

/** How long a touch or a pen has to stay down to open the menu, in milliseconds. */
export const LONG_PRESS_DELAY = 500;

/** How far a long press can move before it counts as something else, in CSS pixels. */
export const LONG_PRESS_TOLERANCE = 10;

/** A touch or a pen held on the trigger. */
interface Press {
  pointerId: number;
  /** What it landed on, which its `contextmenu` goes to. */
  target: Element;
  x: number;
  y: number;
  timer?: ReturnType<typeof setTimeout>;
  /** A `contextmenu` arrived while it was down, so the menu opened. */
  opened: boolean;
}

/**
 * The last press a trigger took. A press reaches every trigger it bubbles
 * through, the innermost first and all before the next press, so this is
 * how a trigger around another one knows the inner one took it.
 */
let claimed: Event | null = null;

/** Whether the event happened in the element its handler is on, rather than in content portaled out of it. */
const inTrigger = (event: { currentTarget: Element; target: EventTarget }) =>
  event.currentTarget.contains(event.target as Node);

/**
 * Where a `contextmenu` asks to open: at its point when that is on the
 * element it was fired at, which it is for the pointer, and at that
 * element's bottom-left corner otherwise, which is where the browser puts
 * its own menu for a key.
 */
function contextMenuPoint(event: MouseEvent<HTMLElement>): ContextMenuPoint {
  const { clientX: x, clientY: y } = event;
  const rect = (event.target as Element).getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    ? { x, y }
    : { x: rect.left, y: rect.bottom };
}

/**
 * Decides when a context menu asks to open, and where. It renders nothing,
 * and knows nothing about ARIA or the menu.
 *
 * - **`contextmenu`:** a right-click, and Shift+F10 or the context menu key
 *   where the browser fires the event for them, asks to open at the point
 *   `contextMenuPoint` works out, and prevents the browser's own menu. Each
 *   one asks again, so a right-click elsewhere on the trigger moves it.
 * - **Long press:** a touch or a pen held still on the trigger for
 *   `LONG_PRESS_DELAY` fires a `contextmenu` at what it landed on, so it
 *   takes the same path, handlers on the way included. Moving more than
 *   `LONG_PRESS_TOLERANCE`, lifting, another pointer coming down on the
 *   trigger, or `pointercancel`, which is the browser taking the gesture for
 *   a scroll or a zoom, cancels it, and a mouse never starts one. Where the
 *   browser fires `contextmenu` for a long press itself, the first of the two
 *   opens it, and the end of a touch that opened it is prevented, so lifting
 *   doesn't click what is under the finger.
 * - **Who opens:** a handler that calls `preventDefault()` on the
 *   `contextmenu` before this one keeps it from asking, which is how a
 *   trigger's own handler opts out and how the innermost of nested triggers
 *   wins. A long press goes to the innermost trigger that takes it. Events
 *   from content portaled out of the trigger, which React brings here
 *   anyway, are ignored.
 * - **`disabled`:** nothing asks, and the browser's menu shows.
 *
 * Nothing it scheduled runs after the component unmounts.
 *
 * @function useContextMenuTrigger
 * @param options - How to ask to open, and whether to.
 * @returns Handlers for the trigger element.
 */
export function useContextMenuTrigger({
  onOpen,
  disabled,
}: UseContextMenuTriggerOptions): ContextMenuTriggerHandlers {
  const pressRef = useRef<Press | null>(null);
  /** A long press opened the menu, and the touch that made it hasn't ended. */
  const heldRef = useRef(false);

  useEffect(
    () => () => {
      clearTimeout(pressRef.current?.timer);
      pressRef.current = null;
    },
    []
  );

  const cancel = () => {
    clearTimeout(pressRef.current?.timer);
    pressRef.current = null;
  };
  const isPress = (event: PointerEvent<HTMLElement>) =>
    pressRef.current?.pointerId === event.pointerId;

  return {
    onContextMenu: event => {
      if (disabled || event.defaultPrevented || !inTrigger(event)) return;
      event.preventDefault();
      const press = pressRef.current;
      if (press) {
        if (press.opened) return;
        clearTimeout(press.timer);
        press.opened = true;
        heldRef.current = true;
      }
      onOpen(contextMenuPoint(event), event.currentTarget);
    },
    onPointerDown: event => {
      const native = event.nativeEvent;
      if (pressRef.current) {
        // Another pointer coming down makes it a pinch, not a long press,
        // here and in any trigger around this one.
        cancel();
        claimed = native;
        return;
      }
      heldRef.current = false;
      if (
        disabled ||
        (event.pointerType !== 'touch' && event.pointerType !== 'pen') ||
        claimed === native ||
        !inTrigger(event)
      ) {
        return;
      }
      claimed = native;
      const press: Press = {
        pointerId: event.pointerId,
        target: event.target as Element,
        x: event.clientX,
        y: event.clientY,
        opened: false,
      };
      press.timer = setTimeout(() => {
        const view = press.target.ownerDocument.defaultView as typeof window;
        press.target.dispatchEvent(
          new view.MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: press.x,
            clientY: press.y,
            button: 2,
          })
        );
      }, LONG_PRESS_DELAY);
      pressRef.current = press;
    },
    onPointerMove: event => {
      const press = pressRef.current;
      if (!press || !isPress(event) || press.opened) return;
      const moved = Math.hypot(
        event.clientX - press.x,
        event.clientY - press.y
      );
      if (moved > LONG_PRESS_TOLERANCE) cancel();
    },
    onPointerUp: event => {
      if (isPress(event)) cancel();
    },
    onPointerCancel: event => {
      if (isPress(event)) cancel();
    },
    onTouchEnd: event => {
      if (!heldRef.current) return;
      heldRef.current = false;
      event.preventDefault();
    },
  };
}
