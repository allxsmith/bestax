import React from 'react';
import classNames from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

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

export const Media: React.FC<MediaProps> & {
  Left: typeof MediaLeft;
  Content: typeof MediaContent;
  Right: typeof MediaRight;
} = ({ as = 'article', className, children, ...props }) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const Tag = as;
  return (
    <Tag
      className={classNames('media', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

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

export interface MediaContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}
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

export interface MediaRightProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  color?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  className?: string;
  children?: React.ReactNode;
}
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
