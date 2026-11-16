import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import {
  prefixedClassNames,
  usePrefixedClassNames,
} from '../helpers/classNames';
import { useClassPrefix } from '../helpers/Config';
import type { BulmaClassesProps } from '../helpers/useBulmaClasses';
import { warnOnce } from '../helpers/devWarnings';
import { useLocaleMatcher } from '../helpers/localeFormat';
import { StatusRegion, spokenText } from '../helpers/statusRegion';
import { useControlled } from '../helpers/useControlled';
import { useMenuKeys } from '../helpers/useMenuKeys';
import { getActiveElementInTree } from '../helpers/shadowDom';
import { isGiven } from '../helpers/isGiven';
import {
  useLoadPhase,
  useLoadRegion,
  type LoadRegion,
} from '../helpers/loadAnnouncements';
import {
  useCascaderColumns,
  type CascaderColumn,
  type CascaderColumnsEngine,
} from '../helpers/useCascaderColumns';
import {
  indexTree,
  isParentNode,
  nodeLabel,
  nodesTo,
  treePaths,
} from '../helpers/treeData';
import { Icon } from '../elements/Icon';
import { Combobox } from './Combobox';
import type { FormFieldProps } from './fieldProps';
import { useFieldsetDisabled } from './FormContext';
import type { PickerPosition } from './_pickerInternals/pickerTypes';
import { DialogSelect, type PanelName } from './_selectInternals/DialogSelect';
import type { TreeItemData } from './TreeSelect';

/** The visible and accessible strings, in your app's language. */
export interface CascaderLabels {
  /**
   * Names the panel and its first column.
   * @defaultValue the field's label
   */
  choose?: string;
  /**
   * Names the search box and its results.
   * @defaultValue 'Search'
   */
  search?: string;
  /**
   * Names the clear button.
   * @defaultValue 'Clear'
   */
  clear?: string;
  /**
   * Sits between the path's labels in the field and in search results.
   * @defaultValue ' / '
   */
  separator?: string;
  /**
   * Describes an item that opens a column, since a listbox's option can't
   * say it has items of its own.
   * @defaultValue 'Opens a column'
   */
  opens?: string;
  /**
   * What a loading column's row says, as on TreeView.
   * @defaultValue 'Loading…'
   */
  loading?: string;
  /**
   * The Retry button's text on a failed load's row, as on TreeView.
   * @defaultValue 'Retry'
   */
  retry?: string;
  /**
   * What the live region says when a column starts loading, built from the
   * name of the item that opened it, as on TreeView.
   * @defaultValue name => `Loading ${name}`
   */
  loadingAnnouncement?: (name: string) => string;
  /**
   * What the live region says when that load finishes, as on TreeView.
   * @defaultValue name => `${name} loaded`
   */
  loadedAnnouncement?: (name: string) => string;
}

/**
 * Props for the Cascader component. The helper props and the other
 * attributes land on the `div.cascader` around the field, as Combobox's do,
 * and the `ref` on the field. It renders the `Field` and the label itself,
 * unless an outer `Field` already does.
 *
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Ref forwarded to the field, the read-only `<input role="combobox">`.
 */
