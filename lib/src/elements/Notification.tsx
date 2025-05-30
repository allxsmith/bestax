import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Notification component for rendering a styled Bulma notification.
 *
 * Supports colors, light variants, a delete button, and arbitrary content.
 */
export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number];
  isLight?: boolean;
  hasDelete?: boolean;
  onDelete?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  className,
  color,
  isLight,
  hasDelete,
  onDelete,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  const notificationClasses = classNames(
    'notification',
    className,
    bulmaHelperClasses,
    {
      [`is-${color}`]: color && validColors.includes(color),
      'is-light': isLight,
    }
  );

  return (
    <div className={notificationClasses} {...rest}>
      {hasDelete && (
        <button
          className="delete"
          onClick={onDelete}
          aria-label="Close notification"
        />
      )}
      {children}
    </div>
  );
};
