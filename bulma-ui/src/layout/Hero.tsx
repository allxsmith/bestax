import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Possible values for Bulma hero size.
 */
export type HeroSize =
  | 'small'
  | 'medium'
  | 'large'
  | 'fullheight'
  | 'fullheight-with-navbar';

/**
 * Props for the Hero component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {HeroSize} [size] - Hero size.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {boolean} [fullheightWithNavbar] - Use fullheight with navbar.
 * @property {React.ReactNode} [children] - Content inside the hero.
 */
export interface HeroProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  size?: HeroSize;
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  fullheightWithNavbar?: boolean;
  children?: React.ReactNode;
}

/**
 * Bulma Hero component root.
 *
 * @function
 * @param {HeroProps} props - Props for the Hero component.
 * @returns {JSX.Element} The rendered hero.
 * @see {@link https://bulma.io/documentation/layout/hero/ | Bulma Hero documentation}
 */
export const Hero: React.FC<HeroProps> & {
  Head: typeof HeroHead;
  Body: typeof HeroBody;
  Foot: typeof HeroFoot;
} = ({
  className,
  color,
  size,
  bgColor,
  fullheightWithNavbar,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    backgroundColor: bgColor,
    ...props,
  });

  const mainClass = usePrefixedClassNames('hero', {
    [`is-${color}`]: color,
    [`is-${size}`]: size && size !== 'fullheight-with-navbar',
    'is-fullheight-with-navbar':
      fullheightWithNavbar || size === 'fullheight-with-navbar',
  });
  const heroClasses = classNames(mainClass, bulmaHelperClasses, className);

  return (
    <section className={heroClasses} {...rest}>
      {children}
    </section>
  );
};

/**
 * Props for the HeroHead component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier for text.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {React.ReactNode} [children] - Content.
 */
export interface HeroHeadProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Bulma Hero head section.
 */
export const HeroHead: React.FC<HeroHeadProps> = ({
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
  const mainClass = usePrefixedClassNames('hero-head');
  const heroHeadClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <div className={heroHeadClasses} {...rest}>
      {children}
    </div>
  );
};

/**
 * Props for the HeroBody component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier for text.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {React.ReactNode} [children] - Content.
 */
export interface HeroBodyProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Bulma Hero body section.
 */
export const HeroBody: React.FC<HeroBodyProps> = ({
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
  const mainClass = usePrefixedClassNames('hero-body');
  const heroBodyClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <div className={heroBodyClasses} {...rest}>
      {children}
    </div>
  );
};

/**
 * Props for the HeroFoot component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier for text.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {React.ReactNode} [children] - Content.
 */
export interface HeroFootProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Bulma Hero foot section.
 */
export const HeroFoot: React.FC<HeroFootProps> = ({
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
  const mainClass = usePrefixedClassNames('hero-foot');
  const heroFootClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <div className={heroFootClasses} {...rest}>
      {children}
    </div>
  );
};

// Attach subcomponents
Hero.Head = HeroHead;
Hero.Body = HeroBody;
Hero.Foot = HeroFoot;

export default Hero;
