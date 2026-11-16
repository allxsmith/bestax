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
import { usePortalContainer } from '../helpers/portal';
import { LocalePortalScope } from '../helpers/LocaleProvider';
import { StatusRegion, spokenText } from '../helpers/statusRegion';
import { scrollLockOffset } from '../helpers/scrollLock';
import { useDismissTimer } from '../helpers/useDismissTimer';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { moveFocusOut } from '../helpers/moveFocusOut';
import { useLatestRef } from '../helpers/useLatestRef';
import { getActiveElementInTree } from '../helpers/shadowDom';

/**
 * Props for the Notification component.
 */
export interface NotificationProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string | undefined;
  /**
   * Bulma color modifier for the notification (renders `is-<color>`).
   *
   * Only `primary`, `link`, `info`, `success`, `warning`, `danger`, `black`,
   * `white`, `light`, and `dark` have shipped CSS for `.notification`. Every
   * other value the union accepts emits a class no CSS rule matches, so the
   * notification renders unstyled; those log a console warning in development
   * and will be removed from this union in the next major version.
   *
   * `dark` and `light` take their color's own text and background from
   * bestax's stylesheets, as a dark or light `Button` has. With Bulma's CSS
   * alone, their text inherits the color around it, which on a light page is
   * one shade off a dark notification's background, and on a dark page is
   * hard to read on a light one.
   */
  color?: (typeof validColors)[number] | undefined;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Use the light color variant. The light and dark colors have none, so
   * `color="light"` or `color="dark"` with `isLight` looks the same as
   * without it, as a light or dark `Button` does.
   *
   * `white` and `black` with `isLight` take Bulma's light gray background,
   * and the light color's text from bestax's stylesheets. With Bulma's CSS
   * alone, their text inherits the color around it, which on a dark page is
   * hard to read.
   */
  isLight?: boolean;
  /**
   * Shows a close (delete) button in the notification. It renders
   * `type="button"`, so it does not submit a form around it.
   *
   * The notification also takes `has-delete`, which pads its end by
   * `--bulma-notification-delete-padding-inline-end` so the text clears the
   * button. That rule ships in bestax's stylesheets, not Bulma's, so an app
   * styled by Bulma's CSS alone keeps Bulma's padding.
   */
  hasDelete?: boolean;
  /** Callback fired when the delete button is clicked. */
  onDelete?: () => void;
  /**
   * Names the close button `hasDelete` shows, in place of "Close
   * notification", for an app in another language. An empty one keeps that
   * name.
   */
  ariaCloseLabel?: string;
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
  ariaCloseLabel,
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
    // The light color's own class is this key too, and this one comes later,
    // so it has to set the class for `light` as well or it erases it.
    'is-light': isLight || color === 'light',
    'has-delete': hasDelete,
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
          type="button"
          className={deleteClasses}
          onClick={onDelete}
          aria-label={ariaCloseLabel || 'Close notification'}
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
   * or an image's `alt`, standing in for what's inside it, a break between
   * block-level elements, and parts that are `aria-hidden`, `hidden` or
   * inline-styled `display: none` left out. Other ways of naming or hiding
   * content, such as `aria-labelledby`, CSS-generated content or a
   * stylesheet's `display: none`, aren't followed, so a message that relies on
   * them can be announced differently from what a screen reader would read.
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
   *
   * `dark` and `light` take their color's own text and background from
   * bestax's stylesheets, as a dark or light `Button` has. With Bulma's CSS
   * alone, their text inherits the color around it, which on a light page is
   * one shade off a dark notification's background, and on a dark page is
   * hard to read on a light one.
   */
  color?: (typeof validColors)[number];
  /**
   * Use the light color variant. The light and dark colors have none, so
   * `color="light"` or `color="dark"` with `isLight` looks the same as
   * without it, as a light or dark `Button` does.
   *
   * `white` and `black` with `isLight` take Bulma's light gray background,
   * and the light color's text from bestax's stylesheets. With Bulma's CSS
   * alone, their text inherits the color around it, which on a dark page is
   * hard to read.
   */
  isLight?: boolean;
  /**
   * Duration in ms before auto-close. Default 3000.
   *
   * The countdown waits while focus is inside the notification, on its close
   * button or on a link in its message, whatever `pauseOnHover` says, and once
   * focus leaves, the notification gets its whole duration again.
   */
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
  /**
   * Names the close button, in place of "Close notification", for an app in
   * another language. An empty one keeps that name.
   */
  ariaCloseLabel?: string;
  /** Stay open until dismissed. */
  indefinite?: boolean;
  /**
   * Pause auto-close timer on hover. Default true. Focus inside the
   * notification pauses it either way (see `duration`).
   */
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
 * @param {{ instance: NotificationInstance; onClose: (id: string) => void; registerMessage: (id: string, node: HTMLElement | null) => void; handOffFocus: (id: string, node: HTMLElement) => void }} props - Component props.
 * @returns {JSX.Element} The rendered notification item.
 */
