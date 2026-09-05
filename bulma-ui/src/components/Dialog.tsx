import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { Modal } from './Modal';

/** Valid dialog type/color values. */
export type DialogType = 'default' | 'success' | 'danger' | 'warning' | 'info';

/**
 * Props for the Dialog component.
 * @extraProp {string} [className] - Additional CSS classes.
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the dialog element.
 */
export interface DialogProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  /** Whether the dialog is open (required). */
  isOpen: boolean;
  /** Dialog title. */
  title?: string;
  /** Dialog message/content (required). */
  message: string | React.ReactNode;
  /** The type/color of the dialog. Default: 'default'. */
  type?: DialogType;
  /** Text for confirm button. Default: 'OK'. */
  confirmText?: string;
  /** Text for cancel button. Default: 'Cancel'. */
  cancelText?: string;
  /** Callback when confirm button is clicked. */
  onConfirm?: () => void;
  /** Callback when cancel button is clicked or dismissed. */
  onCancel?: () => void;
  /** Whether to show cancel button. Default: true for confirm dialogs. */
  showCancel?: boolean;
  /** Whether the dialog can be dismissed. Default: true. */
  canCancel?: boolean;
  /** Focus cancel button instead of confirm. Default: false. */
  focusCancel?: boolean;
  /** Custom icon to display. */
  icon?: React.ReactNode;
  /**
   * Renders the dialog into a portal target instead of inline. Forwarded to
   * the underlying `Modal`; see its `portal` prop for the accepted values.
   * @defaultValue false
   */
  portal?: boolean | string | HTMLElement;
}

/**
 * The `Dialog` component provides ready-made confirm and alert dialogs, so a destructive action stays one `await dialog.confirm()` call away.
 *
 * @function
 * @param {DialogProps} props - Props for the Dialog component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the dialog element.
 * @returns {JSX.Element | null} The rendered dialog component.
 *
 * @example
 * // Alert dialog
 * <Dialog
 *   isOpen={showAlert}
 *   title="Success"
 *   message="Operation completed successfully!"
 *   type="success"
 *   onConfirm={() => setShowAlert(false)}
 *   showCancel={false}
 * />
 *
 * @example
 * // Confirm dialog
 * <Dialog
 *   isOpen={showConfirm}
 *   title="Delete Item?"
 *   message="This action cannot be undone."
 *   type="danger"
 *   confirmText="Delete"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      isOpen,
      title,
      message,
      type = 'default',
      confirmText = 'OK',
      cancelText = 'Cancel',
      onConfirm,
      onCancel,
      showCancel = true,
      canCancel = true,
      focusCancel = false,
      icon,
      portal,
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const dialogRef = useRef<HTMLDivElement>(null);
    // Cleanup returned by a consumer's callback ref on attach, held until detach.
    const consumerCleanupRef = useRef<(() => void) | null>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);

    // Handle cancel
    const handleCancel = useCallback(() => {
      if (canCancel) {
        onCancel?.();
      }
    }, [canCancel, onCancel]);

    // Handle confirm
    const handleConfirm = useCallback(() => {
      onConfirm?.();
    }, [onConfirm]);

    // Handle background click
    const handleBackgroundClick = useCallback(() => {
      if (canCancel) {
        handleCancel();
      }
    }, [canCancel, handleCancel]);

    // Moving into the portal remounts the Modal's subtree — these buttons
    // included — so the focus effect below has to re-run against the new
    // nodes, exactly as the Modal's own focus effect does.
    const isHydrated = useIsHydrated();
    const isPortaled = Boolean(portal) && isHydrated;

    // Focus management — Dialog picks a specific button rather than the
    // Modal's default (first focusable/root); this effect runs after the
    // inner Modal's own focus-on-open effect, so it wins.
    useEffect(() => {
      if (isOpen) {
        const buttonToFocus =
          focusCancel && showCancel ? cancelRef.current : confirmRef.current;
        buttonToFocus?.focus();
      }
    }, [isOpen, focusCancel, showCancel, isPortaled]);

    // Use combined ref
    const combinedRef = useCallback(
      (node: HTMLDivElement | null) => {
        (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
        if (typeof ref === 'function') {
          // React 19 lets a callback ref return a cleanup function and detaches by
          // running it instead of calling the ref with `null`; React 18 discards the
          // return value entirely. Returning it from here would be a React-19-only
          // contract, so we hold the cleanup and run it ourselves on detach — the
          // same shape as `Dropdown` and `Modal`, so one consumer cleanup ref
          // behaves identically across every component in the library.
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

    // Generate classes
    const dialogClasses = usePrefixedClassNames('dialog', {
      [`is-${type}`]: type !== 'default',
    });
    const headerClass = usePrefixedClassNames('dialog-header');
    const iconClass = usePrefixedClassNames('dialog-icon');
    const titleClass = usePrefixedClassNames('dialog-title');
    const bodyClass = usePrefixedClassNames('dialog-body');
    const footerClass = usePrefixedClassNames('dialog-footer');
    const cancelButtonClass = usePrefixedClassNames('button');
    const confirmButtonClass = usePrefixedClassNames('button', {
      'is-success': type === 'success',
      'is-danger': type === 'danger',
      'is-warning': type === 'warning',
      'is-info': type === 'info',
      'is-primary': type === 'default',
    });

    const combinedClasses = classNames(
      dialogClasses,
      bulmaHelperClasses,
      className
    );

    // Get default icon based on type
    const getDefaultIcon = () => {
      switch (type) {
        case 'success':
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          );
        case 'danger':
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          );
        case 'warning':
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z" />
            </svg>
          );
        case 'info':
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-9h2v6h-2zm0-4h2v2h-2z" />
            </svg>
          );
        default:
          return null;
      }
    };

    const displayIcon = icon !== undefined ? icon : getDefaultIcon();

    if (!isOpen) {
      return null;
    }

    return (
      <Modal
        isActive={isOpen}
        onClose={handleCancel}
        role="presentation"
        portal={portal}
      >
        <Modal.Background onClick={handleBackgroundClick} />
        <div
          ref={combinedRef}
          className={combinedClasses}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={title ? 'dialog-title' : undefined}
          aria-describedby="dialog-message"
          {...rest}
        >
          {title && (
            <div className={headerClass}>
              {displayIcon && <span className={iconClass}>{displayIcon}</span>}
              <h3 id="dialog-title" className={titleClass}>
                {title}
              </h3>
            </div>
          )}
          <div id="dialog-message" className={bodyClass}>
            {message}
          </div>
          <div className={footerClass}>
            {showCancel && (
              <button
                ref={cancelRef}
                type="button"
                className={cancelButtonClass}
                onClick={handleCancel}
              >
                {cancelText}
              </button>
            )}
            <button
              ref={confirmRef}
              type="button"
              className={confirmButtonClass}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </Modal>
    );
  }
);

Dialog.displayName = 'Dialog';

// Dialog Manager for programmatic dialogs

/**
 * Options for showing a programmatic alert dialog.
 */
