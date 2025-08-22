import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Props for the Navbar component.
 *
 * @property {string} [className] - Additional CSS classes for the navbar.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Color for text.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color modifier for the navbar.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color for the navbar.
 * @property {boolean} [transparent] - Whether the navbar is transparent.
 * @property {'top'|'bottom'} [fixed] - Whether the navbar is fixed to the top or bottom.
 * @property {React.ReactNode} [children] - Navbar content.
 */
export interface NavbarProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
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
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  transparent?: boolean;
  fixed?: 'top' | 'bottom';
  children?: React.ReactNode;
}

/**
 * Bulma Navbar component, supports subcomponents for structured navigation.
 *
 * @function
 * @param {NavbarProps} props - Props for the Navbar component.
 * @returns {JSX.Element} The rendered navbar.
 * @see {@link https://bulma.io/documentation/components/navbar/ | Bulma Navbar documentation}
 */
export const Navbar: React.FC<NavbarProps> & {
  Brand: typeof NavbarBrand;
  Item: typeof NavbarItem;
  Burger: typeof NavbarBurger;
  Menu: typeof NavbarMenu;
  Start: typeof NavbarStart;
  End: typeof NavbarEnd;
  Dropdown: typeof NavbarDropdown;
  DropdownMenu: typeof NavbarDropdownMenu;
  Divider: typeof NavbarDivider;
} = ({
  className,
  textColor,
  bgColor,
  color,
  transparent,
  fixed,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('navbar', {
    [`is-${color}`]: color,
    'is-transparent': transparent,
    [`is-fixed-${fixed}`]: fixed,
  });

  const navbarClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <nav
      className={navbarClasses}
      role="navigation"
      aria-label="main navigation"
      {...rest}
    >
      {children}
    </nav>
  );
};

/**
 * Props for the NavbarBrand component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the brand.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier for the brand.
 * @property {React.ReactNode} [children] - Brand content.
 */
export interface NavbarBrandProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
}

/**
 * Bulma Navbar brand area (usually left side).
 *
 * @function
 * @param {NavbarBrandProps} props - Props for the NavbarBrand component.
 * @returns {JSX.Element} The rendered brand area.
 */
export const NavbarBrand: React.FC<NavbarBrandProps> = ({
  className,
  children,
  textColor,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    ...props,
  });

  return (
    <div
      className={classNames('navbar-brand', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Props for the NavbarItem component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ElementType} [as] - Render as a custom component.
 * @property {boolean} [active] - Whether the item is active.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the item.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [bgColor] - Background color for the item.
 * @property {React.ReactNode} [children] - Navbar item content.
 */
export interface NavbarItemProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  as?: React.ElementType;
  active?: boolean;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  children?: React.ReactNode;
}

/**
 * Bulma Navbar item (link, button, etc).
 *
 * @function
 * @param {NavbarItemProps} props - Props for the NavbarItem component.
 * @returns {JSX.Element} The rendered item.
 */
export const NavbarItem: React.FC<NavbarItemProps> = ({
  className,
  as: Component = 'a',
  active,
  textColor,
  bgColor,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color: textColor,
    backgroundColor: bgColor,
    ...props,
  });

  return (
    <Component
      className={classNames('navbar-item', bulmaHelperClasses, className, {
        'is-active': active,
      })}
      {...rest}
    >
      {children}
    </Component>
  );
};

/**
 * Props for the NavbarBurger component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the burger.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier for the burger.
 * @property {boolean} [active] - Whether the burger is active.
 * @property {React.ReactNode} [children] - Custom content inside the burger.
 * @property {string} ['aria-label'] - Aria label for accessibility.
 * @property {boolean} ['aria-expanded'] - Aria expanded state.
 * @property {React.MouseEventHandler<HTMLButtonElement>} [onClick] - Click handler.
 */
export interface NavbarBurgerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  active?: boolean;
  children?: React.ReactNode;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * Bulma Navbar burger (responsive menu toggle).
 *
 * @function
 * @param {NavbarBurgerProps} props - Props for the NavbarBurger component.
 * @returns {JSX.Element} The rendered burger.
 */
export const NavbarBurger: React.FC<NavbarBurgerProps> = ({
  className,
  active,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  return (
    <button
      type="button"
      className={classNames('navbar-burger', bulmaHelperClasses, className, {
        'is-active': active,
      })}
      aria-label={props['aria-label'] || 'menu'}
      aria-expanded={props['aria-expanded'] ?? !!active}
      {...rest}
    >
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      {children}
    </button>
  );
};

/**
 * Props for the NavbarMenu component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color for the menu.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier for the menu.
 * @property {boolean} [active] - Whether the menu is active.
 * @property {React.ReactNode} [children] - Menu content.
 */
export interface NavbarMenuProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  active?: boolean;
  children?: React.ReactNode;
}

