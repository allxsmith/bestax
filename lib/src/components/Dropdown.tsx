import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

// Safe, testable helper
export const isBrowser = (win?: typeof window, doc?: typeof document) =>
  typeof win !== 'undefined' && typeof doc !== 'undefined';

export interface DropdownProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof BulmaClassesProps>,
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

export const Dropdown: React.FC<DropdownProps> = ({
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

  // Controlled mode support
  useEffect(() => {
    if (typeof activeProp === 'boolean') setActive(activeProp);
  }, [activeProp]);

  // SSR-safe outside click
  useEffect(() => {
    if (!active) return;

    if (!isBrowser(window, document)) return;

    const handleClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setActive(false);
        onActiveChange?.(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [active, onActiveChange]);

  const handleToggle = () => {
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
    'dropdown',
    bulmaHelperClasses,
    {
      'is-active': active,
      'is-up': up,
      'is-right': right,
      'is-hoverable': hoverable,
      'is-disabled': disabled,
    },
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
      <div className="dropdown-trigger">
        <button
          className="button"
          aria-haspopup="true"
          aria-controls={id ? `${id}-menu` : undefined}
          aria-expanded={active}
          onClick={handleToggle}
          disabled={disabled}
          type="button"
        >
          <span>{label}</span>
          <span className="icon is-small" aria-hidden="true">
            <i className="fas fa-angle-down" />
          </span>
        </button>
      </div>
      <div
        className={classNames('dropdown-menu', menuClassName)}
        id={id ? `${id}-menu` : undefined}
        role="menu"
        data-testid="dropdown-menu"
      >
        <div
          className="dropdown-content"
          onClick={handleMenuClick}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export interface DropdownItemProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof BulmaClassesProps>,
    BulmaClassesProps {
  active?: boolean;
  className?: string;
  as?: 'a' | 'div' | 'button';
}

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
        'dropdown-item',
        bulmaHelperClasses,
        { 'is-active': active },
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

export const DropdownDivider: React.FC = () => (
  <hr className="dropdown-divider" />
);
