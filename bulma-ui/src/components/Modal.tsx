import React from 'react';
import classNames from '../helpers/classNames';
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
 * @property {React.ReactNode} [modalCardTitle] - Title for modal card variant.
 * @property {React.ReactNode} [modalCardFoot] - Footer for modal card variant.
 * @property {'card'|'content'} [type] - Modal type ('card' for modal-card, 'content' for modal-content).
 * @property {React.ReactNode} [children] - Modal body/content.
 */
export interface ModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  active?: boolean;
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
 * Bulma Modal component, supporting both modal-card and modal-content variants.
 *
 * @function
 * @param {ModalProps} props - Props for the Modal component.
 * @returns {JSX.Element} The rendered modal.
 * @see {@link https://bulma.io/documentation/components/modal/ | Bulma Modal documentation}
 */
export const Modal: React.FC<ModalProps> = ({
  active = false,
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

  // EXPLICIT type wins; fallback to auto detection if not provided
  let isModalCard: boolean;
  if (type === 'card') isModalCard = true;
  else if (type === 'content') isModalCard = false;
  else isModalCard = !!modalCardTitle || !!modalCardFoot;

  const modalClasses = classNames(
    'modal',
    { 'is-active': active },
    className,
    bulmaHelperClasses
  );

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
                  className="delete"
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

export default Modal;