/**
 * Bulma Navbar menu area (collapsible content).
 *
 * @function
 * @param {NavbarMenuProps} props - Props for the NavbarMenu component.
 * @returns {JSX.Element} The rendered menu.
 */
export const NavbarMenu: React.FC<NavbarMenuProps> = ({
  className,
  active,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });

  return (
    <div
      className={classNames('navbar-menu', bulmaHelperClasses, className, {
        'is-active': active,
      })}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Props for the NavbarStartEnd component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {(typeof validColors)[number] | 'inherit' | 'current'} [textColor] - Text color.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier.
 * @property {React.ReactNode} [children] - Content.
 */
export interface NavbarStartEndProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
}

/**
 * Bulma Navbar start area (left-aligned).
 *
 * @function
 * @param {NavbarStartEndProps} props - Props for the NavbarStart component.
 * @returns {JSX.Element} The rendered start area.
 */
export const NavbarStart: React.FC<NavbarStartEndProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });
  return (
    <div
      className={classNames('navbar-start', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Bulma Navbar end area (right-aligned).
 *
 * @function
 * @param {NavbarStartEndProps} props - Props for the NavbarEnd component.
 * @returns {JSX.Element} The rendered end area.
 */
export const NavbarEnd: React.FC<NavbarStartEndProps> = ({
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...props,
  });
  return (
    <div
      className={classNames('navbar-end', bulmaHelperClasses, className)}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Props for the NavbarDropdown component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {boolean} [right] - Dropdown aligned right.
 * @property {boolean} [up] - Dropdown opens upwards.
 * @property {boolean} [hoverable] - Dropdown opens on hover.
 * @property {boolean} [active] - Dropdown is open.
 * @property {React.ReactNode} [children] - Dropdown content.
 */
export interface NavbarDropdownProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  right?: boolean;
  up?: boolean;
  hoverable?: boolean;
  active?: boolean;
  children?: React.ReactNode;
}

/**
 * Bulma Navbar dropdown (for nested dropdown menus).
 *
 * @function
 * @param {NavbarDropdownProps} props - Props for the NavbarDropdown component.
 * @returns {JSX.Element} The rendered dropdown.
 */
export const NavbarDropdown: React.FC<NavbarDropdownProps> = ({
  className,
  right,
  up,
  hoverable,
  active,
  children,
  ...props
}) => (
  <div
    className={classNames(
      'navbar-item',
      'has-dropdown',
      {
        'is-right': right,
        'is-up': up,
        'is-hoverable': hoverable,
        'is-active': active,
      },
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/**
 * Props for the NavbarDropdownMenu component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {boolean} [right] - Dropdown aligned right.
 * @property {boolean} [up] - Dropdown opens upwards.
 * @property {React.ReactNode} [children] - Dropdown menu content.
 */
export interface NavbarDropdownMenuProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  right?: boolean;
  up?: boolean;
  children?: React.ReactNode;
}

/**
 * Bulma Navbar dropdown menu container.
 *
 * @function
 * @param {NavbarDropdownMenuProps} props - Props for the NavbarDropdownMenu component.
 * @returns {JSX.Element} The rendered dropdown menu.
 */
export const NavbarDropdownMenu: React.FC<NavbarDropdownMenuProps> = ({
  className,
  right,
  up,
  children,
  ...props
}) => (
  <div
    className={classNames(
      'navbar-dropdown',
      {
        'is-right': right,
        'is-up': up,
      },
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/**
 * Bulma Navbar divider.
 *
 * @param props - Standard hr props.
 * @returns {JSX.Element} The rendered divider.
 */
export const NavbarDivider: React.FC<
  React.HTMLAttributes<HTMLHRElement>
> = props => <hr className="navbar-divider" {...props} />;

// Attach subcomponents
Navbar.Brand = NavbarBrand;
Navbar.Item = NavbarItem;
Navbar.Burger = NavbarBurger;
Navbar.Menu = NavbarMenu;
Navbar.Start = NavbarStart;
Navbar.End = NavbarEnd;
Navbar.Dropdown = NavbarDropdown;
Navbar.DropdownMenu = NavbarDropdownMenu;
Navbar.Divider = NavbarDivider;

export default Navbar;
