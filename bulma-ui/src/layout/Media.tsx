import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';

/**
 * Props for the Media component.
 *
 * @property {'article'|'div'} [as] - Element type to render.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Content.
 */
export interface MediaProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  as?: 'article' | 'div';
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Media component root.
 *
 * @function
 * @param {MediaProps} props - Props for the Media component.
 * @returns {JSX.Element} The rendered media container.
 * @see {@link https://bulma.io/documentation/layout/media-object/ | Bulma Media documentation}
 */
export const Media: React.FC<MediaProps> & {
  Left: typeof MediaLeft;
  Content: typeof MediaContent;
  Right: typeof MediaRight;
} = ({ as = 'article', className, children, ...props }) => {
  const { classPrefix } = useConfig();
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const Tag = as;
  const mainClass = classPrefix ? `${classPrefix}media` : 'media';
  return (
    <Tag
      className={classNames(mainClass, bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

/**
 * Props for the MediaLeft component.
 *
 * @property {'figure'|'div'} [as] - Element type to render.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Content.
 */
export interface MediaLeftProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  as?: 'figure' | 'div';
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Media left section.
 */
export const MediaLeft: React.FC<MediaLeftProps> = ({
  as = 'figure',
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const Tag = as;
  return (
    <Tag
      className={classNames('media-left', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

/**
 * Props for the MediaContent component.
 *
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Content.
 */
export interface MediaContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Media content section.
 */
export const MediaContent: React.FC<MediaContentProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  return (
    <div
      className={classNames('media-content', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Props for the MediaRight component.
 *
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [color] - Bulma color modifier.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Content.
 */
export interface MediaRightProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Media right section.
 */
export const MediaRight: React.FC<MediaRightProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  return (
    <div
      className={classNames('media-right', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

Media.Left = MediaLeft;
Media.Content = MediaContent;
Media.Right = MediaRight;

export default Media;
