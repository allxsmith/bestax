import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePrefixedClassNames } from '../helpers/classNames';
import type { BulmaClassesProps } from '../helpers/useBulmaClasses';
import { warnOnce } from '../helpers/devWarnings';
import { useLocaleMatcher } from '../helpers/localeFormat';
import { StatusRegion, spokenText } from '../helpers/statusRegion';
import {
  TreeViewHiddenContext,
  toggledList,
  useControlled,
} from '../helpers/useTreeView';
import {
  checkRecords,
  checkedByStrategy,
  indexTree,
  isParentNode,
  nodeLabel,
  searchTree,
} from '../helpers/treeData';
import { TreeView } from '../components/TreeView';
import type { FormFieldProps } from './fieldProps';
import { useFieldsetDisabled } from './FormContext';
import type { PickerPosition } from './_pickerInternals/pickerTypes';
import { DialogSelect } from './_selectInternals/DialogSelect';
import { ValueTags, tagIds } from './_selectInternals/ValueTags';

/**
 * One node in a TreeSelect's `data`: Combobox's item fields plus
 * TreeView.Item's, with `children` for the nodes under it.
 */
export interface TreeItemData {
  /** **Required.** What the value holds and `name` posts. Unique in the whole tree. */
  value: string;
  /** What the row, the field and the tags show, and what search matches. The `value` when it's left out. */
  label?: string;
  /** Reachable, but never picked, checked, opened or closed. */
  disabled?: boolean;
  /** A picture before the label: an `Icon` name, or a node. Hidden from assistive tech. */
  icon?: React.ReactNode;
  /** The nodes under this one. */
  children?: TreeItemData[];
  /** Shows the node as a parent before its children are known, for a branch that loads when it opens. */
  hasChildren?: boolean;
  /** Its children are on their way: an open branch ends in a row that says so, and the live region says it too. */
  isLoading?: boolean;
  /** Its children didn't load: an open branch ends in this message, with a Retry button when there's an `onRetry`. */
  loadError?: React.ReactNode;
  /** Called by the Retry button on a failed load's row. Set `isLoading` while the retry runs. */
  onRetry?: () => void;
}

/** What a checked branch puts in the value and the tags. */
export type TreeSelectCheckedStrategy = 'child' | 'parent' | 'all';

/** The visible and accessible strings, in your app's language. */
export interface TreeSelectLabels {
  /** Names the panel and the tree in it. Default: the field's label. */
  choose?: string;
  /** Names the search box. Default: "Search". */
  search?: string;
  /** Names the clear button. Default: "Clear". */
  clear?: string;
}

/**
 * What every TreeSelect takes. The helper props and the other attributes
 * land on the root `<div>`, as Combobox's do, and the `ref` on the field.
 */
