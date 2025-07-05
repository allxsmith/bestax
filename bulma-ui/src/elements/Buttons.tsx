import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Buttons component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the buttons group.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {boolean} [isCentered] - Center the group of buttons.
 * @property {boolean} [isRight] - Align the group of buttons to the right.
 * @property {boolean} [hasAddons] - Group buttons together as addons.
 * @property {React.ReactNode} children - The button elements to render inside the group.
 */
interface ButtonsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BulmaClassesProps {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  isCentered?: boolean;
  isRight?: boolean;
  hasAddons?: boolean;
  children: React.ReactNode;
}

/**
 * Buttons component for rendering a group of Bulma-styled buttons.
 *
 * Supports Bulma helper classes for styling, color, and layout, including centering, right alignment, and grouping as addons.
 *
 * @function
 * @param {ButtonsProps} props - Props for the Buttons component.
 * @returns {JSX.Element} The rendered group of buttons.
 * @see {@link https://bulma.io/documentation/elements/button/#group | Bulma Button Group documentation}
 */
export const Buttons: React.FC<ButtonsProps> = ({
  className,
  textColor,
  bgColor,
  isCentered,
  isRight,
  hasAddons,
  children,
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

  const buttonsClasses = classNames('buttons', className, bulmaHelperClasses, {
    'is-centered': isCentered,
    'is-right': isRight,
    'has-addons': hasAddons,
  });

  return (
    <div className={buttonsClasses} {...rest}>
      {children}
    </div>
  );
};
