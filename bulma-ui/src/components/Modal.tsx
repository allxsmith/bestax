import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';
import { useScrollLock } from '../helpers/scrollLock';
import { resolvePortalContainer } from '../helpers/portal';

/**
 * Props for the Modal component.
 */
export interface ModalProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Whether the modal is open/visible. */
  active?: boolean;
  /** Alias for `active`. Whether the modal is open/visible. */
  isActive?: boolean; // Alias for active
  /** Callback invoked to request modal close (background or close button). */
  onClose?: () => void;
  /** Additional CSS classes for the modal. */
  className?: string;
  /** Text color for modal content. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color for modal content. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Title/header for modal-card variant. (Legacy API only) */
  modalCardTitle?: React.ReactNode;
  /** Footer for modal-card variant. (Legacy API only) */
  modalCardFoot?: React.ReactNode;
  /**
   * Modal style: `'card'` for modal-card, `'content'` for modal-content. (Legacy API only)
   * @defaultValue auto
   */
  type?: 'card' | 'content';
  /** Modal body/content or compound components. */
  children?: React.ReactNode;
  /**
   * Close the modal when the Escape key is pressed (calls `onClose`).
   * @defaultValue true
   */
  closeOnEscape?: boolean;
  /**
   * Lock body scroll while the modal is active. Ref-counted, so nesting a
   * `Dialog` (which renders its own `Modal`) inside a `Modal` does not
   * double-unlock when one closes before the other.
   * @defaultValue true
   */
  lockScroll?: boolean;
  /**
   * Renders the modal into a portal target instead of inline, so it isn't
   * clipped by an ancestor with `overflow: hidden`, `filter` or `transform`.
   * `true` portals to `document.body`; a string is used as a
   * `document.querySelector` selector; an element is used directly. Renders
   * inline when `document` is undefined (SSR).
   * @defaultValue false
   */
  portal?: boolean | string | HTMLElement;
}

/**
 * Props for Modal.Background component.
 */
export interface ModalBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Props for Modal.Content component.
 */
export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Props for Modal.Card component.
 */
export interface ModalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Props for Modal.Card.Head component.
 */
