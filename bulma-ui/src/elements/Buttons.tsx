import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { Button } from './Button';
import { LinkButton } from './LinkButton';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Buttons component.
 */
interface ButtonsProps
  extends React.HTMLAttributes<HTMLDivElement>, BulmaClassesProps {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper for the button group. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the buttons group. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper for the button group. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Center the group of buttons. */
  isCentered?: boolean;
  /** Align the group of buttons to the right. */
  isRight?: boolean;
  /** Group buttons together as addons (removes spacing between them). */
  hasAddons?: boolean;
  /** The button elements to render inside the group. */
  children: React.ReactNode;
}

/**
 * The `Buttons` component lets you group multiple `Button` elements together with Bulma's spacing, alignment, and add-on features.
 *
 * @function
 * @param {ButtonsProps} props - Props for the Buttons component.
 * @returns {JSX.Element} The rendered group of buttons.
 * @see {@link https://bulma.io/documentation/elements/button/#group | Bulma Button Group documentation}
 */
const ButtonsComponent: React.FC<ButtonsProps> = ({
  className,
  textColor,
  bgColor,
  isCentered,
  isRight,
  hasAddons,
  children,
  ...props
}) => {
  const buttonsClasses = usePrefixedClassNames('buttons', {
    'is-centered': isCentered,
    'is-right': isRight,
    'has-addons': hasAddons,
  });

  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  const combinedClasses = classNames(
    buttonsClasses,
    className,
    bulmaHelperClasses
  );

  return (
    <div className={combinedClasses} {...rest}>
      {children}
    </div>
  );
};

export const Buttons = withSubComponents(
  ButtonsComponent,
  {
    Button,
    LinkButton,
  },
  'Buttons'
);
