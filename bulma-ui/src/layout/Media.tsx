import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

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
  extends
    React.HTMLAttributes<HTMLElement>,
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
export const Media: React.FC<MediaProps> = ({
  as = 'article',
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
  const Tag = as;
  const mainClass = usePrefixedClassNames('media');
  const mediaClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <Tag className={mediaClasses} {...rest}>
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
  extends
    React.HTMLAttributes<HTMLElement>,
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
  const Tag = as;
  const mainClass = usePrefixedClassNames('media-left');
  const mediaLeftClasses = classNames(mainClass, bulmaHelperClasses, className);
  return (
    <Tag className={mediaLeftClasses} {...rest}>
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
  extends
    React.HTMLAttributes<HTMLDivElement>,
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
  const mainClass = usePrefixedClassNames('media-content');
  const mediaContentClasses = classNames(
    mainClass,
    bulmaHelperClasses,
    className
  );
  return (
    <div className={mediaContentClasses} {...rest}>
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
  extends
    React.HTMLAttributes<HTMLDivElement>,
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
  const mainClass = usePrefixedClassNames('media-right');
  const mediaRightClasses = classNames(
    mainClass,
    bulmaHelperClasses,
    className
  );
  return (
    <div className={mediaRightClasses} {...rest}>
      {children}
    </div>
  );
};

interface MediaComponent extends React.FC<MediaProps> {
  Left: React.FC<MediaLeftProps>;
  Content: React.FC<MediaContentProps>;
  Right: React.FC<MediaRightProps>;
}

const MediaWithSubcomponents = Media as MediaComponent;
MediaWithSubcomponents.Left = MediaLeft;
MediaWithSubcomponents.Content = MediaContent;
MediaWithSubcomponents.Right = MediaRight;

export default MediaWithSubcomponents;
