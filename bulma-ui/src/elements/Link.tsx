import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Link component.
 * @extraProp {string} [href] - The URL the link points to.
 * @extraProp {'_self' | '_blank' | '_parent' | '_top'} [target] - Where to open the linked document.
 * @extraProp {string} [rel] - Relationship between current and linked document.
 */
export interface LinkProps
  extends
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes to apply. */
  className?: string;
  /** Text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Whether the link appears active. */
  isActive?: boolean;
  /** Render as a custom component (e.g. a router `Link`) instead of `<a>`. Defaults to `'a'`. */
  as?: React.ElementType;
  /** Content to render inside the link. */
  children?: React.ReactNode;
}

/**
 * The `Link` component renders a styled anchor (`<a>`) element with Bulma helper class integration.
 *
 * @function
 * @param {LinkProps} props - Props for the Link component.
 * @returns {JSX.Element} The rendered anchor element.
 * @see {@link https://bulma.io/documentation/elements/content/ | Bulma Content documentation}
 */
export const Link: React.FC<LinkProps> = ({
  className,
  textColor,
  bgColor,
  isActive,
  as: Component = 'a',
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
  } as BulmaClassesProps & typeof props);

  const bulmaClasses = usePrefixedClassNames({
    'is-active': isActive,
  });
  const linkClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <Component className={linkClasses || undefined} {...rest}>
      {children}
    </Component>
  );
};
