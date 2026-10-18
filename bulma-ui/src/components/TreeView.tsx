import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { warnOnce } from '../helpers/devWarnings';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { useTreeView, type TreeViewEngine } from '../helpers/useTreeView';
import { Checkbox } from '../form/Checkbox';
import { Icon } from '../elements/Icon';

/**
 * How items are picked: `none`, nothing is; `single`, one item at a time;
 * `checkbox`, any number, with a box on every item and mixed parents.
 */
export type TreeViewSelectionMode = 'none' | 'single' | 'checkbox';

const validTreeViewSizes = ['small', 'medium', 'large'] as const;

// Not exported, so they stay out of the public API that `index.ts` re-exports.
const TreeViewContext = createContext<TreeViewEngine | null>(null);

/** Where an item sits: the values of the items above it, and whether one of them is closed. */
interface Branch {
  path: string[];
  hidden: boolean;
}

const TOP: Branch = { path: [], hidden: false };
const BranchContext = createContext<Branch>(TOP);

/** The box's input lets the row's click toggle it, so a change on its own does nothing. */
const ignoreChange = () => {};

/** Whether an `icon` was given something to render. */
const isGiven = (node: React.ReactNode) =>
  node !== undefined &&
  node !== null &&
  typeof node !== 'boolean' &&
  node !== '';

/**
 * Props for the TreeView component. The helper props, the other attributes
 * and the `ref` land on the `<ul role="tree">`.
 *
 * @extraProp {string} [aria-label] - Names the tree, such as "Files". A tree needs a name, so pass this or `aria-labelledby`, and a development build warns when it has neither.
 * @extraProp {string} [aria-labelledby] - The id of a visible heading or label that names the tree, in place of `aria-label`.
 * @extraProp {React.Ref<HTMLUListElement>} [ref] - Ref forwarded to the `<ul>`.
 */
