import React from 'react';
import classNames from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

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

export interface PanelHeadingProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface PanelTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface PanelBlockProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
  active?: boolean;
  children?: React.ReactNode;
}

export interface PanelIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface PanelInputBlockProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  iconClassName?: string;
}

export interface PanelCheckboxBlockProps
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  children?: React.ReactNode;
}

export interface PanelButtonBlockProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

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

  const panelClasses = classNames('panel', bulmaHelperClasses, className, {
    [`is-${color}`]: color,
  });

  return (
    <nav className={panelClasses} {...rest}>
      {children}
    </nav>
  );
};

export const PanelHeading: React.FC<PanelHeadingProps> = ({
  className,
  children,
  ...props
}) => (
  <p className={classNames('panel-heading', className)} {...props}>
    {children}
  </p>
);

export const PanelTabs: React.FC<PanelTabsProps> = ({
  className,
  children,
  ...props
}) => (
  <p className={classNames('panel-tabs', className)} {...props}>
    {children}
  </p>
);

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

export const PanelIcon: React.FC<PanelIconProps> = ({
  className,
  children,
  ...props
}) => (
  <span className={classNames('panel-icon', className)} {...props}>
    {children}
  </span>
);

export const PanelInputBlock: React.FC<PanelInputBlockProps> = ({
  value,
  onChange,
  placeholder,
  iconClassName = 'fas fa-search',
  ...props
}) => (
  <div className="panel-block" {...props}>
    <p className="control has-icons-left">
      <input
        className="input"
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
