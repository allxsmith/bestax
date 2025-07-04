import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Message component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [title] - Title displayed in the message header.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma or 'inherit'/'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the message.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma or 'inherit'/'current').
 * @property {() => void} [onClose] - Called when the close button is clicked.
 * @property {React.ReactNode} [children] - Message body content.
 */
export interface MessageProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  title?: React.ReactNode;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  onClose?: () => void;
  children?: React.ReactNode;
}

/**
 * Bulma-styled Message component.
 *
 * Supports Bulma helper classes, color, and an optional close button.
 *
 * @function
 * @param {MessageProps} props - Props for the Message component.
 * @returns {JSX.Element} The rendered message.
 * @see {@link https://bulma.io/documentation/components/message/ | Bulma Message documentation}
 */
export const Message: React.FC<MessageProps> = ({
  className,
  title,
  textColor,
  color,
  bgColor,
  onClose,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const messageClasses = classNames(
    'message',
    color && `is-${color}`,
    className,
    bulmaHelperClasses
  );

  return (
    <article className={messageClasses} {...rest} data-testid="message">
      {(title || onClose) && (
        <div className="message-header">
          {title && <span>{title}</span>}
          {onClose && (
            <button
              className="delete"
              aria-label="delete"
              onClick={onClose}
              type="button"
              data-testid="message-close"
            />
          )}
        </div>
      )}
      {children && (
        <div className="message-body" data-testid="message-body">
          {children}
        </div>
      )}
    </article>
  );
};

export default Message;
