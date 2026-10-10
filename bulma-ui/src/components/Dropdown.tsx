import React, {
  forwardRef,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { getActiveElementInTree, isEventInside } from '../helpers/shadowDom';
import type { ConstrainedPolymorphicComponentWithoutRef } from '../helpers/polymorphic';
import {
  type AnchorOnlyAttributes,
  ANCHOR_ONLY_ATTRS,
  omitAttrs,
} from '../helpers/anchorAttrs';
import { buttonType } from '../helpers/buttonType';

/**
 * Checks if code is running in a browser environment.
 * @deprecated Dropdown's internal SSR guard, exported by accident; it will
 * be removed in the next major. Check `typeof window !== 'undefined' &&
 * typeof document !== 'undefined'` instead.
 * @param win - Window object.
 * @param doc - Document object.
 * @returns {boolean} True if in browser, false otherwise.
 */
export const isBrowser = (win?: typeof window, doc?: typeof document) =>
  typeof win !== 'undefined' && typeof doc !== 'undefined';

/**
 * Props for the Dropdown component.
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the root dropdown element.
 */
export interface DropdownProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  /** The dropdown button/trigger content. */
  label: React.ReactNode;
  /** Dropdown menu items and dividers. */
  children: React.ReactNode;
  /** Additional CSS classes for root. */
  className?: string;
  /** Additional CSS classes for the dropdown menu. */
  menuClassName?: string;
  /** Whether the dropdown is open (controlled). */
  active?: boolean;
  /** Dropdown menu opens upward. */
  up?: boolean;
  /** Menu is right-aligned. */
  right?: boolean;
  /** Open on hover instead of click. */
  hoverable?: boolean;
  /** Disables the dropdown trigger. */
  disabled?: boolean;
  /** Callback when dropdown active state changes. */
  onActiveChange?: (active: boolean) => void;
  /** Close dropdown when a menu item is clicked, or activated with Enter or Space. */
  closeOnClick?: boolean;
  /** Root element ID (for aria-controls, etc). */
  id?: string;
}

/**
 * The `Dropdown` component provides Bulma's versatile dropdown menu for your Bulma React UI.
 *
 * @function
 * @param {DropdownProps} props - Props for the Dropdown component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the root dropdown element.
 * @returns {JSX.Element} The rendered dropdown.
 * @see {@link https://bulma.io/documentation/components/dropdown/ | Bulma Dropdown documentation}
 */