const NotificationItem: React.FC<{
  instance: NotificationInstance;
  onClose: (id: string) => void;
  registerMessage: (id: string, node: HTMLElement | null) => void;
  handOffFocus: (id: string, node: HTMLElement) => void;
}> = ({ instance, onClose, registerMessage, handOffFocus }) => {
  const {
    message,
    color,
    isLight,
    duration = 3000,
    hasDelete = true,
    ariaCloseLabel,
    indefinite = false,
    pauseOnHover = true,
  } = instance.options;

  const [isPaused, setIsPaused] = useState(false);
  const urgent = isUrgentColor(color);

  const handleClose = useCallback(() => {
    onClose(instance.id);
  }, [onClose, instance.id]);

  // The message's element, whose parent is the notification's, since
  // Notification takes no ref. The container keeps it too, to read a polite
  // one's text for its status region and to find the notification. It's
  // attached for as long as the notification is on the page, which is when
  // the timer and the cleanup below read it.
  const messageElRef = useRef<HTMLElement | null>(null);
  const notificationEl = useCallback(
    () => messageElRef.current!.parentElement!,
    []
  );
  const messageRef = useCallback(
    (node: HTMLElement | null) => {
      messageElRef.current = node;
      registerMessage(instance.id, node);
    },
    [registerMessage, instance.id]
  );

  // Auto-close timer. It waits while focus is inside the notification, so
  // what someone is using doesn't go away under them, whatever pauseOnHover
  // says.
  const { onFocus: handleFocus } = useDismissTimer(
    handleClose,
    indefinite || duration === 0 || isPaused ? null : duration,
    notificationEl
  );

  // A layout effect's cleanup, because it runs before the notification's
  // element leaves the page, while focus can still be in it. The container
  // decides where focus goes.
  useClientLayoutEffect(
    () => () => handOffFocus(instance.id, notificationEl()),
    [handOffFocus, instance.id, notificationEl]
  );

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
      ariaCloseLabel={ariaCloseLabel}
      onDelete={handleClose}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Only the message is announced, not the close button Notification
          renders ahead of its children. Danger and warning announce
          themselves as an assertive alert, which a screen reader reliably
          reads out even when it arrives with its text. The rest are announced
          through the container's status region, which reads their text from
          this span, so it carries no role of its own that would announce them
          a second time. */}
      {urgent ? (
        <span role="alert" aria-live="assertive" ref={messageRef}>
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
 * While an overlay locks the page, each side adds the room the page's
 * scrollbar gave back there, so the stack stays put as the scrollbar goes.
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
  const left = scrollLockOffset('left');
  const right = scrollLockOffset('right');

  return {
    position: 'fixed',
    zIndex: 100,
    display: 'flex',
    flexDirection: isBottom ? 'column-reverse' : 'column',
    gap: '0.75rem',
    padding: '1rem',
    pointerEvents: 'none',
    maxWidth: `calc(100% - ${left} - ${right})`,
    ...(isBottom ? { bottom: 0 } : { top: 0 }),
    ...(isCenter
      ? {
          left: `calc(50% + (${left} - ${right}) / 2)`,
          transform: 'translateX(-50%)',
          alignItems: 'center',
        }
      : isRight
        ? { right, alignItems: 'flex-end' }
        : { left, alignItems: 'flex-start' }),
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
 * The text stays in the region briefly, even if the notification closes in
 * the meantime, and while both are up the page holds two copies of it. A
 * polite notification that closes before its announcement is written, a
 * moment after it appears, isn't announced at all. `danger` and `warning`
 * notifications announce themselves as assertive alerts. The region is hidden
 * with inline styles, so it needs no stylesheet.
 *
 * When a notification closes with focus inside it, focus moves to the close
 * button of the next notification in its stack that stays open and has one,
 * or else of the one before it, or, with neither, back to where it was before
 * it went into a notification. Focus anywhere else stays where it is.
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
  const resolveContainer = usePortalContainer();

  // The notifications the status region announces. Danger and warning
  // announce themselves.
  const politeItems = useMemo(
    () => items.filter(item => !isUrgentColor(item.options.color)),
    [items]
  );

  // Each notification's message element: the status region reads a polite
  // one's text, so it announces the text on screen, whatever the message
  // renders, and its parent is the notification, for handing focus on.
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

  // Where focus last was outside the notifications, for handing it back. It
  // follows focus anywhere on the page, so it's where focus came from when it
  // went into a notification, and it's cleared when focus goes to the page
  // itself, so a click on the page's background leaves nothing to go back to.
  const focusOriginRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const isInNotification = (target: Node) => {
      for (const message of messageNodesRef.current.values()) {
        if (message.parentElement!.contains(target)) return true;
      }
      return false;
    };
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.composedPath()[0] as HTMLElement;
      if (!isInNotification(target)) focusOriginRef.current = target;
    };
    const handleFocusOut = (event: FocusEvent) => {
      const target = event.composedPath()[0] as HTMLElement;
      if (!event.relatedTarget && !isInNotification(target)) {
        focusOriginRef.current = null;
      }
    };
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
    };
  }, []);

  // When a notification closes with focus inside it, as one does from its
  // close button, the browser would drop focus to the page, and the next Tab
  // would start from wherever it resumes, the end of the page for a portaled
  // stack. So focus moves first: to the close button of the next
  // notification in its stack that stays open and has one, or else of the
  // one before it, and otherwise back to where it was before it went into a
  // notification. One that arrives in the same render, as a queued one does,
  // isn't on the page yet to take it. A notification that leaves the page
  // without closing, as one remounting at a new position does, and focus
  // anywhere else, are left alone. React hears no focus event for a move
  // made while notifications leave, so the notification focus lands in hears
  // it through its own element instead.
  const deleteClassRef = useLatestRef(usePrefixedClassNames('delete'));
  const handOffFocus = useCallback(
    (id: string, node: HTMLElement) => {
      if (!node.contains(getActiveElementInTree(node))) return;
      const staying = new Set(getVisibleNotifications().map(item => item.id));
      if (staying.has(id)) return;
      const stayingEls = new Set<Element>();
      for (const [otherId, message] of messageNodesRef.current) {
        if (staying.has(otherId)) stayingEls.add(message.parentElement!);
      }
      // A notification's close button, which Notification renders first,
      // when it stays open and has one.
      const closeButtonOf = (el: Element) => {
        const first = el.firstElementChild;
        return stayingEls.has(el) &&
          first?.classList.contains(deleteClassRef.current)
          ? (first as HTMLElement)
          : null;
      };
      let next: HTMLElement | null = null;
      for (let el = node.nextElementSibling; el && !next;) {
        next = closeButtonOf(el);
        el = el.nextElementSibling;
      }
      for (let el = node.previousElementSibling; el && !next;) {
        next = closeButtonOf(el);
        el = el.previousElementSibling;
      }
      const origin = focusOriginRef.current;
      moveFocusOut([node], next ?? origin, next ? origin : null);
    },
    [deleteClassRef]
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

  const target = resolveContainer();
  return createPortal(
    <LocalePortalScope target={target}>
      {stacks.map(stack => (
        <div key={stack.key} style={notificationStackStyle(stack.position)}>
          {stack.items.map(item => (
            <NotificationItem
              key={item.id}
              instance={item}
              onClose={notification.close}
              registerMessage={registerMessage}
              handOffFocus={handOffFocus}
            />
          ))}
        </div>
      ))}
      <StatusRegion items={politeItems} describe={describe} />
    </LocalePortalScope>,
    target
  );
};
