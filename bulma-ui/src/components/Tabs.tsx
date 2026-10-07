import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useCallback,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { withSubComponents } from '../helpers/withSubComponents';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { warnDeprecatedColorProp } from '../helpers/colorDeprecations';
import { Icon } from '../elements/Icon';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TabRecord {
  index: number;
  id: string;
  disabled: boolean;
}

interface PanelRecord {
  index: number;
  id: string;
}

interface TabsContextValue {
  activeTab: number;
  setActiveTab: (index: number) => void;
  /** Prefix for the ids the tabs and panels generate. */
  baseId: string;
  /** The tab that holds `tabIndex={0}`, or `null` when every tab is disabled. */
  tabStop: number | null;
  /** Records which tab has focus, so the tab stop can follow it. */
  setFocusedTab: (index: number | null) => void;
  /** The id of the mounted tab for `index`, for its panel's `aria-labelledby`. */
  tabId: (index: number) => string | undefined;
  /** The id of the mounted panel for `index`, for its tab's `aria-controls`. */
  panelId: (index: number) => string | undefined;
  registerTab: (record: TabRecord) => () => void;
  registerPanel: (record: PanelRecord) => () => void;
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue | null {
  return useContext(TabsContext);
}

/**
 * The tabs and panels currently mounted under one `Tabs`. Each registers from
 * an effect and removes itself on cleanup, so the links between them only
 * ever name elements that exist, wherever in the tree the panels sit.
 */
function useRegistry<T>(): [T[], (record: T) => () => void] {
  const [records, setRecords] = useState<T[]>([]);
  const register = useCallback((record: T) => {
    setRecords(prev => [...prev, record]);
    return () => setRecords(prev => prev.filter(r => r !== record));
  }, []);
  return [records, register];
}

/**
 * The tab a key press moves focus to, found among the sibling tabs in the
 * DOM, skipping disabled ones and wrapping at either end. `undefined` for a
 * key the tab list does not handle, or when no enabled tab is left to go to.
 */
function findTargetTab(
  current: HTMLElement,
  key: string,
  vertical: boolean
): HTMLElement | undefined {
  const tabs = Array.from(
    (current.parentElement as HTMLElement).children
  ).filter(el => el.getAttribute('role') === 'tab') as HTMLElement[];
  const isEnabled = (el: HTMLElement) =>
    el.getAttribute('aria-disabled') !== 'true';

  if (key === 'Home') return tabs.find(isEnabled);
  if (key === 'End') return [...tabs].reverse().find(isEnabled);

  let step: number;
  if (key === 'ArrowRight' || (vertical && key === 'ArrowDown')) step = 1;
  else if (key === 'ArrowLeft' || (vertical && key === 'ArrowUp')) step = -1;
  else return undefined;

  const start = tabs.indexOf(current);
  for (let i = 1; i <= tabs.length; i++) {
    const candidate =
      tabs[(((start + step * i) % tabs.length) + tabs.length) % tabs.length];
    if (isEnabled(candidate)) return candidate;
  }
  return undefined;
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
  /**
   * Callback when active tab changes. Called with the tab's `index` when a
   * `Tabs.Tab` is activated: clicked, or Enter or Space pressed on it.
   * Moving focus with the arrow keys, Home or End does not call it, because
   * activation is manual: focus moves freely and the selected tab changes
   * only when the user picks one.
   */
  onChange?: (index: number) => void;
  /** Initial active tab index (uncontrolled). */
  defaultValue?: number;
  /**
   * Renders tabs vertically. With a `Tabs.Content`, the tab list is also
   * marked `aria-orientation="vertical"` and ArrowUp and ArrowDown move focus
   * between tabs, alongside ArrowLeft and ArrowRight (the layout stacks
   * horizontally on mobile).
   */
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
 * Built from `Tabs.Tab`, the tabs follow the WAI-ARIA tabs pattern with
 * manual activation: the tab list is a single tab stop, the arrow keys, Home
 * and End move focus between tabs (skipping disabled ones), and Enter or
 * Space activates the focused tab. Each tab names its `Tabs.Content.Item` in
 * `aria-controls`, and each panel names its tab in `aria-labelledby`. Built
 * from `Tabs.Item` with links inside, the tabs stay plain Bulma navigation.
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

  const baseId = useId();
  const [tabs, registerTab] = useRegistry<TabRecord>();
  const [panels, registerPanel] = useRegistry<PanelRecord>();
  const [focusedTab, setFocusedTab] = useState<number | null>(null);

  // One tab stop for the whole list (roving tabindex). While focus is inside
  // the list the stop follows it, so Tab and Shift+Tab leave the list from
  // whichever tab has focus; once focus leaves, the stop is the selected tab
  // again. A disabled tab never holds it, and when the selected tab is
  // disabled or missing the first enabled tab does, so the list can always be
  // reached. Before the tabs register (the server render and the first client
  // render), the selected tab holds it.
  const enabledTabs = tabs.filter(t => !t.disabled);
  const canHoldStop = (index: number | null) =>
    enabledTabs.some(t => t.index === index);
  let tabStop: number | null;
  if (canHoldStop(focusedTab)) tabStop = focusedTab;
  else if (tabs.length === 0 || canHoldStop(activeTab)) tabStop = activeTab;
  else tabStop = enabledTabs.length > 0 ? enabledTabs[0].index : null;

  // Check if children include TabsContent
  const childArray = React.Children.toArray(children);
  const hasContent = childArray.some(
    child => React.isValidElement(child) && child.type === TabsContent
  );

  const contextValue: TabsContextValue = {
    activeTab,
    setActiveTab,
    baseId,
    tabStop,
    setFocusedTab,
    tabId: index => tabs.find(t => t.index === index)?.id,
    panelId: index => panels.find(p => p.index === index)?.id,
    registerTab,
    registerPanel,
    orientation: hasContent && vertical ? 'vertical' : 'horizontal',
  };

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
}) => {
  const ctx = useTabsContext();
  return (
    <ul
      role="tablist"
      aria-orientation={
        ctx?.orientation === 'vertical' ? 'vertical' : undefined
      }
      className={classNames(className) || undefined}
      {...props}
    >
      {children}
    </ul>
  );
};