const DropdownComponent = forwardRef<HTMLDivElement, DropdownProps>(
  function DropdownComponent(
    {
      label,
      children,
      className,
      menuClassName,
      active: activeProp,
      up,
      right,
      hoverable,
      disabled,
      onActiveChange,
      closeOnClick = true,
      id,
      ...props
    },
    ref
  ) {
    const [active, setActive] = useState<boolean>(!!activeProp);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const pendingFocusRef = useRef<'first' | 'last' | null>(null);

    // Cleanup returned by a consumer's callback ref on attach, held until detach.
    const consumerCleanupRef = useRef<(() => void) | null>(null);

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        (dropdownRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
        if (typeof ref === 'function') {
          // React 19 lets a callback ref return a cleanup function and detaches
          // by running it instead of calling the ref with `null`; React 18
          // discards the return value entirely. Returning it from here would be
          // a React-19-only contract, so instead we hold the cleanup and run it
          // ourselves on detach — a consumer's cleanup ref then behaves the same
          // on both majors of the CI matrix.
          if (node === null) {
            const consumerCleanup = consumerCleanupRef.current;
            consumerCleanupRef.current = null;
            if (consumerCleanup) {
              consumerCleanup();
            } else {
              ref(null);
            }
            return;
          }
          const cleanup: unknown = ref(node);
          consumerCleanupRef.current =
            typeof cleanup === 'function' ? (cleanup as () => void) : null;
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    const { bulmaHelperClasses, rest } = useBulmaClasses(props);

    // Generate Bulma classes with prefix
    const bulmaClasses = usePrefixedClassNames('dropdown', {
      'is-active': active,
      'is-up': up,
      'is-right': right,
      'is-hoverable': hoverable,
      'is-disabled': disabled,
    });

    const buttonClass = usePrefixedClassNames('button');

    // Controlled mode support: mirror the controlled `active` prop into local
    // state. This is an intentional external-prop sync (controlled/uncontrolled
    // hybrid); behavior is covered by tests and certified in-browser.
    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to controlled prop
      if (typeof activeProp === 'boolean') setActive(activeProp);
    }, [activeProp]);

    // SSR-safe outside click
    useEffect(() => {
      if (!active) return;

      if (!isBrowser(window, document)) return;

      const handleClick = (e: MouseEvent) => {
        if (!isEventInside(e, dropdownRef.current)) {
          setActive(false);
          onActiveChange?.(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [active, onActiveChange]);

    const handleToggle = () => {
      /* istanbul ignore next: guard is enforced by button[disabled] at the DOM level */
      if (disabled) return;

      const newActive = !active;
      setActive(newActive);
      onActiveChange?.(newActive);
    };

    const handleMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnClick) {
        setActive(false);
        onActiveChange?.(false);
        // Closing hides the item that has focus, and the browser drops focus
        // to the page when that happens. Hand it back to the trigger, as
        // Escape does. An item that moved focus somewhere else keeps it there.
        // The menu around this content is what a click between items focuses.
        const menu = e.currentTarget.parentElement as HTMLElement;
        if (menu.contains(getActiveElementInTree(e.currentTarget))) {
          triggerRef.current?.focus();
        }
      }
    };

    const getMenuItems = (): HTMLElement[] => {
      /* istanbul ignore next: dropdownRef.current is never null once mounted */
      if (!dropdownRef.current) return [];
      return Array.from(
        // Every menu-item role, so an item a caller gives `menuitemcheckbox`
        // or `menuitemradio` (a filter or sort menu) stays reachable.
        dropdownRef.current.querySelectorAll<HTMLElement>(
          '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
        )
      ).filter(
        el =>
          !el.hasAttribute('disabled') &&
          el.getAttribute('aria-disabled') !== 'true'
      );
    };

    // Focus the pending menu item once the menu becomes visible; the item is
    // unfocusable while `display: none` applies, so this must wait for the
    // `is-active` class to actually land in the DOM.
    useEffect(() => {
      if (!active || !pendingFocusRef.current) return;
      const items = getMenuItems();
      if (items.length) {
        const index =
          pendingFocusRef.current === 'first' ? 0 : items.length - 1;
        items[index].focus();
      }
      pendingFocusRef.current = null;
    }, [active]);

    const handleTriggerKeyDown = (
      e: React.KeyboardEvent<HTMLButtonElement>
    ) => {
      if (disabled) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          pendingFocusRef.current = 'first';
          if (!active) {
            setActive(true);
            onActiveChange?.(true);
          } else {
            const items = getMenuItems();
            if (items.length) items[0].focus();
            pendingFocusRef.current = null;
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          pendingFocusRef.current = 'last';
          if (!active) {
            setActive(true);
            onActiveChange?.(true);
          } else {
            const items = getMenuItems();
            if (items.length) items[items.length - 1].focus();
            pendingFocusRef.current = null;
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          // A held key sends a keydown per auto-repeat. Running an item hands
          // focus back here, so without this a held Enter would reopen the
          // menu and run whichever item it focused next.
          if (e.repeat) break;
          if (!active) {
            pendingFocusRef.current = 'first';
            setActive(true);
            onActiveChange?.(true);
          } else {
            setActive(false);
            onActiveChange?.(false);
          }
          break;
        case 'Escape':
          if (active) {
            e.preventDefault();
            setActive(false);
            onActiveChange?.(false);
          }
          break;
        default:
          break;
      }
    };

    const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Escape and Tab close the menu regardless of whether it has any focusable
      // items — an empty or all-disabled menu must still honor the close contract.
      if (e.key === 'Escape') {
        e.preventDefault();
        setActive(false);
        onActiveChange?.(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key === 'Tab') {
        setActive(false);
        onActiveChange?.(false);
        return;
      }

      const items = getMenuItems();
      if (!items.length) return;
      const currentIndex = items.indexOf(
        getActiveElementInTree(e.currentTarget) as HTMLElement
      );
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next =
            currentIndex >= 0 ? (currentIndex + 1) % items.length : 0;
          items[next].focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev =
            currentIndex >= 0
              ? (currentIndex - 1 + items.length) % items.length
              : items.length - 1;
          items[prev].focus();
          break;
        }
        case 'Home':
          e.preventDefault();
          items[0].focus();
          break;
        case 'End':
          e.preventDefault();
          items[items.length - 1].focus();
          break;
        case 'Enter':
        case ' ': {
          // Activate the focused item by clicking it, so its `onClick` runs and
          // closing follows `closeOnClick` as it does for the mouse. A caller's
          // own key handler that prevented the default has claimed the key, and
          // is left to it rather than followed by a second activation.
          if (currentIndex < 0 || e.defaultPrevented) break;
          const item = items[currentIndex];
          // Leave the browser's own activation alone, or the item runs twice: a
          // `<button>` answers both keys, and a link with an `href` answers
          // Enter. A link does not answer Space, so Space on a link is handled
          // here too, which also keeps the page from scrolling.
          if (item.tagName === 'BUTTON') break;
          if (
            e.key === 'Enter' &&
            item.tagName === 'A' &&
            item.hasAttribute('href')
          ) {
            break;
          }
          e.preventDefault();
          // A held key sends a keydown per auto-repeat. Clicking on each would
          // toggle a checkbox item over and over while `closeOnClick` is off,
          // so only the first press activates. The default is still prevented
          // on the repeats above, so a held Space does not scroll the page.
          if (!e.repeat) item.click();
          break;
        }
        default:
          break;
      }
    };

    const dropdownClasses = classNames(
      bulmaClasses,
      bulmaHelperClasses,
      className
    );

    return (
      <div
        className={dropdownClasses}
        ref={setRefs}
        id={id}
        data-testid="dropdown-root"
        {...rest}
      >
        <div className={usePrefixedClassNames('dropdown-trigger')}>
          <button
            ref={triggerRef}
            className={buttonClass}
            aria-haspopup="true"
            aria-controls={id ? `${id}-menu` : undefined}
            aria-expanded={active}
            onClick={handleToggle}
            onKeyDown={handleTriggerKeyDown}
            disabled={disabled}
            type="button"
          >
            <span>{label}</span>
            <span
              className={usePrefixedClassNames('icon', 'is-small')}
              aria-hidden="true"
            >
              <i className="fas fa-angle-down" />
            </span>
          </button>
        </div>
        <div
          className={classNames(
            usePrefixedClassNames('dropdown-menu'),
            menuClassName
          )}
          id={id ? `${id}-menu` : undefined}
          role="menu"
          data-testid="dropdown-menu"
          onKeyDown={handleMenuKeyDown}
          // The menu, not its content, takes focus from a click between items,
          // so the menu owns nothing focusable but its items.
          tabIndex={-1}
        >
          <div
            className={usePrefixedClassNames('dropdown-content')}
            onClick={handleMenuClick}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);

/**
 * The elements a dropdown item may render as. Bulma's dropdown markup names
 * these three and no others, so `as` is a closed set rather than an open
 * `React.ElementType`.
 */
export type DropdownItemElement = 'a' | 'div' | 'button';

/**
 * The DropdownItem component's own props.
 */
export interface DropdownItemOwnProps extends BulmaClassesProps {
  /** Whether the item is active. */
  active?: boolean;
  /** Additional CSS classes. */
  className?: string;
  /** Marks the item as disabled; disabled items are skipped during keyboard navigation. Use with `as="button"` for a native disabled control, or pair with `aria-disabled` on a link. */
  disabled?: boolean;
  /** Item content. */
  children?: React.ReactNode;
}

/**
 * Props for the DropdownItem component. Everything the item does not own
 * follows `as`: `href`, `target` and `rel` under the default `'a'`, `type` and
 * `form` under `'button'`, and the shared HTML attributes under any of them.
 *
 * Pinning these to `React.HTMLAttributes<HTMLElement>` instead — which is what
 * this type did before — rejected `href` on an anchor and `type` on a button,
 * both of which have always worked at runtime. Same defect as #641, in the
 * narrower shape a constrained `as` takes.
 *
 * **Name the tag you mean.** The type parameter defaults to the whole union, not
 * to the rendered element, so bare `DropdownItemProps` keeps accepting
 * `{ as: 'div' }` the way it always has. The cost is that it is not
 * distributive: `Omit` over a union keeps only the shared keys, so the bare
 * alias carries no `href` even though the component takes one under `as="a"`.
 * Write `DropdownItemProps<'a'>` for the anchor's props. That is the #667 alias
 * limitation Button carries, labelled next-major because closing it is
 * source-breaking, and pinned for this component in
 * `__typetests__/polymorphic.tsx`; the component itself is unaffected.
 */
export type DropdownItemProps<
  T extends DropdownItemElement = DropdownItemElement,
> = DropdownItemOwnProps &
  Omit<React.ComponentPropsWithoutRef<T>, keyof DropdownItemOwnProps | 'as'> & {
    /**
     * The element type to render.
     *
     * `'button'` renders `type="button"` unless you pass `type="submit"` or `type="reset"`, so
     * an item inside a form does not submit it.
     */
    as?: T;
  };

/**
 * The anchor's attributes, minus the one a `<button>` legitimately takes.
 *
 * `type` stays: `as="button"` is a supported form and `type="submit"` is valid
 * there, so stripping it would remove a working attribute. A `<div>` takes no
 * `type`, so it gets the whole `ANCHOR_ONLY_ATTRS` set instead. The set is
 * chosen by the rendered tag because that is where the reason lives (#692).
 *
 * Neither set withholds `rel`, which `Level.Item` does: React declares `rel` on
 * `HTMLAttributes` for every element, so withholding it would diverge from
 * React's own typing, the call #641 recorded for `Navbar.Link`. Level
 * withholds it anyway, because it always has.
 */
const STRIP_FROM_BUTTON: Readonly<
  Record<Exclude<keyof AnchorOnlyAttributes, 'type'>, true>
> = (() => {
  const { type: _type, ...rest } = ANCHOR_ONLY_ATTRS;
  return rest;
})();

/**
 * The shape the implementation destructures. The public contract is the generic
 * `DropdownItemProps<T>` above — the body cannot see through `T`.
 */
type DropdownItemImplProps = DropdownItemOwnProps & {
  as?: DropdownItemElement;
};

/**
 * Bulma Dropdown item.
 *
 * @function
 * @param {DropdownItemProps} props - Props for the DropdownItem component.
 * @returns {JSX.Element} The rendered dropdown item.
 */
export const DropdownItem = ((itemProps: DropdownItemProps) => {
  const {
    children,
    active,
    className,
    as: Component = 'a',
    ...props
  } = itemProps as DropdownItemImplProps;
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
  // The anchor's attributes reach an anchor and nothing else — `<div href>` and
  // `<button target>` are invalid HTML. The same rule Menu applies, for the same
  // reason: the type now derives these from `as`, and deriving them must not
  // quietly widen where they land. The type stops a direct caller; this stops a
  // plain-JS one, a loose `{...props}` spread, and the genericity a wrapping HOC
  // erases.
  //
  // The whole link set, not `href` alone: they all arrive together under
  // `as="a"`. Menu strips `href` only, because its `as` is open and a flat set
  // would delete attributes legal on the element a caller named.
  //
  // `bestax-migrate` tracks the same question from the other side, per attribute
  // per element (`LINK_ATTR_ELEMENTS`) rather than as one set — so the two lists
  // are not interchangeable and neither derives from the other.
  //
  // Menu's condition also admits a custom component and a custom element, which
  // own their prop contracts. Here the set follows the tag: an `<a>` keeps all
  // of them, a `<button>` keeps `type`, and any other `as` keeps none of them.
  const forwarded =
    Component === 'a'
      ? rest
      : Component === 'button'
        ? omitAttrs(rest, STRIP_FROM_BUTTON)
        : omitAttrs(rest, ANCHOR_ONLY_ATTRS);
  return (
    <Component
      className={classNames(
        usePrefixedClassNames('dropdown-item', {
          'is-active': active,
        }),
        bulmaHelperClasses,
        className
      )}
      data-testid="dropdown-item"
      {...forwarded}
      // After `forwarded` for the same reason as `role` and `type` below: a
      // spread carrying `tabIndex: undefined` would otherwise erase the
      // default. The item keeps its menu role and its place in the arrow-key
      // order, but a `<div>` or an anchor without an `href` cannot take focus
      // without a tabindex, so the arrow keys stall on it.
      tabIndex={(forwarded as { tabIndex?: number }).tabIndex ?? 0}
      // After `forwarded` for the same reason as `type` below: a spread
      // carrying `role: undefined` would otherwise erase the default, and an
      // item with no role drops out of the menu and its arrow-key order.
      role={(forwarded as { role?: React.AriaRole }).role ?? 'menuitem'}
      // A menu item inside a form must not submit it. `<button>` defaults to
      // type="submit", and a filter or sort menu sitting in a form is ordinary.
      // Dropdown's own trigger sets it, and `Avatar` and `Menu.Item` default it
      // the same way. A caller's `submit` or `reset` still wins, and anything
      // else becomes `button`, since HTML reads a value it does not define for
      // a button as submit too; `buttonType` says more.
      //
      // After `forwarded`, reading through it rather than before it: React
      // treats `type={undefined}` as "remove the attribute", and a spread
      // carrying an absent key is how that arrives. Spreading the default first
      // let such a spread erase it and restore the submit behaviour, so the
      // guard only held for callers who passed nothing.
      {...(Component === 'button'
        ? { type: buttonType((forwarded as { type?: unknown }).type) }
        : {})}
    >
      {children}
    </Component>
  );
}) as ConstrainedPolymorphicComponentWithoutRef<
  DropdownItemOwnProps,
  DropdownItemElement,
  'a'
>;

/**
 * Bulma Dropdown divider.
 *
 * @function
 * @returns {JSX.Element} The rendered divider element.
 */
export const DropdownDivider: React.FC = () => (
  <hr className={usePrefixedClassNames('dropdown-divider')} />
);

/** Bulma Dropdown component with Item and Divider sub-components. */
export const Dropdown = withSubComponents(
  DropdownComponent,
  {
    Item: DropdownItem,
    Divider: DropdownDivider,
  },
  'Dropdown'
);

export default Dropdown;
