import React from 'react';
import classNames, { usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Section size values for Bulma.
 */
type SectionSize = 'medium' | 'large';

/**
 * Props for the Section component.
 *
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {'medium'|'large'} [size] - Section size.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Section content.
 */
export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  size?: SectionSize;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Section component for general layout.
 *
 * @function
 * @param {SectionProps} props - Props for the Section component.
 * @returns {JSX.Element} The rendered section.
 * @see {@link https://bulma.io/documentation/layout/section/ | Bulma Section documentation}
 */
export const Section: React.FC<SectionProps> = ({
  size,
  className,
  children,
  color,
  bgColor,
  textColor,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('section');
  const sectionModifiers = usePrefixedClassNames('', {
    [`is-${size}`]: size,
  });
  const sectionClasses = classNames(
    mainClass,
    sectionModifiers,
    className,
    bulmaHelperClasses
  );

  return (
    <section className={sectionClasses} {...rest}>
      {children}
    </section>
  );
};
