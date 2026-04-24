import React, { forwardRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/** Screen positions where snackbars can be displayed. */
export type SnackbarPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

/** Color type presets for snackbar action buttons. */
export type SnackbarType =
  | 'default'
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/**
 * Props for the Snackbar component.
 *
 * @property {string} message - The message to display.
 * @property {SnackbarType} [type] - Colors the action button. Default: 'default'.
 * @property {(typeof validColors)[number]} [color] - Colors the snackbar background.
 * @property {SnackbarPosition} [position] - Position on the screen. Default: 'bottom-right'.
 * @property {number} [duration] - Duration in ms before auto-close. Default: 4000.
 * @property {boolean} [indefinite] - Stay open until dismissed.
 * @property {boolean} [pauseOnHover] - Pause auto-close timer on hover. Default: true.
 * @property {string} [actionText] - Text for action button.
 * @property {string} [cancelText] - Text for cancel button.
 * @property {() => void} [onAction] - Callback when action button is clicked.
 * @property {() => void} [onClose] - Callback when snackbar closes.
 * @property {boolean} [cancelable] - Dismiss with Escape key. Default: true.
 * @property {string|HTMLElement} [container] - Custom mount target.
 * @property {boolean} [dismissible] - Show a close button. Default: false.
 * @property {boolean} [rounded] - Pill-shaped snackbar. Default: false.
 * @property {boolean} [inline] - Render without portal/container wrapper. Default: false.
 */
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

/**
 * Snackbar component for brief messages with optional action buttons.
 *
 * Appears at a configurable screen position with auto-close, pause-on-hover,
 * and keyboard dismiss support.
 *
 * @function
 * @param {SnackbarProps} props - Props for the Snackbar component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the snackbar element.
 * @returns {JSX.Element | null} The rendered snackbar, or null if dismissed.
 *
 * @example
 * <Snackbar message="Item deleted" actionText="Undo" onAction={handleUndo} />
 */
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
          return (
            (document.querySelector(container) as HTMLElement) || document.body
          );
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
                <button
                  type="button"
                  className="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleClose();
                  }}
                >
                  {cancelText}
                </button>
              </span>
            )}
            {actionText && (
              <span className="snackbar-action">
                <button
                  type="button"
                  className="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleAction();
                  }}
                >
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
            onClick={e => {
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Close"
          />
        )}
      </div>
    );

    if (inline) {
      return snackbarElement;
    }

    const snackbarContent = (
      <div className={containerClasses}>{snackbarElement}</div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(snackbarContent, resolveContainer());
    }

    return null;
  }
);

Snackbar.displayName = 'Snackbar';

// Snackbar Manager for programmatic snackbars

/**
 * Options for showing a programmatic snackbar. Extends SnackbarProps with a required message.
 *
 * @property {string} message - The message to display.
 */
export interface SnackbarOptions extends Omit<SnackbarProps, 'message'> {
  message: string;
}

/**
 * Internal representation of a queued snackbar entry.
 *
 * @property {number} id - Unique identifier.
 * @property {SnackbarOptions} options - Snackbar configuration.
 * @property {() => void} resolve - Callback to resolve the promise when closed.
 */
interface SnackbarEntry {
  id: number;
  options: SnackbarOptions;
  resolve: () => void;
}

let snackbarIdCounter = 0;
let snackbarQueue: SnackbarEntry[] = [];
let currentSnackbar: SnackbarEntry | null = null;
const snackbarListeners: Set<(entry: SnackbarEntry | null) => void> = new Set();

const notifySnackbarListeners = () => {
  snackbarListeners.forEach(listener => listener(currentSnackbar));
};

const processQueue = () => {
  if (currentSnackbar || snackbarQueue.length === 0) return;

  currentSnackbar = snackbarQueue.shift()!;
  notifySnackbarListeners();
};

/**
 * Programmatic snackbar API for showing, closing, and managing snackbars.
 *
 * @example
 * snackbar.success('Changes saved');
 * snackbar.show({ message: 'Deleted', actionText: 'Undo', onAction: handleUndo });
 */
export const snackbar = {
  /**
   * Show a snackbar with the given options.
   * @param {SnackbarOptions} options - Snackbar configuration.
   * @returns {Promise<void>} Resolves when the snackbar closes.
   */
  show: (options: SnackbarOptions): Promise<void> => {
    return new Promise(resolve => {
      snackbarQueue.push({ id: ++snackbarIdCounter, options, resolve });
      processQueue();
    });
  },

  /**
   * Show a success snackbar.
   * @param {string} message - The message to display.
   * @param {Partial<SnackbarOptions>} [options] - Additional options.
   * @returns {Promise<void>} Resolves when the snackbar closes.
   */
  success: (
    message: string,
    options?: Partial<SnackbarOptions>
  ): Promise<void> => {
    return snackbar.show({ message, type: 'success', ...options });
  },

  /**
   * Show a danger snackbar.
   * @param {string} message - The message to display.
   * @param {Partial<SnackbarOptions>} [options] - Additional options.
   * @returns {Promise<void>} Resolves when the snackbar closes.
   */
  danger: (
    message: string,
    options?: Partial<SnackbarOptions>
  ): Promise<void> => {
    return snackbar.show({ message, type: 'danger', ...options });
  },

  /**
   * Show a warning snackbar.
   * @param {string} message - The message to display.
   * @param {Partial<SnackbarOptions>} [options] - Additional options.
   * @returns {Promise<void>} Resolves when the snackbar closes.
   */
  warning: (
    message: string,
    options?: Partial<SnackbarOptions>
  ): Promise<void> => {
    return snackbar.show({ message, type: 'warning', ...options });
  },

  /**
   * Show an info snackbar.
   * @param {string} message - The message to display.
   * @param {Partial<SnackbarOptions>} [options] - Additional options.
   * @returns {Promise<void>} Resolves when the snackbar closes.
   */
  info: (
    message: string,
    options?: Partial<SnackbarOptions>
  ): Promise<void> => {
    return snackbar.show({ message, type: 'info', ...options });
  },

  /** Close the current snackbar and process the next in queue. */
  close: (): void => {
    if (currentSnackbar) {
      currentSnackbar.resolve();
      currentSnackbar = null;
      notifySnackbarListeners();
      processQueue();
    }
  },

  /** Clear all queued snackbars and close the current one. */
  clear: (): void => {
    snackbarQueue.forEach(({ resolve }) => resolve());
    snackbarQueue = [];
    snackbar.close();
  },

  /**
   * Subscribe to snackbar state changes.
   * @param {(entry: SnackbarEntry | null) => void} listener - Callback invoked on changes.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe: (
    listener: (entry: SnackbarEntry | null) => void
  ): (() => void) => {
    snackbarListeners.add(listener);
    return () => snackbarListeners.delete(listener);
  },
};

/**
 * Props for the SnackbarContainer component.
 *
 * @property {SnackbarPosition} [position] - Default position for snackbars. Default: 'bottom-right'.
 */
export interface SnackbarContainerProps {
  position?: SnackbarPosition;
}

/**
 * Container component for rendering programmatic snackbars.
 * Place once at your app root to enable the snackbar API.
 *
 * @function
 * @param {SnackbarContainerProps} props - Props for the SnackbarContainer component.
 * @returns {JSX.Element | null} The rendered snackbar, or null if none is active.
 */
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