export interface CascaderProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'color' | 'onChange' | 'defaultValue' | 'children'
    >,
    Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
  /** The tree, as nodes nested through `children`. The same nodes TreeSelect takes. */
  data: TreeItemData[];
  /**
   * The field's label, which names the field through `htmlFor`, and the
   * panel and its first column through `aria-labelledby`. Dropped inside an
   * outer `Field`, whose label names them instead.
   */
  label?: React.ReactNode;
  /** The field's `id`, which the label then points at. The panel's is this one with `-panel` after it. */
  id?: React.HTMLAttributes<HTMLDivElement>['id'];
  /** Names the field, and the panel and its first column, in place of a `label`. */
  'aria-label'?: React.AriaAttributes['aria-label'];
  /** The ids of what names the field, and the panel and its first column, in place of a `label`. */
  'aria-labelledby'?: React.AriaAttributes['aria-labelledby'];
  /** The ids of what describes the field. */
  'aria-describedby'?: React.AriaAttributes['aria-describedby'];
  /** The picked node's value when you hold the state, or `null` for none. Picking then only calls `onChange`. */
  value?: string | null | undefined;
  /** The node picked to begin with, when the Cascader holds its own state. */
  defaultValue?: string | null | undefined;
  /**
   * Called with the picked node's value, or `null` when it's cleared. The
   * field shows its path. A reset of the field's form calls it too, with
   * `defaultValue`, or with `null` when you hold the value, for you to set.
   */
  onChange?: ((value: string | null) => void) | undefined;
  /**
   * A parent can be picked too: its row, Enter and Space pick it, and Right
   * or its chevron opens its column. Without it, only leaves are picked, and
   * a parent's row, Enter and Space open its column. TreeSelect, which takes
   * the same `data`, defaults to `true`, as Ant Design's does, so moving a
   * field from one to the other means setting this to keep what it picks.
   * @defaultValue false
   */
  parentsSelectable?: boolean;
  /**
   * Closes the panel after a pick and puts focus back on the field.
   * @defaultValue true
   */
  closeOnSelect?: boolean;
  /**
   * The values of the items whose columns are open, which is the open path,
   * when you hold the state. Opening the panel opens the picked node's path
   * and reports it through `onExpandedChange`: at once for a click or a key,
   * and only once the panel is on the page when you open it yourself, with
   * `open` or `defaultOpen`. So when you hold this and open the panel
   * yourself, set it to the path you want open.
   */
  expanded?: string[];
  /** The path open to begin with, when the Cascader holds its own state. */
  defaultExpanded?: string[];
  /**
   * Called with the new path whenever a column opens or closes, opening the
   * panel on the picked node's path included. Fetch a lazy column's items
   * from here.
   */
  onExpandedChange?: (expanded: string[]) => void;
  /** Whether the panel is open, controlled: opening and closing then only call `onOpenChange`. */
  open?: boolean | undefined;
  /** The panel is open to begin with. */
  defaultOpen?: boolean;
  /** Called with the new state when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Puts a search box at the top of the panel. While it has text, the
   * columns give way to a list of matching paths, leaves only unless
   * `parentsSelectable`. A printable key on the field opens the panel with
   * it in the box, and the search empties when the panel closes.
   */
  searchable?: boolean;
  /** The search text when you hold the state. */
  query?: string;
  /** The search text to begin with. */
  defaultQuery?: string;
  /** Called with the search text as it changes. */
  onQueryChange?: (query: string) => void;
  /**
   * Whether a path matches the search, in place of the locale-aware match
   * on any of its labels. It's handed the search text trimmed, the node
   * offered, and its path from the top node down, the node last, as
   * TreeSelect's `filter` is. The search runs again when the search text or
   * `data` changes, not when only this does, so one written inline costs
   * nothing.
   */
  filter?: (query: string, item: TreeItemData, path: TreeItemData[]) => boolean;
  /** What the panel shows when the search matches nothing, such as "No cities match". Announced once. */
  empty?: React.ReactNode;
  /** Renders a row's content in place of its label. The field and search results still show the labels. */
  itemTemplate?: (item: TreeItemData) => React.ReactNode;
  /** What the field shows while nothing is picked. */
  placeholder?: string | undefined;
  /** A form field name. A hidden input posts the picked node's value, empty while nothing is picked. */
  name?: string | undefined;
  /** The id of the form the hidden input belongs to, when it isn't an ancestor. */
  form?: string | undefined;
  /**
   * A value is needed: the field is `aria-required`, and the form won't
   * submit while nothing is picked. The browser's message points at the
   * field, which shows focus, and the next key goes to it.
   */
  required?: boolean | undefined;
  /** The field can't be used: it can't be focused or opened, and its hidden input doesn't post. */
  disabled?: boolean | undefined;
  /** Shows a clear button at the field's inline end while something is picked. */
  clearable?: boolean;
  /** Bulma color modifier for the field. */
  color?:
    'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger' | undefined;
  /** The field's size, which the columns follow. */
  size?: 'small' | 'medium' | 'large' | undefined;
  /** Rounds the field's corners (Bulma's `is-rounded`). */
  isRounded?: boolean;
  /**
   * Where the panel opens against the field, as on the pickers. Left out, it
   * opens below and lines up with the field's start edge, which is its right
   * edge on a right-to-left page. A corner you pass stays physical, so
   * `bottom-left` lines up the left edges either way.
   * @defaultValue 'bottom-left'
   */
  position?: PickerPosition;
  /** Renders the panel through a portal, into a `ConfigProvider`'s `portalContainer`, else the overlay it's in that takes its popups, such as a `Modal`, else `document.body`. */
  appendToBody?: boolean;
  /** The visible and accessible strings, in your app's language. */
  labels?: CascaderLabels;
}

