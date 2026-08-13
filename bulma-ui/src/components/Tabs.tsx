import React, { createContext, useContext, useState, useCallback } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { warnDeprecatedColorProp } from '../helpers/colorDeprecations';
import { Icon } from '../elements/Icon';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TabsContextValue {
  activeTab: number;
  setActiveTab: (index: number) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue | null {
  return useContext(TabsContext);
}

// ---------------------------------------------------------------------------
// Tabs (root)
// ---------------------------------------------------------------------------

/**
 * Props for the Tabs component.
 */
export interface TabsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  /** Tab alignment. */
  align?: 'centered' | 'right' | 'left';
  /** Tab size. */
  size?: 'small' | 'medium' | 'large';
  /** Tabs expand to fill the horizontal space. */
  isFullwidth?: boolean;
  /** Tabs expand to fill the horizontal space. @deprecated Use `isFullwidth` instead — `isFullwidth` wins if both are set. */
  isFullWidth?: boolean;
  /** Tabs expand to fill the horizontal space. @deprecated Use `isFullwidth` instead — `isFullwidth` wins if both are set. */
  fullwidth?: boolean;
  /** Tabs use the boxed style. */
  boxed?: boolean;
  /** Tabs use the toggle style. */
  toggle?: boolean;
  /** Tabs use the rounded toggle style (only with `toggle`). */
  rounded?: boolean;
  /**
   * Bulma color for tab underlines and active state (renders `is-<color>`).
   *
   * Bulma ships no tabs color CSS, so this prop has never had a visual effect
   * for any value. Passing it logs a console warning in development.
   * @deprecated No `.tabs.is-<color>` CSS exists; the prop renders unstyled
   * and will be removed in the next major version.
   */
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
  /** Controlled active tab index. */
  value?: number;
  /** Callback when active tab changes. */
  onChange?: (index: number) => void;
  /** Initial active tab index (uncontrolled). */
  defaultValue?: number;
  /** Renders tabs vertically. */
  vertical?: boolean;
  /** Side placement when `vertical` is true. */
  side?: 'left' | 'right';
  /** Makes tabs take up the full width equally. */
  expanded?: boolean;
  /** Additional CSS classes. */
  className?: string;
  /** Tab list and tab items. */
  children?: React.ReactNode;
}

/**
 * The `Tabs` component provides flexible and fully-featured Bulma tab navigation for your Bulma React UI.
 *
 * @function
 * @param {TabsProps} props - Props for the Tabs component.
 * @returns {JSX.Element} The rendered tabs component.
 * @see {@link https://bulma.io/documentation/components/tabs/ | Bulma Tabs documentation}
 *
 * @example
 * // Basic tabs
 * <Tabs>
 *   <Tabs.List>
 *     <Tabs.Tab index={0}>Pictures</Tabs.Tab>
 *     <Tabs.Tab index={1}>Music</Tabs.Tab>
 *   </Tabs.List>
 *   <Tabs.Content>
 *     <Tabs.Content.Item index={0}>Pictures content</Tabs.Content.Item>
 *     <Tabs.Content.Item index={1}>Music content</Tabs.Content.Item>
 *   </Tabs.Content>
 * </Tabs>
 */
