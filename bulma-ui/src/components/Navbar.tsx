import React, { useContext, useEffect, useState } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import {
  useBulmaClasses,
  BulmaClassesProps,
  validColors,
} from '../helpers/useBulmaClasses';

/**
 * Shared state a `Navbar.Dropdown` exposes to its `Navbar.Link` trigger so the
 * trigger needs no hand-wired ARIA or keyboard handling.
 */
interface NavbarDropdownContextValue {
  /** Whether the dropdown is currently open. */
  active: boolean;
  /** Flips the open state. */
  toggle: () => void;
  /** Closes the dropdown (no-op if already closed). */
  close: () => void;
}

const NavbarDropdownContext =
  React.createContext<NavbarDropdownContextValue | null>(null);

/**
 * Props for the Navbar component.
 */
export interface NavbarProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes for the navbar. */
  className?: string;
  /** Text color for the navbar. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the navbar. */
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
  /** Background color for the navbar. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Renders the navbar with a transparent background. */
  transparent?: boolean;
  /** Fixes the navbar to the top or bottom of the viewport. */
  fixed?: 'top' | 'bottom';
  /** Navbar content (compose with subcomponents). */
  children?: React.ReactNode;
}

/**
 * The `Navbar` component implements Bulma's powerful, responsive navigation bar for your Bulma React UI.
 *
 * @function
 * @param {NavbarProps} props - Props for the Navbar component.
 * @returns {JSX.Element} The rendered navbar.
 * @see {@link https://bulma.io/documentation/components/navbar/ | Bulma Navbar documentation}
 */
const NavbarComponent: React.FC<NavbarProps> = ({
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
 */
export interface NavbarBrandProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Text color for the brand. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the brand. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Brand content. */
  children?: React.ReactNode;
}

/**
 * For logo and branding (left side)
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
      className={classNames(
        usePrefixedClassNames('navbar-brand'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Props for the NavbarItem component.
 */
export interface NavbarItemProps
  extends
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Render as a custom component (e.g., a router link). */
  as?: React.ElementType;
  /** Whether the item is active. */
  active?: boolean;
  /** Text color for the item. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color for the item. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Navbar item content. */
  children?: React.ReactNode;
  // Allow router props like `to` when rendering via `as` (matches MenuItemProps)
  [key: string]: unknown;
}

/**
 * Navigation links, buttons, or custom content
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
      className={classNames(
        usePrefixedClassNames('navbar-item', {
          'is-active': active,
        }),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};

/**
 * Props for the NavbarBurger component.
 */
export interface NavbarBurgerProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Text color for the burger. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the burger. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Whether the burger is active. */
  active?: boolean;
  /** Custom content inside the burger. */
  children?: React.ReactNode;
  /** Aria label for accessibility. */
  'aria-label'?: string;
  /** Aria expanded state. */
  'aria-expanded'?: boolean;
  /** Click handler. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * Responsive menu toggle (mobile)
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
      className={classNames(
        usePrefixedClassNames('navbar-burger', {
          'is-active': active,
        }),
        bulmaHelperClasses,
        className
      )}
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
 */
export interface NavbarMenuProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Text color for the menu. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier for the menu. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Whether the menu is active. */
  active?: boolean;
  /** Menu content. */
  children?: React.ReactNode;
}

/**
 * Collapsible content (contains `Navbar.Start` and `Navbar.End`)
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
      className={classNames(
        usePrefixedClassNames('navbar-menu', {
          'is-active': active,
        }),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Props for the NavbarStartEnd component.
 */
export interface NavbarStartEndProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Bulma color modifier. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Content. */
  children?: React.ReactNode;
}

/**
 * Left-aligned menu area
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
      className={classNames(
        usePrefixedClassNames('navbar-start'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Right-aligned menu area
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
      className={classNames(
        usePrefixedClassNames('navbar-end'),
        bulmaHelperClasses,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

/**
 * Props for the NavbarLink component.
 */
export interface NavbarLinkProps
  extends
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Additional CSS classes. */
  className?: string;
  /** Render as a custom component (default: 'a'). */
  as?: React.ElementType;
  /** Remove the dropdown arrow indicator. */
  arrowless?: boolean;
  /** Text color. */
  textColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Background color. */
  bgColor?: (typeof validColors)[number] | 'inherit' | 'current';
  /** Link content. */
  children?: React.ReactNode;
}

/**
 * Dropdown trigger with arrow indicator (use as first child of `Navbar.Dropdown`)
 *
 * @function
 * @param {NavbarLinkProps} props - Props for the NavbarLink component.
 * @returns {JSX.Element} The rendered navbar link.
 */