/** What takes focus as the panel opens. */
const INITIAL_FOCUS = '[data-initial-focus]';

/** Whether a search result can't be picked: some node on its path is disabled. */
const isPathDisabled = (path: TreeItemData[]) =>
  path.some(step => step.disabled);

/** What a column's items do, handed down from the Cascader. */
interface ColumnContext {
  engine: CascaderColumnsEngine;
  keys: ReturnType<typeof useMenuKeys>;
  region: LoadRegion;
  /** Whether a node can be picked: enabled, and a leaf unless parents can be. */
  pickable: (node: TreeItemData) => boolean;
  pick: (value: string) => void;
  /** The item focus lands on as the panel opens. */
  focusTarget: string | undefined;
  /** The values on the picked node's path, from the top down. */
  picked: Set<string>;
  hintId: string;
  itemTemplate?: (item: TreeItemData) => React.ReactNode;
  loadingLabel: string;
  retryLabel: string;
}

/** Props for one column. */
interface ColumnProps {
  context: ColumnContext;
  column: CascaderColumn;
  at: number;
  /** What names the column: the panel's name for the first. */
  name: PanelName;
}

/**
 * One column, a listbox of the items under the node that opened it, with a
 * roving tab stop: its item on the open path, or else its first enabled one.
 * An item on the picked node's path is `aria-selected`. A parent whose items
 * are on their way, or failed to load, ends its column in a row that says
 * so, which the live region reads out as TreeView's does.
 */
function CascaderList({ context, column, at, name }: ColumnProps) {
  const { engine, keys, region, pickable, pick, focusTarget, hintId, picked } =
    context;
  const prefix = useClassPrefix();
  const { parent, items, current } = column;

  const status = !parent
    ? null
    : parent.isLoading
      ? 'loading'
      : isGiven(parent.loadError)
        ? 'error'
        : null;
  const retry = status === 'error' ? parent!.onRetry : undefined;
  const statusId = useId();
  const statusKey = `${statusId}-row`;
  const statusLabelRef = useRef<HTMLSpanElement>(null);
  useLoadPhase(
    parent ? (status ?? 'open') : 'closed',
    statusId,
    region.announce,
    () => ({
      name: nodeLabel(parent!),
      message: statusLabelRef.current ? spokenText(statusLabelRef.current) : '',
    })
  );

  // The tab stop: the current item, the first enabled one, or the row.
  const tabStop =
    current ??
    items.find(item => !item.disabled)?.value ??
    (status ? statusKey : items[0]?.value);

  // A load's row that leaves while it has focus, with its column or alone,
  // hands focus on, so it doesn't drop out of the panel.
  const statusRef = useRef<HTMLLIElement | null>(null);
  const { lostFocus } = engine;
  const setStatusRef = useCallback(
    (node: HTMLLIElement | null) => {
      const row = statusRef.current;
      if (!node && row?.contains(getActiveElementInTree(row))) lostFocus(at);
      statusRef.current = node;
    },
    [lostFocus, at]
  );

  const listClass = prefixedClassNames(prefix, 'cascader-column');
  const chevronClass = prefixedClassNames(prefix, 'cascader-item-chevron');
  const iconClass = prefixedClassNames(prefix, 'cascader-icon');
  const labelClass = prefixedClassNames(prefix, 'cascader-label');
  const loaderClass = prefixedClassNames(prefix, 'loader');
  const retryClass = prefixedClassNames(prefix, 'button', 'is-small');

  return (
    <ul
      {...name}
      className={listClass}
      role="listbox"
      // It scrolls, and Firefox makes a scroller a Tab stop of its own.
      tabIndex={-1}
      onKeyDown={keys.onKeyDown}
      onFocus={event => {
        // Type-ahead starts over in each column it comes into, from the
        // field or from another column.
        const from = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(from)) keys.reset();
      }}
    >
      {items.map(node => {
        const isParent = isParentNode(node);
        const disabled = !!node.disabled;
        const isPicked = picked.has(node.value);
        return (
          <li
            key={node.value}
            className={prefixedClassNames(
              prefix,
              'dropdown-item',
              'cascader-item',
              {
                // As Combobox's: the open path, which follows focus, is
                // active, and the picked path checked. A disabled one is
                // selected but not filled, where its text would be hard to
                // read.
                'is-active': node.value === current,
                'is-checked': isPicked && !disabled,
                'is-disabled': disabled,
              }
            )}
            role="option"
            aria-selected={isPicked}
            aria-disabled={disabled || undefined}
            aria-describedby={isParent && !disabled ? hintId : undefined}
            tabIndex={node.value === tabStop ? 0 : -1}
            data-initial-focus={node.value === focusTarget ? '' : undefined}
            onFocus={() => engine.moveTo(at, node.value)}
            onKeyDown={event => engine.onKeyDown(event, at, node)}
            onClick={event => {
              if (disabled) return;
              const onChevron =
                isParent &&
                !!(event.target as Element).closest(`.${chevronClass}`);
              if (!onChevron && pickable(node)) pick(node.value);
              else engine.open(at, node);
            }}
          >
            {isGiven(node.icon) && (
              <span className={iconClass} aria-hidden="true">
                {typeof node.icon === 'string' ? (
                  <Icon name={node.icon} />
                ) : (
                  node.icon
                )}
              </span>
            )}
            <span className={labelClass}>
              {context.itemTemplate
                ? context.itemTemplate(node)
                : nodeLabel(node)}
            </span>
            {isParent && <span className={chevronClass} aria-hidden="true" />}
          </li>
        );
      })}
      {status && (
        <li
          ref={setStatusRef}
          className={prefixedClassNames(
            prefix,
            'dropdown-item',
            'cascader-item',
            'cascader-status',
            {
              'is-disabled': !retry,
            }
          )}
          role="option"
          aria-selected={false}
          aria-labelledby={
            retry ? `${statusId}-label ${statusId}-retry` : `${statusId}-label`
          }
          aria-disabled={!retry || undefined}
          tabIndex={tabStop === statusKey ? 0 : -1}
          onKeyDown={event => engine.onKeyDown(event, at, null)}
          onClick={() => retry?.()}
        >
          {status === 'loading' && (
            <span className={loaderClass} aria-hidden="true" />
          )}
          <span
            className={labelClass}
            id={`${statusId}-label`}
            ref={statusLabelRef}
          >
            {status === 'loading' ? context.loadingLabel : parent!.loadError}
          </span>
          {retry && (
            // Drawn, but the row is what's pressed and its name says so.
            <span
              className={retryClass}
              id={`${statusId}-retry`}
              aria-hidden="true"
            >
              {context.retryLabel}
            </span>
          )}
        </li>
      )}
    </ul>
  );
}

