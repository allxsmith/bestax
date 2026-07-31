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
 */
export interface SectionProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'backgroundColor' | 'color'> {
  /** Bulma color modifier for text. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Section size for extra vertical spacing. */
  size?: SectionSize;
  /** Additional CSS classes. */
  className?: string;
  /** Section content. */
  children?: React.ReactNode;
}

/**
 * The `Section` component provides vertical spacing and visual separation for your Bulma React UI.
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
