import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Notification component.
 */
export interface NotificationProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Bulma color modifier for the notification. */
  color?: (typeof validColors)[number];
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Use the light color variant. */
  isLight?: boolean;
  /** Shows a close (delete) button in the notification. */
  hasDelete?: boolean;
  /** Callback fired when the delete button is clicked. */
  onDelete?: () => void;
  /** Content to be rendered inside the notification. */
  children?: React.ReactNode;
}

/**
 * The `Notification` component is a Bulma-styled alert/message area for providing feedback, warnings, or information to users.
 *
 * @function
 * @param {NotificationProps} props - Props for the Notification component.
 * @returns {JSX.Element} The rendered notification element.
 * @see {@link https://bulma.io/documentation/elements/notification/ | Bulma Notification documentation}
 */
export const Notification: React.FC<NotificationProps> = ({
  className,
  color,
  textColor,
  isLight,
  hasDelete,
  onDelete,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    ...props,
  });

  const bulmaClasses = usePrefixedClassNames('notification', {
    [`is-${color}`]: color && validColors.includes(color),
    'is-light': isLight,
  });

  const deleteClasses = usePrefixedClassNames('delete');

  const notificationClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <div className={notificationClasses} {...rest}>
      {hasDelete && (
        <button
          className={deleteClasses}
          onClick={onDelete}
          aria-label="Close notification"
        />
      )}
      {children}
    </div>
  );
};

// Programmatic Notification API

/** Screen positions where programmatic notifications can be displayed. */
export type NotificationPosition =
  'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';

/**
 * Options for showing a programmatic notification.
 */
export interface NotificationOptions {
  /** The message to display. */
  message: string | React.ReactNode;
  /** Bulma color modifier. */
  color?: (typeof validColors)[number];
  /** Use the light color variant. */
  isLight?: boolean;
  /** Duration in ms before auto-close. Default 3000. */
  duration?: number;
  /** Position on the screen. Default 'top-right'. */
  position?: NotificationPosition;
  /** When true, notifications enter a FIFO queue and display one at a time. Default false. */
  queue?: boolean;
  /** Show a delete (close) button. Default true. */
  hasDelete?: boolean;
  /** Stay open until dismissed. */
  indefinite?: boolean;
  /** Pause auto-close timer on hover. Default true. */
  pauseOnHover?: boolean;
}

/**
 * Internal representation of a notification instance.
 */
interface NotificationInstance {
  /** Unique identifier for this notification. */
  id: string;
  /** Configuration options for the notification. */
  options: NotificationOptions;
}

let notificationId = 0;
const notificationListeners: Set<(items: NotificationInstance[]) => void> =
  new Set();
let notifications: NotificationInstance[] = [];

// Queue support
let queuedNotifications: NotificationInstance[] = [];
let currentQueuedNotification: NotificationInstance | null = null;

const notifyNotificationListeners = () => {
  const allVisible = [...notifications];
  if (currentQueuedNotification) {
    allVisible.push(currentQueuedNotification);
  }
  notificationListeners.forEach(listener => listener([...allVisible]));
};

const processQueuedNotification = () => {
  if (currentQueuedNotification || queuedNotifications.length === 0) return;
  currentQueuedNotification = queuedNotifications.shift()!;
  notifyNotificationListeners();
};

/**
 * Programmatic notification API for showing, closing, and managing notifications.
 *
 * @example
 * notification.success('File saved successfully');
 * notification.danger('Something went wrong', { duration: 5000 });
 */