export interface ModalCardHeadProps extends React.HTMLAttributes<HTMLElement> {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Props for Modal.Card.Title component.
 */
export interface ModalCardTitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Props for Modal.Card.Body component.
 */
export interface ModalCardBodyProps extends React.HTMLAttributes<HTMLElement> {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Props for Modal.Card.Foot component.
 */
export interface ModalCardFootProps extends React.HTMLAttributes<HTMLElement> {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Props for Modal.Close component.
 */
export interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Size of the close button (only applies to 'floating' variant). */
  size?: 'small' | 'medium' | 'large';
  /** Button variant. 'delete' (default) for modal card headers, 'floating' for overlay close button. */
  variant?: 'delete' | 'floating';
}

/**
 * Modal.Background - Renders the modal background overlay.
 *
 * @function
 * @param {ModalBackgroundProps} props - Component props.
 * @returns {JSX.Element} Modal background element.
 */
const ModalBackground: React.FC<ModalBackgroundProps> = ({
  className,
  ...props
}) => {
  const classes = classNames(
    usePrefixedClassNames('modal-background'),
    className
  );
  return <div className={classes} {...props} />;
};

/**
 * Modal.Content - Renders modal content wrapper for custom content.
 *
 * @function
 * @param {ModalContentProps} props - Component props.
 * @returns {JSX.Element} Modal content element.
 */
const ModalContent: React.FC<ModalContentProps> = ({ className, ...props }) => {
  const classes = classNames(usePrefixedClassNames('modal-content'), className);
  return <div className={classes} {...props} />;
};

/**
 * Modal.Card.Head - Renders modal card header section.
 *
 * @function
 * @param {ModalCardHeadProps} props - Component props.
 * @returns {JSX.Element} Modal card header element.
 */
const ModalCardHead: React.FC<ModalCardHeadProps> = ({
  className,
  ...props
}) => {
  const classes = classNames(
    usePrefixedClassNames('modal-card-head'),
    className
  );
  return <header className={classes} {...props} />;
};

/**
 * Modal.Card.Title - Renders modal card title.
 *
 * @function
 * @param {ModalCardTitleProps} props - Component props.
 * @returns {JSX.Element} Modal card title element.
 */
const ModalCardTitle: React.FC<ModalCardTitleProps> = ({
  className,
  ...props
}) => {
  const classes = classNames(
    usePrefixedClassNames('modal-card-title'),
    className
  );
  return <p className={classes} {...props} />;
};

/**
 * Modal.Card.Body - Renders modal card body section.
 *
 * @function
 * @param {ModalCardBodyProps} props - Component props.
 * @returns {JSX.Element} Modal card body element.
 */
const ModalCardBody: React.FC<ModalCardBodyProps> = ({
  className,
  ...props
}) => {
  const classes = classNames(
    usePrefixedClassNames('modal-card-body'),
    className
  );
  return <section className={classes} {...props} />;
};

/**
 * Modal.Card.Foot - Renders modal card footer section.
 *
 * @function
 * @param {ModalCardFootProps} props - Component props.
 * @returns {JSX.Element} Modal card footer element.
 */
const ModalCardFoot: React.FC<ModalCardFootProps> = ({
  className,
  ...props
}) => {
  const classes = classNames(
    usePrefixedClassNames('modal-card-foot'),
    className
  );
  return <footer className={classes} {...props} />;
};

/**
 * Modal.Card - Renders modal card wrapper with compound components.
 * Use with Modal.Card.Head, Modal.Card.Title, Modal.Card.Body, and Modal.Card.Foot.
 *
 * @function
 * @param {ModalCardProps} props - Component props.
 * @returns {JSX.Element} Modal card element.
 */
const ModalCardComponent: React.FC<ModalCardProps> = ({
  className,
  ...props
}) => {
  const classes = classNames(usePrefixedClassNames('modal-card'), className);
  return <div className={classes} {...props} />;
};

const ModalCard = withSubComponents(ModalCardComponent, {
  Head: ModalCardHead,
  Title: ModalCardTitle,
  Body: ModalCardBody,
  Foot: ModalCardFoot,
});

/**
 * Modal.Close - Renders modal close button with two variant styles.
 *
 * @function
 * @param {ModalCloseProps} props - Component props.
 * @returns {JSX.Element} Close button element.
 *
 * @remarks
 * Supports two variants:
 * - 'delete' (default): For use in modal card headers, renders with 'delete' class
 * - 'floating': For floating overlay close button, renders with 'modal-close' class
 *
 * The size prop only applies to the 'floating' variant.
 */
const ModalClose: React.FC<ModalCloseProps> = ({
  className,
  size = 'large',
  variant = 'delete',
  ...props
}) => {
  const classes = classNames(
    usePrefixedClassNames(
      variant === 'delete' ? 'delete' : 'modal-close',
      variant === 'floating' && size && { [`is-${size}`]: true }
    ),
    className
  );
  return (
    <button className={classes} aria-label="close" type="button" {...props} />
  );
};

/**
 * The `Modal` component provides an empty, accessible overlay for arbitrary content — for a ready-made confirm or alert, reach for `Dialog` instead.
 *
 * @function
 * @param {ModalProps} props - Props for the Modal component.
 * @returns {JSX.Element} The rendered modal.
 *
 * @example
 * // Legacy API
 * <Modal active={isOpen} onClose={handleClose} modalCardTitle="Title">
 *   Content
 * </Modal>
 *
 * @example
 * // Compound Component API
 * <Modal isActive={isOpen}>
 *   <Modal.Background onClick={handleClose} />
 *   <Modal.Card>
 *     <Modal.Card.Head>
 *       <Modal.Card.Title>Title</Modal.Card.Title>
 *       <Modal.Close onClick={handleClose} />
 *     </Modal.Card.Head>
 *     <Modal.Card.Body>Content</Modal.Card.Body>
 *   </Modal.Card>
 * </Modal>
 *
 * @see {@link https://bulma.io/documentation/components/modal/ | Bulma Modal documentation}
 */
const ModalRoot: React.FC<ModalProps> = ({
  active,
  isActive,
  onClose,
  className,
  textColor,
  bgColor,
  modalCardTitle,
  modalCardFoot,
  type,
  children,
  closeOnEscape = true,
  lockScroll = true,
  portal = false,
  role,
  'aria-modal': ariaModalProp,
  ...props
}) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  // Support both active and isActive props
  const isModalActive = active ?? isActive ?? false;

