import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { omitAttrs } from '../helpers/anchorAttrs';
import { buttonType } from '../helpers/buttonType';
import { inertProps } from '../helpers/inertProps';
import { moveFocusOut } from '../helpers/moveFocusOut';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { warnOnce } from '../helpers/devWarnings';
import { MenuRailContext, type MenuRail } from '../helpers/menuRail';
import { Icon } from '../elements/Icon';
import {
  isCustomElement,
  type PolymorphicComponent,
} from '../helpers/polymorphic';

// Context to track MenuList nesting level
const MenuListLevelContext = createContext(0);

/** Whether an `icon` was given something to render, as TreeView.Item reads it. */
const isGiven = (node: React.ReactNode) =>
  node !== undefined &&
  node !== null &&
  typeof node !== 'boolean' &&
  node !== '';

/** An `icon` to render: a string is an `Icon` name, and a node is itself. */
const iconNode = (icon: React.ReactNode) =>
  typeof icon === 'string' ? <Icon name={icon} /> : icon;

// The rail the menu's own top-level items and sections are in, and whether
// the Menu root has checked where it sits. A Menu takes the nav's rail only
// when its element is inside the nav, so a Menu portaled out of it, into a
// Popover or a Modal opened from the nav, has none. An item's nested lists
// and a section's list get none either: the rail hides them.
interface OwnRail {
  rail: MenuRail | null;
  settled: boolean;
}
const NO_RAIL: OwnRail = { rail: null, settled: true };
const MenuOwnRailContext = createContext<OwnRail>(NO_RAIL);

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
  const navRail = useContext(MenuRailContext);
  const rootRef = useRef<HTMLElement>(null);

  // Whether the menu sits inside the rail's nav, which only the page knows.
  // Taken as inside until a layout effect checks, before paint: a portaled
  // Menu, the one kind outside, doesn't render on the server.
  const [inNav, setInNav] = useState<boolean | null>(null);
  useClientLayoutEffect(() => {
    if (!navRail) return;
    let el: HTMLElement | null = rootRef.current;
    while (el && el.id !== navRail.navId) el = el.parentElement;
    setInNav(!!el);
  }, [navRail]);
  const own = useMemo<OwnRail>(
    () =>
      navRail
        ? { rail: inNav === false ? null : navRail, settled: inNav !== null }
        : NO_RAIL,
    [navRail, inNav]
  );

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('menu');

  return (
    <MenuOwnRailContext.Provider value={own}>
      <aside
        ref={rootRef}
        className={classNames(bulmaClasses, bulmaHelperClasses, className)}
        {...rest}
      >
        {children}
      </aside>
    </MenuOwnRailContext.Provider>
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
 * @extraProp {React.AriaRole} [role] - Ignored: every level renders `role="list"` in its place, so a menu or tree role can't go here.
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
 * Every level renders `role="list"`, which Safari needs: WebKit stops
 * exposing a `<ul>` as a list once its markers are hidden, and Bulma's reset
 * hides them.
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

  // Increment level for nested MenuLists. role="list" restates the <ul>'s
  // own role, for Safari: WebKit stops exposing a list as one once its
  // markers are hidden, as Bulma's reset hides them, unless the role is set
  // explicitly. After the spread, so a caller's role can't take it away.
  return (
    <MenuListLevelContext.Provider value={level + 1}>
      <ul className={ulClass || undefined} {...rest} role="list">
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
  /**
   * An icon before the label: an `Icon` name, or a node. It's hidden from
   * assistive technology, since the label names the item. With it, the rest of the
   * label is wrapped in a `menu-item-label` span; without it, the item
   * renders as it always has. In an `AppFrame.Nav rail` column collapsed to
   * its icons, the label is visually hidden, stays the link's name, and
   * shows in a Tooltip on hover and keyboard focus. It's Menu.Item's own
   * prop, so a component passed as `as` never receives an `icon` of its own:
   * pass that one under another name.
   */
  icon?: React.ReactNode;
  /**
   * Marks the item as the current one. It adds Bulma's `is-active` class, and
   * `aria-current="page"` on the element `as` renders, so assistive tech can
   * tell which item is current too. An `aria-current` you pass wins, even
   * `undefined`: use it to say something else (`"location"` for a section of
   * one page, say), or `aria-current={false}` to turn it off. A menu should
   * mark one page, so when the section above the current page is `active` too,
   * give it `aria-current="location"`, and give an `active` item that isn't
   * navigation, such as an `as="button"` filter, `aria-current={false}`.
   */
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
      /**
       * Custom link component (e.g. `Link` from router).
       *
       * `'button'` renders `type="button"` unless you pass `type="submit"` or `type="reset"`, so
       * an item inside a form does not submit it.
       */
      as?: T;
    };

/**
 * `href` alone — annotated so a typo is a compile error rather than a silent
 * no-op, the way both siblings' sets are.
 */
const STRIP_FROM_NON_LINK: Readonly<Record<'href', true>> = { href: true };

/**
 * The shape the implementation destructures. The public contract is the generic
 * `MenuItemProps<T>` above — the body cannot see through `T`.
 */
type MenuItemImplProps = MenuItemOwnProps & {
  as?: React.ElementType;
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
};

/**
 * MenuItem supports `as` prop for custom link components, e.g., react-router-dom Link.
 *
 * Give each item an `href`, a router link through `as`, or `as="button"`, so
 * the keyboard can reach it: an `<a>` with no `href` isn't a link, and Tab
 * skips it.
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
    icon,
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
  const isLinkLike =
    Component === 'a' ||
    typeof Component !== 'string' ||
    isCustomElement(Component);
  // `href` ALONE. `Dropdown.Item` strips every anchor-only attribute except
  // `type`; `Level.Item` strips all of them, plus `rel`.
  //
  // Not because nothing else can arrive: `as` here is an open `React.ElementType`,
  // and a non-fresh spread skips excess-property checking, so a typed caller
  // CAN deliver `target` or `download` and they are forwarded. The set stays at
  // `href` because widening it would be wrong for an open `as` — `referrerPolicy`
  // on `as="img"`, `target` on `as="form"` and `media` on `as="source"` are all
  // legal, and a flat strip would delete them. Getting that right needs a
  // per-attribute-per-element rule, which `bestax-migrate` already models in
  // `LINK_ATTR_ELEMENTS`.
  const linkProps = isLinkLike
    ? forwarded
    : omitAttrs(forwarded, STRIP_FROM_NON_LINK);
  const itemClass = classNames(
    { [usePrefixedClassNames('is-active')]: active },
    bulmaHelperClasses
  );
  const iconClass = usePrefixedClassNames('menu-item-icon');
  const labelClass = usePrefixedClassNames('menu-item-label');
  const hasIcon = isGiven(icon);
  const { rail, settled } = useContext(MenuOwnRailContext);
  // Once the Menu knows it's in the rail, so a portaled one never warns.
  useEffect(() => {
    if (settled && rail && !hasIcon) {
      warnOnce(
        'Menu:rail-item-icon',
        '[bestax-bulma] A <Menu.Item> in an <AppFrame.Nav rail> has no ' +
          'icon, so the collapsed rail has nothing to show for it and its ' +
          'label spills over the page. Give every top-level Menu.Item and ' +
          'Menu.Section in a rail an icon.'
      );
    }
  }, [settled, rail, hasIcon]);

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

  // The rail hides an item's nested lists. Focus on a link in one as the
  // column collapses would drop to the page, so it moves to the item's own
  // link, which stays, or to the nav when that can't take focus. A layout
  // effect, while that link still has focus.
  const liRef = useRef<HTMLLIElement>(null);
  const wrapped = !!rail && hasIcon;
  const hidesNested = !!rail?.collapsed && nestedMenuLists.length > 0;
  useClientLayoutEffect(() => {
    if (!hidesNested) return;
    const [own, ...nested] = Array.from(liRef.current!.children);
    // The item's own link, inside the rail's tooltip when it has one.
    const target = wrapped ? own.firstElementChild : own;
    moveFocusOut(nested, target as HTMLElement, rail!.nav());
  }, [hidesNested, wrapped, rail]);

  const link = (
    <Component
      ref={ref}
      className={itemClass || undefined}
      // The active item is the current page, the way Pagination marks its
      // page. Before the spread, so an `aria-current` the caller passes
      // decides, `false` and `undefined` included. bestax-migrate converts
      // `is-active` to `active` only beside an `aria-current` of the
      // element's own, and relies on that to render the same markup.
      aria-current={active ? 'page' : undefined}
      {...linkProps}
      // A menu item inside a form must not submit it, and `<button>` defaults
      // to type="submit". A sidebar menu sitting in a form is ordinary. A
      // caller's `submit` or `reset` still wins. Anything else becomes
      // `button`, since HTML reads a value it does not define for a button as
      // submit too; `buttonType` says more.
      //
      // After `linkProps`, reading through it rather than before it: React
      // treats `type={undefined}` as "remove the attribute", and a spread
      // carrying the key with no value is how that arrives, so a default
      // spread first would be erased by it. `Dropdown.Item` and `Avatar`
      // apply their button type after the spread too.
      {...(Component === 'button' ? { type: buttonType(linkProps.type) } : {})}
    >
      {hasIcon ? (
        <>
          <span className={iconClass} aria-hidden="true">
            {iconNode(icon)}
          </span>
          <span className={labelClass}>{labelChildren}</span>
        </>
      ) : (
        labelChildren
      )}
    </Component>
  );

  // In a column that collapses to an icon rail, an item with an icon shows
  // its label in a tooltip while only the icon shows.
  return (
    <li
      ref={liRef}
      className={className}
      data-testid={testId}
      style={style}
      id={id}
      title={title}
      role={role}
      tabIndex={tabIndex}
    >
      {wrapped ? rail.wrap(link, labelChildren) : link}
      <MenuOwnRailContext.Provider value={NO_RAIL}>
        {nestedMenuLists}
      </MenuOwnRailContext.Provider>
    </li>
  );
}) as PolymorphicComponent<MenuItemOwnProps, 'a'>;

MenuItem.displayName = 'MenuItem';

/**
 * Props for the MenuSection component. The helper props and the other
 * attributes land on the wrapping `<div>`.
 */
export interface MenuSectionProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  /** Additional CSS classes for the wrapping `<div>`. */
  className?: string;
  /** **Required.** The section's heading, drawn like `Menu.Label` inside the button that opens and closes it. Keep links and buttons out of it, since it's inside one. */
  label: React.ReactNode;
  /**
   * An icon before the heading: an `Icon` name, or a node. It's hidden from
   * assistive technology, since the heading names the button. In an `AppFrame.Nav
   * rail` column collapsed to its icons, the heading is visually hidden,
   * stays the button's name, and shows in a Tooltip on hover and keyboard
   * focus.
   */
  icon?: React.ReactNode;
  /**
   * The `Menu.List` of links the section shows while it's open. The section
   * itself goes directly in `Menu`, beside its labels and lists: inside a
   * `Menu.Item` it would render inside the item's link, and inside a
   * `Menu.List` it wouldn't be a list item.
   */
  children: React.ReactNode;
  /** Controlled open state. If provided, the section is controlled, and its button only reports through `onOpenChange`. */
  open?: boolean;
  /** Initial open state for uncontrolled usage. Open the section that holds the current page, so the reader sees where they are. */
  defaultOpen?: boolean;
  /** Called with the state the button asks for (`true` to open) each time it is clicked or activated with Enter or Space, in every mode. Pair it with `open` to let the button drive a controlled section. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * A section of the menu that opens and closes: its heading is a button drawn like `Menu.Label`, and its `Menu.List` of links shows while it's open.
 *
 * It's APG's disclosure navigation, for a sidebar of link groups: the links
 * stay ordinary links, each its own tab stop, and a closed section's list is
 * `hidden` and `inert`, so Tab and assistive tech skip it. It goes directly in
 * `Menu`, holding a `Menu.List`. Closing it while focus is on one of its links
 * moves focus to its heading.
 *
 * @function
 * @param {MenuSectionProps} props - Props for the MenuSection component.
 * @returns {JSX.Element} The rendered menu section.
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/ | APG Disclosure Navigation Menu example}
 *
 * @example
 * <Menu>
 *   <Menu.Section label="Components" defaultOpen>
 *     <Menu.List>
 *       <Menu.Item href="/button" active>Button</Menu.Item>
 *       <Menu.Item href="/card">Card</Menu.Item>
 *     </Menu.List>
 *   </Menu.Section>
 * </Menu>
 */
export const MenuSection: React.FC<MenuSectionProps> = ({
  className,
  label,
  icon,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  const sectionClass = usePrefixedClassNames('menu-section');
  const toggleClass = usePrefixedClassNames('menu-section-toggle');
  const labelClass = usePrefixedClassNames('menu-section-label');
  const chevronClass = usePrefixedClassNames('menu-section-chevron');
  const iconClass = usePrefixedClassNames('menu-section-icon');
  const listClass = usePrefixedClassNames('menu-section-list');
  const hasIcon = isGiven(icon);
  const listId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { rail, settled } = useContext(MenuOwnRailContext);
  useEffect(() => {
    if (settled && rail && !hasIcon) {
      warnOnce(
        'Menu:rail-section-icon',
        '[bestax-bulma] A <Menu.Section> in an <AppFrame.Nav rail> has no ' +
          'icon, so in the collapsed rail its button shows nothing. Give ' +
          'every top-level Menu.Item and Menu.Section in a rail an icon.'
      );
    }
  }, [settled, rail, hasIcon]);
  // The rail hides a section's list, so there the button widens the column
  // and opens the section, and says it's collapsed. While the column is set
  // to collapse and the frame doesn't know yet whether that makes it a rail,
  // as before the page hydrates, the button says neither, as AppFrame.Burger
  // does. Expanded, its state is known, so it says it.
  const railCollapsed = !!rail?.collapsed;

  // The caller owns the state when `open` is set, and the section does
  // otherwise, as with Collapse. The button reports in both modes.
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;
  const expanded = rail?.pending ? undefined : isOpen && !railCollapsed;

  const handleClick = () => {
    const next = railCollapsed || !isOpen;
    if (railCollapsed) rail!.expand();
    onOpenChange?.(next);
    if (!isControlled) setInternalOpen(next);
  };

  // An app holding `open` can close a section while focus is on one of its
  // links, as a sidebar that keeps only the current route's section open
  // does after a link is followed. The browser then drops focus to <body>
  // a frame later, and the next Tab starts from the top of the page. The
  // heading is where the reader was, so focus goes there. A layout effect,
  // because it runs in the same task as the commit that hid the list, while
  // the link still has focus. A close from the button itself finds focus on
  // the button and leaves it. The rail hides an open section's list too, so
  // collapsing the column to it moves focus the same way.
  useClientLayoutEffect(() => {
    if (isOpen && !railCollapsed) return;
    moveFocusOut([listRef.current!], toggleRef.current, rail?.nav() ?? null);
  }, [isOpen, railCollapsed, rail]);

  // A real button, so Enter and Space work with no key handler, and
  // `type="button"`, so a menu inside a form isn't submitted by it.
  const toggle = (
    <button
      ref={toggleRef}
      type="button"
      className={toggleClass}
      aria-expanded={expanded}
      aria-controls={listId}
      onClick={handleClick}
    >
      {hasIcon && (
        <span className={iconClass} aria-hidden="true">
          {iconNode(icon)}
        </span>
      )}
      <span className={labelClass}>{label}</span>
      <span className={chevronClass} aria-hidden="true" />
    </button>
  );

  // A closed list is `hidden`, so it isn't drawn and find-in-page doesn't
  // reach it, and `inert`, so its links stay out of Tab and assistive tech
  // even if a stylesheet sets `display` on it and shows it anyway. The markup
  // is the same from the server and on both React majors, which `inertProps`
  // sees to. It stays mounted, so `aria-controls` always names an element
  // that exists. In a column that collapses to an icon rail, a section with
  // an icon shows its heading in a tooltip while only the icon shows.
  return (
    <div
      className={classNames(sectionClass, bulmaHelperClasses, className)}
      {...rest}
    >
      {rail && hasIcon ? rail.wrap(toggle, label) : toggle}
      <div
        ref={listRef}
        id={listId}
        className={listClass}
        hidden={!isOpen}
        {...inertProps(!isOpen)}
      >
        <MenuOwnRailContext.Provider value={NO_RAIL}>
          {children}
        </MenuOwnRailContext.Provider>
      </div>
    </div>
  );
};

// Attach static subcomponents
export const Menu = withSubComponents(
  MenuComponent,
  {
    Label: MenuLabel,
    List: MenuList,
    Item: MenuItem,
    Section: MenuSection,
  },
  'Menu'
);

export default Menu;
