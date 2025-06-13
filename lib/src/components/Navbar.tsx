import React from 'react';
import classNames from 'classnames';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

// Root Navbar
export interface NavbarProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  /** Bulma has-text-* color utility */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the navbar itself */
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
  /** Bulma has-background-* color utility */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  transparent?: boolean;
  fixed?: 'top' | 'bottom';
  children?: React.ReactNode;
}

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

  const navbarClasses = classNames('navbar', bulmaHelperClasses, className, {
    [`is-${color}`]: color,
    'is-transparent': transparent,
    [`is-fixed-${fixed}`]: fixed,
  });

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

// Navbar Brand
export interface NavbarBrandProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  /** Bulma has-text-* color utility */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the navbar itself */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
}

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

// Navbar Item
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

// Navbar Burger
export interface NavbarBurgerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the navbar itself */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  active?: boolean;
  children?: React.ReactNode;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

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

// Navbar Menu
export interface NavbarMenuProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the navbar itself */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  active?: boolean;
  children?: React.ReactNode;
}

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

// Navbar Start/End
export interface NavbarStartEndProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  className?: string;
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the navbar itself */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
}

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

// Navbar Dropdown
export interface NavbarDropdownProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  right?: boolean;
  up?: boolean;
  hoverable?: boolean;
  active?: boolean;
  children?: React.ReactNode;
}

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

// Navbar Dropdown Menu
export interface NavbarDropdownMenuProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  right?: boolean;
  up?: boolean;
  children?: React.ReactNode;
}

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

// Navbar Divider
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
