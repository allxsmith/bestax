import React from 'react';
import classNames, { usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Footer component.
 *
 * @property {'footer'|'div'} [as] - The HTML tag to render as.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Content inside the footer.
 */
export interface FooterProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  as?: 'footer' | 'div';
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Footer component.
 *
 * @example
 * <Footer>
 *   <div className="content has-text-centered">...</div>
 * </Footer>
 * @see {@link https://bulma.io/documentation/layout/footer/ | Bulma Footer documentation}
 */
export const Footer: React.FC<FooterProps> = ({
  as = 'footer',
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
  const Tag = as;
  const mainClass = usePrefixedClassNames('footer');
  const footerClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <Tag className={footerClasses} {...rest}>
      {children}
    </Tag>
  );
};

export default Footer;
