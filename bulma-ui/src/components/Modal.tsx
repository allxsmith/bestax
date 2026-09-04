import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
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
import { useIsHydrated } from '../helpers/useIsHydrated';

/**
 * Every currently active modal, in the order they opened. Only the last entry
 * — the topmost modal — reacts to Escape and Tab, so one keypress can't
 * dismiss a whole stack (e.g. a `Dialog` opened on top of a `Modal`).
 */
const activeModalStack: object[] = [];

/**
 * Controls the modal can hand focus to. Disabled and hidden controls are
 * excluded because `focus()` on them is a no-op, which would leave focus
 * outside the modal.
 */
const FOCUSABLE_SELECTOR =
  'button:not(:disabled), [href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]';

/**
 * The modal's tab stops, in document order. The selector alone is not the
 * tabbable set — `[href]` and `button` match regardless of `tabindex`, so an
 * `<a href tabIndex={-1}>` would otherwise be treated as a tab stop and let
 * Tab escape the modal when it sorts last. `el.tabIndex` is the browser's own
 * resolved value, so filtering on it drops every negative index (not just
 * `-1`) without a second selector to keep in sync.
 */
const getTabbable = (node: HTMLElement): HTMLElement[] =>
  Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    el => el.tabIndex >= 0
  );

/**
 * Props for the Modal component.
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the root `.modal` element.
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
   * Close the modal when the Escape key is pressed (calls `onClose`). Only the
   * topmost open modal responds, so Escape closes one layer at a time.
   * @defaultValue true
   */
  closeOnEscape?: boolean;
  /**
   * Lock body scroll while the modal is active. Ref-counted and shared with
   * `Dialog`, `Sidebar` and `Loading`, so whichever overlay closes first does
   * not unlock the page underneath one that is still open.
   * @defaultValue true
   */
  lockScroll?: boolean;
  /**
   * Renders the modal into a portal target instead of inline, so it isn't
   * clipped by an ancestor with `overflow: hidden`, `filter` or `transform`.
   * `true` portals to `document.body`; a string is used as a
   * `document.querySelector` selector; an element is used directly. Renders
   * inline on the server and while hydrating, moving into the portal once the
   * client takes over, so hydration matches.
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
const ModalRoot = forwardRef<HTMLDivElement, ModalProps>(function ModalRoot(
  {
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
  },
  ref
) {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  // Support both active and isActive props
  const isModalActive = active ?? isActive ?? false;

  const modalRootRef = useRef<HTMLDivElement>(null);

  // Cleanup returned by a consumer's callback ref on attach, held until detach.
  const consumerCleanupRef = useRef<(() => void) | null>(null);

  // The forwarded ref and the internal one must both see the node: focus
  // management, the scroll lock and the topmost-modal check all read
  // `modalRootRef`, while consumers expect their own ref to resolve.
  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      (modalRootRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
      if (typeof ref === 'function') {
        // React 19 lets a callback ref return a cleanup function and detaches
        // by running it instead of calling the ref with `null`; React 18
        // discards the return value entirely. Returning it from here would be
        // a React-19-only contract, so instead we hold the cleanup and run it
        // ourselves on detach — a consumer's cleanup ref then behaves the same
        // on both majors of the CI matrix. Same shape as `Dropdown`.
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
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const stackTokenRef = useRef<object>({});
  const generatedTitleId = useId();
  // A portal has no server-rendered counterpart, so the server render and the
  // hydrating render have to stay inline and only move into the portal once
  // we're past hydration.
  const onClient = useIsHydrated();
  // Moving into the portal remounts the modal's subtree, so any effect holding
  // a DOM node from before the move is holding a detached one. Effects that
  // touch the modal's nodes key on this so they re-run against the new tree.
  const isPortaled = Boolean(portal) && onClient;

  useScrollLock(isModalActive && lockScroll);

  // Record open order so keyboard handling only applies to the topmost modal.
  useEffect(() => {
    if (!isModalActive) return undefined;

    const token = stackTokenRef.current;
    activeModalStack.push(token);
    return () => {
      const index = activeModalStack.indexOf(token);
      if (index !== -1) activeModalStack.splice(index, 1);
    };
  }, [isModalActive]);

  // Escape closes; Tab cycles inside the modal. Both only for the topmost one.
  useEffect(() => {
    if (!isModalActive) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      const node = modalRootRef.current;
      if (
        activeModalStack[activeModalStack.length - 1] !== stackTokenRef.current
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (closeOnEscape) onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !node) return;

      // Keep Tab within the modal — `aria-modal` hides the rest of the page
      // from assistive technology, so the keyboard order has to agree.
      const focusable = getTabbable(node);
      const activeElement = document.activeElement;
      if (focusable.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const outside = !node.contains(activeElement);
      if (e.shiftKey) {
        if (outside || activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (outside || activeElement === last) {
        e.preventDefault();
        first.focus();
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
    const focusable = node ? getTabbable(node)[0] : undefined;
    (focusable ?? node)?.focus();

    return () => {
      // Only hand focus back if this modal still owns it: closing a background
      // modal must not pull focus out of one that is still open on top. A
      // removed subtree leaves focus on <body>, which still counts as ours.
      const activeElement = document.activeElement;
      if (
        activeElement &&
        activeElement !== document.body &&
        !node?.contains(activeElement)
      ) {
        return;
      }
      previouslyFocusedRef.current?.focus?.();
    };
    // `isPortaled` flips once when a hydrated portal modal moves out of the
    // inline tree; re-running rebinds focus onto the remounted nodes. The
    // cleanup above restores focus to the pre-open element first (the detached
    // subtree has left focus on <body>), so the re-run re-records the same
    // element and restore-on-close still lands in the right place.
  }, [isModalActive, isPortaled]);

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
  // A dialog needs an accessible name: the legacy card title is wired up
  // automatically, compound users pass their own aria-label/aria-labelledby
  // (both arrive in `rest`, which is spread last and so wins).
  const titleId = modalCardTitle ? generatedTitleId : undefined;

  let modalElement: React.ReactElement;

  // If using compound components, render children as-is
  if (hasCompoundComponents) {
    modalElement = (
      <div
        className={modalClasses}
        ref={combinedRef}
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
        ref={combinedRef}
        role={resolvedRole}
        aria-modal={resolvedAriaModal}
        aria-labelledby={titleId}
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
                  id={titleId}
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

  if (isPortaled) {
    const target = resolvePortalContainer(
      typeof portal === 'boolean' ? undefined : portal
    );
    return createPortal(modalElement, target);
  }

  return modalElement;
});

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
