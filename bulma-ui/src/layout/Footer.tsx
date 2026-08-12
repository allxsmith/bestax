import React from 'react';
import classNames, { usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
  validSchemeColors,
} from '../helpers/useBulmaClasses';
import { mergeBulmaStyles } from '../helpers/mergeBulmaStyles';

/**
 * Props for the Footer component.
 */
export interface FooterProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** The HTML tag to render as. */
  as?: 'footer' | 'div';
  /** Bulma color modifier. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /**
   * Background color. `scheme-*` values render as a dark-mode-safe inline
   * `background-color: var(--bulma-scheme-*)` instead of a class.
   */
  bgColor?:
    | (typeof validColors)[number]
    | (typeof validSchemeColors)[number]
    | 'inherit'
    | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Content inside the footer. */
  children?: React.ReactNode;
}

/**
 * The `Footer` component provides a semantic and accessible site footer for your Bulma React UI.
 *
 * @function
 * @param {FooterProps} props - Props for the Footer component.
 * @returns {JSX.Element} The rendered footer element.
 * @see {@link https://bulma.io/documentation/layout/footer/ | Bulma Footer documentation}
 *
 * @example
 * <Footer>
 *   <div className="content has-text-centered">...</div>
 * </Footer>
 */
export const Footer: React.FC<FooterProps> = ({
  as = 'footer',
  className,
  children,
  color,
  bgColor,
  textColor,
  style,
  ...props
}) => {
  const { bulmaHelperClasses, bulmaHelperStyles, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });
  const Tag = as;
  const mainClass = usePrefixedClassNames('footer');
  const footerClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <Tag
      className={footerClasses}
      style={mergeBulmaStyles(bulmaHelperStyles, style)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Footer;
