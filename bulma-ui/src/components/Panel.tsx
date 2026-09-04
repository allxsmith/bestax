import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Icon, IconChildrenProps, IconNameProps } from '../elements/Icon';

/**
 * Props for the Panel component.
 */
export interface PanelProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Bulma color modifier for the panel. */
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
  /** Additional CSS classes. */
  className?: string;
  /** Panel content (usually includes subcomponents). */
  children?: React.ReactNode;
}

/**
 * Props for the PanelHeading component.
 */
export interface PanelHeadingProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Heading content. */
  children?: React.ReactNode;
}

/**
 * Props for the PanelTabs component.
 */
export interface PanelTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Tabs content. */
  children?: React.ReactNode;
}

/**
 * Props for the PanelBlock component.
 */
export interface PanelBlockProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Whether the block is active. */
  active?: boolean;
  /** Block content. */
  children?: React.ReactNode;
}

/**
 * Props for the PanelIcon component.
 * Extends IconProps but uses 'panel-icon' as the container class.
 */
export type PanelIconProps =
  | Omit<IconNameProps, 'containerClassName'>
  | Omit<IconChildrenProps, 'containerClassName'>;

/**
 * Props for the PanelInputBlock component.
 */
export interface PanelInputBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Input value. */
  value?: string;
  /** Input change handler. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Input placeholder. */
  placeholder?: string;
  /** Icon class for left icon (default 'fas fa-search'). */
  iconClassName?: string;
}

/**
 * Props for the PanelCheckboxBlock component.
 */
export interface PanelCheckboxBlockProps extends Omit<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  'onChange'
> {
  /** Whether the checkbox is checked. */
  checked?: boolean;
  /** Checkbox change handler. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Label/content. */
  children?: React.ReactNode;
}

/**
 * Props for the PanelButtonBlock component.
 */
export interface PanelButtonBlockProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button content. */
  children?: React.ReactNode;
}

/**
 * The `Panel` component implements Bulma's versatile panel block for React.
 *
 * @function
 * @param {PanelProps} props - Props for the Panel component.
 * @returns {JSX.Element} The rendered panel.
 * @see {@link https://bulma.io/documentation/components/panel/ | Bulma Panel documentation}
 */
const PanelComponent: React.FC<PanelProps> = ({
  color,
  className,
  children,
  ...props
}) => {
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    color,
    ...props,
  });

  // Generate Bulma classes with prefix
  const bulmaClasses = usePrefixedClassNames('panel', {
    [`is-${color}`]: color,
  });

  const panelClasses = classNames(bulmaClasses, bulmaHelperClasses, className);

  return (
    <nav className={panelClasses} {...rest}>
      {children}
    </nav>
  );
};

/**
 * Main heading (renders as `<p class="panel-heading">`)
 *
 * @function
 * @param {PanelHeadingProps} props - Props for the PanelHeading component.
 * @returns {JSX.Element} The rendered panel heading.
 */
export const PanelHeading: React.FC<PanelHeadingProps> = ({
  className,
  children,
  ...props
}) => (
  <p
    className={classNames(usePrefixedClassNames('panel-heading'), className)}
    {...props}
  >
    {children}
  </p>
);

/**
 * Panel tabs (renders as `<p class="panel-tabs">`)
 *
 * @function
 * @param {PanelTabsProps} props - Props for the PanelTabs component.
 * @returns {JSX.Element} The rendered panel tabs.
 */
export const PanelTabs: React.FC<PanelTabsProps> = ({
  className,
  children,
  ...props
}) => (
  <p
    className={classNames(usePrefixedClassNames('panel-tabs'), className)}
    {...props}
  >
    {children}
  </p>
);

/**
 * Individual panel block (renders as `<a class="panel-block">`)
 *
 * @function
 * @param {PanelBlockProps} props - Props for the PanelBlock component.
 * @returns {JSX.Element} The rendered panel block.
 */
export const PanelBlock: React.FC<PanelBlockProps> = ({
  className,
  active,
  children,
  ...props
}) => (
  <a
    className={classNames(
      usePrefixedClassNames('panel-block', { 'is-active': active }),
      className
    )}
    {...props}
  >
    {children}
  </a>
);

/**
 * Icon wrapper with panel styling (renders as `<span class="panel-icon">`, containing an
 * `<i/>` when a `name` is given, or the custom node passed as `children`).
 * Accepts all Icon props (`name`, `variant`, `features`, etc.), or `children` for a custom node.
 *
 * @function
 * @param {PanelIconProps} props - Props for the PanelIcon component.
 * @returns {JSX.Element} The rendered panel icon.
 */
export const PanelIcon: React.FC<PanelIconProps> = ({
  className,
  ...props
}) => (
  <Icon
    containerClassName={classNames(
      usePrefixedClassNames('panel-icon'),
      className
    )}
    {...props}
  />
);

/**
 * Search input with icon (renders as `<div class="panel-block">`)
 *
 * @function
 * @param {PanelInputBlockProps} props - Props for the PanelInputBlock component.
 * @returns {JSX.Element} The rendered panel input block.
 */
export const PanelInputBlock: React.FC<PanelInputBlockProps> = ({
  value,
  onChange,
  placeholder,
  iconClassName = 'fas fa-search',
  ...props
}) => {
  const inputClass = usePrefixedClassNames('input');

  return (
    <div className={usePrefixedClassNames('panel-block')} {...props}>
      <p className={usePrefixedClassNames('control', 'has-icons-left')}>
        <input
          className={inputClass}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <span className={usePrefixedClassNames('icon', 'is-left')}>
          <i className={iconClassName} aria-hidden="true"></i>
        </span>
      </p>
    </div>
  );
};

/**
 * Checkbox block (renders as `<label class="panel-block">`)
 *
 * @function
 * @param {PanelCheckboxBlockProps} props - Props for the PanelCheckboxBlock component.
 * @returns {JSX.Element} The rendered panel checkbox block.
 */
export const PanelCheckboxBlock: React.FC<PanelCheckboxBlockProps> = ({
  checked,
  onChange,
  children,
  ...props
}) => (
  <label className={usePrefixedClassNames('panel-block')} {...props}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    {children}
  </label>
);

/**
 * Call-to-action button (renders as `<div class="panel-block"><button /></div>`)
 *
 * @function
 * @param {PanelButtonBlockProps} props - Props for the PanelButtonBlock component.
 * @returns {JSX.Element} The rendered panel button block.
 */
export const PanelButtonBlock: React.FC<PanelButtonBlockProps> = ({
  children,
  className,
  ...props
}) => (
  <div className={usePrefixedClassNames('panel-block')}>
    <button
      className={classNames(
        usePrefixedClassNames(
          'button',
          'is-link',
          'is-outlined',
          'is-fullwidth'
        ),
        className
      )}
      {...props}
    >
      {children}
    </button>
  </div>
);

export const Panel = withSubComponents(
  PanelComponent,
  {
    Heading: PanelHeading,
    Tabs: PanelTabs,
    Block: PanelBlock,
    Icon: PanelIcon,
    InputBlock: PanelInputBlock,
    CheckboxBlock: PanelCheckboxBlock,
    ButtonBlock: PanelButtonBlock,
  },
  'Panel'
);

export default Panel;