export const NavbarLink: React.FC<NavbarLinkProps> = ({
  className,
  as: Component = 'a',
  arrowless,
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

  const dropdownContext = useContext(NavbarDropdownContext);
  const hasHref = (rest as { href?: string }).href !== undefined;
  const isNativeInteractive = Component === 'button' || hasHref;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    rest.onKeyDown?.(e);
    if (!dropdownContext || e.defaultPrevented) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dropdownContext.toggle();
    } else if (e.key === 'Escape' && dropdownContext.active) {
      e.preventDefault();
      dropdownContext.close();
    }
  };

  // When the link is not natively interactive (no `href`, not a `<button>`) it
  // renders as `role="button"`, so a mouse/touch click has no default action to
  // open the dropdown. Compose the caller's handler and toggle the dropdown
  // unless the caller prevented the default. Native links/buttons keep their own
  // click semantics (navigation / the caller's handler).
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    rest.onClick?.(e);
    if (!dropdownContext || isNativeInteractive || e.defaultPrevented) return;
    dropdownContext.toggle();
  };

  return (
    <Component
      className={classNames(
        usePrefixedClassNames('navbar-link', {
          'is-arrowless': arrowless,
        }),
        bulmaHelperClasses,
        className
      )}
      {...rest}
      {...(dropdownContext && {
        'aria-haspopup': 'true',
        'aria-expanded': dropdownContext.active,
        onKeyDown: handleKeyDown,
        ...(!isNativeInteractive && {
          role: 'button',
          tabIndex: 0,
          onClick: handleClick,
        }),
      })}
    >
      {children}
    </Component>
  );
};

/**
 * Props for the NavbarDropdown component.
 */
export interface NavbarDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Dropdown aligned right. */
  right?: boolean;
  /** Dropdown opens upwards. */
  up?: boolean;
  /** Dropdown opens on hover. */
  hoverable?: boolean;
  /** Dropdown is open. */
  active?: boolean;
  /** Callback when dropdown active state changes. */
  onActiveChange?: (active: boolean) => void;
  /** Dropdown content. */
  children?: React.ReactNode;
}

/**
 * Dropdown parent (with options for hover, up, right, active)
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
  active: activeProp,
  onActiveChange,
  children,
  ...props
}) => {
  const [active, setActive] = useState<boolean>(!!activeProp);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to controlled prop
    if (typeof activeProp === 'boolean') setActive(activeProp);
  }, [activeProp]);

  const toggle = () => {
    setActive(prev => {
      const next = !prev;
      onActiveChange?.(next);
      return next;
    });
  };

  const close = () => {
    setActive(prev => {
      /* istanbul ignore next: close() is only invoked once already active */
      if (!prev) return prev;
      onActiveChange?.(false);
      return false;
    });
  };

  return (
    <NavbarDropdownContext.Provider value={{ active, toggle, close }}>
      <div
        className={classNames(
          usePrefixedClassNames('navbar-item', 'has-dropdown', {
            'has-dropdown-up': up,
            'is-right': right,
            'is-hoverable': hoverable,
            'is-active': active,
          }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    </NavbarDropdownContext.Provider>
  );
};

/**
 * Props for the NavbarDropdownMenu component.
 */
export interface NavbarDropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Dropdown aligned right. */
  right?: boolean;
  /** Dropdown opens upwards. */
  up?: boolean;
  /** Dropdown menu content. */
  children?: React.ReactNode;
}

/**
 * Dropdown menu container
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
      usePrefixedClassNames('navbar-dropdown', {
        'is-right': right,
        'is-up': up,
      }),
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/**
 * Divider in dropdown menus.
 *
 * @function
 * @param {React.HTMLAttributes<HTMLHRElement>} props - Standard hr props.
 * @returns {JSX.Element} The rendered divider.
 */
export const NavbarDivider: React.FC<
  React.HTMLAttributes<HTMLHRElement>
> = props => (
  <hr className={usePrefixedClassNames('navbar-divider')} {...props} />
);

// Attach subcomponents
export const Navbar = withSubComponents(
  NavbarComponent,
  {
    Brand: NavbarBrand,
    Item: NavbarItem,
    Link: NavbarLink,
    Burger: NavbarBurger,
    Menu: NavbarMenu,
    Start: NavbarStart,
    End: NavbarEnd,
    Dropdown: NavbarDropdown,
    DropdownMenu: NavbarDropdownMenu,
    Divider: NavbarDivider,
  },
  'Navbar'
);

export default Navbar;
