import React from 'react';
import { Button, ButtonProps } from './Button';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';

/**
 * Props for the LinkButton component.
 */
export interface LinkButtonProps extends Omit<
  ButtonProps,
  'color' | 'isOutlined' | 'isInverted' | 'isLight'
> {
  /** Display mode. `text` has no underline; `ghost` uses default text color. */
  variant?: 'text' | 'ghost' | 'underline';
  /** Text color override for the button. */
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
 * The `LinkButton` component renders a `<button>` that visually looks like text or a link.
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
