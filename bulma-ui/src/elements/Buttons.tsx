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

const validButtonsSizes = ['small', 'medium', 'large'] as const;
/**
 * Valid size values for the Buttons component (Bulma button group sizes).
 */
export type ButtonsSize = (typeof validButtonsSizes)[number];

/**
 * Props for the Buttons component.
 */
interface ButtonsProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'size'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper for the button group. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Text color alias: renders `has-text-<color>`, exactly like `textColor`.
   * Not a filled variant (no `.buttons.is-<color>` CSS exists; color the
   * individual `Button`s instead). Prefer `textColor`, which takes precedence
   * when both are set; use `bgColor` for a colored surface.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Background color helper for the button group. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Center the group of buttons. */
  isCentered?: boolean;
  /** Align the group of buttons to the right. */
  isRight?: boolean;
  /** Group buttons together as addons (removes spacing between them). */
  hasAddons?: boolean;
  /** Size of the button group. */
  size?: ButtonsSize;
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
  color,
  bgColor,
  isCentered,
  isRight,
  hasAddons,
  size,
  children,
  ...props
}) => {
  const buttonsClasses = usePrefixedClassNames('buttons', {
    'is-centered': isCentered,
    'is-right': isRight,
    'has-addons': hasAddons,
    [`are-${size}`]: size && validButtonsSizes.includes(size),
  });

  /**
   * Generates Bulma helper classes and separates out remaining props.
   */
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor ?? color,
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
