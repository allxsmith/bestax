import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Tabs component.
 *
 * @property {'centered'|'right'|'left'} [align] - Tab alignment.
 * @property {'small'|'medium'|'large'} [size] - Tab size.
 * @property {boolean} [fullwidth] - Tabs are fullwidth.
 * @property {boolean} [boxed] - Tabs are boxed style.
 * @property {boolean} [toggle] - Tabs are toggle style.
 * @property {boolean} [rounded] - Tabs are rounded (if toggle).
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color for the tabs.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Tab content.
 */
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

/**
 * Props for the TabList component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Tab list items.
 */
export interface TabListProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Props for the TabItem component.
 *
 * @property {boolean} [active] - Whether the tab is active.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Tab content.
 * @property {React.MouseEventHandler<HTMLLIElement>} [onClick] - Click handler.
 */
export interface TabItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
}

/**
 * Bulma Tabs component with subcomponents for tab lists and items.
 *
 * @function
 * @param {TabsProps} props - Props for the Tabs component.
 * @returns {JSX.Element} The rendered tabs.
 * @see {@link https://bulma.io/documentation/components/tabs/ | Bulma Tabs documentation}
 */
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

/**
 * Bulma Tab list container.
 *
 * @function
 * @param {TabListProps} props - Props for the TabList component.
 * @returns {JSX.Element} The rendered tab list.
 */
export const TabList: React.FC<TabListProps> = ({
  className,
  children,
  ...props
}) => (
  <ul className={classNames(className)} {...props}>
    {children}
  </ul>
);

/**
 * Bulma Tab item.
 *
 * @function
 * @param {TabItemProps} props - Props for the TabItem component.
 * @returns {JSX.Element} The rendered tab item.
 */
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
