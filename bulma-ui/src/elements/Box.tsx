import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Box component.
 *
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color (Bulma color, 'inherit', or 'current').
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the box.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color (Bulma color, 'inherit', or 'current').
 * @property {boolean} [hasShadow=true] - Whether the box has a shadow (default: true).
 * @property {React.ReactNode} [children] - Content to be rendered inside the box.
 */
export interface BoxProps
  /** @ignore */
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  hasShadow?: boolean;
  children?: React.ReactNode;
}

/**
 * Box component for rendering a styled Bulma box element.
 *
 * Supports Bulma helper classes for styling and layout, with optional shadow control.
 *
 * @function
 * @param {BoxProps} props - Props for the Box component.
 * @returns {JSX.Element} The rendered box element.
 * @see {@link https://bulma.io/documentation/elements/box/ | Bulma Box documentation}
 */
export const Box: React.FC<BoxProps> = ({
  className,
  textColor,
  bgColor,
  hasShadow = true,
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

  const bulmaClasses = usePrefixedClassNames('box', {
    'is-shadowless': !hasShadow,
  });

  const boxClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <div className={boxClasses} {...rest}>
      {children}
    </div>
  );
};

export default Box;