const TabsComponent: React.FC<TabsProps> = ({
  align,
  size,
  isFullwidth,
  isFullWidth,
  fullwidth,
  boxed,
  toggle,
  rounded,
  color,
  value,
  onChange,
  defaultValue = 0,
  vertical,
  side,
  expanded,
  className,
  children,
  ...props
}) => {
  warnDeprecatedColorProp(
    'Tabs',
    color,
    'Remove the prop; no replacement exists.'
  );

  const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });

  // Controlled vs uncontrolled state
  const isControlled = value !== undefined;
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = isControlled ? value : internalTab;

  const setActiveTab = useCallback(
    (index: number) => {
      if (!isControlled) {
        setInternalTab(index);
      }
      onChange?.(index);
    },
    [isControlled, onChange]
  );

  const contextValue: TabsContextValue = { activeTab, setActiveTab };

  // Build classes for the .tabs div
  const tabsClasses = usePrefixedClassNames('tabs', {
    [`is-${align}`]: align,
    [`is-${size}`]: size,
    [`is-${color}`]: color,
    'is-fullwidth': isFullwidth ?? isFullWidth ?? fullwidth,
    'is-boxed': boxed,
    'is-toggle': toggle,
    'is-toggle-rounded': rounded,
  });

  // Check if children include TabsContent
  const childArray = React.Children.toArray(children);
  const hasContent = childArray.some(
    child => React.isValidElement(child) && child.type === TabsContent
  );

  // Hoisted unconditionally to respect rules-of-hooks. Modifiers gate themselves
  // via their truthy values — `tabs-root` is always prefixed, modifiers only
  // apply in the vertical-with-content branch.
  const rootClasses = usePrefixedClassNames('tabs-root', {
    'is-vertical': hasContent && vertical,
    'is-right': hasContent && vertical && side === 'right',
    'is-expanded': hasContent && vertical && expanded,
  });

  if (hasContent && vertical) {
    const combinedRootClasses = classNames(
      rootClasses,
      bulmaHelperClasses,
      className
    );

    // Split children into list-like and content children
    const listChildren: React.ReactNode[] = [];
    const contentChildren: React.ReactNode[] = [];
    childArray.forEach(child => {
      if (React.isValidElement(child) && child.type === TabsContent) {
        contentChildren.push(child);
      } else {
        listChildren.push(child);
      }
    });

    return (
      <TabsContext.Provider value={contextValue}>
        <div className={combinedRootClasses} {...rest}>
          <div className={tabsClasses}>{listChildren}</div>
          {contentChildren}
        </div>
      </TabsContext.Provider>
    );
  }

  if (hasContent) {
    const combinedRootClasses = classNames(
      rootClasses,
      bulmaHelperClasses,
      className
    );

    const listChildren: React.ReactNode[] = [];
    const contentChildren: React.ReactNode[] = [];
    childArray.forEach(child => {
      if (React.isValidElement(child) && child.type === TabsContent) {
        contentChildren.push(child);
      } else {
        listChildren.push(child);
      }
    });

    return (
      <TabsContext.Provider value={contextValue}>
        <div className={combinedRootClasses} {...rest}>
          <div className={tabsClasses}>{listChildren}</div>
          {contentChildren}
        </div>
      </TabsContext.Provider>
    );
  }

  // No content children — backward compatible single .tabs div
  const combinedClasses = classNames(
    tabsClasses,
    bulmaHelperClasses,
    className
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={combinedClasses} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// TabList
// ---------------------------------------------------------------------------

/**
 * Props for the TabList component.
 */
export interface TabListProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Additional CSS classes. */
  className?: string;
  /** Tab elements. */
  children?: React.ReactNode;
}

/**
 * The `<ul>` container for tab items.
 *
 * @function
 * @param {TabListProps} props - Props for the TabList component.
 * @returns {JSX.Element} The rendered tab list.
 */
export const TabList: React.FC<TabListProps> = ({
  className,
  children,
  ...props
}) => (
  <ul role="tablist" className={classNames(className)} {...props}>
    {children}
  </ul>
);

// ---------------------------------------------------------------------------
// Tab (new — context-aware)
// ---------------------------------------------------------------------------

type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';

/**
 * Props for the Tab component.
 */
export interface TabProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  'onClick'
> {
  /** **Required.** Tab index for matching with content. */
  index: number;
  /** Disables the tab. */
  disabled?: boolean;
  /** Icon name for the tab. */
  icon?: string;
  /** Icon library to use. */
  iconLibrary?: IconLibrary;
  /** Icon style variant (e.g., 'solid', 'outlined', 'rounded'). */
  iconVariant?: string;
  /** Size of the tab icon. */
  iconSize?: 'small' | 'medium' | 'large';
  /** Additional icon modifiers. */
  iconFeatures?: string | string[];
  /** Additional CSS classes. */
  className?: string;
  /** Tab label content. */
  children?: React.ReactNode;
}

/**
 * Individual tab button. Consumes Tabs context for active state management.
 * Renders `<a>` internally — consumers provide only the label text/children.
 *
 * @function
 * @param {TabProps} props - Props for the Tab component.
 * @returns {JSX.Element} The rendered tab.
 */
