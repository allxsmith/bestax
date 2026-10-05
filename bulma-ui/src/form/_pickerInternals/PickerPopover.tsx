import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../../helpers/classNames';
import { useFocusTrap } from '../../helpers/useFocusTrap';
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
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const resolved = useAnchoredPosition(anchorRef, panelRef, {
    active: isOpen,
    position,
    fixed: appendToBody,
    // A portaled panel takes its gap from `--bulma-picker-popover-offset` as
    // a margin, so its coordinates leave the gap out and `auto` reads it off
    // the panel. An in-place panel's gap is in its `top` or `bottom`, which
    // `auto` cannot read, so it keeps the hook's default estimate.
    offset: appendToBody ? 0 : undefined,
    styledGap: marginGap,
  });

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
      onClose();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [isOpen, closeOnClickOutside, anchorRef, onClose]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape || !isBrowser) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeOnEscape, onClose]);

  useFocusTrap(panelRef, {
    active: isOpen && trapFocus,
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
    >
      {children}
    </div>
  );

  if (appendToBody && isBrowser) {
    return createPortal(panel, document.body);
  }
  return panel;
};

PickerPopover.displayName = 'PickerPopover';

export default PickerPopover;
