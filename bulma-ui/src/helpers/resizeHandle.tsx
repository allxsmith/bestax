// INTERNAL: deliberately not exported from src/index.ts.
import React, { useEffect, useRef, useState } from 'react';
import { classNames } from './classNames';
import { useLatestRef } from './useLatestRef';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { moveFocusOut } from './moveFocusOut';
import {
  ChevronNextIcon,
  ChevronPrevIcon,
  ChevronsNextIcon,
  ChevronsPrevIcon,
} from './chevronIcons';

// A page's own cursor and text selection, kept while any handle in it is
// being dragged: the first drag to start saves them and the last to end puts
// them back, so two at once, as two fingers can make, leave nothing behind.
// Each document keeps its own, so a handle in an iframe holds that page.
const holds = new WeakMap<
  Document,
  { drags: number; cursor: string; userSelect: string }
>();

/**
 * Shows `cursor` everywhere in `doc` and stops text selection there for one
 * drag, and returns what ends it.
 */
function holdPage(doc: Document, cursor: string) {
  const body = doc.body.style;
  let hold = holds.get(doc);
  if (!hold) {
    hold = { drags: 0, cursor: body.cursor, userSelect: body.userSelect };
    holds.set(doc, hold);
  }
  hold.drags += 1;
  body.cursor = cursor;
  body.userSelect = 'none';
  return () => {
    hold.drags -= 1;
    if (hold.drags > 0) return;
    body.cursor = hold.cursor;
    body.userSelect = hold.userSelect;
    holds.delete(doc);
  };
}

/**
 * The buttons a handle shows beside it, for a pointer that can't drag. They
 * sit beside the `separator` rather than in it, since a separator's children
 * are presentational, and they take no room: the stylesheet draws them over
 * the line.
 */
export interface ResizeHandleButtons {
  /** Prefixed classes: the box over the line, each half of it, each button. */
  className: string;
  groupClass: string;
  buttonClass: string;
  /**
   * The names of the buttons that move the line toward its start and its
   * end: up and down, or toward the inline start and end, which right to
   * left are the right and the left. A click takes an arrow key's step, and
   * ten times as far with Shift.
   */
  start: string;
  end: string;
  /**
   * A button that does what Enter does: its name, which stays as it is
   * pressed, the side the line moves to as it shuts what it resizes, and
   * whether that's shut now, which `aria-expanded` says and which turns its
   * arrows around.
   */
  toggle?: { name: string; side: 'start' | 'end'; collapsed: boolean };
}

/** Props for ResizeHandle. */
export interface ResizeHandleProps {
  /** Its class, prefixed. */
  className: string;
  /** The class it takes while a drag holds it, prefixed. */
  activeClass: string;
  /**
   * Which way its line runs: `vertical` between parts side by side, moved by
   * Left and Right, or `horizontal` between stacked ones, moved by Up and
   * Down. It's the separator's `aria-orientation`.
   */
  orientation: 'horizontal' | 'vertical';
  /** The separator's value now, and its limits, in the caller's units. */
  valueNow: number;
  valueMin: number;
  valueMax: number;
  /** Its name. */
  label?: string;
  /** The id of what names it, when that's an element. */
  labelledBy?: string;
  /** The id of what it resizes. */
  controls?: string;
  /**
   * Whether the page runs right to left, read as each drag or key starts. A
   * `vertical` line then moves the way the key points or the pointer goes,
   * so forward is left. A `horizontal` one moves up and down either way.
   */
  rtl: () => boolean;
  /**
   * A drag is starting. Returning `false` turns it down, when there's
   * nothing to measure it against.
   */
  onDragStart: () => boolean;
  /**
   * How far the pointer has moved since the drag started, in pixels, forward
   * positive: right, or down, or left right to left.
   */
  onDrag: (moved: number) => void;
  /** A drag is over: let go, cancelled, or the handle lost the pointer. */
  onDragEnd?: () => void;
  /**
   * An arrow key: 1 forward or -1 back, as for a drag, times ten with Shift.
   * Returning `false` leaves the key alone.
   */
  onStep: (by: number) => boolean | void;
  /** Home and End: to the lower and the upper limit. */
  onHome: () => boolean | void;
  onEnd: () => boolean | void;
  /** Enter: shut what it resizes, or bring it back. */
  onEnter: () => boolean | void;
  /** A double click: back to the default. */
  onReset: () => void;
  /**
   * It, or one of its buttons, took focus, or a button is being pressed,
   * before a key or a click: read anything they measure from.
   */
  onFocus?: () => void;
  /** Buttons beside it that do what its keys do. Without it, none. */
  buttons?: ResizeHandleButtons;
}

/**
 * A handle's buttons: one toward the line's start and one toward its end,
 * each taking an arrow key's step, and the one Enter's, when there is one.
 * A step toward the start is a step back whichever way the page reads, so
 * they need no mirroring: the stylesheet turns their arrows instead.
 */
