import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { getActiveElementInTree, isEventInside } from '../helpers/shadowDom';
import {
  isTyping,
  matchesShortcut,
  parseShortcut,
  type ParsedShortcut,
} from '../helpers/shortcut';
import { focusWithoutTabStop } from '../helpers/moveFocusOut';
import { DeleteTarget } from '../helpers/deleteTarget';
import { passFocusOn, useFocusOrigin } from '../helpers/focusHandOff';
import {
  classNames,
  prefixedClassNames,
  usePrefixedClassNames,
} from '../helpers/classNames';
import { useClassPrefix } from '../helpers/Config';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Portal, usePortalContainer, usePortalProp } from '../helpers/portal';
import { LocalePortalScope } from '../helpers/LocaleProvider';
import { groupIntoPositionStacks } from '../helpers/positionStacks';
import { useLatestRef } from '../helpers/useLatestRef';
import { isModalOverlayOpen, useOverlayStack } from '../helpers/overlayStack';
import { useDismissTimer } from '../helpers/useDismissTimer';
import { chain } from '../helpers/useHoverOpen';

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
 * @extraProp {React.MouseEventHandler<HTMLDivElement>} [onClick] - Called on a click on the toast. With `dismissible` left out, a toast with an `onClick` stays open on a click on it; with `dismissible` set to `true`, it closes after `onClick` runs.
 */
