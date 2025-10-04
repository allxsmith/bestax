import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Modal component.
 *
 * @property {boolean} [active] - Whether the modal is open.
 * @property {() => void} [onClose] - Called when modal is closed.
 * @property {string} [className] - Additional CSS classes for the modal.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for modal content.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color for modal content.
 * @property {React.ReactNode} [modalCardTitle] - Title for modal card variant (legacy API).
 * @property {React.ReactNode} [modalCardFoot] - Footer for modal card variant (legacy API).
 * @property {'card'|'content'} [type] - Modal type ('card' for modal-card, 'content' for modal-content).
 * @property {React.ReactNode} [children] - Modal body/content.
 */
export interface ModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  active?: boolean;
  isActive?: boolean; // Alias for active
  onClose?: () => void;
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  modalCardTitle?: React.ReactNode;
  modalCardFoot?: React.ReactNode;
  type?: 'card' | 'content';
  children?: React.ReactNode;
}

/**
 * Props for Modal.Background component.
 */
export interface ModalBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Props for Modal.Content component.
 */
export interface ModalContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Props for Modal.Card component.
 */
export interface ModalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Props for Modal.Card.Head component.
 */
export interface ModalCardHeadProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

/**
 * Props for Modal.Card.Title component.
 */
export interface ModalCardTitleProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

/**
 * Props for Modal.Card.Body component.
 */
export interface ModalCardBodyProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

/**
 * Props for Modal.Card.Foot component.
 */
export interface ModalCardFootProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

/**
 * Props for Modal.Close component.
 */
export interface ModalCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'delete' | 'floating';
}

/**
 * Modal.Background - Renders the modal background overlay
 */
const ModalBackground: React.FC<ModalBackgroundProps> = ({
  className,
  ...props
}) => {
  const classes = classNames('modal-background', className);
  return <div className={classes} {...props} />;
};

/**
 * Modal.Content - Renders modal content wrapper
 */
const ModalContent: React.FC<ModalContentProps> = ({ className, ...props }) => {
  const classes = classNames('modal-content', className);
  return <div className={classes} {...props} />;
};

/**
 * Modal.Card.Head - Renders modal card header
 */
const ModalCardHead: React.FC<ModalCardHeadProps> = ({
  className,
  ...props
}) => {
  const classes = classNames('modal-card-head', className);
  return <header className={classes} {...props} />;
};

/**
 * Modal.Card.Title - Renders modal card title
 */
const ModalCardTitle: React.FC<ModalCardTitleProps> = ({
  className,
  ...props
}) => {
  const classes = classNames('modal-card-title', className);
  return <p className={classes} {...props} />;
};

/**
 * Modal.Card.Body - Renders modal card body
 */
const ModalCardBody: React.FC<ModalCardBodyProps> = ({
  className,
  ...props
}) => {
  const classes = classNames('modal-card-body', className);
  return <section className={classes} {...props} />;
};

/**
 * Modal.Card.Foot - Renders modal card footer
 */
const ModalCardFoot: React.FC<ModalCardFootProps> = ({
  className,
  ...props
}) => {
  const classes = classNames('modal-card-foot', className);
  return <footer className={classes} {...props} />;
};

/**
 * Modal.Card - Renders modal card wrapper with compound components
 */
const ModalCard: React.FC<ModalCardProps> & {
  Head: typeof ModalCardHead;
  Title: typeof ModalCardTitle;
  Body: typeof ModalCardBody;
  Foot: typeof ModalCardFoot;
} = ({ className, ...props }) => {
  const classes = classNames('modal-card', className);
  return <div className={classes} {...props} />;
};

ModalCard.Head = ModalCardHead;
ModalCard.Title = ModalCardTitle;
ModalCard.Body = ModalCardBody;
ModalCard.Foot = ModalCardFoot;

/**
 * Modal.Close - Renders modal close button
 * Supports two variants:
 * - 'delete': For use in modal card headers (renders with 'delete' class)
 * - 'floating': For floating close button (renders with 'modal-close' class)
 */
const ModalClose: React.FC<ModalCloseProps> = ({
  className,
  size = 'large',
  variant = 'delete',
  ...props
}) => {
  const classes = classNames(
    variant === 'delete' ? 'delete' : 'modal-close',
    variant === 'floating' && size && `is-${size}`,
    className
  );
  return (
    <button className={classes} aria-label="close" type="button" {...props} />
  );
};

/**
 * Bulma Modal component, supporting both modal-card and modal-content variants.
 * Supports both legacy props-based API and compound component API.
 *
 * @function
 * @param {ModalProps} props - Props for the Modal component.
 * @returns {JSX.Element} The rendered modal.
 * @see {@link https://bulma.io/documentation/components/modal/ | Bulma Modal documentation}
 */
const ModalRoot: React.FC<ModalProps> & {
  Background: typeof ModalBackground;
  Content: typeof ModalContent;
  Card: typeof ModalCard;
  Close: typeof ModalClose;
} = ({
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
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  // Support both active and isActive props
  const isModalActive = active ?? isActive ?? false;

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

  // If using compound components, render children as-is
  if (hasCompoundComponents) {
    return (
      <div className={modalClasses} {...rest} data-testid="modal">
        {children}
      </div>
    );
  }

  // Legacy API: EXPLICIT type wins; fallback to auto detection if not provided
  let isModalCard: boolean;
  if (type === 'card') isModalCard = true;
  else if (type === 'content') isModalCard = false;
  else isModalCard = !!modalCardTitle || !!modalCardFoot;

  return (
    <div className={modalClasses} {...rest} data-testid="modal">
      <div
        className="modal-background"
        onClick={onClose}
        data-testid="modal-background"
      />
      {isModalCard ? (
        <div className="modal-card">
          {modalCardTitle && (
            <header className="modal-card-head">
              <p className="modal-card-title">{modalCardTitle}</p>
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
          <section className="modal-card-body" data-testid="modal-body">
            {children}
          </section>
          {modalCardFoot && (
            <footer className="modal-card-foot">{modalCardFoot}</footer>
          )}
        </div>
      ) : (
        <div className="modal-content" data-testid="modal-content">
          {children}
        </div>
      )}
      {/* Show floating close button for modal-content, or for modal-card when no header */}
      {(!isModalCard || (!modalCardTitle && onClose)) && onClose && (
        <button
          className="modal-close is-large"
          aria-label="close"
          onClick={onClose}
          type="button"
          data-testid="modal-close-float"
        />
      )}
    </div>
  );
};

ModalRoot.Background = ModalBackground;
ModalRoot.Content = ModalContent;
ModalRoot.Card = ModalCard;
ModalRoot.Close = ModalClose;

export const Modal = ModalRoot;
export default Modal;
