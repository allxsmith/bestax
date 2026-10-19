import React, {
  createContext,
  forwardRef,
  useContext,
  useId,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { omitAttrs } from '../helpers/anchorAttrs';
import { buttonType } from '../helpers/buttonType';
import {
  isCustomElement,
  type PolymorphicComponent,
} from '../helpers/polymorphic';

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
        {...(Component === 'button'
          ? { type: buttonType(linkProps.type) }
          : {})}
      >
        {labelChildren}
      </Component>
      {nestedMenuLists}
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
  /** The `Menu.List` of links the section shows while it's open. */
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
 * `hidden`, so Tab and assistive tech skip it.
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
  const listId = useId();

  // The caller owns the state when `open` is set, and the section does
  // otherwise, as with Collapse. The button reports in both modes.
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;

  const handleClick = () => {
    const next = !isOpen;
    onOpenChange?.(next);
    if (!isControlled) setInternalOpen(next);
  };

  // A real button, so Enter and Space work with no key handler, and
  // `type="button"`, so a menu inside a form isn't submitted by it.
  //
  // A closed list is `hidden` rather than inert, as Collapse's panel is.
  // Collapse keeps a closed panel rendered so it can animate it, and needs
  // `inert` to take what's in it out of reach. Nothing here animates, so
  // `hidden` does it all in one attribute: the list isn't drawn, Tab skips
  // its links, assistive tech and find-in-page don't reach them, and the
  // markup is the same from the server and on both React majors. It stays
  // mounted, so `aria-controls` always names an element that exists.
  return (
    <div
      className={classNames(sectionClass, bulmaHelperClasses, className)}
      {...rest}
    >
      <button
        type="button"
        className={toggleClass}
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={handleClick}
      >
        <span className={labelClass}>{label}</span>
        <span className={chevronClass} aria-hidden="true" />
      </button>
      <div id={listId} hidden={!isOpen}>
        {children}
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
