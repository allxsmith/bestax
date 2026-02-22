import React, { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Snackbar } from './Snackbar';

export type ToastType =
  | 'default'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'primary'
  | 'link';

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

/**
 * Props for the Toast component.
 *
 * @property {string} message - The message to display.
 * @property {ToastType} [type] - The type/color of the toast. Default: 'default'.
 * @property {ToastPosition} [position] - Position on the screen. Default: 'top-right'.
 * @property {number} [duration] - Duration in ms before auto-close. Default: 2000.
 * @property {boolean} [indefinite] - Stay open until dismissed. Default: false.
 * @property {boolean} [dismissible] - Whether clicking the toast dismisses it. Default: true.
 * @property {boolean} [rounded] - Pill-shaped toast. Default: false.
 * @property {() => void} [onClose] - Callback when toast closes.
 * @property {boolean} [pauseOnHover] - Pause auto-close timer on hover. Default: false.
 * @property {boolean} [cancelable] - Whether the toast can be dismissed with Escape. Default: true.
 * @property {string | HTMLElement} [container] - Custom mount target (CSS selector string or HTMLElement).
 */
export interface ToastProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  message: string;
  type?: ToastType;
  position?: ToastPosition;
  /** Duration in ms before auto-close. Default 2000. */
  duration?: number;
  /** Stay open until dismissed. */
  indefinite?: boolean;
  /** Whether clicking the toast dismisses it. Default true. */
  dismissible?: boolean;
  /** Pill-shaped toast. Default false. */
  rounded?: boolean;
  onClose?: () => void;
  /** Pause auto-close timer on hover. Default false. */
  pauseOnHover?: boolean;
  /** Whether the toast can be dismissed with Escape. Default true. */
  cancelable?: boolean;
  /** Custom mount target (CSS selector string or HTMLElement). */
  container?: string | HTMLElement;
}

/**
 * Toast component for displaying brief notification messages.
 *
 * Wraps Snackbar with a simplified API — just a message, no action buttons.
 * Dismisses by clicking the toast body or via auto-close timer.
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
 * // Indefinite toast
 * <Toast message="Processing..." indefinite onClose={handleDone} />
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      message,
      type = 'default',
      position = 'top-right',
      duration = 2000,
      indefinite = false,
      dismissible = true,
      rounded = false,
      onClose,
      pauseOnHover = false,
      cancelable = true,
      container,
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const [isVisible, setIsVisible] = useState(true);
    const toastRef = useRef<HTMLDivElement | null>(null);

    const handleClose = useCallback(() => {
      setIsVisible(false);
      onClose?.();
    }, [onClose]);

    // Click outside to dismiss — deferred so the triggering click doesn't
    // immediately dismiss the toast before it's even visible.
    useEffect(() => {
      if (!dismissible || !isVisible) return undefined;

      const handleDocumentClick = (e: MouseEvent) => {
        if (toastRef.current && !toastRef.current.contains(e.target as Node)) {
          handleClose();
        }
      };

      // Defer listener so the click that spawned the toast doesn't dismiss it
      const raf = requestAnimationFrame(() => {
        document.addEventListener('click', handleDocumentClick);
      });

      return () => {
        cancelAnimationFrame(raf);
        document.removeEventListener('click', handleDocumentClick);
      };
    }, [dismissible, isVisible, handleClose]);

    const toastClasses = usePrefixedClassNames('toast', {
      [`is-${type}`]: type && type !== 'default',
    });

    const containerClasses = usePrefixedClassNames('toast-container', {
      [`is-${position}`]: true,
    });

    const combinedClasses = classNames(
      toastClasses,
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

    const toastContent = (
      <div className={containerClasses}>
        <Snackbar
          ref={(node) => {
            toastRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          inline
          message={message}
          type={type}
          duration={duration}
          indefinite={indefinite}
          rounded={rounded}
          onClose={handleClose}
          pauseOnHover={pauseOnHover}
          cancelable={cancelable}
          className={combinedClasses}
          role="alert"
          onClick={dismissible ? handleClose : undefined}
          {...rest}
        />
      </div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(toastContent, resolveContainer());
    }

    return null;
  }
);

Toast.displayName = 'Toast';

// Toast Manager for programmatic toasts
export interface ToastOptions extends Omit<ToastProps, 'message'> {
  message: string;
  /** When true, toasts enter a FIFO queue and display one at a time. Default false. */
  queue?: boolean;
}

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

export const toast = {
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

  success: (message: string, options?: Partial<ToastOptions>): string => {
    return toast.show({ message, type: 'success', ...options });
  },

  danger: (message: string, options?: Partial<ToastOptions>): string => {
    return toast.show({ message, type: 'danger', ...options });
  },

  warning: (message: string, options?: Partial<ToastOptions>): string => {
    return toast.show({ message, type: 'warning', ...options });
  },

  info: (message: string, options?: Partial<ToastOptions>): string => {
    return toast.show({ message, type: 'info', ...options });
  },

  close: (id: string): void => {
    // Check if it's the current queued toast
    if (currentQueuedToast && currentQueuedToast.id === id) {
      currentQueuedToast = null;
      processQueuedToast();
    } else {
      // Remove from queued waiting list
      queuedToasts = queuedToasts.filter(t => t.id !== id);
      // Remove from non-queued toasts
      toasts = toasts.filter(t => t.id !== id);
    }
    notifyListeners();
  },

  closeAll: (): void => {
    toasts = [];
    queuedToasts = [];
    currentQueuedToast = null;
    notifyListeners();
  },

  subscribe: (listener: (toasts: ToastInstance[]) => void): (() => void) => {
    toastListeners.add(listener);
    return () => toastListeners.delete(listener);
  },
};

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