export interface AlertOptions {
  /** Dialog title. */
  title?: string;
  /** Dialog message/content. */
  message: string | React.ReactNode;
  /** Dialog type/color. */
  type?: DialogType;
  /** Text for the confirm button. */
  confirmText?: string;
  /** Custom icon to display. */
  icon?: React.ReactNode;
}

/**
 * Options for showing a programmatic confirm dialog.
 */
export interface ConfirmOptions extends AlertOptions {
  /** Text for the cancel button. */
  cancelText?: string;
  /** Focus cancel button instead of confirm. */
  focusCancel?: boolean;
}

/**
 * Options for showing a programmatic prompt dialog.
 */
export interface PromptOptions extends ConfirmOptions {
  /** Input placeholder text. */
  placeholder?: string;
  /** Default input value. */
  defaultValue?: string;
}

type DialogResolve = (value?: void | boolean | string) => void;

type DialogState = {
  type: 'alert' | 'confirm' | 'prompt';
  options: PromptOptions;
  resolve: DialogResolve;
};

let dialogListeners: Set<(dialog: DialogState | null) => void> = new Set();
let currentDialog: DialogState | null = null;

const notifyDialogListeners = () => {
  dialogListeners.forEach(listener => listener(currentDialog));
};

/**
 * Programmatic dialog API for showing dialogs from anywhere.
 */
export const dialog = {
  /**
   * Show an alert dialog. Returns a promise that resolves when closed.
   */
  alert: (options: AlertOptions | string): Promise<void> => {
    return new Promise<void>(resolve => {
      const opts = typeof options === 'string' ? { message: options } : options;
      currentDialog = {
        type: 'alert',
        options: opts,
        resolve: () => resolve(),
      };
      notifyDialogListeners();
    });
  },

  /**
   * Show a confirm dialog. Returns a promise that resolves to true/false.
   */
  confirm: (options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      const opts = typeof options === 'string' ? { message: options } : options;
      currentDialog = {
        type: 'confirm',
        options: opts,
        resolve: value => resolve(Boolean(value)),
      };
      notifyDialogListeners();
    });
  },

  /**
   * Close the current dialog.
   */
  close: (value?: void | boolean | string): void => {
    if (currentDialog) {
      currentDialog.resolve(value);
      currentDialog = null;
      notifyDialogListeners();
    }
  },

  /**
   * Subscribe to dialog changes.
   */
  subscribe: (listener: (dialog: DialogState | null) => void): (() => void) => {
    dialogListeners.add(listener);
    return () => dialogListeners.delete(listener);
  },
};

/**
 * DialogContainer component to render programmatic dialogs.
 * Place this once at the root of your app.
 *
 * @function
 * @returns {JSX.Element | null} The rendered dialog, or null if none is active.
 */
export const DialogContainer: React.FC = () => {
  const [current, setCurrent] = React.useState<DialogState | null>(null);

  useEffect(() => {
    return dialog.subscribe(setCurrent);
  }, []);

  if (!current) {
    return null;
  }

  const { type, options } = current;

  return (
    <Dialog
      isOpen
      title={options.title}
      message={options.message}
      type={options.type}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      icon={options.icon}
      showCancel={type === 'confirm'}
      focusCancel={options.focusCancel}
      onConfirm={() => dialog.close(type === 'confirm' ? true : undefined)}
      onCancel={() => dialog.close(type === 'confirm' ? false : undefined)}
    />
  );
};

export default Dialog;
