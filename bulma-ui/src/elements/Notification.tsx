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
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number]} [color] - Bulma color modifier for the notification.
 * @property {boolean} [isLight] - Use the light color variant.
 * @property {boolean} [hasDelete] - Show a delete (close) button.
 * @property {() => void} [onDelete] - Callback fired when the delete button is clicked.
 * @property {React.ReactNode} [children] - Content to be rendered inside the notification.
 */
export interface NotificationProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number];
  isLight?: boolean;
  hasDelete?: boolean;
  onDelete?: () => void;
  children?: React.ReactNode;
}

/**
 * Notification component for rendering a styled Bulma notification.
 *
 * Supports colors, light variants, a delete button, and arbitrary content.
 *
 * @function
 * @param {NotificationProps} props - Props for the Notification component.
 * @returns {JSX.Element} The rendered notification element.
 * @see {@link https://bulma.io/documentation/elements/notification/ | Bulma Notification documentation}
 */
export const Notification: React.FC<NotificationProps> = ({
  className,
  color,
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

export type NotificationPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export interface NotificationOptions {
  message: string | React.ReactNode;
  color?: (typeof validColors)[number];
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

interface NotificationInstance {
  id: string;
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

export const notification = {
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

  success: (
    message: string | React.ReactNode,
    options?: Partial<NotificationOptions>
  ): string => {
    return notification.show({ message, color: 'success', ...options });
  },

  danger: (
    message: string | React.ReactNode,
    options?: Partial<NotificationOptions>
  ): string => {
    return notification.show({ message, color: 'danger', ...options });
  },

  warning: (
    message: string | React.ReactNode,
    options?: Partial<NotificationOptions>
  ): string => {
    return notification.show({ message, color: 'warning', ...options });
  },

  info: (
    message: string | React.ReactNode,
    options?: Partial<NotificationOptions>
  ): string => {
    return notification.show({ message, color: 'info', ...options });
  },

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

  closeAll: (): void => {
    notifications = [];
    queuedNotifications = [];
    currentQueuedNotification = null;
    notifyNotificationListeners();
  },

  subscribe: (
    listener: (items: NotificationInstance[]) => void
  ): (() => void) => {
    notificationListeners.add(listener);
    return () => notificationListeners.delete(listener);
  },
};

/**
 * Single auto-dismissing notification item used by NotificationContainer.
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
  const isLeft = position.endsWith('left');

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
