import React, { createContext, useContext } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';

// Context to track MenuList nesting level
const MenuListLevelContext = createContext(0);

/**
 * Props for the Menu component.
 */
export interface MenuProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  /** Additional CSS classes. */
  className?: string;
  /** Menu content (labels, lists, items, etc). */
  children: React.ReactNode;
}

/**
 * The `Menu` component provides Bulma's vertical navigation menu: a simple, accessible sidebar or section menu for your Bulma React UI.
 *
 * @function
 * @param {MenuProps} props - Props for the Menu component.
 * @returns {JSX.Element} The rendered menu.
 * @see {@link https://bulma.io/documentation/components/menu/ | Bulma Menu documentation}
 */
const MenuComponent: React.FC<MenuProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('menu');

  return (
    <aside
      className={classNames(bulmaClasses, bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </aside>
  );
};

/**
 * Props for the MenuLabel component.
 */
export interface MenuLabelProps
  extends
    Omit<React.HTMLAttributes<HTMLParagraphElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  /** Additional CSS classes. */
  className?: string;
  /** Label content. */
  children: React.ReactNode;
}

/**
 * Bulma Menu label component.
 *
 * @function
 * @param {MenuLabelProps} props - Props for the MenuLabel component.
 * @returns {JSX.Element} The rendered menu label.
 */
export const MenuLabel: React.FC<MenuLabelProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  return (
    <p
      className={classNames(
        usePrefixedClassNames('menu-label'),
        className,
        bulmaHelperClasses
      )}
      {...rest}
    >
      {children}
    </p>
  );
};

/**
 * Props for the MenuList component.
 */
export interface MenuListProps
  extends
    Omit<React.HTMLAttributes<HTMLUListElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  /** Additional CSS classes. */
  className?: string;
  /** List items. */
  children: React.ReactNode;
}

/**
 * MenuList applies `menu-list` class only at the top level (not for nested lists).
 *
 * @function
 * @param {MenuListProps} props - Props for the MenuList component.
 * @returns {JSX.Element} The rendered menu list.
 */
export const MenuList: React.FC<MenuListProps> = ({
  className,
  children,
  ...props
}) => {
  const level = useContext(MenuListLevelContext);
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);

  const ulClass = classNames(className, bulmaHelperClasses, {
    [usePrefixedClassNames('menu-list')]: level === 0,
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

/**
 * Props for the MenuItem component.
 */
export interface MenuItemProps
  extends
    Omit<React.LiHTMLAttributes<HTMLLIElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  /** Additional CSS classes. */
  className?: string;
  /** Item content and optional nested MenuList. */
  children: React.ReactNode;
  /** Highlight item as active. */
  active?: boolean;
  /** Href for link items (if rendered as `<a>`). */
  href?: string;
  /** Custom link component (e.g. `Link` from router). */
  as?: React.ElementType;
  [key: string]: unknown;
}

/**
 * MenuItem supports `as` prop for custom link components, e.g., react-router-dom Link.
 *
 * @function
 * @param {MenuItemProps} props - Props for the MenuItem component.
 * @returns {JSX.Element} The rendered menu item.
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
  const itemClass = classNames(
    { [usePrefixedClassNames('is-active')]: active },
    bulmaHelperClasses
  );

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

// Attach static subcomponents
export const Menu = withSubComponents(
  MenuComponent,
  {
    Label: MenuLabel,
    List: MenuList,
    Item: MenuItem,
  },
  'Menu'
);

export default Menu;
