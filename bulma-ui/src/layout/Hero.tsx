import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Possible values for Bulma hero size.
 */
export type HeroSize =
  'small' | 'medium' | 'large' | 'fullheight' | 'fullheight-with-navbar';

/**
 * Props for the Hero component.
 */
export interface HeroProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Bulma color modifier for the hero section. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Hero size. */
  size?: HeroSize;
  /** Bulma background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Use fullheight hero with a navbar offset. */
  fullheightWithNavbar?: boolean;
  /** Hero content (often includes `Hero.Head`, `Hero.Body`, `Hero.Foot`). */
  children?: React.ReactNode;
}

/**
 * The `Hero` component provides a responsive, flexible, and visually striking section for your Bulma React UI.
 *
 * @function
 * @param {HeroProps} props - Props for the Hero component.
 * @returns {JSX.Element} The rendered hero.
 * @see {@link https://bulma.io/documentation/layout/hero/ | Bulma Hero documentation}
 */
const HeroComponent: React.FC<HeroProps> = ({
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
 */
export interface HeroHeadProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Bulma color modifier for text. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Bulma Hero head section.
 *
 * @function
 * @param {HeroHeadProps} props - Props for the HeroHead component.
 * @returns {JSX.Element} The rendered hero head.
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
 */
export interface HeroBodyProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Bulma color modifier for text. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Bulma Hero body section.
 *
 * @function
 * @param {HeroBodyProps} props - Props for the HeroBody component.
 * @returns {JSX.Element} The rendered hero body.
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
 */
export interface HeroFootProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Bulma color modifier for text. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Bulma Hero foot section.
 *
 * @function
 * @param {HeroFootProps} props - Props for the HeroFoot component.
 * @returns {JSX.Element} The rendered hero foot.
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
export const Hero = withSubComponents(
  HeroComponent,
  {
    Head: HeroHead,
    Body: HeroBody,
    Foot: HeroFoot,
  },
  'Hero'
);

export default Hero;
