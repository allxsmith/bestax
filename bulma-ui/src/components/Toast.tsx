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
import { resolvePortalContainer } from '../helpers/portal';

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
 * @extraProp {string} [className] - Additional CSS classes.
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the toast element.
 */
export interface ToastProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** The message to display (required). */
  message: string;
  /** Color variant — colors the toast **background**. */
  type?: ToastType;
  /** Color variant — colors the **action button** text. */
  actionType?: ToastType;
  /** Position on the screen. Default: 'top-right'. */
  position?: ToastPosition;
  /** Duration in ms before auto-close. `0` disables auto-close. */
  duration?: number;
  /** Keeps the toast visible until dismissed. */
  indefinite?: boolean;
  /** Whether clicking the toast (or outside it) dismisses it. */
  dismissible?: boolean;
  /** Show an explicit close (X) button. Default: false. */
  closable?: boolean;
  /** Pill-shaped (rounded corners). */
  rounded?: boolean;
  /** Pause auto-close timer on hover. Default: false. */
  pauseOnHover?: boolean;
  /** Whether the toast can be dismissed with Escape. Default: true. */
  cancelable?: boolean;
  /** Text for an action button (e.g. "Undo"). */
  actionText?: string;
  /** Text for a cancel button. */
  cancelText?: string;
  /** Callback when the action button is clicked. */
  onAction?: () => void;
  /** Callback when toast closes. */
  onClose?: () => void;
  /** CSS selector or DOM node to mount the toast into. */
  container?: string | HTMLElement;
  /** Renders inline instead of using a portal. */
  inline?: boolean;
}

/**
 * The `Toast` component provides brief notification messages with optional action and cancel buttons.
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

    // Cleanup returned by a consumer's callback ref on attach, held until detach.
    const consumerCleanupRef = useRef<(() => void) | null>(null);
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

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        toastRef.current = node;
        if (typeof ref === 'function') {
          // React 19 lets a callback ref return a cleanup function and detaches by
          // running it instead of calling the ref with `null`; React 18 discards the
          // return value entirely. Returning it from here would be a React-19-only
          // contract, so we hold the cleanup and run it ourselves on detach — the
          // same shape as `Dropdown` and `Modal`, so one consumer cleanup ref
          // behaves identically across every component in the library. Memoized
          // for the same reason: an unstable ref identity makes React detach and
          // re-attach on every render, which would run that cleanup each time.
          if (node === null) {
            const consumerCleanup = consumerCleanupRef.current;
            consumerCleanupRef.current = null;
            if (consumerCleanup) {
              consumerCleanup();
            } else {
              ref(null);
            }
            return;
          }
          const cleanup: unknown = ref(node);
          consumerCleanupRef.current =
            typeof cleanup === 'function' ? (cleanup as () => void) : null;
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    if (!isVisible) {
      return null;
    }

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
      return createPortal(toastContent, resolvePortalContainer(container));
    }

    return null;
  }
);

Toast.displayName = 'Toast';

// Toast Manager for programmatic toasts

/**
 * Options for showing a programmatic toast. Extends ToastProps with a required message.
 */
export interface ToastOptions extends Omit<ToastProps, 'message'> {
  /** The message to display. */
  message: string;
  /** When true, toasts enter a FIFO queue and display one at a time. Default false. */
  queue?: boolean;
}

/**
 * Internal representation of a toast instance.
 */
export interface ToastInstance {
  /** Unique identifier for this toast. */
  id: string;
  /** Configuration options for the toast. */
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
