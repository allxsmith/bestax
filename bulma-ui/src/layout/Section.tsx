import React from 'react';
import classNames from '../helpers/classNames';
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
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  const sectionClasses = classNames('section', className, bulmaHelperClasses, {
    [`is-${size}`]: size,
  });

  return (
    <section className={sectionClasses} {...rest}>
      {children}
    </section>
  );
};
