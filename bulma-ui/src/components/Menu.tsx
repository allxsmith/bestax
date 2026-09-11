import React, { createContext, forwardRef, useContext } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import type { PolymorphicComponent } from '../helpers/polymorphic';

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
 * The MenuItem component's own props.
 *
 * A menu item is two elements: a wrapping `<li>` and, inside it, the element
 * `as` names. The props here are the ones the `<li>` consumes; everything else
 * follows `as` onto the inner element.
 */
export interface MenuItemOwnProps extends BulmaClassesProps {
  /** Additional CSS classes for the wrapping `<li>`. */
  className?: string;
  /** Item content and optional nested MenuList. */
  children: React.ReactNode;
  /** Highlight item as active. */
  active?: boolean;
  /** Inline styles for the wrapping `<li>`. */
  style?: React.CSSProperties;
  /** `id` for the wrapping `<li>`. */
  id?: string;
  /** `title` for the wrapping `<li>`. */
  title?: string;
  /** ARIA role for the wrapping `<li>`. */
  role?: React.AriaRole;
  /** Tab index for the wrapping `<li>`. */
  tabIndex?: number;
  /** Test id for the wrapping `<li>`. */
  'data-testid'?: string;
}

/**
 * Props for the MenuItem component. Everything the `<li>` does not consume
 * follows `as` onto the inner element: with the default `'a'` that means `href`
 * and the other anchor attributes, and with `as={Link}` it means that
 * component's own props.
 *
 * @extraProp {PolymorphicRef<React.ElementType>} [ref] - Ref forwarded to the inner element `as` renders, not the wrapping `<li>`, typed from `as`: the DOM node for an intrinsic tag, or whatever handle a custom component exposes.
 */
export type MenuItemProps<T extends React.ElementType = 'a'> =
  MenuItemOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof MenuItemOwnProps | 'as'> & {
      /** Custom link component (e.g. `Link` from router). */
      as?: T;
    };

/**
 * The shape the implementation destructures. The public contract is the generic
 * `MenuItemProps<T>` above — the body cannot see through `T`.
 */
type MenuItemImplProps = MenuItemOwnProps & { as?: React.ElementType };

/**
 * MenuItem supports `as` prop for custom link components, e.g., react-router-dom Link.
 *
 * @function
 * @param {MenuItemProps} props - Props for the MenuItem component.
 * @param {React.Ref} ref - Forwarded ref to the inner element `as` renders.
 * @returns {JSX.Element} The rendered menu item.
 */
export const MenuItem = forwardRef(function MenuItem(
  itemProps: MenuItemProps,
  ref: React.Ref<HTMLElement>
) {
  const {
    className,
    children,
    active,
    as: Component = 'a',
    'data-testid': testId,
    style,
    id,
    title,
    role,
    tabIndex,
    ...rest
  } = itemProps as MenuItemImplProps;
  const { bulmaHelperClasses, rest: forwarded } = useBulmaClasses(rest);
  // `href` reaches an anchor or a custom component (which owns its own prop
  // contract), but not another intrinsic tag — `<span href>` is invalid HTML.
  // The same rule Avatar applies through `isLinkLike` and Button through its
  // intrinsic-only strip. Before #641 `href` was an own prop re-applied only
  // for `as="a"`; deriving it from `as` must not quietly widen that.
  const isLinkLike = Component === 'a' || typeof Component !== 'string';
  const { href: _href, ...withoutHref } = forwarded as { href?: string };
  const linkProps = isLinkLike ? forwarded : withoutHref;
  const itemClass = classNames(
    { [usePrefixedClassNames('is-active')]: active },
    bulmaHelperClasses
  );

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

  return (
    <li
      className={className}
      data-testid={testId}
      style={style}
      id={id}
      title={title}
      role={role}
      tabIndex={tabIndex}
    >
      <Component ref={ref} className={itemClass} {...linkProps}>
        {labelChildren}
      </Component>
      {nestedMenuLists}
    </li>
  );
}) as PolymorphicComponent<MenuItemOwnProps, 'a'>;

MenuItem.displayName = 'MenuItem';

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