interface TreeSelectBaseProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'color' | 'onChange' | 'defaultValue'
    >,
    Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
  /** **Required.** The tree, as nodes nested through `children`. */
  data: TreeItemData[];
  /**
   * The field's label, which names the field through `htmlFor`, and the
   * panel and the tree in it through `aria-labelledby`. Dropped inside an
   * outer `Field`, whose label names them instead.
   */
  label?: React.ReactNode;
  /** The field's `id`, which the label then points at. The panel's is this one with `-panel` after it. */
  id?: string;
  /** Names the field, and the panel and the tree, in place of a `label`. */
  'aria-label'?: string;
  /** The ids of what names the field, and the panel and the tree, in place of a `label`. */
  'aria-labelledby'?: string;
  /** The ids of what describes the field, ahead of the tags. */
  'aria-describedby'?: string;
  /** The open branches' values when you hold the state, as TreeView's `expanded`. */
  expanded?: string[];
  /** The branches open to begin with, when TreeSelect holds its own state. */
  defaultExpanded?: string[];
  /**
   * Called with the new list whenever a branch opens or closes, opening the
   * panel on the picked item's branch included. Fetch a lazy branch's
   * children from here. The branches a search opens aren't in it.
   */
  onExpandedChange?: (expanded: string[]) => void;
  /** Whether the panel is open, when you hold the state. Opening and closing then only call `onOpenChange`. */
  open?: boolean;
  /** The panel is open to begin with. */
  defaultOpen?: boolean;
  /** Called with the new state when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Puts a search box at the top of the panel. It matches labels, keeps a
   * match's ancestors and the nodes under it, and opens every branch with a
   * match. A printable key on the field opens the panel with it in the box,
   * and the search empties when the panel closes.
   */
  searchable?: boolean;
  /** The search text when you hold the state. */
  query?: string;
  /** The search text to begin with. */
  defaultQuery?: string;
  /** Called with the search text as it changes. */
  onQueryChange?: (query: string) => void;
  /**
   * Whether a node matches the search, in place of the locale-aware match on
   * its label. It's handed the search text trimmed. A match's ancestors stay
   * either way.
   */
  filter?: (query: string, item: TreeItemData) => boolean;
  /** What the panel shows when the search matches nothing, such as "No folders match". Announced once. */
  empty?: React.ReactNode;
  /** Renders a row's content in place of its label. The field and the tags still show the label. */
  itemTemplate?: (item: TreeItemData) => React.ReactNode;
  /** What the field shows while nothing is picked. */
  placeholder?: string;
  /** A form field name. A hidden input posts the value, or one per value in the checkbox modes. */
  name?: string;
  /** The id of the form the hidden inputs belong to, when it isn't an ancestor. */
  form?: string;
  /**
   * A value is needed: the field is `aria-required`, and the form won't
   * submit while nothing is picked. The browser's message points at the
   * field, and focus goes to it.
   */
  required?: boolean;
  /** The field can't be used: it can't be focused or opened, its tags lose their buttons, and its hidden inputs don't post. */
  disabled?: boolean;
  /** Shows a clear button at the field's inline end while something is picked. */
  clearable?: boolean;
  /** Bulma color modifier for the field. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** The field's size, which the tree in the panel follows. */
  size?: 'small' | 'medium' | 'large';
  /** Rounds the field's corners (Bulma's `is-rounded`). */
  isRounded?: boolean;
  /**
   * Where the panel opens, relative to the field, as on the pickers.
   * @defaultValue 'bottom-left'
   */
  position?: PickerPosition;
  /** Renders the panel through a portal, into a `ConfigProvider`'s `portalContainer`, `document.body` by default. */
  appendToBody?: boolean;
  /** The visible and accessible strings, in your app's language. */
  labels?: TreeSelectLabels;
  /** What a loading branch's row says, as on TreeView. In your app's language. */
  loadingLabel?: string;
  /** The Retry button's text on a failed load's row, as on TreeView. In your app's language. */
  retryLabel?: string;
  /** What the live region says when an open branch starts loading, as on TreeView. */
  loadingAnnouncement?: (name: string) => string;
  /** What the live region says when that load finishes, as on TreeView. */
  loadedAnnouncement?: (name: string) => string;
  /** @internal The tree comes from `data`. */
  children?: never;
}

/** Props for a TreeSelect that picks one item. */
export interface TreeSelectSingleProps extends TreeSelectBaseProps {
  /** `'single'`, the default: Enter, Space or a click on a row picks it. */
  selectionMode?: 'single';
  /** The picked item's value when you hold the state, or `null` for none. */
  value?: string | null;
  /** The item picked to begin with, when TreeSelect holds its own state. */
  defaultValue?: string | null;
  /** Called with the picked item's value, or `null` when it's cleared. */
  onChange?: (value: string | null) => void;
  /**
   * A parent's row picks the parent. `false` makes the row, Enter and Space
   * open it instead, so only leaves are picked.
   * @defaultValue true
   */
  parentsSelectable?: boolean;
  /**
   * Closes the panel after a pick and puts focus back on the field.
   * @defaultValue true
   */
  closeOnSelect?: boolean;
  /** Read with the checkbox modes only. */
  checkedStrategy?: never;
  /** Read with the checkbox modes only. */
  ariaCloseLabel?: never;
}

