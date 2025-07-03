import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

export interface LevelProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  isMobile?: boolean;
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';

  className?: string;
  children?: React.ReactNode;
}

const Level: React.FC<LevelProps> & {
  Left: typeof LevelLeft;
  Right: typeof LevelRight;
  Item: typeof LevelItem;
} = ({ isMobile, className, children, ...props }) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  return (
    <nav
      className={classNames('level', bulmaHelperClasses, className, {
        'is-mobile': isMobile,
      })}
      {...rest}
    >
      {children}
    </nav>
  );
};

export interface LevelLeftProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

const LevelLeft: React.FC<LevelLeftProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  return (
    <div
      className={classNames('level-left', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

export interface LevelRightProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

const LevelRight: React.FC<LevelRightProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  return (
    <div
      className={classNames('level-right', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

export interface LevelItemProps
  extends React.HTMLAttributes<
      HTMLDivElement | HTMLParagraphElement | HTMLAnchorElement
    >,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  as?: 'div' | 'p' | 'a';
  hasTextCentered?: boolean;
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
  href?: string; // For <a>
  target?: string; // For <a>
  rel?: string; // For <a>
}

const LevelItem: React.FC<LevelItemProps> = ({
  as = 'div',
  hasTextCentered,
  className,
  children,
  href,
  target,
  rel,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const Tag = as;

  // If rendering as "a", only pass anchor-specific props
  if (Tag === 'a') {
    return (
      <a
        className={classNames('level-item', bulmaHelperClasses, className, {
          'has-text-centered': hasTextCentered,
        })}
        href={href}
        target={target}
        rel={rel}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Tag
      className={classNames('level-item', bulmaHelperClasses, className, {
        'has-text-centered': hasTextCentered,
      })}
      {...rest}
    >
      {children}
    </Tag>
  );
};

Level.Left = LevelLeft;
Level.Right = LevelRight;
Level.Item = LevelItem;

export default Level;
