import React, { forwardRef, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export type SidebarPosition = 'left' | 'right';

/**
 * Props for the Sidebar component.
 *
 * @property {boolean} isOpen - Whether the sidebar is open.
 * @property {() => void} [onClose] - Callback when sidebar should close.
 * @property {SidebarPosition} [position] - Which side the sidebar appears from. Default: 'left'.
 * @property {string} [width] - Custom width. Default: '260px'.
 * @property {boolean} [fullWidth] - Sidebar takes full width (mobile-style).
 * @property {boolean} [overlay] - Show overlay behind sidebar. Default: true.
 * @property {boolean} [overlayClose] - Close sidebar when overlay is clicked. Default: true.
 * @property {boolean} [escapeClose] - Close sidebar on Escape key. Default: true.
 * @property {boolean} [canCancel] - Allow closing the sidebar. Default: true.
 * @property {React.ReactNode} [children] - Content to display in the sidebar.
 */
export interface SidebarProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'color'>,
    BulmaClassesProps {
  isOpen: boolean;
  onClose?: () => void;
  position?: SidebarPosition;
  width?: string;
  fullWidth?: boolean;
  overlay?: boolean;
  overlayClose?: boolean;
  escapeClose?: boolean;
  canCancel?: boolean;
  children?: React.ReactNode;
}

/**
 * Sidebar component for slide-out navigation panels.
 *
 * Provides a side panel that slides in from the left or right,
 * with optional overlay, keyboard support, and customizable width.
 *
 * @function
 * @param {SidebarProps} props - Props for the Sidebar component.
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref to the sidebar element.
 * @returns {JSX.Element | null} The rendered sidebar component.
 *
 * @example
 * // Basic sidebar
 * const [isOpen, setIsOpen] = useState(false);
 * <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <Menu>...</Menu>
 * </Sidebar>
 *
 * @example
 * // Right-side sidebar with custom width
 * <Sidebar
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   position="right"
 *   width="320px"
 * >
 *   <div>Panel content</div>
 * </Sidebar>
 */
const SidebarComponent = forwardRef<HTMLElement, SidebarProps>(
  (
    {
      isOpen,
      onClose,
      position = 'left',
      width = '260px',
      fullWidth = false,
      overlay = true,
      overlayClose = true,
      escapeClose = true,
      canCancel = true,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const sidebarRef = useRef<HTMLElement>(null);

    // Close handler
    const handleClose = useCallback(() => {
      if (canCancel && onClose) {
        onClose();
      }
    }, [canCancel, onClose]);

    // Handle overlay click
    const handleOverlayClick = useCallback(() => {
      if (overlayClose) {
        handleClose();
      }
    }, [overlayClose, handleClose]);

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !escapeClose) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, escapeClose, handleClose]);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
      if (isOpen && overlay) {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = originalOverflow;
        };
      }
      return undefined;
    }, [isOpen, overlay]);

    // Focus trap (basic - focus sidebar when opened)
    useEffect(() => {
      if (isOpen) {
        const element = sidebarRef.current;
        if (element) {
          // Focus first focusable element or sidebar itself
          const focusable = element.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable) {
            focusable.focus();
          } else {
            element.focus();
          }
        }
      }
    }, [isOpen]);

    // Use combined ref
    const combinedRef = useCallback(
      (node: HTMLElement | null) => {
        (sidebarRef as React.MutableRefObject<HTMLElement | null>).current =
          node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      [ref]
    );

    // Generate classes
    const sidebarClasses = usePrefixedClassNames('sidebar', {
      'is-active': isOpen,
      [`is-${position}`]: position,
      'is-fullwidth': fullWidth,
    });
    const backgroundClass = usePrefixedClassNames('sidebar-background');
    const contentClass = usePrefixedClassNames('sidebar-content');

    const combinedClasses = classNames(
      sidebarClasses,
      bulmaHelperClasses,
      className
    );

    // Custom style for width
    const sidebarStyle: React.CSSProperties = {
      ...style,
      '--bulma-sidebar-width': fullWidth ? '100%' : width,
    } as React.CSSProperties;

    const sidebarContent = (
      <>
        {overlay && (
          <div
            className={classNames(backgroundClass, {
              'is-active': isOpen,
            })}
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
        )}
        <aside
          ref={combinedRef}
          className={combinedClasses}
          style={sidebarStyle}
          role="dialog"
          aria-modal={overlay ? 'true' : undefined}
          aria-hidden={!isOpen}
          tabIndex={-1}
          {...rest}
        >
          <div className={contentClass}>{children}</div>
        </aside>
      </>
    );

    // Render to portal for proper stacking
    if (typeof document !== 'undefined') {
      return createPortal(sidebarContent, document.body);
    }

    return null;
  }
);

SidebarComponent.displayName = 'Sidebar';

// Sub-components

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  className,
  children,
  ...props
}) => {
  const headerClass = usePrefixedClassNames('sidebar-header');
  return (
    <div className={classNames(headerClass, className)} {...props}>
      {children}
    </div>
  );
};

interface SidebarTitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

const SidebarTitle: React.FC<SidebarTitleProps> = ({
  className,
  children,
  ...props
}) => {
  const titleClass = usePrefixedClassNames('sidebar-title');
  return (
    <p className={classNames(titleClass, className)} {...props}>
      {children}
    </p>
  );
};

interface SidebarCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SidebarClose: React.FC<SidebarCloseProps> = ({
  className,
  children,
  ...props
}) => {
  const closeClass = usePrefixedClassNames('sidebar-close');
  return (
    <button
      type="button"
      className={classNames(closeClass, className)}
      aria-label="Close"
      {...props}
    >
      {children}
    </button>
  );
};

interface SidebarBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const SidebarBody: React.FC<SidebarBodyProps> = ({
  className,
  children,
  ...props
}) => {
  const bodyClass = usePrefixedClassNames('sidebar-body');
  return (
    <div className={classNames(bodyClass, className)} {...props}>
      {children}
    </div>
  );
};

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({
  className,
  children,
  ...props
}) => {
  const footerClass = usePrefixedClassNames('sidebar-footer');
  return (
    <div className={classNames(footerClass, className)} {...props}>
      {children}
    </div>
  );
};

// Attach static subcomponents
export const Sidebar = Object.assign(SidebarComponent, {
  Header: SidebarHeader,
  Title: SidebarTitle,
  Close: SidebarClose,
  Body: SidebarBody,
  Footer: SidebarFooter,
});

export default Sidebar;
