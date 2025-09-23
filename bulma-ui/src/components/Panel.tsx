import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

/**
 * Props for the Panel component.
 *
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color modifier for the panel.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Panel content.
 */
export interface PanelProps
  extends React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
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
  className?: string;
  children?: React.ReactNode;
}

/**
 * Props for the PanelHeading component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Heading content.
 */
export interface PanelHeadingProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Props for the PanelTabs component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Tabs content.
 */
export interface PanelTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Props for the PanelBlock component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {boolean} [active] - Whether the block is active.
 * @property {React.ReactNode} [children] - Block content.
 */
export interface PanelBlockProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
  active?: boolean;
  children?: React.ReactNode;
}

/**
 * Props for the PanelIcon component.
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Icon content.
 */
export interface PanelIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Props for the PanelInputBlock component.
 *
 * @property {string} [value] - Input value.
 * @property {(event: React.ChangeEvent<HTMLInputElement>) => void} [onChange] - Input change handler.
 * @property {string} [placeholder] - Input placeholder.
 * @property {string} [iconClassName] - Icon class for left icon (default 'fas fa-search').
 */
export interface PanelInputBlockProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  iconClassName?: string;
}

/**
 * Props for the PanelCheckboxBlock component.
 *
 * @property {boolean} [checked] - Whether the checkbox is checked.
 * @property {(event: React.ChangeEvent<HTMLInputElement>) => void} [onChange] - Checkbox change handler.
 * @property {React.ReactNode} [children] - Label/content.
 */
export interface PanelCheckboxBlockProps
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  children?: React.ReactNode;
}

/**
 * Props for the PanelButtonBlock component.
 *
 * @property {React.ReactNode} [children] - Button content.
 */
export interface PanelButtonBlockProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

/**
 * Bulma Panel component, supports various panel subcomponents.
 *
 * @function
 * @param {PanelProps} props - Props for the Panel component.
 * @returns {JSX.Element} The rendered panel.
 * @see {@link https://bulma.io/documentation/components/panel/ | Bulma Panel documentation}
 */
export const Panel: React.FC<PanelProps> & {
  Heading: typeof PanelHeading;
  Tabs: typeof PanelTabs;
  Block: typeof PanelBlock;
  Icon: typeof PanelIcon;
  InputBlock: typeof PanelInputBlock;
  CheckboxBlock: typeof PanelCheckboxBlock;
  ButtonBlock: typeof PanelButtonBlock;
} = ({ color, className, children, ...props }) => {
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
 * Bulma Panel heading.
 */
export const PanelHeading: React.FC<PanelHeadingProps> = ({
  className,
  children,
  ...props
}) => (
  <p className={classNames('panel-heading', className)} {...props}>
    {children}
  </p>
);

/**
 * Bulma Panel tabs.
 */
export const PanelTabs: React.FC<PanelTabsProps> = ({
  className,
  children,
  ...props
}) => (
  <p className={classNames('panel-tabs', className)} {...props}>
    {children}
  </p>
);

/**
 * Bulma Panel block.
 */
export const PanelBlock: React.FC<PanelBlockProps> = ({
  className,
  active,
  children,
  ...props
}) => (
  <a
    className={classNames('panel-block', className, { 'is-active': active })}
    {...props}
  >
    {children}
  </a>
);

/**
 * Bulma Panel icon.
 */
export const PanelIcon: React.FC<PanelIconProps> = ({
  className,
  children,
  ...props
}) => (
  <span className={classNames('panel-icon', className)} {...props}>
    {children}
  </span>
);

/**
 * Bulma Panel input block.
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
    <div className="panel-block" {...props}>
      <p className="control has-icons-left">
        <input
          className={inputClass}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <span className="icon is-left">
          <i className={iconClassName} aria-hidden="true"></i>
        </span>
      </p>
    </div>
  );
};

/**
 * Bulma Panel checkbox block.
 */
export const PanelCheckboxBlock: React.FC<PanelCheckboxBlockProps> = ({
  checked,
  onChange,
  children,
  ...props
}) => (
  <label className="panel-block" {...props}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    {children}
  </label>
);

/**
 * Bulma Panel button block.
 */
export const PanelButtonBlock: React.FC<PanelButtonBlockProps> = ({
  children,
  className,
  ...props
}) => (
  <div className="panel-block">
    <button
      className={classNames(
        'button is-link is-outlined is-fullwidth',
        className
      )}
      {...props}
    >
      {children}
    </button>
  </div>
);

Panel.Heading = PanelHeading;
Panel.Tabs = PanelTabs;
Panel.Block = PanelBlock;
Panel.Icon = PanelIcon;
Panel.InputBlock = PanelInputBlock;
Panel.CheckboxBlock = PanelCheckboxBlock;
Panel.ButtonBlock = PanelButtonBlock;

export default Panel;
