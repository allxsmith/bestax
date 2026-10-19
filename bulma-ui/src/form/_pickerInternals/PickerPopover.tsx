import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../../helpers/classNames';
import { useFocusTrap } from '../../helpers/useFocusTrap';
import { usePortalContainer } from '../../helpers/portal';
import { isEventInside } from '../../helpers/shadowDom';
import { useLatestRef } from '../../helpers/useLatestRef';
import {
  marginGap,
  useAnchoredPosition,
} from '../../helpers/useAnchoredPosition';
import { PickerPosition } from './pickerTypes';

export interface PickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  position?: PickerPosition;
  appendToBody?: boolean;
  className?: string;
  trapFocus?: boolean;
  closeOnClickOutside?: boolean;
  /** Close on Escape and on Alt+ArrowUp. Default `true`. */
  closeOnEscape?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  role?: 'dialog' | 'group';
  id?: string;
  /**
   * Where focus goes when the popover closes. Without it, focus goes back to
   * whatever had it when the focus trap turned on, which is read after the
   * panel's content mounts: a calendar that focuses a cell as it mounts
   * would be recorded instead, and that cell leaves with the panel.
   */
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * Selects the element in the panel that takes focus as it opens, such as a
   * calendar's focused date rather than the first button in its header. When
   * nothing matches, or the match can't take focus, the first tab stop does.
   */
  initialFocusSelector?: string;
}

const isBrowser = typeof window !== 'undefined';

export const PickerPopover: React.FC<PickerPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  children,
  position = 'bottom-left',
  appendToBody = false,
  className,
  trapFocus = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  ariaLabel,
  ariaLabelledBy,
  role = 'dialog',
  id,
  restoreFocusRef,
  initialFocusSelector,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const resolveContainer = usePortalContainer();
  // Read as the trap turns on, once the panel's content has rendered.
  const initialFocusRef = useMemo(
    () =>
      initialFocusSelector === undefined
        ? undefined
        : {
            get current() {
              return (
                panelRef.current?.querySelector<HTMLElement>(
                  initialFocusSelector
                ) ?? null
              );
            },
          },
    [initialFocusSelector]
  );
  const resolved = useAnchoredPosition(anchorRef, panelRef, {
    active: isOpen,
    position,
    fixed: appendToBody,
    // The gap comes from `--bulma-picker-popover-offset` as a margin, in place
    // or portaled, so the coordinates leave it out and `auto` reads it off
    // the panel.
    offset: 0,
    styledGap: marginGap,
  });

  // Read when a press lands outside or a key arrives, so both listeners stay
  // put while `onClose` changes identity, as an inline one does on every
  // render of the field.
  const onCloseRef = useLatestRef(onClose);

  useEffect(() => {
    if (!isOpen || !closeOnClickOutside || !isBrowser) return undefined;
    // Listen on `pointerdown` (rather than `mousedown`) so touch starts
    // outside the popover dismiss it on mobile — including swipe-from-outside
    // gestures, where the synthetic mouse event would otherwise lag a few
    // hundred ms behind the actual touch.
    const handler = (e: PointerEvent) => {
      const path = e.composedPath();
      if (panelRef.current && path.includes(panelRef.current)) return;
      if (anchorRef.current && path.includes(anchorRef.current)) return;
      onCloseRef.current();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [isOpen, closeOnClickOutside, anchorRef, onCloseRef]);

  // Escape closes it, and so does Alt+ArrowUp, the combobox's key for it,
  // which the calendar and the time wheels inside leave to it. Escape closes
  // it from anywhere, but the key is only the picker's when it was pressed in
  // the panel or the field: then it's marked used, so a Modal or Sidebar
  // around the picker stays open. From anywhere else, such as a dialog opened
  // over the picker, the key goes on to whatever has focus.
  useEffect(() => {
    if (!isOpen || !closeOnEscape || !isBrowser) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (
          isEventInside(e, panelRef.current) ||
          isEventInside(e, anchorRef.current)
        ) {
          e.preventDefault();
        }
        onCloseRef.current();
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeOnEscape, anchorRef, onCloseRef]);

  useFocusTrap(panelRef, {
    active: isOpen && trapFocus,
    initialFocusRef,
    restoreFocus: restoreFocusRef ?? true,
  });

  const panelClass = usePrefixedClassNames('picker-popover', {
    'is-active': isOpen,
    [`is-${resolved.position}`]: true,
    'is-portal': appendToBody,
  });

  if (!isOpen) return null;

  const style: React.CSSProperties = appendToBody
    ? {
        position: 'fixed',
        top: resolved.top,
        left: resolved.left,
      }
    : {};

  const panel = (
    <div
      ref={panelRef}
      id={id}
      role={role}
      aria-modal={role === 'dialog' ? 'false' : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      tabIndex={-1}
      className={classNames(panelClass, className)}
      style={style}
      // An Escape pressed in the panel is the picker's, and the listener
      // above claims it. A Dropdown menu around the picker hears Escape in a
      // React handler, which runs before that listener, so the panel claims
      // it here too, where React gets to it first.
      onKeyDown={e => {
        if (closeOnEscape && e.key === 'Escape') e.preventDefault();
      }}
    >
      {children}
    </div>
  );

  if (appendToBody && isBrowser) {
    return createPortal(panel, resolveContainer());
  }
  return panel;
};

PickerPopover.displayName = 'PickerPopover';

export default PickerPopover;
