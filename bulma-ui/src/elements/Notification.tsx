import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { warnUnstyledColor } from '../helpers/colorDeprecations';
import { groupIntoPositionStacks } from '../helpers/positionStacks';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { StatusRegion, spokenText } from '../helpers/statusRegion';

/**
 * Props for the Notification component.
 */
export interface NotificationProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /**
   * Bulma color modifier for the notification (renders `is-<color>`).
   *
   * Only `primary`, `link`, `info`, `success`, `warning`, `danger`, `black`,
   * `white`, `light`, and `dark` have shipped CSS for `.notification`. Every
   * other value the union accepts emits a class no CSS rule matches, so the
   * notification renders unstyled; those log a console warning in development
   * and will be removed from this union in the next major version.
   */
  color?: (typeof validColors)[number];
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Use the light color variant. */
  isLight?: boolean;
  /** Shows a close (delete) button in the notification. */
  hasDelete?: boolean;
  /** Callback fired when the delete button is clicked. */
  onDelete?: () => void;
  /** Content inside the notification. */
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
  warnUnstyledColor('Notification', color);

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
  /**
   * The message to display.
   *
   * For a notification other than `danger` and `warning`, NotificationContainer
   * announces the text the message renders, with an element's `aria-label`,
   * or an image's `alt`, standing in for what's inside it, and `aria-hidden`
   * parts left out. Other ways of naming content, such as `aria-labelledby`
   * or CSS-generated content, aren't followed, so a message that relies on
   * them can be announced with less than a screen reader would read.
   */
  message: string | React.ReactNode;
  /**
   * Bulma color modifier for the notification (renders `is-<color>`).
   *
   * Only `primary`, `link`, `info`, `success`, `warning`, `danger`, `black`,
   * `white`, `light`, and `dark` have shipped CSS for `.notification`. Every
   * other value the union accepts emits a class no CSS rule matches, so the
   * notification renders unstyled; those log a console warning in development
   * and will be removed from this union in the next major version.
   */
  color?: (typeof validColors)[number];
  /** Use the light color variant. */
  isLight?: boolean;
  /** Duration in ms before auto-close. Default 3000. */
  duration?: number;
  /**
   * Position on the screen. A notification shown without one goes to
   * `NotificationContainer`'s `position`.
   */
  position?: NotificationPosition;
  /**
   * When true, notifications enter a FIFO queue and display one at a time,
   * one queue across every `position`. Default false.
   */
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

// The server has nowhere to portal a notification to, and its copy of this
// module is shared by every request, so server rendering reads an empty list.
// Hydration reads it too, which keeps the first client render matching the
// server's.
const noNotifications: NotificationInstance[] = [];
const getServerNotifications = () => noNotifications;

// What a container shows right now: the stacked notifications, then the queued
// one on screen. NotificationContainer renders from this rather than from
// updates alone, so notifications raised before it mounted still appear. It is
// replaced rather than mutated, and only when listeners are notified, because
// useSyncExternalStore needs the same array back between changes. An empty
// list is `noNotifications` itself, so an empty store reads the same snapshot
// on the client as on the server, and a notify that leaves nothing showing
// when nothing was showing doesn't render the container again.
let visibleNotifications: NotificationInstance[] = noNotifications;
const getVisibleNotifications = () => visibleNotifications;

const notifyNotificationListeners = () => {
  const allVisible = [...notifications];
  if (currentQueuedNotification) {
    allVisible.push(currentQueuedNotification);
  }
  visibleNotifications = allVisible.length > 0 ? allVisible : noNotifications;
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
 * Whether a notification of this color announces itself as an alert, rather
 * than politely through NotificationContainer's status region.
 *
 * @function isUrgentColor
 * @param {NotificationOptions['color']} color - The notification's color.
 * @returns {boolean} True for `danger` and `warning`.
 */
const isUrgentColor = (color: NotificationOptions['color']): boolean =>
  color === 'danger' || color === 'warning';

/**
 * Single auto-dismissing notification item used by NotificationContainer.
 *
 * @function
 * @param {{ instance: NotificationInstance; onClose: (id: string) => void; registerMessage: (id: string, node: HTMLElement | null) => void }} props - Component props.
 * @returns {JSX.Element} The rendered notification item.
 */
const NotificationItem: React.FC<{
  instance: NotificationInstance;
  onClose: (id: string) => void;
  registerMessage: (id: string, node: HTMLElement | null) => void;
}> = ({ instance, onClose, registerMessage }) => {
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
  const urgent = isUrgentColor(color);

  const handleClose = useCallback(() => {
    onClose(instance.id);
  }, [onClose, instance.id]);

  const messageRef = useCallback(
    (node: HTMLElement | null) => {
      registerMessage(instance.id, node);
    },
    [registerMessage, instance.id]
  );

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
      {/* Only the message is announced, not the close button Notification
          renders ahead of its children. Danger and warning announce
          themselves as an alert, which a screen reader reliably reads out
          even when it arrives with its text. The rest are announced through
          the container's status region, which reads their text from this
          span, so it carries no role of its own that would announce them a
          second time. */}
      {urgent ? (
        <span role="alert" aria-live="assertive">
          {message}
        </span>
      ) : (
        <span ref={messageRef}>{message}</span>
      )}
    </Notification>
  );
};