  const modalRootRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useScrollLock(isModalActive && lockScroll);

  // Close on Escape
  useEffect(() => {
    if (!isModalActive || !closeOnEscape) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalActive, closeOnEscape, onClose]);

  // Move focus into the modal on open, restore it on close
  useEffect(() => {
    if (!isModalActive) return undefined;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const node = modalRootRef.current;
    const focusable = node?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusable ?? node)?.focus();

    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isModalActive]);

  // Check if children contain compound components
  const hasCompoundComponents = React.Children.toArray(children).some(
    child =>
      React.isValidElement(child) &&
      (child.type === ModalBackground ||
        child.type === ModalContent ||
        child.type === ModalCard ||
        child.type === ModalClose)
  );

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('modal', {
    'is-active': isModalActive,
  });
  const deleteClass = usePrefixedClassNames('delete');

  const modalClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  const resolvedRole = role ?? (isModalActive ? 'dialog' : undefined);
  const resolvedAriaModal =
    ariaModalProp ??
    (isModalActive && resolvedRole !== 'presentation' ? 'true' : undefined);

  let modalElement: React.ReactElement;

  // If using compound components, render children as-is
  if (hasCompoundComponents) {
    modalElement = (
      <div
        className={modalClasses}
        ref={modalRootRef}
        role={resolvedRole}
        aria-modal={resolvedAriaModal}
        tabIndex={-1}
        {...rest}
        data-testid="modal"
      >
        {children}
      </div>
    );
  } else {
    // Legacy API: EXPLICIT type wins; fallback to auto detection if not provided
    let isModalCard: boolean;
    if (type === 'card') isModalCard = true;
    else if (type === 'content') isModalCard = false;
    else isModalCard = !!modalCardTitle || !!modalCardFoot;

    modalElement = (
      <div
        className={modalClasses}
        ref={modalRootRef}
        role={resolvedRole}
        aria-modal={resolvedAriaModal}
        tabIndex={-1}
        {...rest}
        data-testid="modal"
      >
        <div
          className={prefixedClassNames(classPrefix, 'modal-background')}
          onClick={onClose}
          data-testid="modal-background"
        />
        {isModalCard ? (
          <div className={prefixedClassNames(classPrefix, 'modal-card')}>
            {modalCardTitle && (
              <header
                className={prefixedClassNames(classPrefix, 'modal-card-head')}
              >
                <p
                  className={prefixedClassNames(
                    classPrefix,
                    'modal-card-title'
                  )}
                >
                  {modalCardTitle}
                </p>
                {onClose && (
                  <button
                    className={deleteClass}
                    aria-label="close"
                    onClick={onClose}
                    type="button"
                    data-testid="modal-close"
                  />
                )}
              </header>
            )}
            <section
              className={prefixedClassNames(classPrefix, 'modal-card-body')}
              data-testid="modal-body"
            >
              {children}
            </section>
            {modalCardFoot && (
              <footer
                className={prefixedClassNames(classPrefix, 'modal-card-foot')}
              >
                {modalCardFoot}
              </footer>
            )}
          </div>
        ) : (
          <div
            className={prefixedClassNames(classPrefix, 'modal-content')}
            data-testid="modal-content"
          >
            {children}
          </div>
        )}
        {/* Show floating close button for modal-content, or for modal-card when no header */}
        {(!isModalCard || (!modalCardTitle && onClose)) && onClose && (
          <button
            className={prefixedClassNames(
              classPrefix,
              'modal-close',
              'is-large'
            )}
            aria-label="close"
            onClick={onClose}
            type="button"
            data-testid="modal-close-float"
          />
        )}
      </div>
    );
  }

  if (portal && typeof document !== 'undefined') {
    const target = resolvePortalContainer(
      typeof portal === 'boolean' ? undefined : portal
    );
    return createPortal(modalElement, target);
  }

  return modalElement;
};

export const Modal = withSubComponents(
  ModalRoot,
  {
    Background: ModalBackground,
    Content: ModalContent,
    Card: ModalCard,
    Close: ModalClose,
  },
  'Modal'
);
export default Modal;