function HandleButtons({
  buttons,
  controls,
  separatorRef,
  onStep,
  onEnter,
  onFocus,
}: {
  buttons: ResizeHandleButtons;
  controls?: string;
  separatorRef: React.RefObject<HTMLDivElement | null>;
  onStep: ResizeHandleProps['onStep'];
  onEnter: ResizeHandleProps['onEnter'];
  onFocus: ResizeHandleProps['onFocus'];
}) {
  // Buttons that go while one has focus, as AppFrame's do when its column
  // collapses, hand it to the handle rather than drop it to the page.
  const boxRef = useRef<HTMLDivElement | null>(null);
  useClientLayoutEffect(() => {
    const box = boxRef.current!;
    const separator = separatorRef.current;
    return () => moveFocusOut([box], separator, null);
  }, [separatorRef]);
  const button = (
    name: string,
    icon: React.ReactNode,
    onClick: (event: React.MouseEvent) => void,
    expanded?: boolean
  ) => (
    <button
      type="button"
      className={buttons.buttonClass}
      aria-label={name}
      aria-controls={controls}
      aria-expanded={expanded}
      onFocus={onFocus}
      onPointerDown={onFocus}
      onClick={onClick}
    >
      {icon}
    </button>
  );
  const step = (by: 1 | -1) => (event: React.MouseEvent) => {
    onStep(by * (event.shiftKey ? 10 : 1));
  };
  const { toggle } = buttons;
  // Its arrows point the way it shuts, and back once it's shut.
  const toggleButton =
    toggle &&
    button(
      toggle.name,
      (toggle.side === 'start') !== toggle.collapsed ? (
        <ChevronsPrevIcon />
      ) : (
        <ChevronsNextIcon />
      ),
      () => {
        onEnter();
      },
      !toggle.collapsed
    );
  return (
    <div ref={boxRef} className={buttons.className}>
      <div className={buttons.groupClass}>
        {toggle?.side === 'start' && toggleButton}
        {button(buttons.start, <ChevronPrevIcon />, step(-1))}
      </div>
      <div className={buttons.groupClass}>
        {button(buttons.end, <ChevronNextIcon />, step(1))}
        {toggle?.side === 'end' && toggleButton}
      </div>
    </div>
  );
}

/**
 * A handle that resizes what's beside it: a focusable `separator` with its
 * values, dragged with the pointer captured, and moved by keys. The arrow
 * keys step along it, mirrored right to left, and Shift goes ten times as
 * far; Home and End go to its limits, Enter shuts what it resizes and brings
 * it back, and a double click resets it. With `buttons`, a click on one
 * does what a key does. Splitter renders one between each pair of panes,
 * and AppFrame.Nav one on its edge. What a move means is the caller's: the
 * handle reports pixels and keys.
 *
 * @function
 * @param {ResizeHandleProps} props - Props for ResizeHandle.
 * @returns {JSX.Element} The rendered handle.
 */
export function ResizeHandle({
  className,
  activeClass,
  orientation,
  valueNow,
  valueMin,
  valueMax,
  label,
  labelledBy,
  controls,
  rtl,
  onDragStart,
  onDrag,
  onDragEnd,
  onStep,
  onHome,
  onEnd,
  onEnter,
  onReset,
  onFocus,
  buttons,
}: ResizeHandleProps) {
  // A line between parts side by side moves across, so it follows clientX.
  const across = orientation === 'vertical';

  // ---- Dragging ----
  // One pointer drags at a time: the one that started it moves it and ends
  // it, and another on the handle meanwhile does neither.
  const [dragging, setDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    start: number;
    flip: boolean;
    pointerId: number;
  } | null>(null);
  const ownDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    return drag && drag.pointerId === event.pointerId ? drag : null;
  };
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || dragRef.current) return;
    if (!onDragStart()) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      start: across ? event.clientX : event.clientY,
      flip: across && rtl(),
      pointerId: event.pointerId,
    };
    setDragging(true);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = ownDrag(event);
    if (!drag) return;
    const moved = (across ? event.clientX : event.clientY) - drag.start;
    onDrag(drag.flip ? -moved : moved);
  };
  // Let go, cancelled, or the pointer lost, as a handle that the page hides
  // or removes mid-drag does.
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!ownDrag(event)) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragging(false);
    onDragEnd?.();
  };
  // While dragging, the resize cursor shows wherever the pointer goes in the
  // handle's own document.
  useEffect(() => {
    if (!dragging) return;
    return holdPage(
      elementRef.current!.ownerDocument,
      across ? 'col-resize' : 'row-resize'
    );
  }, [dragging, across]);
  // A handle that goes away mid-drag, as one turned off does, ends the drag,
  // so whatever the drag set up is put back.
  const onDragEndRef = useLatestRef(onDragEnd);
  useEffect(
    () => () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      onDragEndRef.current?.();
    },
    [onDragEndRef]
  );

  // ---- Keys ----
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const back = across ? 'ArrowLeft' : 'ArrowUp';
    const forward = across ? 'ArrowRight' : 'ArrowDown';
    let handled: boolean | void;
    if (event.key === back || event.key === forward) {
      // The line moves the way the key points, so right to left, moving
      // right is moving back.
      const direction =
        (event.key === forward ? 1 : -1) * (across && rtl() ? -1 : 1);
      handled = onStep(direction * (event.shiftKey ? 10 : 1));
    } else if (event.key === 'Home') {
      handled = onHome();
    } else if (event.key === 'End') {
      handled = onEnd();
    } else if (event.key === 'Enter') {
      handled = onEnter();
    } else {
      return;
    }
    if (handled === false) return;
    event.preventDefault();
  };

  return (
    <>
      <div
        ref={elementRef}
        className={classNames(className, dragging && activeClass)}
        role="separator"
        tabIndex={0}
        aria-orientation={orientation}
        aria-valuenow={Math.round(valueNow)}
        aria-valuemin={Math.round(valueMin)}
        aria-valuemax={Math.round(valueMax)}
        aria-controls={controls}
        aria-label={label}
        aria-labelledby={labelledBy}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onDoubleClick={onReset}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
      />
      {buttons && (
        <HandleButtons
          buttons={buttons}
          controls={controls}
          separatorRef={elementRef}
          onStep={onStep}
          onEnter={onEnter}
          onFocus={onFocus}
        />
      )}
    </>
  );
}