// The order NotificationContainer renders its stacks in: across the top of the
// screen, then across the bottom.
const notificationStackOrder: readonly NotificationPosition[] = [
  'top-left',
  'top',
  'top-right',
  'bottom-left',
  'bottom',
  'bottom-right',
];

/**
 * Inline style that fixes a stack of notifications to its place on the screen.
 *
 * @function
 * @param {NotificationPosition} position - Where the stack sits.
 * @returns {React.CSSProperties} The stack's style.
 */
const notificationStackStyle = (
  position: NotificationPosition
): React.CSSProperties => {
  const isBottom = position.startsWith('bottom');
  const isCenter = position === 'top' || position === 'bottom';
  const isRight = position.endsWith('right');

  return {
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
};

/**
 * Container component for rendering programmatic notifications.
 * Place once at your app root to enable the notification API. A notification
 * shown with a `position` appears there, and one shown without goes to the
 * container's `position`, so the container renders a stack for each position
 * in use.
 *
 * It keeps a visually hidden `role="status"` live region in the page from the
 * moment it mounts, even while nothing is showing, and announces every
 * notification other than `danger` and `warning` through it, a moment after
 * the notification appears. Those notifications carry no `role="status"` of
 * their own, so `getByRole('status')` finds the region, not the notification.
 * The text stays in the region briefly, and while it's there the page holds a
 * second copy of it. A polite notification that closes before its
 * announcement is written, a moment after it appears, isn't announced at all.
 * `danger` and `warning` notifications announce themselves with
 * `role="alert"`. The region is hidden with inline styles, so it needs no
 * stylesheet.
 *
 * @function
 * @param {{ position?: NotificationPosition }} props - Container props.
 * @returns {JSX.Element | null} The rendered notification container, or null on the server and while hydrating.
 */
export const NotificationContainer: React.FC<{
  /**
   * Where a notification shown without a `position` of its own appears.
   * Default: 'top-right'. When it changes, those notifications move without
   * remounting, but one shown with its own `position` equal to the old or new
   * value remounts and starts over as if it had just been shown.
   */
  position?: NotificationPosition;
}> = ({ position = 'top-right' }) => {
  // Starts from the notifications already showing instead of an empty list,
  // then follows changes.
  const items = useSyncExternalStore(
    notification.subscribe,
    getVisibleNotifications,
    getServerNotifications
  );
  // A portal needs a document, and it has no server-rendered counterpart, so
  // the server render and the hydrating one render nothing, and the container
  // portals in from the render after hydration.
  const isHydrated = useIsHydrated();

  // The notifications the status region announces. Danger and warning
  // announce themselves.
  const politeItems = useMemo(
    () => items.filter(item => !isUrgentColor(item.options.color)),
    [items]
  );

  // Each polite notification's message element, so the text the region
  // announces is the text on screen, whatever the message renders.
  const messageNodesRef = useRef(new Map<string, HTMLElement>());
  const registerMessage = useCallback(
    (id: string, node: HTMLElement | null) => {
      if (node) {
        messageNodesRef.current.set(id, node);
      } else {
        messageNodesRef.current.delete(id);
      }
    },
    []
  );
  // StatusRegion only describes polite notifications that are on screen, and
  // each of those registered its message element when it mounted. The
  // fallback is for a notification announced without being rendered, should
  // the container ever render fewer than it announces: a plain-text message
  // still says itself, and anything else is skipped.
  const describe = useCallback((item: NotificationInstance) => {
    const node = messageNodesRef.current.get(item.id);
    /* istanbul ignore if: every polite notification on screen registers its message element when it mounts */
    if (!node) {
      const { message } = item.options;
      return typeof message === 'string' ? message : null;
    }
    return spokenText(node);
  }, []);

  if (typeof document === 'undefined' || !isHydrated) {
    return null;
  }

  const stacks = groupIntoPositionStacks(
    items,
    item => item.options.position,
    position,
    notificationStackOrder
  );

  return createPortal(
    <>
      {stacks.map(stack => (
        <div key={stack.key} style={notificationStackStyle(stack.position)}>
          {stack.items.map(item => (
            <NotificationItem
              key={item.id}
              instance={item}
              onClose={notification.close}
              registerMessage={registerMessage}
            />
          ))}
        </div>
      ))}
      <StatusRegion items={politeItems} describe={describe} />
    </>,
    document.body
  );
};
