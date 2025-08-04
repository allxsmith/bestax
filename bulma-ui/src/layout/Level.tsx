import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the Level component.
 *
 * @property {boolean} [isMobile] - Enable mobile mode.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Level content.
 */
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

/**
 * Bulma Level component for horizontal layouts.
 *
 * @function
 * @param {LevelProps} props - Props for the Level component.
 * @returns {JSX.Element} The rendered level.
 * @see {@link https://bulma.io/documentation/layout/level/ | Bulma Level documentation}
 */
export const Level: React.FC<LevelProps> & {
  Left: typeof LevelLeft;
  Right: typeof LevelRight;
  Item: typeof LevelItem;
} = ({ isMobile, className, children, ...props }) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClass = classPrefix ? `${classPrefix}level` : 'level';
  return (
    <nav
      className={classNames(mainClass, bulmaHelperClasses, className, {
        'is-mobile': isMobile,
      })}
      {...rest}
    >
      {children}
    </nav>
  );
};

/**
 * Props for the LevelLeft component.
 *
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Content.
 */
export interface LevelLeftProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Level left section.
 */
export const LevelLeft: React.FC<LevelLeftProps> = ({
  className,
  children,
  ...props
}) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClass = classPrefix ? `${classPrefix}level-left` : 'level-left';
  return (
    <div
      className={classNames(mainClass, bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Props for the LevelRight component.
 *
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Content.
 */
export interface LevelRightProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Level right section.
 */
export const LevelRight: React.FC<LevelRightProps> = ({
  className,
  children,
  ...props
}) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const mainClass = classPrefix ? `${classPrefix}level-right` : 'level-right';
  return (
    <div
      className={classNames(mainClass, bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Props for the LevelItem component.
 *
 * @property {'div'|'p'|'a'} [as] - Element type to render.
 * @property {boolean} [hasTextCentered] - Center the text in the item.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Content.
 * @property {string} [href] - Href for "a" tag.
 * @property {string} [target] - Target for "a" tag
 * @property {string} [rel] - Rel for "a" tag
 */
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
  href?: string;
  target?: string;
  rel?: string;
}

/**
 * Bulma Level item section.
 */
export const LevelItem: React.FC<LevelItemProps> = ({
  as = 'div',
  hasTextCentered,
  className,
  children,
  href,
  target,
  rel,
  ...props
}) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const Tag = as;
  const mainClass = classPrefix ? `${classPrefix}level-item` : 'level-item';

  // If rendering as "a", only pass anchor-specific props
  if (Tag === 'a') {
    return (
      <a
        className={classNames(mainClass, bulmaHelperClasses, className, {
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
      className={classNames(mainClass, bulmaHelperClasses, className, {
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
