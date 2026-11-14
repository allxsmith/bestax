import React from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { isElementOf } from '../helpers/elementType';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

const validMessageSizes = ['small', 'medium', 'large'] as const;
/**
 * Valid size values for the Message component (Bulma message sizes).
 */
export type MessageSize = (typeof validMessageSizes)[number];

/**
 * Props for the Message component.
 */
export interface MessageProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'title'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor' | 'size'> {
  /** Additional CSS classes. */
  className?: string;
  /** Title string/node (renders header section). */
  title?: React.ReactNode;
  /** Text color for the message (Bulma helper). */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the message. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color for the message (Bulma helper). */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Size of the message. */
  size?: MessageSize;
  /** Callback for the close ("X") button. */
  onClose?: () => void;
  /**
   * Body content for the message, wrapped in a `.message-body`. Children that
   * include a `Message.Header` or `Message.Body` aren't wrapped: they render as
   * the article's own children, after the header `title` and `onClose` make.
   */
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
  size,
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
    [`is-${size}`]: size && validMessageSizes.includes(size),
  });
  const deleteClass = usePrefixedClassNames('delete');

  const messageClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  // Built from its parts, the header and body are the article's own
  // children, as Bulma lays them out, so they get no body around them.
  const composed = React.Children.toArray(children).some(child =>
    isElementOf(child, MessageHeader, MessageBody)
  );

  // A test id the caller passes wins. It's written after `rest`, since a
  // spread carrying `data-testid: undefined` would otherwise erase the default.
  const testId =
    (rest as { 'data-testid'?: string })['data-testid'] ?? 'message';

  return (
    <article className={messageClasses} {...rest} data-testid={testId}>
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
      {composed
        ? children
        : children && (
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
export const MessageHeader: React.FC<MessageHeaderProps> = ({
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
export const MessageBody: React.FC<MessageBodyProps> = ({
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