export const notification = {
  /**
   * Show a notification with the given options.
   * @param {NotificationOptions} options - Notification configuration.
   * @returns {string} The unique ID of the created notification.
   */
  show: (options: NotificationOptions): string => {
    const id = `notification-${++notificationId}`;
    const instance = { id, options };

    if (options.queue) {
      queuedNotifications.push(instance);
      processQueuedNotification();
    } else {
      notifications.push(instance);
      notifyNotificationListeners();
    }

    return id;
  },

  /**
   * Show a success notification.
   * @param {string|React.ReactNode} message - The message to display.
   * @param {Partial<NotificationOptions>} [options] - Additional options.
   * @returns {string} The notification ID.
   */
  success: (
    message: string | React.ReactNode,
    options?: Partial<NotificationOptions>
  ): string => {
    return notification.show({ message, color: 'success', ...options });
  },

  /**
   * Show a danger notification.
   * @param {string|React.ReactNode} message - The message to display.
   * @param {Partial<NotificationOptions>} [options] - Additional options.
   * @returns {string} The notification ID.
   */
  danger: (
    message: string | React.ReactNode,
    options?: Partial<NotificationOptions>
  ): string => {
    return notification.show({ message, color: 'danger', ...options });
  },

  /**
   * Show a warning notification.
   * @param {string|React.ReactNode} message - The message to display.
   * @param {Partial<NotificationOptions>} [options] - Additional options.
   * @returns {string} The notification ID.
   */
  warning: (
    message: string | React.ReactNode,
    options?: Partial<NotificationOptions>
  ): string => {
    return notification.show({ message, color: 'warning', ...options });
  },

  /**
   * Show an info notification.
   * @param {string|React.ReactNode} message - The message to display.
   * @param {Partial<NotificationOptions>} [options] - Additional options.
   * @returns {string} The notification ID.
   */
  info: (
    message: string | React.ReactNode,
    options?: Partial<NotificationOptions>
  ): string => {
    return notification.show({ message, color: 'info', ...options });
  },

  /**
   * Close a specific notification by ID.
   * @param {string} id - The notification ID to close.
   */
  close: (id: string): void => {
    if (currentQueuedNotification && currentQueuedNotification.id === id) {
      currentQueuedNotification = null;
      processQueuedNotification();
    } else {
      queuedNotifications = queuedNotifications.filter(n => n.id !== id);
      notifications = notifications.filter(n => n.id !== id);
    }
    notifyNotificationListeners();
  },

  /** Close all notifications and clear the queue. */
  closeAll: (): void => {
    notifications = [];
    queuedNotifications = [];
    currentQueuedNotification = null;
    notifyNotificationListeners();
  },

  /**
   * Subscribe to notification state changes.
   * @param {(items: NotificationInstance[]) => void} listener - Callback invoked on changes.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe: (
    listener: (items: NotificationInstance[]) => void
  ): (() => void) => {
    notificationListeners.add(listener);
    return () => notificationListeners.delete(listener);
  },
};

/**
 * Single auto-dismissing notification item used by NotificationContainer.
 *
 * @function
 * @param {{ instance: NotificationInstance; onClose: (id: string) => void }} props - Component props.
 * @returns {JSX.Element} The rendered notification item.
 */
const NotificationItem: React.FC<{
  instance: NotificationInstance;
  onClose: (id: string) => void;
}> = ({ instance, onClose }) => {
  const {
    message,
    color,
    isLight,
    duration = 3000,
    hasDelete = true,
    indefinite = false,
    pauseOnHover = true,
  } = instance.options;

  const [isPaused, setIsPaused] = useState(false);

  const handleClose = useCallback(() => {
    onClose(instance.id);
  }, [onClose, instance.id]);

  // Auto-close timer
  useEffect(() => {
    if (indefinite || duration === 0 || isPaused) return undefined;

    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [duration, indefinite, isPaused, handleClose]);

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  return (
    <Notification
      color={color}
      isLight={isLight}
      hasDelete={hasDelete}
      onDelete={handleClose}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ pointerEvents: 'auto' }}
    >
      {message}
    </Notification>
  );
};

/**
 * Container component for rendering programmatic notifications.
 * Place once at your app root to enable the notification API.
 *
 * @function
 * @param {{ position?: NotificationPosition }} props - Container props.
 * @returns {JSX.Element | null} The rendered notification container, or null if empty.
 */
export const NotificationContainer: React.FC<{
  position?: NotificationPosition;
}> = ({ position = 'top-right' }) => {
  const [items, setItems] = useState<NotificationInstance[]>([]);

  useEffect(() => {
    return notification.subscribe(setItems);
  }, []);

  if (typeof document === 'undefined' || items.length === 0) {
    return null;
  }

  const isBottom = position.startsWith('bottom');
  const isCenter = position === 'top' || position === 'bottom';
  const isRight = position.endsWith('right');

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 100,
    display: 'flex',
    flexDirection: isBottom ? 'column-reverse' : 'column',
    gap: '0.75rem',
    padding: '1rem',
    pointerEvents: 'none',
    maxWidth: '100%',
    ...(isBottom ? { bottom: 0 } : { top: 0 }),
    ...(isCenter
      ? { left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
      : isRight
        ? { right: 0, alignItems: 'flex-end' }
        : { left: 0, alignItems: 'flex-start' }),
  };

  return createPortal(
    <div style={containerStyle}>
      {items.map(item => (
        <NotificationItem
          key={item.id}
          instance={item}
          onClose={notification.close}
        />
      ))}
    </div>,
    document.body
  );
};
