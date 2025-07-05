import React from 'react';
import classNames from '../helpers/classNames';
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
  extends React.HTMLAttributes<HTMLElement>,
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
const Footer: React.FC<FooterProps> = ({
  as = 'footer',
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const Tag = as;
  return (
    <Tag
      className={classNames('footer', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Footer;
