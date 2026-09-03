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
 * Props for the DropdownItem component.
 */
export interface DropdownItemProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  /** Whether the item is active. */
  active?: boolean;
  /** Additional CSS classes. */
  className?: string;
  /** The element type to render. */
  as?: 'a' | 'div' | 'button';
  /** Marks the item as disabled; disabled items are skipped during keyboard navigation. Use with `as="button"` for a native disabled control, or pair with `aria-disabled` on a link. */
  disabled?: boolean;
  /** Item content. */
  children?: React.ReactNode;
}

/**
 * Bulma Dropdown item.
 *
 * @function
 * @param {DropdownItemProps} props - Props for the DropdownItem component.
 * @returns {JSX.Element} The rendered dropdown item.
 */
export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  active,
  className,
  as: Component = 'a',
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses(props);
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
      {...rest}
    >
      {children}
    </Component>
  );
};

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
