import React, { useState, useRef, useEffect } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

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
 *
 * @property {React.ReactNode} label - The dropdown button content.
 * @property {React.ReactNode} children - The menu items.
 * @property {string} [className] - Additional CSS classes to apply.
 * @property {string} [menuClassName] - Additional CSS classes for the dropdown menu.
 * @property {boolean} [active] - Whether the dropdown is open (controlled).
 * @property {boolean} [up] - Dropdown direction up.
 * @property {boolean} [right] - Dropdown aligned to the right.
 * @property {boolean} [hoverable] - Dropdown opens on hover.
 * @property {boolean} [disabled] - Disables the dropdown trigger.
 * @property {(active: boolean) => void} [onActiveChange] - Called when active state changes.
 * @property {boolean} [closeOnClick=true] - Close dropdown when clicking a menu item.
 * @property {string} [id] - ID for the root element.
 */
export interface DropdownProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  menuClassName?: string;
  active?: boolean;
  up?: boolean;
  right?: boolean;
  hoverable?: boolean;
  disabled?: boolean;
  onActiveChange?: (active: boolean) => void;
  closeOnClick?: boolean;
  id?: string;
}

/**
 * Bulma Dropdown component.
 *
 * @function
 * @param {DropdownProps} props - Props for the Dropdown component.
 * @returns {JSX.Element} The rendered dropdown.
 * @see {@link https://bulma.io/documentation/components/dropdown/ | Bulma Dropdown documentation}
 */
const DropdownComponent: React.FC<DropdownProps> = ({
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
}) => {
  const [active, setActive] = useState<boolean>(!!activeProp);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Controlled mode support
  useEffect(() => {
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

  const dropdownClasses = classNames(
    bulmaClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <div
      className={dropdownClasses}
      ref={dropdownRef}
      id={id}
      data-testid="dropdown-root"
      {...rest}
    >
      <div className={usePrefixedClassNames('dropdown-trigger')}>
        <button
          className={buttonClass}
          aria-haspopup="true"
          aria-controls={id ? `${id}-menu` : undefined}
          aria-expanded={active}
          onClick={handleToggle}
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
};

/**
 * Props for the DropdownItem component.
 *
 * @property {boolean} [active] - Whether the item is active.
 * @property {string} [className] - Additional CSS classes.
 * @property {'a'|'div'|'button'} [as] - The element type to render.
 * @property {React.ReactNode} [children] - Item content.
 */
export interface DropdownItemProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  active?: boolean;
  className?: string;
  as?: 'a' | 'div' | 'button';
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
 * @returns {JSX.Element} The divider element.
 */
export const DropdownDivider: React.FC = () => (
  <hr className={usePrefixedClassNames('dropdown-divider')} />
);

// Assign static subcomponents
export const Dropdown = Object.assign(DropdownComponent, {
  Item: DropdownItem,
  Divider: DropdownDivider,
});

export default Dropdown;
