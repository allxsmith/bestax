import React from 'react';
import { Button, ButtonProps } from './Button';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';

/**
 * Props for the LinkButton component.
 *
 * @property {'text' | 'ghost' | 'underline'} [variant] - Display mode. 'text' renders a minimal button without underline; 'ghost' renders a link-like button with default text color; 'underline' renders a text button that underlines on hover/focus. Defaults to 'text'.
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger' | 'white' | 'light' | 'dark' | 'black'} [color] - Text color override.
 */
export interface LinkButtonProps extends Omit<
  ButtonProps,
  'color' | 'isOutlined' | 'isInverted' | 'isLight'
> {
  variant?: 'text' | 'ghost' | 'underline';
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
 * The 'underline' variant uses `is-text` styling with an underline that appears on hover/focus.
 *
 * @function
 * @param {LinkButtonProps} props - Props for the LinkButton component.
 * @returns {JSX.Element} The rendered link-styled button element.
 *
 * @example
 * // Text variant (default)
 * <LinkButton onClick={handleClick}>Click me</LinkButton>
 *
 * @example
 * // Underline variant with color
 * <LinkButton variant="underline" color="primary">Learn more</LinkButton>
 */
export const LinkButton: React.FC<LinkButtonProps> = ({
  variant = 'text',
  color,
  className,
  ...props
}) => {
  const buttonColor = variant === 'underline' ? 'text' : variant;

  const prefixedClasses = usePrefixedClassNames(
    'link-button',
    color && `link-button-${color}`,
    variant === 'underline' && 'link-button-underline'
  );

  return (
    <Button
      color={buttonColor}
      className={classNames(prefixedClasses, className)}
      {...props}
    />
  );
};

export default LinkButton;