export const Tab: React.FC<TabProps> = ({
  index,
  disabled,
  icon,
  iconLibrary,
  iconVariant,
  iconSize = 'small',
  iconFeatures,
  className,
  children,
  ...props
}) => {
  const ctx = useTabsContext();
  const isActive = ctx ? ctx.activeTab === index : false;

  const activeClass = usePrefixedClassNames({ 'is-active': isActive });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled && ctx) {
        ctx.setActiveTab(index);
      }
    },
    [disabled, ctx, index]
  );

  return (
    <li
      className={classNames(activeClass, className)}
      role="tab"
      aria-selected={isActive}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      <a onClick={handleClick} aria-disabled={disabled || undefined}>
        {icon && (
          <Icon
            name={icon}
            library={iconLibrary}
            variant={iconVariant}
            size={iconSize}
            features={iconFeatures}
          />
        )}
        {children && <span>{children}</span>}
      </a>
    </li>
  );
};

// ---------------------------------------------------------------------------
// TabItem (backward-compatible — no context)
// ---------------------------------------------------------------------------

/**
 * Props for the TabItem component (backward-compatible).
 */
export interface TabItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /** Whether the tab is active. */
  active?: boolean;
  /** Additional CSS classes. */
  className?: string;
  /** Tab content. */
  children?: React.ReactNode;
  /** Click handler. */
  onClick?: React.MouseEventHandler<HTMLLIElement>;
}

/**
 * Each tab; accepts `active`, `onClick`, etc.
 *
 * @function
 * @param {TabItemProps} props - Props for the TabItem component.
 * @returns {JSX.Element} The rendered tab item.
 * @deprecated Use `Tabs.Tab` with an `index` prop instead.
 */
export const TabItem: React.FC<TabItemProps> = ({
  active,
  className,
  children,
  onClick,
  ...props
}) => (
  <li
    className={classNames(
      { [usePrefixedClassNames('is-active')]: active },
      className
    )}
    onClick={onClick}
    {...props}
  >
    {children}
  </li>
);

// ---------------------------------------------------------------------------
// TabsContent
// ---------------------------------------------------------------------------

/**
 * Props for the TabsContent component.
 */
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes. */
  className?: string;
  /** TabContentItem elements. */
  children?: React.ReactNode;
}

/**
 * Container for tab content panels. No custom props beyond `children` and standard `<div>` HTML attributes. Applies the `.tabs-content` class.
 *
 * @function
 * @param {TabsContentProps} props - Props for the TabsContent component.
 * @returns {JSX.Element} The rendered tabs content wrapper.
 */
const TabsContentComponent: React.FC<TabsContentProps> = ({
  className,
  children,
  ...props
}) => {
  const contentClass = usePrefixedClassNames('tabs-content');
  return (
    <div className={classNames(contentClass, className)} {...props}>
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// TabContentItem
// ---------------------------------------------------------------------------

/**
 * Props for the TabContentItem component.
 */
export interface TabContentItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** **Required.** Tab index for matching with content. */
  index: number;
  /** Additional CSS classes. */
  className?: string;
  /** Panel content. */
  children?: React.ReactNode;
}

/**
 * Individual content panel. Shows/hides based on active tab from context.
 *
 * @function
 * @param {TabContentItemProps} props - Props for the TabContentItem component.
 * @returns {JSX.Element} The rendered tab content panel.
 */
export const TabContentItem: React.FC<TabContentItemProps> = ({
  index,
  className,
  children,
  ...props
}) => {
  const ctx = useTabsContext();
  const isActive = ctx ? ctx.activeTab === index : false;

  const itemClass = usePrefixedClassNames('tabs-content-item', {
    'is-active': isActive,
  });

  return (
    <div
      className={classNames(itemClass, className)}
      role="tabpanel"
      aria-hidden={!isActive}
      {...props}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Static property attachment
// ---------------------------------------------------------------------------

export const TabsContent = withSubComponents(TabsContentComponent, {
  Item: TabContentItem,
});

export const Tabs = withSubComponents(
  TabsComponent,
  {
    List: TabList,
    Tab,
    Item: TabItem,
    Content: TabsContent,
  },
  'Tabs'
);

export default Tabs;
