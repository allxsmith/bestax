import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Notification component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number]} [color] - Bulma color modifier for the notification.
 * @property {boolean} [isLight] - Use the light color variant.
 * @property {boolean} [hasDelete] - Show a delete (close) button.
 * @property {() => void} [onDelete] - Callback fired when the delete button is clicked.
 * @property {React.ReactNode} [children] - Content to be rendered inside the notification.
 */
export interface NotificationProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number];
  isLight?: boolean;
  hasDelete?: boolean;
  onDelete?: () => void;
  children?: React.ReactNode;
}

/**
 * Notification component for rendering a styled Bulma notification.
 *
 * Supports colors, light variants, a delete button, and arbitrary content.
 *
 * @function
 * @param {NotificationProps} props - Props for the Notification component.
 * @returns {JSX.Element} The rendered notification element.
 * @see {@link https://bulma.io/documentation/elements/notification/ | Bulma Notification documentation}
 */
export const Notification: React.FC<NotificationProps> = ({
  className,
  color,
  isLight,
  hasDelete,
  onDelete,
  children,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  const bulmaClasses = usePrefixedClassNames('notification', {
    [`is-${color}`]: color && validColors.includes(color),
    'is-light': isLight,
  });

  const deleteClasses = usePrefixedClassNames('delete');

  const notificationClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <div className={notificationClasses} {...rest}>
      {hasDelete && (
        <button
          className={deleteClasses}
          onClick={onDelete}
          aria-label="Close notification"
        />
      )}
      {children}
    </div>
  );
};
