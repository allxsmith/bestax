import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

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
