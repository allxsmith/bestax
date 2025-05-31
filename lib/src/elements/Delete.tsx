import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Delete component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the delete button.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {(event: React.MouseEvent<HTMLButtonElement>) => void} [onClick] - Click handler for the button.
 * @property {'small' | 'medium' | 'large'} [size] - Size modifier for the delete button.
 * @property {string} [ariaLabel='Close'] - ARIA label for accessibility (default: 'Close').
 * @property {boolean} [disabled=false] - Whether the button is disabled (default: false).
 */
interface DeleteProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    BulmaClassesProps {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Delete component for rendering a Bulma-styled delete/close button.
 *
 * Supports Bulma helper classes for styling, color, and size, and includes accessibility and disabled state.
 *
 * @function
 * @param {DeleteProps} props - Props for the Delete component.
 * @returns {JSX.Element} The rendered delete button.
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
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const classes = classNames(
    'delete',
    {
      [`is-${size}`]: size,
      'is-disabled': disabled,
    },
    bulmaHelperClasses,
    className
  );

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
