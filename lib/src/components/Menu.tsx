import React, { createContext, useContext } from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

// Context to track MenuList nesting level
const MenuListLevelContext = createContext(0);

export interface MenuProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  className?: string;
  children: React.ReactNode;
}

export const Menu: React.FC<MenuProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  return (
    <aside
      className={classNames('menu', className, bulmaHelperClasses)}
      {...rest}
    >
      {children}
    </aside>
  );
};

export interface MenuLabelProps
  extends Omit<
      React.HTMLAttributes<HTMLParagraphElement>,
      keyof BulmaClassesProps
    >,
    BulmaClassesProps {
  className?: string;
  children: React.ReactNode;
}

export const MenuLabel: React.FC<MenuLabelProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  return (
    <p
      className={classNames('menu-label', className, bulmaHelperClasses)}
      {...rest}
    >
      {children}
    </p>
  );
};

export interface MenuListProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * MenuList applies `menu-list` class only at the top level (not for nested lists).
 */
export const MenuList: React.FC<MenuListProps> = ({
  className,
  children,
  ...props
}) => {
  const level = useContext(MenuListLevelContext);
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  const ulClass = classNames(className, bulmaHelperClasses, {
    'menu-list': level === 0,
  });

  // Increment level for nested MenuLists
  return (
    <MenuListLevelContext.Provider value={level + 1}>
      <ul className={ulClass} {...rest}>
        {children}
      </ul>
    </MenuListLevelContext.Provider>
  );
};

export interface MenuItemProps
  extends Omit<React.LiHTMLAttributes<HTMLLIElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  className?: string;
  children: React.ReactNode;
  active?: boolean;
  href?: string;
  as?: React.ElementType;
  [key: string]: unknown;
}

/**
 * MenuItem supports `as` prop for custom link components, e.g., react-router-dom Link
 * Ensures data-testid is only applied to "li" html elements
 */
export const MenuItem: React.FC<MenuItemProps> = ({
  className,
  children,
  active,
  href,
  as: Component = 'a',
  'data-testid': testId,
  ...rest
}) => {
  const { bulmaHelperClasses, rest: bulmaRest } = useBulmaClasses(rest);
  const itemClass = classNames({ 'is-active': active }, bulmaHelperClasses);

  // Standard <li> props
  const { style, id, title, role, tabIndex, ...linkProps } = bulmaRest;

  // Split children into label and nested MenuList(s)
  const labelChildren: React.ReactNode[] = [];
  const nestedMenuLists: React.ReactNode[] = [];
  React.Children.forEach(children, child => {
    if (React.isValidElement(child) && child.type === MenuList) {
      nestedMenuLists.push(child);
    } else {
      labelChildren.push(child);
    }
  });

  // href/to should go to the link component
  if (Component === 'a' && href) {
    (linkProps as Record<string, unknown>).href = href;
  }
  if (Object.prototype.hasOwnProperty.call(rest, 'to')) {
    (linkProps as Record<string, unknown>).to = rest.to;
  }

  return (
    <li
      className={className}
      data-testid={testId}
      style={style as React.CSSProperties | undefined}
      id={id as string | undefined}
      title={title as string | undefined}
      role={role as React.AriaRole | undefined}
      tabIndex={tabIndex as number | undefined}
    >
      <Component className={itemClass} {...linkProps}>
        {labelChildren}
      </Component>
      {nestedMenuLists}
    </li>
  );
};
