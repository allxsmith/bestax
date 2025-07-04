import React from 'react';
import classNames from '../helpers/classNames';
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
    color,
    backgroundColor: bgColor,
    ...props,
  });

  const heroClasses = classNames(
    'hero',
    bulmaHelperClasses,
    className,
    color && `is-${color}`,
    size && size !== 'fullheight-with-navbar' && `is-${size}`,
    {
      'is-fullheight-with-navbar':
        fullheightWithNavbar || size === 'fullheight-with-navbar',
    }
  );

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
  return (
    <div
      className={classNames('hero-head', bulmaHelperClasses, className)}
      {...rest}
    >
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
  return (
    <div
      className={classNames('hero-body', bulmaHelperClasses, className)}
      {...rest}
    >
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
  return (
    <div
      className={classNames('hero-foot', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

// Attach subcomponents
Hero.Head = HeroHead;
Hero.Body = HeroBody;
Hero.Foot = HeroFoot;

export default Hero;
