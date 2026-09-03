import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useScrollLock } from '../helpers/scrollLock';

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
  /** Whether the loading overlay is visible. */
  active?: boolean;
  /** Cover the entire viewport. */
  isFullPage?: boolean;
  /** Size of the loading spinner. */
  size?: 'small' | 'medium' | 'large';
  /** Color variant for the spinner. Default is light grey. */
  color?: LoadingColor;
  /** Show a cancel button and allow closing. */
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

  // Handle escape key
  React.useEffect(() => {
    if (!active || !canCancel || !onCancel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, canCancel, onCancel]);

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
