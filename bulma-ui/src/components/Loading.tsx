import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

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
 *
 * @property {boolean} [active] - Whether the loading overlay is visible.
 * @property {boolean} [isFullPage] - Cover the entire viewport.
 * @property {'small' | 'medium' | 'large'} [size] - Size of the loading spinner.
 * @property {LoadingColor} [color] - Color variant for the spinner. Default is light grey.
 * @property {boolean} [canCancel] - Show a cancel button/allow closing.
 * @property {() => void} [onCancel] - Callback when cancel is triggered.
 * @property {React.ReactNode} [children] - Content to display below the spinner.
 * @property {string} [className] - Additional CSS classes.
 * @property {string} [overlayClassName] - Additional classes for the overlay.
 * @property {string} [iconClassName] - Additional classes for the spinner icon.
 * @property {React.ReactNode} [indicator] - Custom content to replace the default CSS spinner. The Loading component wraps it in a spinning container.
 * @property {LoadingOverlay} [overlay] - Overlay opacity level: 'light', 'dark', or 'opaque'. Defaults to a medium opacity.
 */
export interface LoadingProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size' | 'overlay'> {
  active?: boolean;
  isFullPage?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: LoadingColor;
  canCancel?: boolean;
  onCancel?: () => void;
  overlayClassName?: string;
  iconClassName?: string;
  indicator?: React.ReactNode;
  overlay?: LoadingOverlay;
}

/**
 * Loading component for displaying a loading overlay with spinner.
 *
 * Can be used as a full-page overlay or a container overlay to indicate
 * loading states. Supports different sizes, color variants, and optional
 * cancel functionality.
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
    'loading-overlay',
    overlayClassName
  );
  const combinedIconClasses = classNames(iconClasses, iconClassName);

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

  // Prevent body scroll when full page loading is active
  React.useEffect(() => {
    if (isFullPage && active) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [isFullPage, active]);

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
      <div className="loading-content">
        {indicator ? (
          <span className="loading-icon-custom">{indicator}</span>
        ) : (
          <span className={combinedIconClasses} />
        )}
        {children && <div className="loading-text">{children}</div>}
        {canCancel && (
          <button
            type="button"
            className="loading-cancel"
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
