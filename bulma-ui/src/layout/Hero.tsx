import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
  validSchemeColors,
} from '../helpers/useBulmaClasses';
import { mergeBulmaStyles } from '../helpers/mergeBulmaStyles';
import { warnUnstyledColor } from '../helpers/colorDeprecations';

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
  /**
   * Bulma color modifier for the hero section (renders `is-<color>`).
   *
   * Only `primary`, `link`, `info`, `success`, `warning`, `danger`, `black`,
   * `white`, `light`, and `dark` have shipped CSS for `.hero`. The other
   * accepted values (`black-bis`, `black-ter`, `grey-darker`, `grey-dark`,
   * `grey`, `grey-light`, `grey-lighter`, `inherit`, `current`) emit a class
   * no CSS rule matches, so the hero renders unstyled; they log a console
   * warning in development and will be removed from this union in the next
   * major version.
   */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Hero size. */
  size?: HeroSize;
  /**
   * Bulma background color helper. `scheme-*` values render as a
   * dark-mode-safe inline `background-color: var(--bulma-scheme-*)` instead
   * of a class. The `scheme-invert*` values do not change text color — pair
   * them with a contrasting foreground.
   */
  bgColor?:
    | (typeof validColors)[number]
    | (typeof validSchemeColors)[number]
    | 'inherit'
    | 'current';
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
  style,
  ...props
}) => {
  warnUnstyledColor('Hero', color, ['inherit', 'current']);

  const { bulmaHelperClasses, bulmaHelperStyles, rest } = useBulmaClasses({
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
    <section
      className={heroClasses}
      style={mergeBulmaStyles(bulmaHelperStyles, style)}
      {...rest}
    >
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
  /**
   * Background color. `scheme-*` values render as a dark-mode-safe inline
   * `background-color: var(--bulma-scheme-*)` instead of a class. The
   * `scheme-invert*` values do not change text color — pair them with a
   * contrasting foreground.
   */
  bgColor?:
    | (typeof validColors)[number]
    | (typeof validSchemeColors)[number]
    | 'inherit'
    | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Top bar for navigation or branding.
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
  style,
  ...props
}) => {
  const { bulmaHelperClasses, bulmaHelperStyles, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });
  const mainClass = usePrefixedClassNames('hero-head');
  const heroHeadClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <div
      className={heroHeadClasses}
      style={mergeBulmaStyles(bulmaHelperStyles, style)}
      {...rest}
    >
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
  /**
   * Background color. `scheme-*` values render as a dark-mode-safe inline
   * `background-color: var(--bulma-scheme-*)` instead of a class. The
   * `scheme-invert*` values do not change text color — pair them with a
   * contrasting foreground.
   */
  bgColor?:
    | (typeof validColors)[number]
    | (typeof validSchemeColors)[number]
    | 'inherit'
    | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Main content area, vertically centered by default.
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
  style,
  ...props
}) => {
  const { bulmaHelperClasses, bulmaHelperStyles, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });
  const mainClass = usePrefixedClassNames('hero-body');
  const heroBodyClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <div
      className={heroBodyClasses}
      style={mergeBulmaStyles(bulmaHelperStyles, style)}
      {...rest}
    >
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
  /**
   * Background color. `scheme-*` values render as a dark-mode-safe inline
   * `background-color: var(--bulma-scheme-*)` instead of a class. The
   * `scheme-invert*` values do not change text color — pair them with a
   * contrasting foreground.
   */
  bgColor?:
    | (typeof validColors)[number]
    | (typeof validSchemeColors)[number]
    | 'inherit'
    | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Bottom bar for tabs or actions.
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
  style,
  ...props
}) => {
  const { bulmaHelperClasses, bulmaHelperStyles, rest } = useBulmaClasses({
    color: textColor ?? color,
    backgroundColor: bgColor,
    ...props,
  });
  const mainClass = usePrefixedClassNames('hero-foot');
  const heroFootClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <div
      className={heroFootClasses}
      style={mergeBulmaStyles(bulmaHelperStyles, style)}
      {...rest}
    >
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
