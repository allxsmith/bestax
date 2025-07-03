import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

export type HeroSize =
  | 'small'
  | 'medium'
  | 'large'
  | 'fullheight'
  | 'fullheight-with-navbar';

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

// Hero root
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

// Hero Head
export interface HeroHeadProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

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

// Hero Body
export interface HeroBodyProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

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

// Hero Foot
export interface HeroFootProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

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