// ---------------------------------------------------------------------------
// Tab (new — context-aware)
// ---------------------------------------------------------------------------

type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';

/**
 * Props for the Tab component.
 * @extraProp {string} [id] - The tab's id, which its panel names in `aria-labelledby`. Generated inside a `Tabs` when omitted; a passed `id` is used and the panel follows it.
 * @extraProp {React.KeyboardEventHandler<HTMLLIElement>} [onKeyDown] - Called before the tab handles the key; call `event.preventDefault()` to stop the tab handling it.
 */
export interface TabProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  'onClick'
> {
  /** **Required.** Tab index for matching with content. */
  index: number;
  /**
   * Disables the tab. A disabled tab is marked `aria-disabled`, cannot be
   * activated, is skipped by the arrow keys, Home and End, and never holds
   * the tab list's tab stop.
   */
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
 * Inside a `Tabs` it takes part in the tab list's keyboard support and links
 * to the `Tabs.Content.Item` with the same `index`.
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
  id,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}) => {
  const ctx = useTabsContext();
  const isActive = ctx ? ctx.activeTab === index : false;
  const anchorRef = useRef<HTMLAnchorElement>(null);

  const activeClass = usePrefixedClassNames({ 'is-active': isActive });

  const tabId = id ?? (ctx ? `${ctx.baseId}-tab-${index}` : undefined);
  const registerTab = ctx?.registerTab;
  useEffect(() => {
    if (!registerTab || tabId === undefined) return undefined;
    return registerTab({ index, id: tabId, disabled: !!disabled });
  }, [registerTab, index, tabId, disabled]);

  // Outside a Tabs there is no list to rove, so every enabled tab stays in
  // the page tab order, as it always did.
  let tabIndex: number;
  if (disabled) tabIndex = -1;
  else if (ctx) tabIndex = ctx.tabStop === index ? 0 : -1;
  else tabIndex = 0;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled && ctx) {
        ctx.setActiveTab(index);
      }
    },
    [disabled, ctx, index]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Activate through a click on the inner <a>, the element a pointer
      // clicks, so click listeners see keyboard activation the way they see
      // a native button's.
      (anchorRef.current as HTMLAnchorElement).click();
      return;
    }
    const target = findTargetTab(
      e.currentTarget,
      e.key,
      ctx?.orientation === 'vertical'
    );
    if (target) {
      e.preventDefault();
      target.focus();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLLIElement>) => {
    onFocus?.(e);
    ctx?.setFocusedTab(index);
  };

  const handleBlur = (e: React.FocusEvent<HTMLLIElement>) => {
    onBlur?.(e);
    const list = e.currentTarget.parentElement as HTMLElement;
    if (!list.contains(e.relatedTarget)) ctx?.setFocusedTab(null);
  };

  return (
    <li
      className={classNames(activeClass, className) || undefined}
      role="tab"
      id={tabId}
      aria-selected={isActive}
      aria-controls={ctx?.panelId(index)}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      <a
        ref={anchorRef}
        onClick={handleClick}
        aria-disabled={disabled || undefined}
      >
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
    className={
      classNames({ [usePrefixedClassNames('is-active')]: active }, className) ||
      undefined
    }
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
 * @extraProp {string} [id] - The panel's id, which its tab names in `aria-controls`. Generated inside a `Tabs` when omitted; a passed `id` is used and the tab follows it.
 * @extraProp {number} [tabIndex] - The panel is not focusable by default. Pass `0` when it holds nothing focusable, so Tab moves from the tab list into it.
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
  id,
  ...props
}) => {
  const ctx = useTabsContext();
  const isActive = ctx ? ctx.activeTab === index : false;

  const itemClass = usePrefixedClassNames('tabs-content-item', {
    'is-active': isActive,
  });

  const panelId = id ?? (ctx ? `${ctx.baseId}-panel-${index}` : undefined);
  const registerPanel = ctx?.registerPanel;
  useEffect(() => {
    if (!registerPanel || panelId === undefined) return undefined;
    return registerPanel({ index, id: panelId });
  }, [registerPanel, index, panelId]);

  return (
    <div
      className={classNames(itemClass, className)}
      role="tabpanel"
      id={panelId}
      aria-labelledby={ctx?.tabId(index)}
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
