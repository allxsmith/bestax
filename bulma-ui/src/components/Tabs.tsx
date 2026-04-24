import React, { createContext, useContext, useState, useCallback } from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
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
 *
 * @property {'centered'|'right'|'left'} [align] - Tab alignment.
 * @property {'small'|'medium'|'large'} [size] - Tab size.
 * @property {boolean} [fullwidth] - Tabs are fullwidth.
 * @property {boolean} [boxed] - Tabs are boxed style.
 * @property {boolean} [toggle] - Tabs are toggle style.
 * @property {boolean} [rounded] - Tabs are rounded (if toggle).
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'|'black'|'dark'|'light'|'white'} [color] - Bulma color.
 * @property {number} [value] - Controlled active tab index.
 * @property {(index: number) => void} [onChange] - Callback when active tab changes.
 * @property {number} [defaultValue] - Initial active tab index for uncontrolled mode.
 * @property {boolean} [vertical] - Render tabs vertically.
 * @property {'left'|'right'} [side] - Which side vertical tabs appear on.
 * @property {boolean} [expanded] - Vertical tabs fill full height.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Tab content.
 */
export interface TabsProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  align?: 'centered' | 'right' | 'left';
  size?: 'small' | 'medium' | 'large';
  fullwidth?: boolean;
  boxed?: boolean;
  toggle?: boolean;
  rounded?: boolean;
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
  value?: number;
  onChange?: (index: number) => void;
  defaultValue?: number;
  vertical?: boolean;
  side?: 'left' | 'right';
  expanded?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Bulma Tabs component with stateful tab management, content panels, and vertical layout.
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
export const Tabs: React.FC<TabsProps> & {
  List: typeof TabList;
  Tab: typeof Tab;
  Item: typeof TabItem;
  Content: typeof TabsContent & { Item: typeof TabContentItem };
} = ({
  align,
  size,
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
    'is-fullwidth': fullwidth,
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
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Tab elements.
 */
export interface TabListProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Tab list container. Renders a `<ul>` with `role="tablist"`.
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
 *
 * @property {number} index - The tab index for state management.
 * @property {boolean} [disabled] - Whether the tab is disabled.
 * @property {string} [icon] - Icon name to render before the label.
 * @property {IconLibrary} [iconLibrary] - Icon library override (defaults to ConfigProvider value or 'fa').
 * @property {string} [iconVariant] - Icon style variant (e.g., 'solid', 'outlined', 'rounded').
 * @property {'small'|'medium'|'large'} [iconSize] - Icon size modifier. Default: 'small'.
 * @property {string|string[]} [iconFeatures] - Additional icon library-specific modifiers.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Tab label content.
 */
export interface TabProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  'onClick'
> {
  index: number;
  disabled?: boolean;
  icon?: string;
  iconLibrary?: IconLibrary;
  iconVariant?: string;
  iconSize?: 'small' | 'medium' | 'large';
  iconFeatures?: string | string[];
  className?: string;
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
 *
 * @property {boolean} [active] - Whether the tab is active.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Tab content.
 * @property {React.MouseEventHandler<HTMLLIElement>} [onClick] - Click handler.
 */
export interface TabItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
}

/**
 * Legacy tab item. Does not consume context — active state is controlled via prop.
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
 *
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - TabContentItem elements.
 */
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Wrapper for tab content panels. Apply `.tabs-content` class.
 *
 * @function
 * @param {TabsContentProps} props - Props for the TabsContent component.
 * @returns {JSX.Element} The rendered tabs content wrapper.
 */
export const TabsContent: React.FC<TabsContentProps> & {
  Item: typeof TabContentItem;
} = ({ className, children, ...props }) => {
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
 *
 * @property {number} index - The tab index this content panel corresponds to.
 * @property {string} [className] - Additional CSS classes.
 * @property {React.ReactNode} [children] - Panel content.
 */
export interface TabContentItemProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
  className?: string;
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

TabsContent.Item = TabContentItem;

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Item = TabItem;
Tabs.Content = Object.assign(TabsContent, { Item: TabContentItem });

export default Tabs;