export interface ToastProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** The message to display. */
  message: string;
  /** Color variant — colors the toast **background**. */
  type?: ToastType | undefined;
  /** Color variant — colors the **action button** text. */
  actionType?: ToastType;
  /**
   * Position on the screen. Default: 'top-right'. On a standalone `<Toast>`
   * this places it. Through `toast.show()` it places that toast, and a toast
   * shown without one goes to `ToastContainer`'s `position` instead.
   */
  position?: ToastPosition;
  /**
   * Duration in ms before auto-close. `0` disables auto-close.
   *
   * The countdown waits while focus is inside the toast, on its action,
   * cancel or close button, whatever `pauseOnHover` says, and once focus
   * leaves, the toast gets its whole duration again.
   */
  duration?: number;
  /** Keeps the toast visible until dismissed. */
  indefinite?: boolean;
  /**
   * Whether clicking the toast (or outside it) dismisses it. A toast you
   * give an `onClick` closes on a click on it only when you set
   * `dismissible` yourself, and then after your `onClick` runs.
   * @defaultValue true
   */
  dismissible?: boolean;
  /** Show an explicit close (X) button. Default: false. */
  closable?: boolean;
  /**
   * Names the close button `closable` shows, in place of "Close", for an app
   * in another language. An empty one keeps that name.
   */
  ariaCloseLabel?: string;
  /** Pill-shaped (rounded corners). */
  rounded?: boolean;
  /**
   * Pause auto-close timer on hover. Default: false. Focus inside the toast
   * holds it open either way (see `duration`).
   */
  pauseOnHover?: boolean;
  /**
   * Whether the toast can be dismissed with Escape. While a Modal, Dialog,
   * Sidebar or full-page Loading is open, Escape goes to that overlay and the
   * toast stays up, so Escape dismisses the toast once none is open. An
   * Escape a popup on the page closed on, by calling `preventDefault()`,
   * leaves it up too. Default: true.
   */
  cancelable?: boolean;
  /** Text for an action button (e.g. "Undo"). */
  actionText?: string;
  /** Text for a cancel button. */
  cancelText?: string;
  /** Callback when the action button is clicked. */
  onAction?: () => void;
  /**
   * Callback when the toast closes itself: on its timer, from its buttons,
   * on Escape when it's cancelable, or, when it's dismissible, on a click on
   * it or outside it. Through `toast.show()`, it runs before the toast
   * leaves the store, and not when the app closes the toast with
   * `toast.close()` or `toast.closeAll()`, so cleanup that has to run
   * however the toast goes, such as committing a delete, goes beside those
   * calls too.
   */
  onClose?: () => void;
  /**
   * CSS selector or DOM node to mount the toast into. Through `toast.show()`,
   * a toast with one portals there in a box of its own, rather than joining
   * `ToastContainer`'s stack for its position.
   */
  container?: string | HTMLElement;
  /**
   * Renders inline instead of using a portal. Without it, a toast renders
   * inline on the server and while hydrating, moving into the portal once the
   * client takes over, so hydration matches. Through `toast.show()`, a toast
   * already renders inline in `ToastContainer`'s stack for its position, and
   * `inline` keeps one with a `container` in that stack too.
   */
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
      dismissible: dismissibleProp,
      closable = false,
      ariaCloseLabel,
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
    const dismissible = dismissibleProp ?? true;
    // A caller's own `onClick` used to replace the close on a click, so a
    // toast given one closes on a click only when it says `dismissible`
    // itself. A click outside closes it either way.
    const closesOnClick =
      dismissible && (dismissibleProp !== undefined || !rest.onClick);
    // A portal has no server-rendered counterpart, so the toast renders in
    // place on the server and while hydrating, and moves into its portal
    // once the client takes over, as Modal's `portal` does.
    const portal = usePortalProp(container || true);
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const toastRef = useRef<HTMLDivElement | null>(null);

    // Cleanup returned by a consumer's callback ref on attach, held until detach.
    const consumerCleanupRef = useRef<(() => void) | null>(null);
    // A toast closes once. Events that land in the same batch as the close,
    // before the render that hides it, would otherwise close it again, or run
    // its action after it closed, and call `onClose` a second time.
    const closedRef = useRef(false);
    const handleClose = useCallback(() => {
      if (closedRef.current) return;
      closedRef.current = true;
      // `onClose` first, so `ToastContainer` drops the toast from its store
      // before the render that hides it, or in it, even where React doesn't
      // batch the two, as a legacy root doesn't outside its own events. The
      // container reads that to tell a toast closing from one moving. It
      // hides even when `onClose` throws, since it can't close again.
      try {
        onClose?.();
      } finally {
        setIsVisible(false);
      }
    }, [onClose]);

    const handleAction = useCallback(() => {
      if (closedRef.current) return;
      onAction?.();
      handleClose();
    }, [onAction, handleClose]);

    // Read when a click lands outside or Escape arrives, so the listeners
    // stay put while `onClose` changes identity, as an inline one does on
    // every render of the parent. An inline one from `ToastContainer` changes
    // whenever another toast shows.
    const handleCloseRef = useLatestRef(handleClose);

    // Auto-close timer. It waits while focus is inside the toast, on its
    // action, cancel or close button, so what someone is using doesn't go
    // away under them, whatever pauseOnHover says. It stops once the toast
    // has closed, as the listeners for a click outside and Escape do, since
    // one the caller keeps mounted stays hidden. Given the toast's element,
    // it also hears focus React doesn't, as when `ToastContainer` moves focus
    // here while another toast closes.
    const { onFocus: handleTimerFocus } = useDismissTimer(
      handleClose,
      !isVisible || indefinite || duration === 0 || isPaused ? null : duration,
      () => toastRef.current
    );

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
        if (toastRef.current && !isEventInside(e, toastRef.current)) {
          handleCloseRef.current();
        }
      };

      const raf = requestAnimationFrame(() => {
        document.addEventListener('click', handleDocumentClick);
      });

      return () => {
        cancelAnimationFrame(raf);
        document.removeEventListener('click', handleDocumentClick);
      };
    }, [dismissible, isVisible, handleCloseRef]);

    // A toast is a notification rather than a layer, so it never joins the
    // stack of open overlays. Asking the stack tells it whether one is open:
    // an Escape while one is belongs to the overlay, and the toast waits.
    const isTopmost = useOverlayStack(false);

    // On `window`, as in `Modal`, so a popup on the page has had the key
    // first, and an Escape it closed on doesn't dismiss the toast as well.
    useEffect(() => {
      if (!cancelable || !isVisible) return undefined;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !e.defaultPrevented && isTopmost()) {
          handleCloseRef.current();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cancelable, isVisible, handleCloseRef, isTopmost]);

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
          // same shape as `Dropdown`, `Modal`, `Dialog`, `Sidebar` and `Carousel`.
          // The form controls that merge a forwarded ref still discard the cleanup
          // and detach with `ref(null)`, so this is not yet library-wide — grep
          // `typeof ref === 'function'` for the current split. Memoized because an
          // unstable ref identity makes React detach and re-attach on every render,
          // which would run that cleanup each time.
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
        {...rest}
        // After the spread, so a caller's own handler runs as well rather
        // than replacing the toast's: the hover pause, the close on a click
        // where it applies, and the focus that holds the timer, which comes
        // first so it holds whatever the caller's does.
        onMouseEnter={chain(rest.onMouseEnter, handleMouseEnter)}
        onMouseLeave={chain(rest.onMouseLeave, handleMouseLeave)}
        // The caller's first, then the close where it applies, both when the
        // click comes, so nothing reads the toast's refs while it renders.
        onClick={e => {
          rest.onClick?.(e);
          if (closesOnClick) handleClose();
        }}
        onFocus={e => {
          handleTimerFocus(e);
          rest.onFocus?.(e);
        }}
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
            aria-label={ariaCloseLabel || 'Close'}
          >
            <DeleteTarget />
          </button>
        )}
      </div>
    );

    if (inline) {
      return toastElement;
    }

    return (
      <Portal disabled={!portal.isPortaled} container={portal.container}>
        <div className={containerClasses}>{toastElement}</div>
      </Portal>
    );
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
  /**
   * When true, toasts enter a FIFO queue and display one at a time, one queue
   * across every `position`. Default false.
   */
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

