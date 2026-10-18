import React from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import {
  ANCHOR_ONLY_ATTRS,
  type AnchorOnlyAttributes,
  omitAttrs,
} from '../helpers/anchorAttrs';
import type { ConstrainedPolymorphicComponentWithoutRef } from '../helpers/polymorphic';
import {
  Icon,
  IconChildrenProps,
  IconDeprecatedProps,
  IconNameProps,
} from '../elements/Icon';

/**
 * Props for the Panel component.
 */
export interface PanelProps
  extends
    React.HTMLAttributes<HTMLElement>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /**
   * HTML element to render (default: `nav`). A `nav` is a `navigation`
   * landmark, which suits a panel of links; a panel that is not navigation
   * takes another tag. Bulma's own colored panels use `article`. A `section`
   * is a `region` landmark only once it has an accessible name, such as
   * `aria-labelledby` pointing at the `id` of its `Panel.Heading`.
   */
  as?: 'nav' | 'article' | 'section' | 'aside' | 'div';
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
 * What `<label>` adds over the attributes every element has (`htmlFor` and
 * `form`), subtracted from React's types the way `AnchorOnlyAttributes` is, so
 * it grows when React's does.
 */
type LabelOnlyAttributes = Omit<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  keyof React.HTMLAttributes<HTMLLabelElement>
>;

/**
 * The set withheld from a non-label `Panel.Block`, keyed so it stops compiling
 * until a label attribute React adds is named here.
 */
const STRIP_FROM_NON_LABEL: Readonly<Record<keyof LabelOnlyAttributes, true>> =
  {
    form: true,
    htmlFor: true,
  };

/**
 * The set withheld from a non-anchor `Panel.Block`: the derived anchor-only
 * attributes plus `rel`, which React declares on every element, withheld the
 * way `Level.Item` and `Card.FooterItem` withhold it.
 */
const STRIP_FROM_NON_ANCHOR: Readonly<
  Record<keyof AnchorOnlyAttributes | 'rel', true>
> = { ...ANCHOR_ONLY_ATTRS, rel: true };

/** A `<div>` block takes neither set. */
const STRIP_FROM_DIV: Readonly<
  Record<keyof AnchorOnlyAttributes | 'rel' | keyof LabelOnlyAttributes, true>
> = { ...STRIP_FROM_NON_ANCHOR, ...STRIP_FROM_NON_LABEL };

/**
 * The elements a panel block may render as: the tags Bulma's panel markup
 * puts `.panel-block` on.
 */
export type PanelBlockElement = 'a' | 'div' | 'label';

/**
 * The PanelBlock component's own props.
 */
export interface PanelBlockOwnProps {
  /** Additional CSS classes. */
  className?: string;
  /** Whether the block is active. */
  active?: boolean;
  /** Block content. */
  children?: React.ReactNode;
}

/**
 * Props for the PanelBlock component. Everything the block does not own
 * follows `as`: the anchor's attributes and an `HTMLAnchorElement`
 * `currentTarget` under the default `'a'`, `htmlFor` under `'label'`, and the
 * shared HTML attributes under any of them.
 *
 * The type parameter defaults to `'a'`, the element a block renders with no
 * `as`, rather than to the whole union the way `DropdownItemProps` does. Before
 * `as` existed this type was the anchor's attributes, so bare
 * `PanelBlockProps` stays exactly that, `href` and anchor-typed handlers
 * included. Write `PanelBlockProps<'div'>` or `PanelBlockProps<'label'>` for
 * the others.
 */
export type PanelBlockProps<T extends PanelBlockElement = 'a'> =
  PanelBlockOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof PanelBlockOwnProps | 'as'> & {
      /**
       * HTML element to render (default: `a`). Bulma styles a `label` block
       * as clickable, like an `a`, and a `div` block as static content, such
       * as a table. The props follow the tag, so the anchor attributes
       * (`href`, `target`, `download` and the rest) are typed only on an `a`
       * and `htmlFor` only on a `label`; at runtime the block also drops them,
       * and `rel`, on the other tags. `Panel.CheckboxBlock`,
       * `Panel.InputBlock` and `Panel.ButtonBlock` render the usual `label`
       * and `div` blocks with their contents.
       */
      as?: T;
    };

/**
 * The shape the implementation destructures. The public contract is the
 * generic `PanelBlockProps<T>` above, which the body cannot see through.
 */
type PanelBlockImplProps = PanelBlockOwnProps & {
  as?: PanelBlockElement;
};

/**
 * Props for the PanelIcon component.
 * Extends IconProps but uses 'panel-icon' as the container class.
 */
export type PanelIconProps =
  | Omit<IconNameProps, 'containerClassName'>
  | Omit<IconChildrenProps, 'containerClassName'>
  // `PanelIcon` spreads straight into `<Icon>`, so every member of `IconProps`
  // reaches it. Enumerating them by hand is what left the deprecated `icon`
  // path compiling on `Icon` and failing here, with an error naming `children`.
  | Omit<IconDeprecatedProps, 'containerClassName'>;

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
  as: Tag = 'nav',
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
    <Tag className={panelClasses} {...rest}>
      {children}
    </Tag>
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
 * Individual panel block (renders as `<a class="panel-block">` unless `as` says otherwise)
 *
 * @function
 * @param {PanelBlockProps} props - Props for the PanelBlock component.
 * @returns {JSX.Element} The rendered panel block.
 */
export const PanelBlock = ((blockProps: PanelBlockProps) => {
  const {
    as: Tag = 'a',
    className,
    active,
    children,
    ...props
  } = blockProps as PanelBlockImplProps;
  const blockClasses = classNames(
    usePrefixedClassNames('panel-block', { 'is-active': active }),
    className
  );
  // The anchor's own attributes reach an `<a>` and nothing else, and the
  // label's a `<label>`; the sets above say which those are. The type already
  // keeps them off the other tags, so this is for a plain-JS caller, a loose
  // `{...props}` spread, and the genericity a wrapping HOC erases.
  const forwarded =
    Tag === 'a'
      ? omitAttrs(props, STRIP_FROM_NON_LABEL)
      : Tag === 'label'
        ? omitAttrs(props, STRIP_FROM_NON_ANCHOR)
        : omitAttrs(props, STRIP_FROM_DIV);
  return (
    <Tag className={blockClasses} {...forwarded}>
      {children}
    </Tag>
  );
}) as ConstrainedPolymorphicComponentWithoutRef<
  PanelBlockOwnProps,
  PanelBlockElement,
  'a'
>;

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
