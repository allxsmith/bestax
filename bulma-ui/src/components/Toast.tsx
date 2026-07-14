import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/** Color/style type presets for toast messages. */
export type ToastType =
  'default' | 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

/** Screen positions where toasts can be displayed. */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Props for the Toast component.
 *
 * @property {string} message - The message to display.
 * @property {ToastType} [type] - Colors the toast background. Default: 'default'.
 * @property {ToastType} [actionType] - Colors the action button text.
 * @property {ToastPosition} [position] - Position on the screen. Default: 'top-right'.
 * @property {number} [duration] - Duration in ms before auto-close (0 disables). Default: 2000.
 * @property {boolean} [indefinite] - Stay open until dismissed. Default: false.
 * @property {boolean} [dismissible] - Click toast (or outside) to dismiss. Default: true.
 * @property {boolean} [closable] - Show an explicit close (X) button. Default: false.
 * @property {boolean} [rounded] - Pill-shaped toast. Default: false.
 * @property {boolean} [pauseOnHover] - Pause auto-close timer on hover. Default: false.
 * @property {boolean} [cancelable] - Whether the toast can be dismissed with Escape. Default: true.
 * @property {string} [actionText] - Text for action button.
 * @property {string} [cancelText] - Text for cancel button.
 * @property {() => void} [onAction] - Callback when action button is clicked.
 * @property {() => void} [onClose] - Callback when toast closes.
 * @property {string | HTMLElement} [container] - Custom mount target (CSS selector string or HTMLElement).
 * @property {boolean} [inline] - Render only the .toast element without portal/container wrapper. Default: false.
 */
export interface ToastProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  message: string;
  type?: ToastType;
  actionType?: ToastType;
  position?: ToastPosition;
  duration?: number;
  indefinite?: boolean;
  dismissible?: boolean;
  closable?: boolean;
  rounded?: boolean;
  pauseOnHover?: boolean;
  cancelable?: boolean;
  actionText?: string;
  cancelText?: string;
  onAction?: () => void;
  onClose?: () => void;
  container?: string | HTMLElement;
  inline?: boolean;
}

/**
 * Toast component for displaying brief notification messages with optional action buttons.
 *
 * Appears at a configurable screen position with auto-close, pause-on-hover,
 * keyboard dismiss, action/cancel buttons, and an optional explicit close button.
 *
 * @function
 * @param {ToastProps} props - Props for the Toast component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the toast element.
 * @returns {JSX.Element | null} The rendered toast component.
 *
 * @example
 * // Basic toast
 * <Toast message="Operation successful!" type="success" />
 *
 * @example
 * // Toast with action button
 * <Toast message="Item deleted" actionText="Undo" onAction={handleUndo} />
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      message,
      type = 'default',
      actionType,
      position = 'top-right',
      duration = 2000,
      indefinite = false,
      dismissible = true,
      closable = false,
      rounded = false,
      pauseOnHover = false,
      cancelable = true,
      actionText,
      cancelText,
      onAction,
      onClose,
      container,
      inline = false,
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const toastRef = useRef<HTMLDivElement | null>(null);

    const handleClose = useCallback(() => {
      setIsVisible(false);
      onClose?.();
    }, [onClose]);

    const handleAction = useCallback(() => {
      onAction?.();
      handleClose();
    }, [onAction, handleClose]);

    useEffect(() => {
      if (indefinite || duration === 0 || isPaused) return undefined;

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }, [duration, indefinite, isPaused, handleClose]);

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

    // Click-outside dismiss — deferred so the click that spawned the toast
    // doesn't immediately dismiss it before it's even visible.
    useEffect(() => {
      if (!dismissible || !isVisible) return undefined;

      const handleDocumentClick = (e: MouseEvent) => {
        if (toastRef.current && !toastRef.current.contains(e.target as Node)) {
          handleClose();
        }
      };

      const raf = requestAnimationFrame(() => {
        document.addEventListener('click', handleDocumentClick);
      });

      return () => {
        cancelAnimationFrame(raf);
        document.removeEventListener('click', handleDocumentClick);
      };
    }, [dismissible, isVisible, handleClose]);

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

    const containerClasses = usePrefixedClassNames('toast-container', {
      [`is-${position}`]: true,
    });

    const toastClasses = usePrefixedClassNames('toast', {
      [`is-${type}`]: type !== 'default',
      [`is-action-${actionType}`]: !!actionType && actionType !== 'default',
      'is-rounded': rounded,
    });

    const combinedClasses = classNames(
      toastClasses,
      bulmaHelperClasses,
      className
    );
    const toastMessageClass = usePrefixedClassNames('toast-message');
    const toastActionsClass = usePrefixedClassNames('toast-actions');
    const toastCancelClass = usePrefixedClassNames('toast-cancel');
    const toastActionClass = usePrefixedClassNames('toast-action');
    const toastButtonClass = usePrefixedClassNames('button');
    const toastCloseClass = usePrefixedClassNames('delete', 'is-small');

    if (!isVisible) {
      return null;
    }

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

    const setRef = (node: HTMLDivElement | null) => {
      toastRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    const toastElement = (
      <div
        ref={setRef}
        className={combinedClasses}
        role="alert"
        aria-live={
          type === 'danger' || type === 'warning' ? 'assertive' : 'polite'
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={dismissible ? handleClose : undefined}
        {...rest}
      >
        <span className={toastMessageClass}>{message}</span>
        {(cancelText || actionText) && (
          <div className={toastActionsClass}>
            {cancelText && (
              <span className={toastCancelClass}>
                <button
                  type="button"
                  className={toastButtonClass}
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
              <span className={toastActionClass}>
                <button
                  type="button"
                  className={toastButtonClass}
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
        {closable && (
          <button
            type="button"
            className={toastCloseClass}
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
      return toastElement;
    }

    const toastContent = <div className={containerClasses}>{toastElement}</div>;

    if (typeof document !== 'undefined') {
      return createPortal(toastContent, resolveContainer());
    }

    return null;
  }
);

Toast.displayName = 'Toast';

// Toast Manager for programmatic toasts

/**
 * Options for showing a programmatic toast. Extends ToastProps with a required message.
 *
 * @property {string} message - The message to display.
 * @property {boolean} [queue] - When true, toasts enter a FIFO queue and display one at a time. Default: false.
 */
