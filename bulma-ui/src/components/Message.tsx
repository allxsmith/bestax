import React from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

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
const MessageComponent: React.FC<MessageProps> = ({
  className,
  title,
  textColor,
  color,
  bgColor,
  onClose,
  children,
  ...props
}) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('message', {
    [`is-${color}`]: color,
  });
  const deleteClass = usePrefixedClassNames('delete');

  const messageClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <article className={messageClasses} {...rest} data-testid="message">
      {(title || onClose) && (
        <div className={prefixedClassNames(classPrefix, 'message-header')}>
          {title && <span>{title}</span>}
          {onClose && (
            <button
              className={deleteClass}
              aria-label="delete"
              onClick={onClose}
              type="button"
              data-testid="message-close"
            />
          )}
        </div>
      )}
      {children && (
        <div
          className={prefixedClassNames(classPrefix, 'message-body')}
          data-testid="message-body"
        >
          {children}
        </div>
      )}
    </article>
  );
};

// Compound components for flexible composition
export interface MessageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface MessageBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={classNames(usePrefixedClassNames('message-header'), className)}
    {...props}
  >
    {children}
  </div>
);

const MessageBody: React.FC<MessageBodyProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={classNames(usePrefixedClassNames('message-body'), className)}
    {...props}
  >
    {children}
  </div>
);

// Create a type that extends the Message component with compound components
type MessageWithCompounds = typeof MessageComponent & {
  Header: typeof MessageHeader;
  Body: typeof MessageBody;
};

// Cast Message to the compound type and assign compound components
const MessageWithSubComponents = MessageComponent as MessageWithCompounds;
MessageWithSubComponents.Header = MessageHeader;
MessageWithSubComponents.Body = MessageBody;

// Export the compound component
export { MessageWithSubComponents as Message };

export default MessageWithSubComponents;