export interface TreeViewProps
  extends
    Omit<
      React.HTMLAttributes<HTMLUListElement>,
      | keyof BulmaClassesProps
      | 'role'
      | 'onSelect'
      | 'defaultValue'
      | 'defaultChecked'
    >,
    BulmaClassesProps {
  /**
   * `TreeView.Item`s, nested inside each other for their children. Render
   * an item's children whenever you have them, open or not: the tree hides
   * them while it's closed.
   */
  children?: React.ReactNode;
  /**
   * `none`: nothing is picked, and Enter and Space open and close a parent.
   * `single`: one item, picked with Enter, Space or a click.
   * `checkbox`: any number, checked with Space or a click. A check reaches
   * every enabled item under it, and a parent with some of them checked is mixed.
   */
  selectionMode?: TreeViewSelectionMode;
  /**
   * The selected item's value when you hold the state, or `null` for none.
   * Read with `single` only. Picking an item then only calls
   * `onSelectedChange`, and nothing changes until you pass the new value.
   */
  selected?: string | null;
  /** The item selected to begin with, when the tree holds its own state. Read with `single` only. */
  defaultSelected?: string | null;
  /**
   * Called with the value of the item picked. Not called for the one
   * already selected, and moving focus never calls it.
   */
  onSelectedChange?: (value: string) => void;
  /**
   * The checked items' values when you hold the state. Read with `checkbox`
   * only. A value checks its item, and an enabled item also counts as checked
   * when any item above it is in the list, so a parent's value stands for its
   * whole branch, loaded or not. A disabled item is checked only by its own value.
   */
  checked?: string[];
  /** The values checked to begin with, when the tree holds its own state. Read with `checkbox` only. */
  defaultChecked?: string[];
  /**
   * Called after a check or an uncheck with every item that now shows
   * checked, parents included, plus any earlier value that matches no item
   * the tree knows, left as it was. The order means nothing. Passed back as
   * `checked`, the list shows the same boxes.
   */
  onCheckedChange?: (checked: string[]) => void;
  /**
   * The open items' values when you hold the state. A value stays in the
   * list while its item's parent is closed, so the item reopens as it was.
   */
  expanded?: string[];
  /** The items open to begin with, when the tree holds its own state. */
  defaultExpanded?: string[];
  /** Called with the new list whenever an item opens or closes, `*` included. */
  onExpandedChange?: (expanded: string[]) => void;
  /** The text size, as Bulma's menu sizes it. The rows, the indent and the chevron scale with it. */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Props for TreeView.Item, one row and, nested in it, its children. The other
 * attributes and the `ref` land on its `<li role="treeitem">`.
 *
 * @extraProp {React.Ref<HTMLLIElement>} [ref] - Ref forwarded to the `<li>`.
 */
export interface TreeViewItemProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  'role' | 'value' | 'onSelect' | 'children'
> {
  /** **Required.** Identifies the item in `selected`, `checked` and `expanded`. Unique in the tree. */
  value: string;
  /**
   * **Required.** What the row shows, and the item's name for assistive
   * tech. Nothing in it should be a link or a button: a tree item does one
   * thing, and nothing else in its row takes focus.
   */
  label: React.ReactNode;
  /** A picture before the label: an `Icon` name, or a node. Hidden from assistive tech. */
  icon?: React.ReactNode;
  /**
   * `TreeView.Item`s under this one. Render them whenever you have them,
   * open or not: the tree hides them while it's closed, and a checkbox tree
   * needs them to know what a check reaches.
   */
  children?: React.ReactNode;
  /** Shows the item as a parent before its children are known, such as a folder that loads when it opens. */
  hasChildren?: boolean;
  /**
   * Reachable with the arrow keys, Home, End and type-ahead, so a screen
   * reader finds it, but never selected, checked, opened or closed. One
   * that's already open stays open.
   */
  disabled?: boolean;
}

/**
 * The `TreeView` component renders a tree of items you browse and pick from, the way a file explorer works: one tab stop, the arrow keys to move, and Right and Left to open and close.
 *
 * It's the APG Tree View pattern, drawn to look like Bulma's menu. It isn't
 * for site navigation: items aren't links, and a sidebar whose sections open
 * and close is `Menu`'s job. The root owns which items are open, through
 * `expanded`, `defaultExpanded` and `onExpandedChange`.
 *
 * `selectionMode` picks one of three trees. With `none`, nothing is picked.
 * With `single`, one item is, and `selected` says which. With `checkbox`,
 * each item has a box, a check reaches every enabled item under it, closed
 * branches included, and a parent with some of its items checked is mixed.
 * `selected` is read in a `single` tree only, and `checked` in a `checkbox`
 * tree only. Selection never follows focus.
 *
 * Disabled items stay reachable from the keys, so a screen reader finds
 * them. The tree needs a name, from `aria-label` or `aria-labelledby`, and a
 * development build warns when it has neither.
 *
 * @function
 * @param {TreeViewProps} props - Props for the TreeView component.
 * @param {React.Ref<HTMLUListElement>} ref - Forwarded ref to the `<ul>`.
 * @returns {JSX.Element} The rendered tree.
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/treeview/ | APG Tree View Pattern}
 *
 * @example
 * <TreeView aria-label="Files" selectionMode="single" defaultExpanded={['src']}>
 *   <TreeView.Item value="src" label="src" icon="folder">
 *     <TreeView.Item value="src/index.ts" label="index.ts" icon="file" />
 *   </TreeView.Item>
 *   <TreeView.Item value="package.json" label="package.json" icon="file" />
 * </TreeView>
 */
const TreeViewRoot = forwardRef<HTMLUListElement, TreeViewProps>(
  function TreeView(
    {
      children,
      selectionMode = 'none',
      selected,
      defaultSelected = null,
      onSelectedChange,
      checked,
      defaultChecked = [],
      onCheckedChange,
      expanded,
      defaultExpanded = [],
      onExpandedChange,
      size,
      className,
      ...props
    },
    ref
  ) {
    const { bulmaHelperClasses, rest } = useBulmaClasses({ ...props });
    const engine = useTreeView({
      mode: selectionMode,
      selected,
      defaultSelected,
      onSelectedChange,
      checked,
      defaultChecked,
      onCheckedChange,
      expanded,
      defaultExpanded,
      onExpandedChange,
    });

    const { treeRef } = engine;
    const setRefs = useCallback(
      (node: HTMLUListElement | null) => {
        treeRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref, treeRef]
    );

    const named = Boolean(rest['aria-label'] || rest['aria-labelledby']);
    useEffect(() => {
      if (!named) {
        warnOnce(
          'TreeView:unnamed',
          '[bestax-bulma] <TreeView> has no accessible name. Pass ' +
            'aria-label or aria-labelledby, so a screen reader can say what ' +
            'the tree holds.'
        );
      }
    }, [named]);

    const rootClass = usePrefixedClassNames('tree-view', {
      [`is-${size}`]:
        !!size && (validTreeViewSizes as readonly string[]).includes(size),
    });

    // The props are spread first, so the role and the attributes the tree
    // owns win over anything a caller passes along.
    return (
      <TreeViewContext.Provider value={engine}>
        <BranchContext.Provider value={TOP}>
          <ul
            {...rest}
            ref={setRefs}
            className={classNames(rootClass, bulmaHelperClasses, className)}
            role="tree"
            aria-multiselectable={engine.rendersClosed || undefined}
          >
            {children}
          </ul>
        </BranchContext.Provider>
      </TreeViewContext.Provider>
    );
  }
);

/**
 * One item in the tree: a row with its chevron, its box, its icon and its label, and, while it's open, a group of the items under it.
 *
 * @function
 * @param {TreeViewItemProps} props - Props for TreeView.Item.
 * @param {React.Ref<HTMLLIElement>} ref - Forwarded ref to the `<li>`.
 * @returns {JSX.Element | null} The rendered item, or nothing under a closed one.
 */
export const TreeViewItem = forwardRef<HTMLLIElement, TreeViewItemProps>(
  function TreeViewItem(
    {
      value,
      label,
      icon,
      children,
      hasChildren = false,
      disabled = false,
      className,
      onClick,
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) {
    const tree = useContext(TreeViewContext);
    const branch = useContext(BranchContext);
    const labelId = useId();
    const hasItems = React.Children.toArray(children).length > 0;
    const isParent = hasItems || hasChildren;
    const open = isParent && !!tree?.isOpen(value);
    const parent = branch.path[branch.path.length - 1] ?? null;

    const itemClass = usePrefixedClassNames('tree-view-item');
    const groupClass = usePrefixedClassNames('tree-view-group');
    const toggleClass = usePrefixedClassNames('tree-view-toggle');
    const checkClass = usePrefixedClassNames('tree-view-check');
    const iconClass = usePrefixedClassNames('tree-view-icon');
    const labelClass = usePrefixedClassNames('tree-view-label');

    const register = tree?.register;
    useClientLayoutEffect(() => {
      if (!register) {
        warnOnce(
          'TreeView.Item:outside',
          '[bestax-bulma] <TreeView.Item> is outside a <TreeView>, so it ' +
            'renders nothing. Put it inside one.'
        );
        return undefined;
      }
      return register(value, { parent, disabled, isParent });
    }, [register, value, parent, disabled, isParent]);

    const setElement = tree?.setElement;
    const setRefs = useCallback(
      (node: HTMLLIElement | null) => {
        // Only an item inside a tree renders an element to hand over.
        setElement!(value, node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [setElement, value, ref]
    );
    const rowRef = useRef<HTMLDivElement | null>(null);
    const toggleRef = useRef<HTMLSpanElement | null>(null);

    const childBranch = useMemo(
      () => ({
        path: [...branch.path, value],
        hidden: branch.hidden || !open,
      }),
      [branch, value, open]
    );

    const { selected, checked } =
      tree?.stateOf(value, branch.path, disabled) ?? {};
    const rowClass = usePrefixedClassNames('tree-view-row', {
      'is-selected': selected,
      'is-disabled': disabled,
    });

    if (!tree) return null;

    // While it's open the children render in its group. In a checkbox tree
    // they render while it's closed too, drawing nothing, so a check knows
    // what's under it.
    const items = (open || tree.rendersClosed) && (
      <BranchContext.Provider value={childBranch}>
        {children}
      </BranchContext.Provider>
    );
    if (branch.hidden) return <>{items}</>;

    const info = { value, parent, disabled, isParent, open };

    return (
      <li
        {...props}
        ref={setRefs}
        className={classNames(itemClass, className)}
        role="treeitem"
        aria-labelledby={labelId}
        aria-level={branch.path.length + 1}
        aria-expanded={isParent ? open : undefined}
        aria-disabled={disabled || undefined}
        aria-selected={selected}
        aria-checked={checked}
        tabIndex={tree.tabStop === value ? 0 : -1}
        onKeyDown={event => {
          onKeyDown?.(event);
          tree.onKeyDown(event, info);
        }}
        onFocus={event => {
          onFocus?.(event);
          if (event.target === event.currentTarget) {
            tree.onFocus(value, event.currentTarget);
          }
        }}
        onBlur={event => {
          onBlur?.(event);
          if (event.target === event.currentTarget) tree.onBlur();
        }}
        onClick={event => {
          onClick?.(event);
          // A click in its row is its own, and so is one on the item itself,
          // as a test's click on the treeitem is. One in its group belongs
          // to the item inside it, or to nothing. The chevron's box is on
          // every row, but it's a chevron only on a parent: on a leaf it's
          // more of the row.
          const target = event.target as Node;
          if (
            target === event.currentTarget ||
            rowRef.current!.contains(target)
          ) {
            tree.onClick(
              event.currentTarget,
              info,
              isParent && toggleRef.current!.contains(target)
            );
          }
        }}
      >
        <div className={rowClass} ref={rowRef}>
          <span className={toggleClass} aria-hidden="true" ref={toggleRef} />
          {checked !== undefined && (
            <span
              className={checkClass}
              aria-hidden="true"
              onClick={event => {
                // A click on the box's label is followed by one on its
                // input, and both reach the item. The label's is cancelled,
                // so the item toggles once.
                if (!(event.target instanceof HTMLInputElement)) {
                  event.preventDefault();
                }
              }}
            >
              <Checkbox
                tabIndex={-1}
                checked={checked === true}
                indeterminate={checked === 'mixed'}
                disabled={disabled}
                onChange={ignoreChange}
              />
            </span>
          )}
          {isGiven(icon) && (
            <span className={iconClass} aria-hidden="true">
              {typeof icon === 'string' ? <Icon name={icon} /> : icon}
            </span>
          )}
          <span className={labelClass} id={labelId}>
            {label}
          </span>
        </div>
        {open && hasItems ? (
          <ul className={groupClass} role="group">
            {items}
          </ul>
        ) : (
          items
        )}
      </li>
    );
  }
);

TreeViewItem.displayName = 'TreeView.Item';

export const TreeView = withSubComponents(
  TreeViewRoot,
  { Item: TreeViewItem },
  'TreeView'
);

export default TreeView;