/** Props for a TreeSelect with a box on every item. */
export interface TreeSelectCheckboxProps extends TreeSelectBaseProps {
  /**
   * `'checkbox'`: a check reaches every enabled item under it, and a parent
   * with some of them checked is mixed. `'checkbox-independent'`: each box
   * checks its own item, so a parent means the parent alone.
   */
  selectionMode: 'checkbox' | 'checkbox-independent';
  /**
   * The checked values when you hold the state. In `'checkbox'`, a parent's
   * value checks its whole branch, so the list any `checkedStrategy` gives
   * checks the same boxes.
   */
  value?: string[];
  /** The values checked to begin with, when TreeSelect holds its own state. */
  defaultValue?: string[];
  /** Called with the new list after a check, an uncheck or a tag's button. */
  onChange?: (value: string[]) => void;
  /**
   * What a checked branch puts in the value and the tags, in `'checkbox'`:
   * `'child'` its leaves, `'parent'` its topmost checked item, `'all'` every
   * checked item, parents included. A checked disabled item is in all three,
   * since only its own value checks it. `'checkbox-independent'` always
   * reports exactly the checked items.
   * @defaultValue 'child'
   */
  checkedStrategy?: TreeSelectCheckedStrategy;
  /** Names each tag's button, in place of "Remove" and the item's label, as on Combobox. */
  ariaCloseLabel?: string;
  /** Read with `'single'` only. */
  parentsSelectable?: never;
  /** Read with `'single'` only: the panel stays open while boxes are checked. */
  closeOnSelect?: never;
}

/**
 * Props for the TreeSelect component. The helper props and the other
 * attributes land on the `div.tree-select` around the field, and the `ref`
 * on the field. It renders the `Field` and the label itself, unless an outer
 * `Field` already does.
 *
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Ref forwarded to the field, the read-only `<input role="combobox">`.
 */
export type TreeSelectProps = TreeSelectSingleProps | TreeSelectCheckboxProps;

const NOTHING_HIDDEN: ReadonlySet<string> = new Set();
const noMatches = [{ id: 'empty' }];
const nothingToSay: Array<{ id: string }> = [];
/** What takes focus as the panel opens. */
const INITIAL_FOCUS = '[data-initial-focus]';

/** One value or several, as a list. */
const asList = (value: string | string[] | null | undefined): string[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];

/** The list with every value of `more` it doesn't have added at the end. */
const withAll = (list: string[], more: string[]): string[] => [
  ...list,
  ...more.filter(value => !list.includes(value)),
];

/**
 * The `TreeSelect` component is a form field whose options are a tree, such as a folder, a place or a team: it opens a panel holding a real `TreeView`, picks one item or checks a branch at a time, and searches labels.
 *
 * The field is a read-only `role="combobox"` that opens a dialog, wired as
 * DateInput's is, so focus moves into the tree for real and the tree keeps
 * TreeView's keys, type-ahead and spoken output. The tree is given as `data`,
 * so the field and the tags can name what's picked while the panel is shut,
 * and on the server.
 *
 * `selectionMode` picks the kind. `'single'` picks one item and closes. With
 * `'checkbox'`, a check reaches every enabled item under it, closed or hidden
 * by a search, and `checkedStrategy` decides what the value holds: the
 * leaves, the topmost checked items or every one. With
 * `'checkbox-independent'`, each box is its own item's, so a parent means
 * itself alone (Mantine's and Ant Design's `checkStrictly`). The checked
 * items show as tags under the field.
 *
 * A value no node has is kept and shown as it is, with a warning in
 * development, so a value under a branch that hasn't loaded survives until
 * it does.
 *
 * @function
 * @param {TreeSelectProps} props - Props for the TreeSelect component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the field.
 * @returns {JSX.Element} The field, its tags and its panel, in a `Field` with the label unless one is around it.
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ | APG Combobox Pattern}
 *
 * @example
 * <TreeSelect
 *   label="Save to"
 *   data={[
 *     { value: 'docs', label: 'Documents', children: [{ value: 'invoices', label: 'Invoices' }] },
 *     { value: 'photos', label: 'Photos' },
 *   ]}
 *   searchable
 * />
 *
 * @example
 * <TreeSelect label="Regions" selectionMode="checkbox" checkedStrategy="parent" data={regions} />
 */