/**
 * The `Cascader` component is a form field whose value sits at the end of a path, such as a city picked by country, then region, then city: it opens a panel of columns, one per level, and shows the path in the field.
 *
 * It's TreeSelect's field and `data` with columns in place of a tree. The
 * field is a read-only `role="combobox"` that opens a dialog, wired as
 * DateInput's is, holding one `role="listbox"` per open level, each named
 * after the item that opened it, with real focus moving through them. Up,
 * Down, Home, End and type-ahead move within a column, and the path you've
 * opened follows focus, drawn with a tint, Right opens the next column and
 * moves into it, and Left goes back. Only the picked node's path is
 * `aria-selected`, filled in the colors Bulma gives an active dropdown item,
 * so moving around never announces an item as selected that isn't.
 *
 * The value is the picked node's own `value`, unique across the tree, as in
 * TreeView and TreeSelect, and the field works the path out from `data`, so
 * it's right on the server. Leaves are picked, and any level with
 * `parentsSelectable`. A value no node has is kept and shown as it is, with
 * a warning in development.
 *
 * @function
 * @param {CascaderProps} props - Props for the Cascader component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the field.
 * @returns {JSX.Element} The field and its panel, in a `Field` with the label unless one is around it.
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ | APG Combobox Pattern}
 *
 * @example
 * <Cascader
 *   label="City"
 *   name="city"
 *   data={[
 *     { value: 'germany', label: 'Germany', children: [{ value: 'berlin', label: 'Berlin' }] },
 *   ]}
 * />
 */
