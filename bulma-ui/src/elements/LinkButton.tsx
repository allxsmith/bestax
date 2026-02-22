import React from 'react';
import { Button, ButtonProps } from './Button';
import { classNames } from '../helpers/classNames';

/**
 * Props for the LinkButton component.
 *
 * @property {'text' | 'ghost'} [variant] - Display mode. 'text' renders a minimal button without underline; 'ghost' renders a link-like button with default text color. Defaults to 'text'.
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger' | 'white' | 'light' | 'dark' | 'black'} [color] - Text color override.
 */
export interface LinkButtonProps
  extends Omit<
    ButtonProps,
    'color' | 'isOutlined' | 'isInverted' | 'isLight'
  > {
  variant?: 'text' | 'ghost';
  color?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'white'
    | 'light'
    | 'dark'
    | 'black';
}

/**
 * A button that visually looks like text or a link, for a11y-friendly replacements
 * of `<div onClick>` anti-patterns.
 *
 * Wraps the Button component with `is-text` or `is-ghost` styling, plus CSS overrides
 * to remove the underline (text variant) or link color (ghost variant).
 *
 * @function
 * @param {LinkButtonProps} props - Props for the LinkButton component.
 * @returns {JSX.Element} The rendered link-styled button element.
 */
export const LinkButton: React.FC<LinkButtonProps> = ({
  variant = 'text',
  color,
  className,
  ...props
}) => {
  return (
    <Button
      color={variant}
      className={classNames(
        'link-button',
        color && `link-button-${color}`,
        className
      )}
      {...props}
    />
  );
};

export default LinkButton;
