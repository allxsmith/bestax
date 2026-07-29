import React from 'react';
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

/**
 * Props for the Message component.
 */
export interface MessageProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'title'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Title string/node (renders header section). Title displayed in the message header. */
  title?: React.ReactNode;
  /** Text color for the message (Bulma helper). Text color (Bulma or 'inherit'/'current'). */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the message. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color for the message (Bulma helper). Background color (Bulma or 'inherit'/'current'). */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Callback for the close ("X") button. Called when the close button is clicked. */
  onClose?: () => void;
  /** Body content for the message. */
  children?: React.ReactNode;
}

/**
 * The `Message` component provides Bulma's flexible notice/message box for your Bulma React UI.
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

/**
 * Props for the Message.Header compound component.
 */
export interface MessageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Header content (title, close button, etc.). */
  children?: React.ReactNode;
}

/**
 * Props for the Message.Body compound component.
 */
export interface MessageBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Message body content. */
  children?: React.ReactNode;
}

/**
 * Message header compound component. Renders a `.message-header` element.
 *
 * @function
 * @param {MessageHeaderProps} props - Props for the MessageHeader component.
 * @returns {JSX.Element} The rendered message header.
 */
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

/**
 * Message body compound component. Renders a `.message-body` element.
 *
 * @function
 * @param {MessageBodyProps} props - Props for the MessageBody component.
 * @returns {JSX.Element} The rendered message body.
 */
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

// Attach compound components
export const Message = withSubComponents(
  MessageComponent,
  {
    Header: MessageHeader,
    Body: MessageBody,
  },
  'Message'
);

export default Message;
