import React, { forwardRef, useEffect, useCallback, useRef } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Modal } from './Modal';

// Ref-counted body scroll lock for chained/overlapping dialogs
let _scrollLockCount = 0;
let _originalOverflow = '';

/** Valid dialog type/color values. */
export type DialogType = 'default' | 'success' | 'danger' | 'warning' | 'info';

/**
 * Props for the Dialog component.
 *
 * @property {boolean} isOpen - Whether the dialog is open.
 * @property {string} [title] - Dialog title.
 * @property {string | React.ReactNode} message - Dialog message/content.
 * @property {DialogType} [type] - The type/color of the dialog. Default: 'default'.
 * @property {string} [confirmText] - Text for confirm button. Default: 'OK'.
 * @property {string} [cancelText] - Text for cancel button. Default: 'Cancel'.
 * @property {() => void} [onConfirm] - Callback when confirm button is clicked.
 * @property {() => void} [onCancel] - Callback when cancel button is clicked or dialog is dismissed.
 * @property {boolean} [showCancel] - Whether to show cancel button. Default: true for confirm dialogs.
 * @property {boolean} [canCancel] - Whether the dialog can be dismissed. Default: true.
 * @property {boolean} [focusCancel] - Focus cancel button instead of confirm. Default: false.
 * @property {React.ReactNode} [icon] - Custom icon to display.
 */
export interface DialogProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    Omit<BulmaClassesProps, 'color'> {
  isOpen: boolean;
  title?: string;
  message: string | React.ReactNode;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  canCancel?: boolean;
  focusCancel?: boolean;
  icon?: React.ReactNode;
}

/**
 * Dialog component for confirmation and alert dialogs.
 *
 * Provides a modal dialog with confirm/cancel actions, customizable
 * appearance, and keyboard support.
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
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const dialogRef = useRef<HTMLDivElement>(null);
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

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !canCancel) return undefined;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, canCancel, handleCancel]);

    // Focus management
    useEffect(() => {
      if (isOpen) {
        const buttonToFocus =
          focusCancel && showCancel ? cancelRef.current : confirmRef.current;
        buttonToFocus?.focus();
      }
    }, [isOpen, focusCancel, showCancel]);

    // Prevent body scroll (ref-counted so chained dialogs work correctly)
    useEffect(() => {
      if (isOpen) {
        _scrollLockCount++;
        if (_scrollLockCount === 1) {
          _originalOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
        }
        return () => {
          _scrollLockCount--;
          if (_scrollLockCount === 0) {
            document.body.style.overflow = _originalOverflow;
          }
        };
      }
      return undefined;
    }, [isOpen]);

    // Use combined ref
    const combinedRef = useCallback(
      (node: HTMLDivElement | null) => {
        (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
        if (typeof ref === 'function') {
          ref(node);
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
      <Modal isActive={isOpen}>
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
              {displayIcon && (
                <span className={iconClass}>{displayIcon}</span>
              )}
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
 *
 * @property {string} [title] - Dialog title.
 * @property {string | React.ReactNode} message - Dialog message/content.
 * @property {DialogType} [type] - Dialog type/color.
 * @property {string} [confirmText] - Text for the confirm button.
 * @property {React.ReactNode} [icon] - Custom icon to display.
 */
export interface AlertOptions {
  title?: string;
  message: string | React.ReactNode;
  type?: DialogType;
  confirmText?: string;
  icon?: React.ReactNode;
}

/**
 * Options for showing a programmatic confirm dialog.
 *
 * @property {string} [cancelText] - Text for the cancel button.
 * @property {boolean} [focusCancel] - Focus cancel button instead of confirm.
 */
export interface ConfirmOptions extends AlertOptions {
  cancelText?: string;
  focusCancel?: boolean;
}

/**
 * Options for showing a programmatic prompt dialog.
 *
 * @property {string} [placeholder] - Input placeholder text.
 * @property {string} [defaultValue] - Default input value.
 */
export interface PromptOptions extends ConfirmOptions {
  placeholder?: string;
  defaultValue?: string;
}

let dialogListeners: Set<
  (
    dialog: {
      type: 'alert' | 'confirm' | 'prompt';
      options: any;
      resolve: (value: any) => void;
    } | null
  ) => void
> = new Set();
let currentDialog: {
  type: 'alert' | 'confirm' | 'prompt';
  options: any;
  resolve: (value: any) => void;
} | null = null;

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
    return new Promise(resolve => {
      const opts = typeof options === 'string' ? { message: options } : options;
      currentDialog = { type: 'alert', options: opts, resolve };
      notifyDialogListeners();
    });
  },

  /**
   * Show a confirm dialog. Returns a promise that resolves to true/false.
   */
  confirm: (options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise(resolve => {
      const opts = typeof options === 'string' ? { message: options } : options;
      currentDialog = { type: 'confirm', options: opts, resolve };
      notifyDialogListeners();
    });
  },

  /**
   * Close the current dialog.
   */
  close: (value?: any): void => {
    if (currentDialog) {
      currentDialog.resolve(value);
      currentDialog = null;
      notifyDialogListeners();
    }
  },

  /**
   * Subscribe to dialog changes.
   */
  subscribe: (
    listener: (
      dialog: {
        type: 'alert' | 'confirm' | 'prompt';
        options: any;
        resolve: (value: any) => void;
      } | null
    ) => void
  ): (() => void) => {
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
  const [current, setCurrent] = React.useState<{
    type: 'alert' | 'confirm' | 'prompt';
    options: any;
    resolve: (value: any) => void;
  } | null>(null);

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
