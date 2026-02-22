import React, { forwardRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps, validColors } from '../helpers/useBulmaClasses';

export type SnackbarPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export type SnackbarType =
  | 'default'
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface SnackbarProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  message: string;
  /** Colors the action BUTTON, not the background. */
  type?: SnackbarType;
  /** Colors the snackbar BACKGROUND. */
  color?: (typeof validColors)[number];
  /** Position on the screen. Default 'bottom-right'. */
  position?: SnackbarPosition;
  /** Duration in ms before auto-close. Default 4000. */
  duration?: number;
  /** Stay open until dismissed. */
  indefinite?: boolean;
  /** Pause auto-close timer on hover. Default true. */
  pauseOnHover?: boolean;
  /** Text for action button. */
  actionText?: string;
  /** Text for cancel button. */
  cancelText?: string;
  /** Callback when action button is clicked. */
  onAction?: () => void;
  /** Callback when snackbar closes. */
  onClose?: () => void;
  /** Whether the snackbar can be dismissed with Escape. Default true. */
  cancelable?: boolean;
  /** Custom mount target (CSS selector string or HTMLElement). */
  container?: string | HTMLElement;
  /** Show a close (delete) button. Default false. */
  dismissible?: boolean;
  /** Pill-shaped snackbar. Default false. */
  rounded?: boolean;
  /** Render only the .snackbar element without portal/container wrapper. Default false. */
  inline?: boolean;
}

export const Snackbar = forwardRef<HTMLDivElement, SnackbarProps>(
  (
    {
      message,
      type = 'default',
      color,
      position = 'bottom-right',
      duration = 4000,
      indefinite = false,
      pauseOnHover = true,
      onClose,
      actionText,
      cancelText,
      onAction,
      cancelable = true,
      container,
      dismissible = false,
      rounded = false,
      inline = false,
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const handleClose = useCallback(() => {
      setIsVisible(false);
      onClose?.();
    }, [onClose]);

    const handleAction = useCallback(() => {
      onAction?.();
      handleClose();
    }, [onAction, handleClose]);

    // Auto-close timer
    useEffect(() => {
      if (indefinite || duration === 0 || isPaused) return undefined;

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }, [duration, indefinite, isPaused, handleClose]);

    // Pause on hover handlers
    const handleMouseEnter = useCallback(() => {
      if (pauseOnHover) {
        setIsPaused(true);
      }
    }, [pauseOnHover]);

    const handleMouseLeave = useCallback(() => {
      if (pauseOnHover) {
        setIsPaused(false);
      }
    }, [pauseOnHover]);

    // Escape key dismiss
    useEffect(() => {
      if (!cancelable) return undefined;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [cancelable, handleClose]);

    // Generate classes
    const containerClasses = usePrefixedClassNames('snackbar-container', {
      [`is-${position}`]: true,
    });

    const snackbarClasses = usePrefixedClassNames('snackbar', {
      [`is-${color}`]: !!color,
      [`is-type-${type}`]: type !== 'default',
      'is-rounded': rounded,
    });

    const combinedClasses = classNames(
      snackbarClasses,
      bulmaHelperClasses,
      className
    );

    if (!isVisible) {
      return null;
    }

    // Resolve container target
    const resolveContainer = (): HTMLElement => {
      if (container) {
        if (typeof container === 'string') {
          return document.querySelector(container) as HTMLElement || document.body;
        }
        return container;
      }
      return document.body;
    };

    const snackbarElement = (
      <div
        ref={ref}
        className={combinedClasses}
        role="status"
        aria-live="polite"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClose}
        {...rest}
      >
        <span className="snackbar-message">{message}</span>
        {(cancelText || actionText) && (
          <div className="snackbar-actions">
            {cancelText && (
              <span className="snackbar-cancel">
                <button type="button" className="button" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
                  {cancelText}
                </button>
              </span>
            )}
            {actionText && (
              <span className="snackbar-action">
                <button type="button" className="button" onClick={(e) => { e.stopPropagation(); handleAction(); }}>
                  {actionText}
                </button>
              </span>
            )}
          </div>
        )}
        {dismissible && (
          <button
            type="button"
            className="delete is-small"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            aria-label="Close"
          />
        )}
      </div>
    );

    if (inline) {
      return snackbarElement;
    }

    const snackbarContent = (
      <div className={containerClasses}>
        {snackbarElement}
      </div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(snackbarContent, resolveContainer());
    }

    return null;
  }
);

Snackbar.displayName = 'Snackbar';

// Snackbar Manager for programmatic snackbars
export interface SnackbarOptions extends Omit<SnackbarProps, 'message'> {
  message: string;
}

interface SnackbarEntry {
  id: number;
  options: SnackbarOptions;
  resolve: () => void;
}

let snackbarIdCounter = 0;
let snackbarQueue: SnackbarEntry[] = [];
let currentSnackbar: SnackbarEntry | null = null;
const snackbarListeners: Set<(entry: SnackbarEntry | null) => void> =
  new Set();

const notifySnackbarListeners = () => {
  snackbarListeners.forEach(listener => listener(currentSnackbar));
};

const processQueue = () => {
  if (currentSnackbar || snackbarQueue.length === 0) return;

  currentSnackbar = snackbarQueue.shift()!;
  notifySnackbarListeners();
};

export const snackbar = {
  show: (options: SnackbarOptions): Promise<void> => {
    return new Promise(resolve => {
      snackbarQueue.push({ id: ++snackbarIdCounter, options, resolve });
      processQueue();
    });
  },

  success: (
    message: string,
    options?: Partial<SnackbarOptions>
  ): Promise<void> => {
    return snackbar.show({ message, type: 'success', ...options });
  },

  danger: (
    message: string,
    options?: Partial<SnackbarOptions>
  ): Promise<void> => {
    return snackbar.show({ message, type: 'danger', ...options });
  },

  warning: (
    message: string,
    options?: Partial<SnackbarOptions>
  ): Promise<void> => {
    return snackbar.show({ message, type: 'warning', ...options });
  },

  info: (
    message: string,
    options?: Partial<SnackbarOptions>
  ): Promise<void> => {
    return snackbar.show({ message, type: 'info', ...options });
  },

  close: (): void => {
    if (currentSnackbar) {
      currentSnackbar.resolve();
      currentSnackbar = null;
      notifySnackbarListeners();
      processQueue();
    }
  },

  clear: (): void => {
    snackbarQueue.forEach(({ resolve }) => resolve());
    snackbarQueue = [];
    snackbar.close();
  },

  subscribe: (
    listener: (entry: SnackbarEntry | null) => void
  ): (() => void) => {
    snackbarListeners.add(listener);
    return () => snackbarListeners.delete(listener);
  },
};

export interface SnackbarContainerProps {
  position?: SnackbarPosition;
}

export const SnackbarContainer: React.FC<SnackbarContainerProps> = ({
  position = 'bottom-right',
}) => {
  const [current, setCurrent] = useState<SnackbarEntry | null>(null);

  useEffect(() => {
    return snackbar.subscribe(setCurrent);
  }, []);

  if (!current || typeof document === 'undefined') {
    return null;
  }

  return (
    <Snackbar
      key={current.id}
      {...current.options}
      position={current.options.position ?? position}
      onClose={() => snackbar.close()}
    />
  );
};

export default Snackbar;