export const TreeSelect = forwardRef<HTMLInputElement, TreeSelectProps>(
  (props, ref) => {
    const {
      data,
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
      loadingLabel,
      retryLabel,
      loadingAnnouncement,
      loadedAnnouncement,
      selectionMode = 'single',
      value: valueProp,
      defaultValue,
      // Called below through `props`, which knows which value it takes.
      onChange: _onChange,
      parentsSelectable = true,
      closeOnSelect = true,
      checkedStrategy = 'child',
      ariaCloseLabel,
      children: _children,
      ...rest
    } = props;
    const disabled = useFieldsetDisabled(disabledProp);
    const single = selectionMode === 'single';
    const cascade = selectionMode === 'checkbox';

    const index = useMemo(() => indexTree(data), [data]);
    const records = useMemo(() => checkRecords(index), [index]);
    const labelFor = (value: string) => {
      const entry = index.get(value);
      return entry ? nodeLabel(entry.node) : value;
    };

    // The value, as a list: none or one in `single`.
    const controlled = valueProp !== undefined;
    const [ownValue, setOwnValue] = useState(() => asList(defaultValue));
    const listed = controlled ? asList(valueProp) : ownValue;
    const change = (next: string[]) => {
      if (!controlled) setOwnValue(next);
      // The mode decides which of the two `onChange` takes.
      const report = props.onChange as
        ((value: string | string[] | null) => void) | undefined;
      report?.(single ? (next[0] ?? null) : next);
    };
    // What the field, the tags and the hidden inputs show: in `checkbox`,
    // the list `checkedStrategy` gives for what's checked.
    const picked = single
      ? listed.slice(0, 1)
      : cascade
        ? checkedByStrategy(records, listed, checkedStrategy)
        : Array.from(new Set(listed));

    const unknown = picked.find(value => !index.has(value));
    useEffect(() => {
      if (unknown !== undefined) {
        warnOnce(
          'TreeSelect:unknown-value',
          `[bestax-bulma] <TreeSelect> was given the value "${unknown}", ` +
            'which no node in its data has. It is kept and shown as it is, ' +
            'as it should be for a node under a branch that has not loaded ' +
            'yet. Otherwise, check the value against the data.'
        );
      }
    }, [unknown]);

    const [expanded, setExpanded] = useControlled(
      expandedProp,
      defaultExpanded
    );
    const changeExpanded = (next: string[]) => {
      setExpanded(next);
      onExpandedChange?.(next);
    };

    // The picked item focus goes to: the first in the tree's order.
    const pickedSet = new Set(picked);
    const target = Array.from(index.keys()).find(value => pickedSet.has(value));

    const [query, setQueryState] = useControlled(queryProp, defaultQuery);
    // The branches a search opened that were closed during it.
    const [searchClosed, setSearchClosed] = useState<string[]>([]);
    const setQuery = (next: string) => {
      setSearchClosed([]);
      if (next === query) return;
      setQueryState(next);
      onQueryChange?.(next);
    };

    const [isOpen, setOpenState] = useControlled(openProp, defaultOpen);
    const setOpen = (next: boolean) => {
      if (next === isOpen) return;
      if (next) {
        // Opening shows the picked item, its branch open.
        const path = (target !== undefined && index.get(target)?.path) || [];
        if (path.some(value => !expanded.includes(value))) {
          changeExpanded(withAll(expanded, path));
        }
      } else {
        setQuery('');
      }
      setOpenState(next);
      onOpenChange?.(next);
    };

    const matchText = useLocaleMatcher();
    const typed = searchable ? query.trim() : '';
    const search = typed
      ? searchTree(data, node => {
          if (filter) return filter(typed, node);
          const text = nodeLabel(node);
          return matchText
            ? matchText(text, typed)
            : text.toLowerCase().includes(typed.toLowerCase());
        })
      : null;
    // The branches a search opens show open over the ones you opened, and
    // close again once it's cleared.
    const forced = search
      ? search.open.filter(value => !searchClosed.includes(value))
      : [];
    const shownExpanded = withAll(expanded, forced);
    const onTreeExpandedChange = (next: string[]) => {
      const closed = shownExpanded.filter(value => !next.includes(value));
      const opened = next.filter(value => !shownExpanded.includes(value));
      const closedForced = closed.filter(value => forced.includes(value));
      if (closedForced.length > 0) {
        setSearchClosed(current => [...current, ...closedForced]);
      }
      if (opened.length > 0 || closed.some(value => expanded.includes(value))) {
        changeExpanded([
          ...expanded.filter(value => !closed.includes(value)),
          ...opened,
        ]);
      }
    };

    // Whether an item is on the page with the panel open: every branch
    // above it open, and the search not hiding it.
    const visible = (value: string) =>
      !search?.hidden.has(value) &&
      (index.get(value)?.path ?? []).every(above =>
        shownExpanded.includes(above)
      );
    const focusTarget =
      target !== undefined && visible(target)
        ? target
        : data.find(node => visible(node.value))?.value;

    // Picking in `single`. TreeView shows `selected`, held here, and the
    // picks are made from the rows' own keys and clicks, so a parent can
    // open instead and a pick of the picked item still closes.
    const pickable = (node: TreeItemData) =>
      !node.disabled && (parentsSelectable || !isParentNode(node));
    const pick = (value: string) => {
      if (listed.length !== 1 || listed[0] !== value) change([value]);
      if (closeOnSelect) setOpen(false);
    };
    const toggleClass = usePrefixedClassNames('tree-view-toggle');
    const rowHandlers = (node: TreeItemData) =>
      single
        ? {
            onKeyDown: (event: React.KeyboardEvent<HTMLLIElement>) => {
              if (
                event.target !== event.currentTarget ||
                event.repeat ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                (event.key !== 'Enter' && event.key !== ' ')
              ) {
                return;
              }
              if (pickable(node)) {
                pick(node.value);
              } else if (!node.disabled && isParentNode(node)) {
                // TreeView leaves a key that's been used alone.
                event.preventDefault();
                onTreeExpandedChange(
                  shownExpanded.includes(node.value)
                    ? shownExpanded.filter(value => value !== node.value)
                    : [...shownExpanded, node.value]
                );
              }
            },
            onClick: (event: React.MouseEvent<HTMLLIElement>) => {
              const target = event.target as Element;
              // A click in this item's own row, not one bubbling up from an
              // item inside it, and not on its chevron, which only opens it.
              if (
                target.closest('[role="treeitem"]') === event.currentTarget &&
                !(isParentNode(node) && target.closest(`.${toggleClass}`)) &&
                pickable(node)
              ) {
                pick(node.value);
              }
            },
          }
        : undefined;

    const renderNode = (node: TreeItemData): React.ReactNode => (
      <TreeView.Item
        key={node.value}
        value={node.value}
        label={itemTemplate ? itemTemplate(node) : nodeLabel(node)}
        icon={node.icon}
        hasChildren={node.hasChildren}
        isLoading={node.isLoading}
        loadError={node.loadError}
        onRetry={node.onRetry}
        disabled={node.disabled}
        data-initial-focus={
          !searchable && node.value === focusTarget ? '' : undefined
        }
        {...rowHandlers(node)}
      >
        {node.children?.map(renderNode)}
      </TreeView.Item>
    );

    // In `checkbox`, TreeView reports every checked item, read here into
    // the list `checkedStrategy` gives. A tag's button unchecks its item the
    // way its box does.
    const onCheckedChange = (next: string[]) =>
      change(
        cascade ? checkedByStrategy(records, next, checkedStrategy) : next
      );
    const remove = (value: string) =>
      onCheckedChange(
        cascade && records.has(value)
          ? toggledList(records, listed, value)
          : listed.filter(item => item !== value)
      );
    const inputRef = useRef<HTMLInputElement | null>(null);
    const tagsId = useId();
    const ids = tagIds(tagsId, picked);

    const searchClass = usePrefixedClassNames('input', 'tree-select-search', {
      [`is-${size}`]: !!size,
    });
    const emptyClass = usePrefixedClassNames('tree-select-empty');
    const treeRef = useRef<HTMLUListElement>(null);
    const emptyRef = useRef<HTMLDivElement>(null);
    const nothingFound = !!search && !search.found;
    // The region reads the text on screen, whatever `empty` renders.
    const describeEmpty = useCallback(() => {
      const node = emptyRef.current;
      /* istanbul ignore if: it's only announced while it's on screen */
      if (!node) return null;
      return spokenText(node);
    }, []);

    return (
      <DialogSelect
        {...rest}
        component="TreeSelect"
        rootClass="tree-select"
        panelClass="tree-select-panel"
        text={single && picked.length > 0 ? labelFor(picked[0]) : ''}
        values={single ? [picked[0] ?? ''] : picked}
        hasValue={picked.length > 0}
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
        onClear={() => change([])}
        clearable={clearable}
        clearLabel={labels?.clear || 'Clear'}
        chooseLabel={labels?.choose}
        disabled={disabled}
        size={size}
        inputRef={inputRef}
        forwardedRef={ref}
        describedBy={single ? undefined : ids.join(' ')}
        below={
          single ? undefined : (
            <ValueTags
              values={picked}
              ids={ids}
              labelFor={labelFor}
              disabled={disabled}
              ariaCloseLabel={ariaCloseLabel}
              removable={value => !index.get(value)?.node.disabled}
              onRemove={value => {
                remove(value);
                inputRef.current?.focus();
              }}
            />
          )
        }
        initialFocusSelector={INITIAL_FOCUS}
      >
        {panelName => (
          <>
            {searchable && (
              <input
                className={searchClass}
                type="search"
                aria-label={labels?.search || 'Search'}
                autoComplete="off"
                value={query}
                data-initial-focus=""
                onChange={event => setQuery(event.target.value)}
                onFocus={event => {
                  // A key that opened the panel is in the box: type after it.
                  const { length } = event.currentTarget.value;
                  event.currentTarget.setSelectionRange(length, length);
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    // The search box's Enter would submit the form.
                    event.preventDefault();
                  } else if (event.key === 'ArrowDown' && !event.altKey) {
                    event.preventDefault();
                    const tree = treeRef.current;
                    (
                      tree?.querySelector<HTMLElement>(
                        '[role="treeitem"][tabindex="0"]'
                      ) ?? tree?.querySelector<HTMLElement>('[role="treeitem"]')
                    )?.focus();
                  }
                }}
              />
            )}
            {nothingFound ? (
              empty && (
                <div className={emptyClass} ref={emptyRef}>
                  {empty}
                </div>
              )
            ) : (
              <TreeViewHiddenContext.Provider
                value={search?.hidden ?? NOTHING_HIDDEN}
              >
                <TreeView
                  {...panelName}
                  ref={treeRef}
                  selectionMode={selectionMode}
                  size={size}
                  selected={single ? (picked[0] ?? null) : undefined}
                  checked={single ? undefined : listed}
                  onCheckedChange={onCheckedChange}
                  expanded={shownExpanded}
                  onExpandedChange={onTreeExpandedChange}
                  loadingLabel={loadingLabel}
                  retryLabel={retryLabel}
                  loadingAnnouncement={loadingAnnouncement}
                  loadedAnnouncement={loadedAnnouncement}
                >
                  {data.map(renderNode)}
                </TreeView>
              </TreeViewHiddenContext.Provider>
            )}
            <StatusRegion
              items={nothingFound && empty ? noMatches : nothingToSay}
              describe={describeEmpty}
            />
          </>
        )}
      </DialogSelect>
    );
  }
);

TreeSelect.displayName = 'TreeSelect';

export default TreeSelect;