export const Cascader = forwardRef<HTMLInputElement, CascaderProps>(
  (props, ref) => {
    const {
      data,
      value: valueProp,
      defaultValue,
      onChange,
      parentsSelectable = false,
      closeOnSelect = true,
      expanded: expandedProp,
      defaultExpanded = [],
      onExpandedChange,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      searchable = false,
      query: queryProp,
      defaultQuery = '',
      onQueryChange,
      filter,
      empty,
      itemTemplate,
      disabled: disabledProp,
      clearable = false,
      size,
      labels,
      ...rest
    } = props;
    const disabled = useFieldsetDisabled(disabledProp);
    const index = useMemo(() => indexTree(data), [data]);
    const separator = labels?.separator ?? ' / ';

    const [value, setValue] = useControlled(valueProp, defaultValue ?? null);
    const change = (next: string | null) => {
      setValue(next);
      onChange?.(next);
    };
    const pathText = (value: string) =>
      nodesTo(index, value).map(nodeLabel).join(separator) || value;

    const unknown = value !== null && !index.has(value) ? value : undefined;
    useEffect(() => {
      if (unknown !== undefined) {
        warnOnce(
          'Cascader:unknown-value',
          `[bestax-bulma] <Cascader> was given the value "${unknown}", ` +
            'which no node in its data has. It is kept and shown as it is, ' +
            'as it should be for a node under a column that has not loaded ' +
            'yet. Otherwise, check the value against the data.'
        );
      }
    }, [unknown]);

    const [query, setQueryState] = useControlled(queryProp, defaultQuery);
    const setQuery = (next: string) => {
      if (next === query) return;
      setQueryState(next);
      onQueryChange?.(next);
    };

    const [isOpen, setOpenState] = useControlled(openProp, defaultOpen);
    // The columns open the picked node's path whenever the panel opens: here
    // for a click or a key, and in the engine for `defaultOpen` or a held
    // `open`.
    const engine = useCascaderColumns({
      data,
      index,
      // As the panel shows it: a disabled Cascader shows none.
      open: isOpen && !disabled,
      value,
      expanded: expandedProp,
      defaultExpanded,
      onExpandedChange,
    });
    const keys = useMenuKeys({
      itemSelector: '[role="option"]',
      disabledReachable: true,
      spaceJoinsSearch: true,
    });
    const region = useLoadRegion(
      labels?.loadingAnnouncement,
      labels?.loadedAnnouncement
    );
    const setOpen = (next: boolean) => {
      if (next === isOpen) return;
      if (next) engine.reveal(value);
      setOpenState(next);
      onOpenChange?.(next);
    };
    // The search empties as the panel closes, however it closes: from in
    // here, through a held `open`, or as the Cascader is disabled.
    const shown = isOpen && !disabled;
    const wasShownRef = useRef(shown);
    useEffect(() => {
      const was = wasShownRef.current;
      wasShownRef.current = shown;
      if (was && !shown) setQuery('');
    });
    const picked = useMemo(
      () =>
        new Set(value === null ? [] : nodesTo(index, value).map(n => n.value)),
      [index, value]
    );

    const pickable = (node: TreeItemData) =>
      !node.disabled && (parentsSelectable || !isParentNode(node));
    const pick = (next: string) => {
      if (next !== value) change(next);
      if (closeOnSelect) setOpen(false);
    };

    // The search: every path, leaves only unless parents can be picked,
    // that matches the text on any of its labels, or the app's `filter`.
    const matchText = useLocaleMatcher();
    const typed = searchable ? query.trim() : '';
    const paths = useMemo(
      () => (searchable ? treePaths(data) : []),
      [searchable, data]
    );
    const matches = useMemo(() => {
      if (!typed) return [];
      const hit = (text: string) =>
        matchText
          ? matchText(text, typed)
          : text.toLowerCase().includes(typed.toLowerCase());
      return paths.filter(path => {
        const node = path[path.length - 1];
        if (!parentsSelectable && isParentNode(node)) return false;
        return filter
          ? filter(typed, node, path)
          : path.some(step => hit(nodeLabel(step)));
      });
      // `filter` is read as it is when the text or the data changes: one
      // written inline is a new function every render, and listing it would
      // search again on each.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paths, typed, parentsSelectable, matchText]);

    // Focus lands on the picked node as the panel opens, or else on the
    // first column's tab stop, which keeps an open path as it is; while a
    // search has text, on the search box.
    const firstColumn = engine.columns[0];
    const focusTarget = engine.columns.some(
      column => value !== null && column.current === value
    )
      ? value!
      : (firstColumn.current ??
        firstColumn.items.find(node => !node.disabled)?.value ??
        firstColumn.items[0]?.value);

    const inputRef = useRef<HTMLInputElement | null>(null);
    // A forwarded callback's cleanup, which React 19 lets it return, run on
    // detach in place of a call with `null`, on React 18 as well.
    const refCleanupRef = useRef<(() => void) | null>(null);
    const fieldRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          if (node === null) {
            const cleanup = refCleanupRef.current;
            refCleanupRef.current = null;
            if (cleanup) cleanup();
            else ref(null);
            return;
          }
          const cleanup: unknown = ref(node);
          refCleanupRef.current =
            typeof cleanup === 'function' ? (cleanup as () => void) : null;
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );
    const hintId = useId();
    const searchId = useId();
    const searchLabel = labels?.search || 'Search';
    const columnsClass = usePrefixedClassNames('cascader-columns');
    const searchClass = usePrefixedClassNames('cascader-search');

    const context: ColumnContext = {
      engine,
      keys,
      region,
      pickable,
      pick,
      focusTarget: typed ? undefined : focusTarget,
      picked,
      hintId,
      itemTemplate,
      loadingLabel: labels?.loading || 'Loading…',
      retryLabel: labels?.retry || 'Retry',
    };

    return (
      <DialogSelect
        {...rest}
        component="Cascader"
        rootClass="cascader"
        panelClass="cascader-panel"
        text={value === null ? '' : pathText(value)}
        values={[value ?? '']}
        hasValue={value !== null}
        open={isOpen}
        onOpenChange={setOpen}
        onPrintableKey={
          searchable
            ? key => {
                setQuery(key);
                setOpen(true);
                return true;
              }
            : undefined
        }
        onClear={() => change(null)}
        clearable={clearable}
        clearLabel={labels?.clear || 'Clear'}
        chooseLabel={labels?.choose}
        disabled={disabled}
        size={size}
        inputRef={inputRef}
        fieldRef={fieldRef}
        initialFocusSelector={INITIAL_FOCUS}
        onFormReset={() => {
          // Back to `defaultValue`, or to nothing for a held value, which
          // its owner sets from `onChange`.
          const back = valueProp === undefined ? (defaultValue ?? null) : null;
          if (back !== value) change(back);
        }}
      >
        {panelName => (
          <>
            {searchable && (
              <Combobox
                inline
                keepFirst
                size={size}
                className={searchClass}
                // After the search box's own keys, which take Enter for a
                // highlighted result. Any other Enter in the box would
                // submit the form, so none goes on, as in TreeSelect's.
                onKeyDown={event => {
                  if (
                    event.key === 'Enter' &&
                    (event.target as Element).id === searchId
                  ) {
                    event.preventDefault();
                  }
                }}
                onSelect={next => {
                  // The columns behind the search show where it is.
                  engine.reveal(next);
                  pick(next);
                }}
              >
                <Combobox.Input
                  id={searchId}
                  type="search"
                  aria-label={searchLabel}
                  value={query}
                  data-initial-focus={typed ? '' : undefined}
                  onChange={event => setQuery(event.target.value)}
                  onFocus={event => {
                    // A key that opened the panel is in the box: type after it.
                    const { length } = event.currentTarget.value;
                    event.currentTarget.setSelectionRange(length, length);
                  }}
                />
                {typed &&
                  (matches.length > 0 ? (
                    <Combobox.List aria-label={searchLabel}>
                      {matches.map(path => {
                        const node = path[path.length - 1];
                        return (
                          <Combobox.Item
                            key={node.value}
                            value={node.value}
                            disabled={isPathDisabled(path)}
                            checked={node.value === value}
                          >
                            {path.map(nodeLabel).join(separator)}
                          </Combobox.Item>
                        );
                      })}
                    </Combobox.List>
                  ) : (
                    isGiven(empty) && <Combobox.Empty>{empty}</Combobox.Empty>
                  ))}
              </Combobox>
            )}
            {!typed && (
              <div
                ref={engine.containerRef}
                className={columnsClass}
                // It scrolls sideways, and Firefox makes a scroller a Tab
                // stop of its own.
                tabIndex={-1}
              >
                {engine.columns.map((column, at) => (
                  <CascaderList
                    // Apart from every node's value, `''` included.
                    key={column.parent ? `node:${column.parent.value}` : 'top'}
                    context={context}
                    column={column}
                    at={at}
                    name={
                      column.parent
                        ? { 'aria-label': nodeLabel(column.parent) }
                        : panelName
                    }
                  />
                ))}
              </div>
            )}
            <span id={hintId} hidden>
              {labels?.opens || 'Opens a column'}
            </span>
            <StatusRegion
              items={region.announcements}
              describe={region.describe}
            />
          </>
        )}
      </DialogSelect>
    );
  }
);

Cascader.displayName = 'Cascader';

export default Cascader;