export interface ToastOptions extends Omit<ToastProps, 'message'> {
  message: string;
  /** When true, toasts enter a FIFO queue and display one at a time. Default false. */
  queue?: boolean;
}

/**
 * Internal representation of a toast instance.
 *
 * @property {string} id - Unique identifier for this toast.
 * @property {ToastOptions} props - Configuration options for the toast.
 */
export interface ToastInstance {
  id: string;
  props: ToastOptions;
}

let toastId = 0;
const toastListeners: Set<(toasts: ToastInstance[]) => void> = new Set();
let toasts: ToastInstance[] = [];

// Queued toasts: FIFO queue, one at a time
let queuedToasts: ToastInstance[] = [];
let currentQueuedToast: ToastInstance | null = null;

const notifyListeners = () => {
  const allVisible = [...toasts];
  if (currentQueuedToast) {
    allVisible.push(currentQueuedToast);
  }
  toastListeners.forEach(listener => listener([...allVisible]));
};

const processQueuedToast = () => {
  if (currentQueuedToast || queuedToasts.length === 0) return;
  currentQueuedToast = queuedToasts.shift()!;
  notifyListeners();
};

/**
 * Programmatic toast API for showing, closing, and managing toasts.
 *
 * @example
 * toast.success('Saved!');
 * toast.show({ message: 'Item deleted', actionText: 'Undo', onAction: handleUndo });
 */
export const toast = {
  /**
   * Show a toast with the given options.
   * @param {ToastOptions} options - Toast configuration.
   * @returns {string} The unique ID of the created toast.
   */
  show: (options: ToastOptions): string => {
    const id = `toast-${++toastId}`;
    const instance = { id, props: options };

    if (options.queue) {
      queuedToasts.push(instance);
      processQueuedToast();
    } else {
      toasts.push(instance);
      notifyListeners();
    }

    return id;
  },

  /**
   * Show a success toast.
   * @param {string} message - The message to display.
   * @param {Partial<ToastOptions>} [options] - Additional options.
   * @returns {string} The toast ID.
   */
  success: (message: string, options?: Partial<ToastOptions>): string => {
    return toast.show({ message, type: 'success', ...options });
  },

  /**
   * Show a danger toast.
   * @param {string} message - The message to display.
   * @param {Partial<ToastOptions>} [options] - Additional options.
   * @returns {string} The toast ID.
   */
  danger: (message: string, options?: Partial<ToastOptions>): string => {
    return toast.show({ message, type: 'danger', ...options });
  },

  /**
   * Show a warning toast.
   * @param {string} message - The message to display.
   * @param {Partial<ToastOptions>} [options] - Additional options.
   * @returns {string} The toast ID.
   */
  warning: (message: string, options?: Partial<ToastOptions>): string => {
    return toast.show({ message, type: 'warning', ...options });
  },

  /**
   * Show an info toast.
   * @param {string} message - The message to display.
   * @param {Partial<ToastOptions>} [options] - Additional options.
   * @returns {string} The toast ID.
   */
  info: (message: string, options?: Partial<ToastOptions>): string => {
    return toast.show({ message, type: 'info', ...options });
  },

  /**
   * Close a specific toast by ID.
   * @param {string} id - The toast ID to close.
   */
  close: (id: string): void => {
    if (currentQueuedToast && currentQueuedToast.id === id) {
      currentQueuedToast = null;
      processQueuedToast();
    } else {
      queuedToasts = queuedToasts.filter(t => t.id !== id);
      toasts = toasts.filter(t => t.id !== id);
    }
    notifyListeners();
  },

  /** Close all toasts and clear the queue. */
  closeAll: (): void => {
    toasts = [];
    queuedToasts = [];
    currentQueuedToast = null;
    notifyListeners();
  },

  /**
   * Subscribe to toast state changes.
   * @param {(toasts: ToastInstance[]) => void} listener - Callback invoked on changes.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe: (listener: (toasts: ToastInstance[]) => void): (() => void) => {
    toastListeners.add(listener);
    return () => toastListeners.delete(listener);
  },
};

/**
 * Container component for rendering programmatic toasts.
 * Place once at your app root to enable the toast API.
 *
 * @function
 * @param {{ position?: ToastPosition }} props - Container props.
 * @returns {JSX.Element | null} The rendered toast container, or null if empty.
 */
export const ToastContainer: React.FC<{ position?: ToastPosition }> = ({
  position = 'top-right',
}) => {
  const [toastList, setToastList] = useState<ToastInstance[]>([]);

  useEffect(() => {
    return toast.subscribe(setToastList);
  }, []);

  if (typeof document === 'undefined' || toastList.length === 0) {
    return null;
  }

  return createPortal(
    <div className={`toast-container is-${position}`}>
      {toastList.map(t => {
        const { queue: _queue, ...toastProps } = t.props;
        return (
          <Toast
            key={t.id}
            {...toastProps}
            position={position}
            onClose={() => toast.close(t.id)}
          />
        );
      })}
    </div>,
    document.body
  );
};

export default Toast;
