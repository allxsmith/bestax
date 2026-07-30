import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Media component.
 */
export interface MediaProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Element type for the root Media container. */
  as?: 'article' | 'div';
  /** Bulma color modifier. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma background color helper. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma text color helper. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Content inside the media container. */
  children?: React.ReactNode;
}

/**
 * The `Media` component implements Bulma’s powerful media object layout for React.
 *
 * @function
 * @param {MediaProps} props - Props for the Media component.
 * @returns {JSX.Element} The rendered media container.
 * @see {@link https://bulma.io/documentation/layout/media-object/ | Bulma Media documentation}
 */
const MediaComponent: React.FC<MediaProps> = ({
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
 */
export interface MediaLeftProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Element type to render. */
  as?: 'figure' | 'div';
  /** Bulma color modifier. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Content. */
  children?: React.ReactNode;
}

/**
 * For avatars, thumbnails, icons (renders as `figure` or `div`)
 *
 * @function
 * @param {MediaLeftProps} props - Props for the MediaLeft component.
 * @returns {JSX.Element} The rendered media left section.
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
 */
export interface MediaContentProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Main content (renders as `div`)
 *
 * @function
 * @param {MediaContentProps} props - Props for the MediaContent component.
 * @returns {JSX.Element} The rendered media content section.
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
 */
export interface MediaRightProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier. */
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Additional CSS classes. */
  className?: string;
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Actions or controls (renders as `div`)
 *
 * @function
 * @param {MediaRightProps} props - Props for the MediaRight component.
 * @returns {JSX.Element} The rendered media right section.
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

/** Media component with Left, Content, and Right sub-components. */
export const Media = withSubComponents(
  MediaComponent,
  {
    Left: MediaLeft,
    Content: MediaContent,
    Right: MediaRight,
  },
  'Media'
);

export default Media;
