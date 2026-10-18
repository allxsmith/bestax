import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useScrollLock } from '../helpers/scrollLock';
import { useLatestRef } from '../helpers/useLatestRef';
import { useOverlayStack } from '../helpers/overlayStack';
import { useInertSiblings } from '../helpers/useInertSiblings';

/**
 * Overlay opacity levels for the Loading background.
 */
export type LoadingOverlay = 'light' | 'dark' | 'opaque';

/**
 * Color variants for the Loading spinner.
 */
export type LoadingColor =
  'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Props for the Loading component.
 * @extraProp {React.ReactNode} [children] - Content to display below the spinner.
 * @extraProp {string} [className] - Additional CSS classes.
 */
export interface LoadingProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size' | 'overlay'> {
  /**
   * Whether the loading overlay is visible. While it is, what it covers is
   * inert, out of reach of Tab, Enter, Space and screen readers as well as
   * the mouse: the other children of the element it's rendered in, so render
   * it directly inside the element it covers, or with `isFullPage` the rest
   * of the page. Its own content, the cancel button included, stays
   * reachable. Only what's there when it turns on is made inert, and an
   * element that was inert already is left as it was. A control under it
   * that had focus loses it, and gets it back when the loading goes away,
   * unless focus has moved on in the meantime.
   */
  active?: boolean;
  /**
   * Cover the entire viewport. While it's active, the rest of the page is
   * inert, as it is under a modal, rather than only the element it's
   * rendered in. So show one at a time: two side by side make each other
   * inert, cancel buttons and all. A full-page loading also takes its turn with
   * Modal and Sidebar for Escape: while it's the topmost open overlay, the
   * Modal or Sidebar under it doesn't answer Escape or hold Tab, whether or
   * not the loading can be cancelled.
   */
  isFullPage?: boolean;
  /** Size of the loading spinner. */
  size?: 'small' | 'medium' | 'large';
  /** Color variant for the spinner. Default is light grey. */
  color?: LoadingColor;
  /**
   * Show a cancel button and allow closing, by a click on the overlay or by
   * Escape. With `isFullPage`, the loading is an overlay like Modal and
   * Sidebar: only the topmost open overlay answers Escape, so a full-page
   * loading shown over a Modal cancels first, and the Modal closes on the
   * next Escape. Without it, Escape cancels once no Modal, Dialog, Sidebar or
   * full-page Loading is open. Either way it marks the Escape it cancels on as
   * used with `preventDefault()`. An Escape a popup on the page closed on, by
   * calling `preventDefault()`, doesn't cancel.
   */
  canCancel?: boolean;
  /** Callback when cancel is triggered. */
  onCancel?: () => void;
  /** Additional classes for the overlay. */
  overlayClassName?: string;
  /** Additional classes for the spinner icon. */
  iconClassName?: string;
  /** Custom loading indicator element. */
  indicator?: React.ReactNode;
  /** Style of the loading overlay. */
  overlay?: LoadingOverlay;
}

/**
 * The `Loading` component provides a loading overlay with a spinner animation.
 *
 * @function
 * @param {LoadingProps} props - Props for the Loading component.
 * @returns {JSX.Element | null} The rendered loading overlay or null if not active.
 *
 * @example
 * // Full page loading
 * <Loading active isFullPage />
 *
 * @example
 * // Container loading with message
 * <div style={{ position: 'relative', height: '200px' }}>
 *   <Loading active>Loading data...</Loading>
 * </div>
 *
 * @example
 * // With color variant
 * <Loading active color="primary" />
 *
 * @example
 * // With cancel functionality
 * <Loading
 *   active={isLoading}
 *   canCancel
 *   onCancel={() => setIsLoading(false)}
 * />
 */
export const Loading: React.FC<LoadingProps> = ({
  active = false,
  isFullPage = false,
  size,
  color,
  canCancel = false,
  onCancel,
  children,
  className,
  overlayClassName,
  iconClassName,
  indicator,
  overlay,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  // Generate Bulma classes with prefix
  const loadingClasses = usePrefixedClassNames('loading', {
    'is-active': active,
    'is-full-page': isFullPage,
    'is-cancelable': canCancel,
    [`is-${overlay}`]: !!overlay,
    [`is-${color}`]: !!color,
  });

  const iconClasses = usePrefixedClassNames('loading-icon', {
    [`is-${size}`]: size,
  });

  // Combine classes
  const combinedClasses = classNames(
    loadingClasses,
    bulmaHelperClasses,
    className
  );
  const combinedOverlayClasses = classNames(
    usePrefixedClassNames('loading-overlay'),
    overlayClassName
  );
  const combinedIconClasses = classNames(iconClasses, iconClassName);
  const loadingContentClass = usePrefixedClassNames('loading-content');
  const loadingIconCustomClass = usePrefixedClassNames('loading-icon-custom');
  const loadingTextClass = usePrefixedClassNames('loading-text');
  const loadingCancelClass = usePrefixedClassNames('loading-cancel');

  // Handle cancel click
  const handleOverlayClick = () => {
    if (canCancel && onCancel) {
      onCancel();
    }
  };

  // Read when Escape arrives, so the key listener stays put while `onCancel`
  // changes identity, as an inline one does on every render of the parent.
  const onCancelRef = useLatestRef(onCancel);
  const hasOnCancel = Boolean(onCancel);

  // A full-page loading covers everything under it, so it joins the stack of
  // open overlays and takes Escape from them while it's on top. One inside a
  // container covers only that, so it stays out and waits, as a Toast does,
  // until no overlay is open.
  const isTopmost = useOverlayStack(active && isFullPage);

  // What the overlay covers ignores the mouse already, and is made inert so
  // Tab and screen readers skip it too: the container's other children, or
  // with `isFullPage` the rest of the page.
  const loadingRef = React.useRef<HTMLDivElement>(null);
  useInertSiblings(loadingRef, active, isFullPage);

  // Handle escape key. On `window`, as in `Modal`, so a popup on the page has
  // had the key first, and an Escape it closed on doesn't cancel as well. One
  // that cancels is marked used, so nothing under it acts on it too.
  React.useEffect(() => {
    if (!active || !canCancel || !hasOnCancel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || !isTopmost()) return;
      e.preventDefault();
      onCancelRef.current?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, canCancel, hasOnCancel, onCancelRef, isTopmost]);

  // Prevent body scroll when full page loading is active. Ref-counted through
  // the shared helper so an overlapping Modal/Dialog/Sidebar doesn't have its
  // lock cleared when this one releases.
  useScrollLock(isFullPage && active);

  if (!active) {
    return null;
  }

  return (
    <div
      className={combinedClasses}
      role="alert"
      aria-busy="true"
      aria-label="Loading"
      {...rest}
      ref={loadingRef}
    >
      <div
        className={combinedOverlayClasses}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      <div className={loadingContentClass}>
        {indicator ? (
          <span className={loadingIconCustomClass}>{indicator}</span>
        ) : (
          <span className={combinedIconClasses} />
        )}
        {children && <div className={loadingTextClass}>{children}</div>}
        {canCancel && (
          <button
            type="button"
            className={loadingCancelClass}
            onClick={onCancel}
            aria-label="Cancel loading"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default Loading;
