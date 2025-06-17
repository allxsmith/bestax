import React from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export interface TabsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  align?: 'centered' | 'right' | 'left';
  size?: 'small' | 'medium' | 'large';
  fullwidth?: boolean;
  boxed?: boolean;
  toggle?: boolean;
  rounded?: boolean;
  color?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'black'
    | 'dark'
    | 'light'
    | 'white';
  className?: string;
  children?: React.ReactNode;
}

export interface TabListProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface TabItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
}

export const Tabs: React.FC<TabsProps> & {
  List: typeof TabList;
  Item: typeof TabItem;
} = ({
  align,
  size,
  fullwidth,
  boxed,
  toggle,
  rounded,
  color,
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color,
    ...props,
  });

  const tabsClass = classNames(
    'tabs',
    bulmaHelperClasses,
    {
      [`is-${align}`]: align,
      [`is-${size}`]: size,
      'is-fullwidth': fullwidth,
      'is-boxed': boxed,
      'is-toggle': toggle,
      'is-toggle-rounded': toggle && rounded,
      [`is-${color}`]: color,
    },
    className
  );
  return (
    <div className={tabsClass} {...rest}>
      {children}
    </div>
  );
};

export const TabList: React.FC<TabListProps> = ({
  className,
  children,
  ...props
}) => (
  <ul className={classNames(className)} {...props}>
    {children}
  </ul>
);

export const TabItem: React.FC<TabItemProps> = ({
  active,
  className,
  children,
  onClick,
  ...props
}) => (
  <li
    className={classNames({ 'is-active': active }, className)}
    onClick={onClick}
    {...props}
  >
    {children}
  </li>
);

Tabs.List = TabList;
Tabs.Item = TabItem;

export default Tabs;
