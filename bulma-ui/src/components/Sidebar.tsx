import React, { forwardRef, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { useScrollLock } from '../helpers/scrollLock';

/** Position of the sidebar relative to the viewport. */
export type SidebarPosition = 'left' | 'right';

/**
 * Props for the Sidebar component.
 * @extraProp {string} [className] - Additional CSS classes.
 * @extraProp {React.Ref<HTMLElement>} [ref] - Ref forwarded to the sidebar element.
 */
export interface SidebarProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'color'>,
    BulmaClassesProps {
  /** Whether the sidebar is open (required). */
  isOpen: boolean;
  /** Callback when sidebar should close. */
  onClose?: () => void;
  /** Which side the sidebar appears from. Default: 'left'. */
  position?: SidebarPosition;
  /** Custom width of the sidebar. */
  width?: string;
  /** Sidebar takes full width (mobile-style). */
  isFullwidth?: boolean;
  /** Sidebar takes full width (mobile-style). @deprecated Use `isFullwidth` instead — `isFullwidth` wins if both are set. */
  fullWidth?: boolean;
  /** Show overlay behind sidebar. Default: true. */
  overlay?: boolean;
  /** Close sidebar when overlay is clicked. Default: true. */
  overlayClose?: boolean;
  /** Close sidebar on Escape key. Default: true. */
  escapeClose?: boolean;
  /** Allow closing the sidebar. Default: true. */
  canCancel?: boolean;
  /** Content to display in the sidebar. */
  children?: React.ReactNode;
  /** Renders inline instead of using a portal. */
  inline?: boolean;
}

/**
 * The `Sidebar` component provides a slide-out navigation panel that appears from the left or right side of the screen.
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
      isFullwidth,
      fullWidth,
      overlay = true,
      overlayClose = true,
      escapeClose = true,
      canCancel = true,
      children,
      inline = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const sidebarRef = useRef<HTMLElement>(null);
    const resolvedFullwidth = isFullwidth ?? fullWidth ?? false;

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

    // Prevent body scroll when sidebar is open. Ref-counted through the shared
    // helper so an overlapping Modal/Dialog/Loading doesn't unlock underneath.
    useScrollLock(isOpen && overlay);

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
      'is-fullwidth': resolvedFullwidth,
    });
    const backgroundClass = usePrefixedClassNames('sidebar-background', {
      'is-active': isOpen,
    });
    const contentClass = usePrefixedClassNames('sidebar-content');

    const combinedClasses = classNames(
      sidebarClasses,
      bulmaHelperClasses,
      className
    );

    // Custom style for width
    const sidebarStyle: React.CSSProperties = {
      ...style,
      '--bulma-sidebar-width': resolvedFullwidth ? '100%' : width,
    } as React.CSSProperties;

    const sidebarContent = (
      <>
        {overlay && (
          <div
            className={backgroundClass}
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

    if (inline) {
      return sidebarContent;
    }

    // Render to portal for proper stacking
    if (typeof document !== 'undefined') {
      return createPortal(sidebarContent, document.body);
    }

    return null;
  }
);

// Sub-components

/**
 * Props for the SidebarHeader component.
 */
interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header content. */
  children?: React.ReactNode;
}

/**
 * Container for the sidebar header.
 *
 * @function
 * @param {SidebarHeaderProps} props - Props for the SidebarHeader component.
 * @returns {JSX.Element} The rendered sidebar header.
 */
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

/**
 * Props for the SidebarTitle component.
 */
interface SidebarTitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Title content. */
  children?: React.ReactNode;
}

/**
 * Title text inside the header.
 *
 * @function
 * @param {SidebarTitleProps} props - Props for the SidebarTitle component.
 * @returns {JSX.Element} The rendered sidebar title.
 */
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

/**
 * Props for the SidebarClose component.
 * Extends standard button attributes.
 */
type SidebarCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Close button for the sidebar.
 *
 * @function
 * @param {SidebarCloseProps} props - Props for the SidebarClose component.
 * @returns {JSX.Element} The rendered close button.
 */
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

/**
 * Props for the SidebarBody component.
 */
interface SidebarBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Body content. */
  children?: React.ReactNode;
}

/**
 * Main content area of the sidebar.
 *
 * @function
 * @param {SidebarBodyProps} props - Props for the SidebarBody component.
 * @returns {JSX.Element} The rendered sidebar body.
 */
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

/**
 * Props for the SidebarFooter component.
 */
interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Footer content. */
  children?: React.ReactNode;
}

/**
 * Footer area of the sidebar.
 *
 * @function
 * @param {SidebarFooterProps} props - Props for the SidebarFooter component.
 * @returns {JSX.Element} The rendered sidebar footer.
 */
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
export const Sidebar = withSubComponents(
  SidebarComponent,
  {
    Header: SidebarHeader,
    Title: SidebarTitle,
    Close: SidebarClose,
    Body: SidebarBody,
    Footer: SidebarFooter,
  },
  'Sidebar'
);

export default Sidebar;
