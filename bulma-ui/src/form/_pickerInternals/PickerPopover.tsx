import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../../helpers/classNames';
import { useFocusTrap } from './useFocusTrap';
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
}

const isBrowser = typeof window !== 'undefined';

interface ResolvedPosition {
  position: Exclude<PickerPosition, 'auto'>;
  top?: number;
  left?: number;
}

function resolveAuto(
  rect: DOMRect,
  panelWidth: number,
  panelHeight: number
): Exclude<PickerPosition, 'auto'> {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fitsBelow = rect.bottom + panelHeight + 4 <= vh;
  const fitsRight = rect.left + panelWidth <= vw;
  if (fitsBelow && fitsRight) return 'bottom-left';
  if (fitsBelow && !fitsRight) return 'bottom-right';
  if (!fitsBelow && fitsRight) return 'top-left';
  return 'top-right';
}

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
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = useState<ResolvedPosition>({
    position: position === 'auto' ? 'bottom-left' : position,
  });

  const updatePosition = useCallback(() => {
    if (!isBrowser || !isOpen) return;
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const rect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const w = panelRect.width;
    const h = panelRect.height;
    const finalPos = position === 'auto' ? resolveAuto(rect, w, h) : position;
    if (!appendToBody) {
      setResolved({ position: finalPos });
      return;
    }
    let top = 0;
    let left = 0;
    switch (finalPos) {
      case 'bottom-left':
        top = rect.bottom + 4;
        left = rect.left;
        break;
      case 'bottom-right':
        top = rect.bottom + 4;
        left = rect.right - w;
        break;
      case 'top-left':
        top = rect.top - h - 4;
        left = rect.left;
        break;
      case 'top-right':
        top = rect.top - h - 4;
        left = rect.right - w;
        break;
    }
    setResolved({ position: finalPos, top, left });
  }, [anchorRef, appendToBody, isOpen, position]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    updatePosition();
    if (!isBrowser) return undefined;
    const handler = () => updatePosition();
    window.addEventListener('resize', handler, { passive: true });
    window.addEventListener('scroll', handler, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, { capture: true });
    };
  }, [isOpen, updatePosition]);

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

  useFocusTrap(panelRef, isOpen && trapFocus);

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
