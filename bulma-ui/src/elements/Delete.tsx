import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Delete component.
 */
interface DeleteProps
  extends React.HTMLAttributes<HTMLButtonElement>, BulmaClassesProps {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the button. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Click handler for the button. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Size modifier for the delete button. */
  size?: 'small' | 'medium' | 'large';
  /** ARIA label for accessibility (default: 'Close'). */
  ariaLabel?: string;
  /** Whether the button is disabled (default: false). */
  disabled?: boolean;
}

/**
 * The `Delete` component provides a Bulma-styled close/delete button for dismissing modals, notifications, tags, messages, and more.
 *
 * @function
 * @param {DeleteProps} props - Props for the Delete component.
 * @returns {JSX.Element} The rendered delete button.
 * @see {@link https://bulma.io/documentation/elements/delete/ | Bulma Delete documentation}
 */
export const Delete: React.FC<DeleteProps> = ({
  className,
  textColor,
  bgColor,
  onClick,
  size,
  ariaLabel = 'Close',
  disabled = false,
  ...props
}) => {
  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const bulmaClasses = usePrefixedClassNames('delete', {
    [`is-${size}`]: size,
    'is-disabled': disabled,
  });

  const classes = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <button
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      type="button"
      {...rest}
    />
  );
};
