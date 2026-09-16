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
import type { ConstrainedPolymorphicComponentWithoutRef } from '../helpers/polymorphic';
import { ANCHOR_ONLY_ATTRS, omitAttrs } from '../helpers/anchorAttrs';

/**
 * Checks if code is running in a browser environment.
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
  /** Close dropdown when a menu item is clicked. */
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
        /* istanbul ignore next: dropdownRef.current is never null while the listener is attached */
        if (!dropdownRef.current?.contains(e.target as Node)) {
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

    const handleMenuClick = () => {
      if (closeOnClick) {
        setActive(false);
        onActiveChange?.(false);
      }
    };

    const getMenuItems = (): HTMLElement[] => {
      /* istanbul ignore next: dropdownRef.current is never null once mounted */
      if (!dropdownRef.current) return [];
      return Array.from(
        dropdownRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')
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
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
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
        >
          <div
            className={usePrefixedClassNames('dropdown-content')}
            onClick={handleMenuClick}
            tabIndex={-1}
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
    /** The element type to render. */
    as?: T;
  };

/**
 * The anchor's attributes, minus the one a `<button>` legitimately takes.
 *
 * `type` stays: `as="button"` is a supported form and `type="submit"` is valid
 * there, so stripping it would remove a working attribute. That single
 * exclusion is the whole difference between this component and `Level.Item`,
 * which renders no `<button>` and strips the full set.
 *
 * `rel` is absent from the derived set and not added back here: React declares
 * it on `HTMLAttributes` for every element, so withholding it would diverge
 * from React's own typing — the call #641 recorded for `Navbar.Link`.
 */
const STRIP_FROM_NON_ANCHOR: Record<string, true> = (() => {
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
  // The whole link set, not `href` alone. Menu strips only `href` because its
  // props never gained the rest; here they all arrive together under `as="a"`,
  // and `bestax-migrate` already removes exactly this set (`LINK_ATTRS`) when it
  // migrates onto a non-anchor — so stripping less would leave the codemod
  // stricter than the component it migrates to.
  //
  // Menu's condition also admits a custom component and a custom element, which
  // own their prop contracts. `as` is closed to three intrinsic tags here, so
  // neither can arrive and the anchor test is the whole rule.
  const forwarded =
    Component === 'a' ? rest : omitAttrs(rest, STRIP_FROM_NON_ANCHOR);
  return (
    <Component
      className={classNames(
        usePrefixedClassNames('dropdown-item', {
          'is-active': active,
        }),
        bulmaHelperClasses,
        className
      )}
      tabIndex={0}
      role="menuitem"
      data-testid="dropdown-item"
      {...forwarded}
      // A menu item inside a form must not submit it. `<button>` defaults to
      // type="submit", and a filter or sort menu sitting in a form is ordinary.
      // Avatar defaults it the same way, and Dropdown's own trigger sets it.
      //
      // After `forwarded`, reading through it rather than before it: React
      // treats `type={undefined}` as "remove the attribute", and a spread
      // carrying an absent key is how that arrives. Spreading the default first
      // let such a spread erase it and restore the submit behaviour, so the
      // guard only held for callers who passed nothing.
      {...(Component === 'button'
        ? {
            type:
              (
                forwarded as {
                  type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
                }
              ).type ?? 'button',
          }
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