/** The order a toast was shown in, read from its id. */
const toastNumber = (t: ToastInstance) => Number(t.id.slice('toast-'.length));
const toastListeners: Set<(toasts: ToastInstance[]) => void> = new Set();
let toasts: ToastInstance[] = [];

// Queued toasts: FIFO queue, one at a time
let queuedToasts: ToastInstance[] = [];
let currentQueuedToast: ToastInstance | null = null;

// The server has nowhere to portal a toast to, and its copy of this module is
// shared by every request, so server rendering reads an empty list. Hydration
// reads it too, which keeps the first client render matching the server's.
const noToasts: ToastInstance[] = [];
const getServerToasts = () => noToasts;

// What a container shows right now: the stacked toasts, then the queued one on
// screen. ToastContainer renders from this rather than from updates alone, so
// toasts raised before it mounted still appear. It is replaced rather than
// mutated, and only when listeners are notified, because useSyncExternalStore
// needs the same array back between changes. An empty list is `noToasts`
// itself, so a container that hydrates with nothing to show reads the same
// snapshot the server did and has no reason to render again.
let visibleToasts: ToastInstance[] = noToasts;
const getVisibleToasts = () => visibleToasts;

const notifyListeners = () => {
  const allVisible = [...toasts];
  if (currentQueuedToast) {
    allVisible.push(currentQueuedToast);
  }
  visibleToasts = allVisible.length > 0 ? allVisible : noToasts;
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

/** The keys `ToastContainer` moves focus to the newest toast on. */
const DEFAULT_HOTKEY: readonly string[] = ['F8'];

/** The modifier flags a hotkey entry can name, and their names in a shortcut. */
const hotkeyModifiers: Record<string, string> = {
  altKey: 'alt',
  ctrlKey: 'ctrl',
  metaKey: 'meta',
  shiftKey: 'shift',
};

/** A hotkey, read: the shortcut it makes, and its key's code. */
interface ReadHotkey {
  combination: ParsedShortcut;
  code: string;
}

/**
 * Reads a hotkey as a shortcut, modifiers first and its one key last: `F8`
 * becomes `f8` and `['altKey', 'KeyT']` becomes `alt+t`. The code stays as
 * given, for a key the shortcut can't name, such as `Period` or `Numpad1`.
 *
 * @function
 * @param {readonly string[]} hotkey - The entries.
 * @returns {ReadHotkey | null} The combination and the code, or `null` when
 *   the entries don't name exactly one key.
 */
const readHotkey = (hotkey: readonly string[]): ReadHotkey | null => {
  const isModifier = (entry: string) =>
    Object.prototype.hasOwnProperty.call(hotkeyModifiers, entry);
  const modifiers = hotkey.filter(isModifier);
  const keys = hotkey.filter(entry => !isModifier(entry));
  if (keys.length !== 1) return null;
  const key = keys[0].replace(/^(Key|Digit)(?=.$)/, '');
  const combination = parseShortcut(
    [...modifiers.map(entry => hotkeyModifiers[entry]), key].join('+')
  );
  return combination && { combination, code: keys[0] };
};

/**
 * Whether a keydown is the hotkey: by its key, as a shortcut matches, or, for
 * a code other than a letter's or a digit's, by the code with the same
 * modifiers, since a key such as `Period` types `.` and `Numpad1` types `1`.
 * A letter or digit is matched by its key only, as a shortcut's is, so
 * another layout's letter in its place doesn't count too.
 *
 * @function
 * @param {KeyboardEvent} event - The keydown.
 * @param {ReadHotkey} hotkey - The hotkey, read.
 * @returns {boolean} Whether it's the hotkey.
 */
const matchesHotkey = (
  event: KeyboardEvent,
  { combination, code }: ReadHotkey
): boolean =>
  matchesShortcut(event, combination) ||
  (!/^(Key|Digit)/.test(code) &&
    event.code === code &&
    event.altKey === combination.alt &&
    event.ctrlKey === combination.ctrl &&
    event.metaKey === combination.meta &&
    event.shiftKey === combination.shift);

/**
 * The hotkey as a person reads it: `F8`, or `Alt+T` for
 * `['altKey', 'KeyT']`.
 *
 * @function
 * @param {readonly string[]} hotkey - The entries.
 * @returns {string} Them joined with `+`, modifier flags named, and `Key` and
 *   `Digit` taken off a code.
 */
const hotkeyLabel = (hotkey: readonly string[]): string =>
  hotkey
    .map(key =>
      key.endsWith('Key') && key.length > 3
        ? key[0].toUpperCase() + key.slice(1, -3)
        : key.replace(/^(Key|Digit)/, '')
    )
    .join('+');

/**
 * A toast's first button, which the hotkey and closing a toast send focus to.
 *
 * @param el - The toast's element.
 * @returns The button, or `null` for a toast with none.
 */
const firstButtonOf = (el: Element): HTMLElement | null =>
  el.querySelector<HTMLElement>('button');

/**
 * A toast `ToastContainer` renders, which hands its element to the container
 * by id, for the hotkey and for passing focus on when a toast closes.
 *
 * @function
 * @param {ToastProps & { toastId: string; register: (id: string, node: HTMLDivElement | null) => void }} props - The toast's props, its id in the store and the container's register.
 * @returns {JSX.Element} The toast.
 */
const RegisteredToast: React.FC<
  ToastProps & {
    toastId: string;
    register: (id: string, node: HTMLDivElement | null) => void;
  }
> = ({ toastId, register, ...props }) => {
  const ref = useCallback(
    (node: HTMLDivElement | null) => register(toastId, node),
    [register, toastId]
  );
  return <Toast ref={ref} {...props} />;
};

// The order ToastContainer renders its stacks in: across the top of the
// screen, then across the bottom.
const toastStackOrder: readonly ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

/**
 * Container component for rendering programmatic toasts.
 * Place once at your app root to enable the toast API. A toast shown with a
 * `position` appears there, and one shown without goes to the container's
 * `position`. The toasts at one position stack in one `.toast-container`,
 * with a gap between them, in the order they were shown, growing away from
 * the edge of the screen. A toast shown with a `container` of its own, and
 * not `inline`, portals there instead, in a box of its own.
 *
 * Each stack is a region named "Notifications", with its hotkey after it,
 * "Notifications (F8)" by default. The hotkey moves keyboard focus to the
 * newest toast's first button, or to the toast itself when it has none, so
 * someone who can't reach a toast with a pointer gets there before it closes,
 * and the toast stays open while focus is inside it.
 *
 * When a toast closes with focus inside it, focus moves to the first button
 * of the next toast in its stack that stays and has one, or else of the one
 * before it, or, with neither, back to where it was before it went into a
 * toast, while that's still on the page. Focus anywhere else stays where it
 * is.
 *
 * @function
 * @param {{ position?: ToastPosition; hotkey?: readonly string[]; ariaLabel?: string }} props - Container props.
 * @returns {JSX.Element | null} The rendered toast container, or null if empty.
 */
export const ToastContainer: React.FC<{
  /**
   * Where a toast shown without a `position` of its own appears. Default:
   * 'top-right'. When it changes, those toasts move without remounting, but
   * one shown with its own `position` equal to the old or new value
   * remounts and starts over as if it had just been shown.
   */
  position?: ToastPosition;
  /**
   * The keys that move keyboard focus to the newest toast: modifier flags
   * (`altKey`, `ctrlKey`, `metaKey`, `shiftKey`) and one key, by its code
   * (`F8`, `KeyT`, `Digit1`, `Period`), held together with no other
   * modifier. A key that types a character, with no Ctrl, Meta or Alt,
   * doesn't count while someone is typing in a field. `[]` turns the hotkey
   * off.
   * @defaultValue ['F8']
   */
  hotkey?: readonly string[] | undefined;
  /**
   * Names each stack's region, with the hotkey after it, for an app in
   * another language. Default: `'Notifications'`, read as
   * "Notifications (F8)".
   */
  ariaLabel?: string | undefined;
}> = ({
  position = 'top-right',
  hotkey = DEFAULT_HOTKEY,
  ariaLabel = 'Notifications',
}) => {
  // Starts from the toasts already showing instead of an empty list, then
  // follows changes.
  const toastList = useSyncExternalStore(
    toast.subscribe,
    getVisibleToasts,
    getServerToasts
  );
  const resolveContainer = usePortalContainer();
  const classPrefix = useClassPrefix();

  // Each toast's element, by id, for the hotkey to find and for passing
  // focus on.
  const elementsRef = useRef(new Map<string, HTMLDivElement>());

  // Where focus last was outside the toasts, for handing it back.
  const focusOriginRef = useFocusOrigin(target => {
    for (const el of elementsRef.current.values()) {
      if (el.contains(target)) return true;
    }
    return false;
  });

  // When a toast closes with focus inside it, as one does from its own
  // buttons, the browser would drop focus to the page, and the next Tab would
  // start from the end of it, where the stacks are portaled. So as React lets
  // go of the toast's element, while it's still on the page, focus moves: to
  // the first button of the next toast in its stack that stays and has one,
  // or else of the one before it, and otherwise back to where it was before
  // it went into a toast, while that's still on the page. Tied to the
  // element rather than to the toast's unmounting, so it runs in whichever
  // render removes the element. A toast that leaves the page without
  // closing, as one that changes stacks does, and focus anywhere else, are
  // left alone. One that arrives in the same render, as a queued one does,
  // isn't on the page yet to take it. React hears no focus event for a move
  // made then, so the toast focus lands in hears it only through its own
  // element, which holds its timer, and a caller's `onFocus` on it doesn't
  // run for it.
  const register = useCallback(
    (id: string, node: HTMLDivElement | null) => {
      if (node) {
        elementsRef.current.set(id, node);
        return;
      }
      // Set when React attached it, which it always does before letting go.
      const el = elementsRef.current.get(id)!;
      elementsRef.current.delete(id);
      passFocusOn({
        id,
        closing: el,
        showing: getVisibleToasts,
        elements: () => elementsRef.current,
        pick: firstButtonOf,
        origin: focusOriginRef.current,
      });
    },
    [focusOriginRef]
  );

  // The hotkey moves focus to the newest toast's first button, or to the
  // toast itself, given `tabindex="-1"` while it holds focus, when it has
  // none. It leaves the key alone with no toast showing, while a modal
  // overlay has the page shut off, when the key is typed text in a field,
  // and when focus can't go there.
  const hotkeyKey = hotkey.join(' ');
  useEffect(() => {
    const read = readHotkey(hotkey);
    if (!read) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      // A key that types a character, with no Ctrl, Meta or Alt, is text
      // while someone types in a field.
      const typed =
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey;
      if (
        event.defaultPrevented ||
        event.isComposing ||
        !matchesHotkey(event, read) ||
        (typed && isTyping(event)) ||
        isModalOverlayOpen()
      ) {
        return;
      }
      // The newest is the one shown last, whatever queue it waited in.
      const newest = getVisibleToasts().reduce<ToastInstance | undefined>(
        (latest, t) =>
          !latest || toastNumber(t) > toastNumber(latest) ? t : latest,
        undefined
      );
      const el = newest && elementsRef.current.get(newest.id);
      if (!el) return;
      const button = firstButtonOf(el);
      const moved = button
        ? (button.focus(), getActiveElementInTree(button) === button)
        : focusWithoutTabStop(el);
      if (moved) event.preventDefault();
    };
    // On `window`, where a keydown arrives last, so anything on the page
    // that used the key first has said so with `preventDefault()`.
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // `hotkeyKey` stands for the entries, so an inline array doesn't add the
    // listener again on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkeyKey]);

  // Named with the hotkey only when there's one to press.
  const regionLabel =
    readHotkey(hotkey) !== null
      ? `${ariaLabel} (${hotkeyLabel(hotkey)})`
      : ariaLabel;

  if (typeof document === 'undefined' || toastList.length === 0) {
    return null;
  }

  // A toast shown with a `container` of its own, and not `inline`, portals
  // there in a box of its own. Every other toast renders inline in the stack
  // for its position, so the toasts at one position stack instead of each
  // sitting in a box of its own on top of the others. An empty `container`
  // falls back to the page, as it does on a Toast, so it means none here.
  const ownsContainer = (t: ToastInstance) =>
    !!t.props.container && !t.props.inline;
  const renderToast = (
    t: ToastInstance,
    at: ToastPosition,
    inline: boolean
  ) => {
    const { queue: _queue, onClose, ...toastProps } = t.props;
    return (
      <RegisteredToast
        key={t.id}
        toastId={t.id}
        register={register}
        {...toastProps}
        position={at}
        inline={inline}
        // The toast's own `onClose`, then out of the store, even when that
        // throws, so a queue behind it moves on.
        onClose={() => {
          try {
            onClose?.();
          } finally {
            toast.close(t.id);
          }
        }}
      />
    );
  };

  const stacks = groupIntoPositionStacks(
    toastList.filter(t => !ownsContainer(t)),
    t => t.props.position,
    position,
    toastStackOrder
  );

  const target = resolveContainer();
  return createPortal(
    <LocalePortalScope target={target}>
      {stacks.map(stack => (
        <div
          key={stack.key}
          className={prefixedClassNames(
            classPrefix,
            'toast-container',
            `is-${stack.position}`
          )}
          role="region"
          aria-label={regionLabel}
        >
          {stack.items.map(t => renderToast(t, stack.position, true))}
        </div>
      ))}
      {toastList
        .filter(ownsContainer)
        .map(t => renderToast(t, t.props.position ?? position, false))}
    </LocalePortalScope>,
    target
  );
};

export default Toast;
