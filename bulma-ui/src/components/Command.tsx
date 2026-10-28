import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { useLatestRef } from '../helpers/useLatestRef';
import { flattenChildren } from '../helpers/flattenChildren';
import { warnOnce } from '../helpers/devWarnings';
import { isModalOverlayOpen } from '../helpers/overlayStack';
import { StatusRegion, spokenText } from '../helpers/statusRegion';
import {
  ComboboxEngine,
  useComboboxEngine,
} from '../helpers/useComboboxEngine';
import { Input, InputProps } from '../form/Input';
import { Modal } from './Modal';

/** What names a Command that's given no `label`. */
const defaultLabel = 'Commands';

/** What a Command given `actions` shows when nothing matches, unless it's given `empty`. */
const defaultEmpty = 'No results';

// What the status region announces: the `Command.Empty` content, as the one
// item it's handed while that content is on screen because of the user's
// typing.
const typedNoMatches = [{ id: 'empty' }];
const nothingToAnnounce: Array<{ id: string }> = [];

/** Whether a slot was given something to show. */
const isShown = (node: React.ReactNode): boolean =>
  node !== undefined && node !== null && node !== false && node !== '';

/** One action in a Command's `actions`. */
export interface CommandAction {
  /** Unique within the Command. It's the item's `value`, so `onSelect` hands it back. */
  id: string;
  /** What the item shows, and what typing matches first. */
  label: string;
  /**
   * A line under the label, such as what the action does or where it goes.
   * Typing matches it too, after the labels. A screen reader hears it after
   * the label, as the item's description.
   */
  description?: string;
  /**
   * More words typing matches, after the labels, such as `['theme']` for
   * "Dark mode". They aren't shown.
   */
  keywords?: string[];
  /**
   * The heading the action goes under. Groups show in the order the matches
   * first name them, so the best match is always on top, and the actions with
   * no group show together where the first of them is.
   */
  group?: string;
  /** Shown before the label, and hidden from assistive tech. */
  icon?: React.ReactNode;
  /**
   * Shown at the end of the row, such as the action's own keyboard shortcut in
   * a `Kbd.Group`, or a `Tag`. It only shows: nothing listens for a shortcut
   * written here. A screen reader hears it after the label, with the
   * description.
   */
  hint?: React.ReactNode;
  /** Shown, and reached with the arrows so a screen reader user finds it, but never run. */
  disabled?: boolean;
  /** Runs the action, when it's picked with Enter or a click, before the Command's `onSelect`. */
  onSelect?: () => void;
}

/** What a Command takes whether it's given `actions` or built from parts. */
interface CommandBaseProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onSelect'>,
    Omit<BulmaClassesProps, 'color'> {
  /**
   * What the Command is for, such as "Commands" or "Settings". It's never
   * shown: it names the search field and the list for assistive tech, and in
   * `Command.Dialog` the dialog too. An empty string counts as none.
   * @defaultValue 'Commands'
   */
  label?: string;
  /**
   * The search, controlled: the text in the field. Pair it with
   * `onQueryChange`.
   */
  query?: string;
  /**
   * The search to start with when uncontrolled.
   * @defaultValue ''
   */
  defaultQuery?: string;
  /**
   * Called with the search as the user types it. Built from parts, this is
   * where the app filters its items.
   */
  onQueryChange?: (query: string) => void;
  /**
   * Called with the picked item's `value`, an action's `id`, when it's run
   * with Enter or a click, after the item's own `onSelect`. A disabled item
   * is never run.
   */
  onSelect?: (value: string) => void;
}

/** Props for a Command given `actions`. */
export interface CommandActionsProps extends CommandBaseProps {
  /**
   * The actions, for a Command that renders the field, the list, the groups
   * and the empty message itself. Typing filters them by label, keywords and
   * description, ignoring case, with label matches first. Leave it out to
   * build the Command from parts.
   */
  actions: CommandAction[];
  /**
   * Takes over the filtering, with `actions`: it's handed the search as typed
   * and every action, and returns the ones to show, in the order to show
   * them, which is how to plug in fuzzy matching or cut the list short. It's
   * called with an empty search too.
   */
  filter?: (query: string, actions: CommandAction[]) => CommandAction[];
  /** The field's placeholder, with `actions`. */
  placeholder?: string;
  /**
   * What shows in place of the list, with `actions`, when nothing matches.
   * It's announced the way `Command.Empty` is. `null` shows nothing.
   * @defaultValue 'No results'
   */
  empty?: React.ReactNode;
  /** @internal With `actions`, the Command renders its own parts. */
  children?: never;
}

/** Props for a Command built from parts. */
export interface CommandPartsProps extends CommandBaseProps {
  /**
   * The parts, in order: `Command.Input`, then `Command.List` while there are
   * items and `Command.Empty` while there aren't. Nothing filters them, so
   * render the items that match the search `onQueryChange` reports. With
   * `actions` there are none to give: children given with it are ignored,
   * with a warning in development.
   */
  children?: React.ReactNode;
  /** @internal Built from parts, the app renders the items. */
  actions?: never;
  /** @internal Built from parts, the app filters. */
  filter?: never;
  /** @internal Built from parts, `Command.Input` takes the placeholder. */
  placeholder?: never;
  /** @internal Built from parts, `Command.Empty` is the empty message. */
  empty?: never;
}

/**
 * Props for the Command component: given `actions`, it renders, filters and
 * groups them itself, and without them it's built from parts. The helper
 * props, the other attributes and the `ref` land on the `div.command` around
 * the field and the list.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the `div.command` around the field and the list.
 */
export type CommandProps = CommandActionsProps | CommandPartsProps;

/** What Command.Dialog takes on top of a Command's props. */
interface CommandDialogOwnProps {
  /** Controlled open state. When set, opening and closing only report through `onOpenChange`. */
  open?: boolean;
  /**
   * Initial open state when uncontrolled.
   * @defaultValue false
   */
  defaultOpen?: boolean;
  /**
   * Called with the open state asked for: `true` from the `shortcut`, and
   * `false` from Escape, a click on the background, or a pick while
   * `closeOnSelect` is on. Fires in controlled and uncontrolled use.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * A key combination that opens the dialog from anywhere on the page, such
   * as `"mod+k"`: modifiers and a key joined by `+`, where `mod` is Ctrl or
   * ⌘ (either one, on every platform), and the others are `ctrl`, `meta`,
   * `alt` and `shift`. It's ignored while the user is typing in a text field,
   * a select or editable content, while an IME is composing, while a modal
   * overlay is open (a `Modal`, a `Dialog`, a `Sidebar` with its overlay or a
   * full-page `Loading`), and when something else has already used the key.
   * It only opens the dialog. Off unless given.
   */
  shortcut?: string;
  /**
   * Closes the dialog once an item has run. Turn it off for an item that
   * opens another page of the palette, and close it yourself with `open`.
   * @defaultValue true
   */
  closeOnSelect?: boolean;
  /**
   * Clears the search when the dialog closes: an uncontrolled one itself,
   * and a controlled one through `onQueryChange('')`.
   * @defaultValue true
   */
  clearOnClose?: boolean;
  /**
   * Renders the dialog into a portal target instead of inline. Forwarded to
   * the underlying `Modal`; see its `portal` prop for the accepted values.
   * @defaultValue false
   */
  portal?: boolean | string | HTMLElement;
}

/** Props for a Command.Dialog given `actions`. */
export interface CommandDialogActionsProps
  extends CommandActionsProps, CommandDialogOwnProps {}

/** Props for a Command.Dialog built from parts. */
export interface CommandDialogPartsProps
  extends CommandPartsProps, CommandDialogOwnProps {}

/**
 * Props for Command.Dialog, the Command in a modal: a Command's props, given
 * `actions` or built from parts, and the dialog's own. The helper props, the
 * other attributes and the `ref` land on the `div.command` that is the
 * dialog.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the `div.command` that is the dialog.
 */
export type CommandDialogProps =
  CommandDialogActionsProps | CommandDialogPartsProps;

/**
 * Props for Command.Input, the search field. It renders `Input`, so its
 * icons, `isLoading` and `color` work as they do there. Its text is the
 * Command's `query`, and it's `autoComplete="off"`, so the browser's own
 * suggestions don't open over the list: neither is yours to set.
 */
export type CommandInputProps = Omit<
  InputProps,
  // By name, since the docs read only names out of an Omit. The Field props:
  | 'label'
  | 'labelSize'
  | 'labelProps'
  | 'horizontal'
  | 'message'
  | 'messageColor'
  | 'fieldClassName'
  // And what the Command sets on the field itself:
  | 'role'
  | 'autoComplete'
  | 'value'
  | 'defaultValue'
>;

/**
 * Props for Command.List, the list. Its `id` is the one the field's
 * `aria-controls` names, so it isn't yours to set.
 */
export interface CommandListProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'role' | 'id'
> {
  /** `Command.Item`s and `Command.Group`s, in the order they're shown. */
  children?: React.ReactNode;
}

/** Props for Command.Group, items under a heading. */
export interface CommandGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'role'
> {
  /**
   * The heading, which also names the group for assistive tech, unless you
   * give the group an `aria-label` or `aria-labelledby` of its own.
   */
  label: React.ReactNode;
  /** The group's `Command.Item`s. */
  children?: React.ReactNode;
}

/**
 * Props for Command.Item, one thing to do in the list. Its `id` follows from
 * its `value`, since the field's `aria-activedescendant` names it, so it
 * isn't yours to set.
 */
export interface CommandItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'role' | 'onSelect' | 'id'
> {
  /** What the Command's `onSelect` hands back. Unique within the Command. */
  value: string;
  /**
   * Can't be run. The arrows still reach it, so a screen reader user finds
   * it, and it's never `aria-selected`.
   * @defaultValue false
   */
  disabled?: boolean;
  /** Runs the item, when it's picked with Enter or a click, before the Command's `onSelect`. */
  onSelect?: () => void;
  /** Shown before the label, and hidden from assistive tech. */
  icon?: React.ReactNode;
  /**
   * A line under the label. A screen reader hears it after the label, as the
   * item's description.
   */
  description?: React.ReactNode;
  /**
   * Shown at the end of the row, such as a keyboard shortcut in a
   * `Kbd.Group`, or a `Tag`. It only shows. A screen reader hears it after
   * the label, with the description.
   */
  hint?: React.ReactNode;
  /** The label, which names the item. */
  children?: React.ReactNode;
}

/** Props for Command.Empty, the message shown in place of the list. */
export interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The message, such as "No commands match". Its text is announced when
   * typing brings it on screen and isn't read again while it stays, so a
   * message that names the search is heard for the first search only.
   */
  children?: React.ReactNode;
}

/** A handler an item registers, read when it's run. */
type ItemHandler = { readonly current: (() => void) | undefined };

/** What the Command hands its parts. */
interface CommandContextValue {
  engine: ComboboxEngine;
  /** What names the field and the list. */
  label: string;
  /** The search. */
  query: string;
  /** A change to the field's value, which is the user typing. */
  onFieldChange: (value: string) => void;
  /** Tells the Command the field's `isLoading`, which holds the empty message's announcement. */
  reportLoading: (loading: boolean) => void;
  /** Records the empty message while it's on screen. Returns the function that forgets it. */
  reportEmpty: (element: HTMLElement) => () => void;
  /** Records an item's `onSelect`. Returns the function that forgets it. */
  registerHandler: (value: string, handler: ItemHandler) => () => void;
}

const noop = () => {};
const registerNothing = () => noop;

// What a part rendered outside a Command reads: nothing to report to, so it
// renders its markup and does nothing.
const standalone: CommandContextValue = {
  engine: {
    open: false,
    expanded: false,
    highlighted: null,
    typed: false,
    listboxId: '',
    itemId: () => '',
    rootRef: { current: null },
    inputRef: { current: null },
    listboxRef: { current: null },
    registerPopup: registerNothing,
    registerItem: registerNothing,
    onKeyDown: noop,
    onChange: noop,
    onClick: noop,
    onBlur: noop,
    hover: noop,
    pick: noop,
    keepFocus: noop,
    markInside: noop,
  },
  label: defaultLabel,
  query: '',
  onFieldChange: noop,
  reportLoading: noop,
  reportEmpty: registerNothing,
  registerHandler: registerNothing,
};

const CommandContext = createContext<CommandContextValue | null>(null);

const useCommand = () => useContext(CommandContext) ?? standalone;

/** Hands a node to a forwarded ref and to one of the component's own. */
function setRefs<T>(
  node: T | null,
  own: React.MutableRefObject<T | null>,
  forwarded: React.ForwardedRef<T>
) {
  own.current = node;
  if (typeof forwarded === 'function') forwarded(node);
  else if (forwarded) forwarded.current = node;
}

/**
 * The default filter: the actions whose label, keywords or description hold
 * the search, ignoring case and the spaces around it, label matches first and
 * the order otherwise kept. An empty search keeps them all.
 */
const filterActions = (
  query: string,
  actions: CommandAction[]
): CommandAction[] => {
  const term = query.trim().toLowerCase();
  if (term === '') return actions;
  const byLabel: CommandAction[] = [];
  const byOther: CommandAction[] = [];
  for (const action of actions) {
    if (action.label.toLowerCase().includes(term)) {
      byLabel.push(action);
    } else if (
      action.description?.toLowerCase().includes(term) ||
      action.keywords?.some(keyword => keyword.toLowerCase().includes(term))
    ) {
      byOther.push(action);
    }
  }
  return [...byLabel, ...byOther];
};

/** The search icon at the start of the field. */
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    width="1em"
    height="1em"
    focusable="false"
  >
    <circle cx="7" cy="7" r="4.75" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);

/**
 * The Command built from parts: the field, the list, the keys and the run,
 * with the items and their filtering left to the app.
 */
const CommandParts = forwardRef<HTMLDivElement, CommandPartsProps>(
  (
    {
      children,
      label,
      query: controlledQuery,
      defaultQuery = '',
      onQueryChange,
      onSelect,
      className,
      ...props
    },
    ref
  ) => {
    const [ownQuery, setOwnQuery] = useState(defaultQuery);
    const query = controlledQuery ?? ownQuery;

    // Each item's `onSelect`, by value, read when it runs.
    const handlersRef = useRef(new Map<string, ItemHandler>());
    const registerHandler = useCallback(
      (value: string, handler: ItemHandler) => {
        const handlers = handlersRef.current;
        handlers.set(value, handler);
        return () => {
          if (handlers.get(value) === handler) handlers.delete(value);
        };
      },
      []
    );
    const run = (value: string) => {
      handlersRef.current.get(value)?.current?.();
      onSelect?.(value);
    };

    // Inline: the list is always on screen, nothing opens or closes it, and
    // Escape goes on to what's around it. `keepFirst` keeps the highlight on
    // the top match, so Enter runs it.
    const engine = useComboboxEngine({
      defaultOpen: true,
      onSelect: run,
      keepFirst: true,
      multiple: false,
      inline: true,
      deferred: false,
    });
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const rootClass = usePrefixedClassNames('command');

    // A polite status region, in the page from the start so it's there
    // before anything is written into it, announces `Command.Empty` when the
    // user's typing leaves it on screen: once each time that happens, not
    // again on each keystroke while it stays. An empty search isn't a search,
    // so it stays quiet then, and while the field's `isLoading` says results
    // are on their way, it waits.
    const [inputLoading, setInputLoading] = useState(false);
    const emptyRef = useRef<HTMLElement | null>(null);
    const [emptyShown, setEmptyShown] = useState(false);
    const announced =
      engine.typed && query !== '' && emptyShown && !inputLoading
        ? typedNoMatches
        : nothingToAnnounce;
    // The region reads the text on screen, whatever the message renders.
    const describeEmpty = useCallback(() => {
      const node = emptyRef.current;
      /* istanbul ignore if: it's only announced while it's on screen */
      if (!node) return null;
      return spokenText(node);
    }, []);
    const reportEmpty = useCallback((element: HTMLElement) => {
      emptyRef.current = element;
      setEmptyShown(true);
      return () => {
        emptyRef.current = null;
        setEmptyShown(false);
      };
    }, []);

    const onFieldChange = (value: string) => {
      if (controlledQuery === undefined) setOwnQuery(value);
      onQueryChange?.(value);
      engine.onChange();
    };

    // A new value each render: the engine's state and handlers are, and the
    // parts read the highlight from it.
    const context: CommandContextValue = {
      engine,
      label: label || defaultLabel,
      query,
      onFieldChange,
      reportLoading: setInputLoading,
      reportEmpty,
      registerHandler,
    };

    const { rootRef } = engine;
    const rootRefs = useCallback(
      (node: HTMLDivElement | null) => setRefs(node, rootRef, ref),
      [rootRef, ref]
    );

    return (
      // The ref after the spread, so the element stays the Command's.
      <div
        className={classNames(rootClass, bulmaHelperClasses, className)}
        {...rest}
        ref={rootRefs}
      >
        <CommandContext.Provider value={context}>
          {children}
        </CommandContext.Provider>
        <StatusRegion items={announced} describe={describeEmpty} />
      </div>
    );
  }
);
CommandParts.displayName = 'CommandParts';

/**
 * The search field, with the combobox role and the keys, rendered as an `Input` with a search icon.
 *
 * @function
 * @param {CommandInputProps} props - Props for the Command.Input component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the `<input>`.
 * @returns {JSX.Element} The field in its Control.
 */
export const CommandInput = forwardRef<HTMLInputElement, CommandInputProps>(
  (
    {
      isLoading,
      iconLeft,
      iconLeftName,
      onKeyDown,
      onChange,
      onClick,
      onBlur,
      'aria-autocomplete': ariaAutocomplete,
      ...props
    },
    ref
  ) => {
    const context = useCommand();
    const { engine, reportLoading } = context;
    useClientLayoutEffect(() => {
      reportLoading(!!isLoading);
      return () => reportLoading(false);
    }, [reportLoading, isLoading]);
    const { inputRef } = engine;
    const inputRefs = useCallback(
      (node: HTMLInputElement | null) => setRefs(node, inputRef, ref),
      [inputRef, ref]
    );
    const { expanded, highlighted } = engine;
    // A name the caller gave the field wins over the Command's `label`.
    const callerNamed = !!props['aria-label'] || 'aria-labelledby' in props;

    return (
      // The attributes the Command owns after the caller's, so a stray
      // `aria-expanded` never wins. A search isn't prose, so the browser's
      // spelling and autocorrect stay out of it unless the caller asks.
      <Input
        autoCorrect="off"
        spellCheck={false}
        {...props}
        ref={inputRefs}
        value={context.query}
        iconLeft={
          iconLeft === undefined && !iconLeftName ? <SearchIcon /> : iconLeft
        }
        iconLeftName={iconLeftName}
        isLoading={isLoading}
        aria-label={callerNamed ? props['aria-label'] : context.label}
        role="combobox"
        aria-autocomplete={ariaAutocomplete ?? 'list'}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? engine.listboxId : undefined}
        aria-activedescendant={
          expanded && highlighted !== null
            ? engine.itemId(highlighted)
            : undefined
        }
        autoComplete="off"
        onKeyDown={event => {
          onKeyDown?.(event);
          engine.onKeyDown(event);
        }}
        onChange={event => {
          onChange?.(event);
          context.onFieldChange(event.target.value);
        }}
        onClick={event => {
          onClick?.(event);
          if (!event.defaultPrevented) engine.onClick();
        }}
        onBlur={event => {
          onBlur?.(event);
          engine.onBlur(event);
        }}
      />
    );
  }
);
CommandInput.displayName = 'CommandInput';

/**
 * The list of items, a `listbox` named by the Command's `label`.
 *
 * @function
 * @param {CommandListProps} props - Props for the Command.List component.
 * @returns {JSX.Element} The listbox.
 */
export const CommandList: React.FC<CommandListProps> = ({
  children,
  className,
  onMouseDown,
  ...props
}) => {
  const { engine, label } = useCommand();
  const { listboxRef, listboxId, keepFocus } = engine;
  const listClass = usePrefixedClassNames('command-list');
  // A name the caller gave the list wins over the Command's.
  const callerNamed = !!props['aria-label'] || 'aria-labelledby' in props;
  return (
    <div
      className={classNames(listClass, className)}
      {...props}
      ref={listboxRef}
      id={listboxId || undefined}
      role="listbox"
      aria-label={callerNamed ? props['aria-label'] : label}
      onMouseDown={event => {
        onMouseDown?.(event);
        keepFocus(event);
      }}
    >
      {children}
    </div>
  );
};
CommandList.displayName = 'CommandList';

/**
 * Items under a heading, a `group` named by it.
 *
 * @function
 * @param {CommandGroupProps} props - Props for the Command.Group component.
 * @returns {JSX.Element} The group and its heading.
 */
export const CommandGroup: React.FC<CommandGroupProps> = ({
  label,
  children,
  className,
  ...props
}) => {
  const labelId = useId();
  const groupClass = usePrefixedClassNames('command-group');
  const labelClass = usePrefixedClassNames('command-group-label');
  // A name the caller gave the group wins over its heading's, as on the list.
  const callerNamed = !!props['aria-label'] || 'aria-labelledby' in props;
  return (
    <div
      className={classNames(groupClass, className)}
      {...props}
      role="group"
      aria-labelledby={callerNamed ? props['aria-labelledby'] : labelId}
    >
      <div className={labelClass} id={labelId}>
        {label}
      </div>
      {children}
    </div>
  );
};
CommandGroup.displayName = 'CommandGroup';

/**
 * One thing to do in the list, named by its label and described by its description and hint.
 *
 * @function
 * @param {CommandItemProps} props - Props for the Command.Item component.
 * @returns {JSX.Element} The item.
 */
export const CommandItem: React.FC<CommandItemProps> = ({
  value,
  disabled = false,
  onSelect,
  icon,
  description,
  hint,
  children,
  className,
  onClick,
  onPointerMove,
  ...props
}) => {
  const { engine, registerHandler } = useCommand();
  const itemRef = useRef<HTMLDivElement>(null);
  const { registerItem } = engine;
  useClientLayoutEffect(
    () =>
      registerItem(itemRef.current as HTMLDivElement, {
        value,
        disabled,
        checked: false,
      }),
    [registerItem, value, disabled]
  );
  const onSelectRef = useLatestRef(onSelect);
  useClientLayoutEffect(
    () => registerHandler(value, onSelectRef),
    [registerHandler, value, onSelectRef]
  );
  const highlighted = engine.highlighted === value;
  const itemClass = usePrefixedClassNames('command-item', {
    'is-active': highlighted,
    'is-disabled': disabled,
  });
  const iconClass = usePrefixedClassNames('command-item-icon');
  const bodyClass = usePrefixedClassNames('command-item-body');
  const labelClass = usePrefixedClassNames('command-item-label');
  const descriptionClass = usePrefixedClassNames('command-item-description');
  const hintClass = usePrefixedClassNames('command-item-hint');

  // Named by its label alone, so a screen reader says what it does before
  // the rest, and described by the description and the hint.
  const baseId = useId();
  const labelId = `${baseId}label`;
  const descriptionId = isShown(description)
    ? `${baseId}description`
    : undefined;
  const hintId = isShown(hint) ? `${baseId}hint` : undefined;
  const describedBy =
    [descriptionId, hintId].filter(Boolean).join(' ') || undefined;
  const callerNamed = !!props['aria-label'] || 'aria-labelledby' in props;

  return (
    <div
      className={classNames(itemClass, className)}
      aria-describedby={describedBy}
      {...props}
      ref={itemRef}
      id={engine.itemId(value) || undefined}
      role="option"
      // The highlighted option, as the ARIA Authoring Practices' combobox
      // has it, and no attribute on the rest. Never a disabled option.
      aria-selected={disabled ? undefined : highlighted || undefined}
      aria-disabled={disabled || undefined}
      aria-labelledby={callerNamed ? props['aria-labelledby'] : labelId}
      onClick={event => {
        onClick?.(event);
        if (!disabled && !event.defaultPrevented) engine.pick(value);
      }}
      onPointerMove={event => {
        onPointerMove?.(event);
        if (!disabled && !highlighted) engine.hover(value);
      }}
    >
      {isShown(icon) && (
        <span className={iconClass} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={bodyClass}>
        <span className={labelClass} id={labelId}>
          {children}
        </span>
        {descriptionId && (
          <span className={descriptionClass} id={descriptionId}>
            {description}
          </span>
        )}
      </span>
      {hintId && (
        <span className={hintClass} id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
};
CommandItem.displayName = 'CommandItem';

/**
 * The message shown in place of the list when nothing matches, announced when typing brings it on screen.
 *
 * @function
 * @param {CommandEmptyProps} props - Props for the Command.Empty component.
 * @returns {JSX.Element} The message.
 */
export const CommandEmpty: React.FC<CommandEmptyProps> = ({
  children,
  className,
  onMouseDown,
  ...props
}) => {
  const { engine, reportEmpty } = useCommand();
  const emptyRef = useRef<HTMLDivElement>(null);
  useClientLayoutEffect(
    () => reportEmpty(emptyRef.current as HTMLDivElement),
    [reportEmpty]
  );
  const emptyClass = usePrefixedClassNames('command-empty');
  return (
    <div
      className={classNames(emptyClass, className)}
      {...props}
      ref={emptyRef}
      onMouseDown={event => {
        onMouseDown?.(event);
        engine.keepFocus(event);
      }}
    >
      {children}
    </div>
  );
};
CommandEmpty.displayName = 'CommandEmpty';

/** What a Command given `actions` renders inside its parts root. */
interface CommandActionsContentProps {
  actions: CommandAction[];
  filter: CommandActionsProps['filter'];
  placeholder: string | undefined;
  empty: React.ReactNode;
}

/**
 * The field, and the actions that match the search, grouped, or the empty
 * message. The search is the parts root's, read from its context.
 */
const CommandActionsContent = ({
  actions,
  filter = filterActions,
  placeholder,
  empty,
}: CommandActionsContentProps) => {
  const { query } = useCommand();
  const shown = filter(query, actions);

  // Each group where the matches first name it, and the actions with none
  // together where the first of them is, so the best match stays on top.
  const sections = new Map<string, CommandAction[]>();
  for (const action of shown) {
    const group = action.group ?? '';
    sections.set(group, [...(sections.get(group) ?? []), action]);
  }
  const renderItem = (action: CommandAction) => (
    <CommandItem
      key={action.id}
      value={action.id}
      disabled={action.disabled}
      icon={action.icon}
      description={action.description}
      hint={action.hint}
      onSelect={action.onSelect}
    >
      {action.label}
    </CommandItem>
  );

  return (
    <>
      <CommandInput placeholder={placeholder} />
      {shown.length > 0 ? (
        <CommandList>
          {Array.from(sections, ([group, members]) =>
            group ? (
              <CommandGroup key={group} label={group}>
                {members.map(renderItem)}
              </CommandGroup>
            ) : (
              members.map(renderItem)
            )
          )}
        </CommandList>
      ) : isShown(empty) ? (
        <CommandEmpty>{empty}</CommandEmpty>
      ) : null}
    </>
  );
};

/**
 * The Command given `actions`. It renders the parts itself and filters the
 * actions as the user types, so a run goes through the same parts, keys and
 * ARIA as one built by hand.
 */
const CommandFromActions = forwardRef<HTMLDivElement, CommandActionsProps>(
  (
    { actions, filter, placeholder, empty = defaultEmpty, children, ...rest },
    ref
  ) => {
    if (flattenChildren(children).length > 0) {
      warnOnce(
        'Command:actions-children',
        '[bestax-bulma] <Command actions> renders its own field and items, ' +
          'so its children are ignored. Give it actions or build it from ' +
          'parts, not both.'
      );
    }
    return (
      <CommandParts {...rest} ref={ref}>
        <CommandActionsContent
          actions={actions}
          filter={filter}
          placeholder={placeholder}
          empty={empty}
        />
      </CommandParts>
    );
  }
);
CommandFromActions.displayName = 'CommandFromActions';

/**
 * The `Command` component is a search field over a list of things to do, which narrows as you type and runs the top match on Enter: inline by default, and a command palette in a modal as `Command.Dialog`.
 *
 * Given `actions`, it's one element. It renders the field, the list, the
 * groups and the empty message, and filters the actions by label, keywords
 * and description as the user types, with label matches first. `filter`
 * takes over the matching, for fuzzy search.
 *
 * Built from parts, the app owns the items: what's in the list and how it's
 * filtered, from the search `onQueryChange` reports. Nothing filters them,
 * so a server's answer shows as it came.
 *
 * Either way, focus stays in the field, and the highlighted item is its
 * `aria-activedescendant`. The first enabled item is highlighted whenever
 * the items change, so Enter runs the top match. Running an item calls its
 * own `onSelect`, then the Command's.
 *
 * When typing leaves the empty message on screen, its text is announced
 * through a polite status region, once, after any loading ends. Result
 * counts aren't announced: a screen reader reads the list's size from the
 * markup, and a count on every keystroke talks over the typing.
 *
 * @function
 * @param {CommandProps} props - Props for the Command component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the `div.command`.
 * @returns {JSX.Element} The field and its list.
 *
 * @example
 * <Command
 *   label="Settings"
 *   placeholder="Search settings"
 *   actions={[
 *     { id: 'profile', label: 'Edit profile', onSelect: openProfile },
 *     { id: 'theme', label: 'Dark mode', keywords: ['theme'], onSelect: toggleTheme },
 *   ]}
 * />
 *
 * @example
 * <Command label="People" onQueryChange={setQuery} onSelect={openProfile}>
 *   <Command.Input placeholder="Find a person" />
 *   {matches.length > 0 ? (
 *     <Command.List>
 *       {matches.map(person => (
 *         <Command.Item key={person.id} value={person.id}>
 *           {person.name}
 *         </Command.Item>
 *       ))}
 *     </Command.List>
 *   ) : (
 *     <Command.Empty>No one matches</Command.Empty>
 *   )}
 * </Command>
 */
const CommandRoot = forwardRef<HTMLDivElement, CommandProps>((props, ref) =>
  props.actions === undefined ? (
    <CommandParts {...props} ref={ref} />
  ) : (
    <CommandFromActions {...props} ref={ref} />
  )
);

/** A key combination, read from a `shortcut` string. */
interface ParsedShortcut {
  /** The key, lowercased, as `KeyboardEvent.key` names it. */
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

/** Other names a key goes by in a `shortcut`, for the ones `key` spells otherwise. */
const keyAliases: Record<string, string> = {
  space: ' ',
  esc: 'escape',
};

/**
 * Reads a `shortcut` such as `"mod+k"` or `"ctrl + shift + p"`.
 *
 * @param shortcut - Modifiers and a key, joined by `+`.
 * @returns The combination, or `null` when it doesn't read as one.
 */
const parseShortcut = (shortcut: string): ParsedShortcut | null => {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map(part => part.trim());
  const key = parts.pop() as string;
  if (key === '') return null;
  const parsed: ParsedShortcut = {
    key: keyAliases[key] ?? key,
    mod: false,
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
  };
  for (const part of parts) {
    if (part === 'mod') parsed.mod = true;
    else if (part === 'ctrl' || part === 'control') parsed.ctrl = true;
    else if (part === 'meta' || part === 'cmd' || part === 'command')
      parsed.meta = true;
    else if (part === 'alt' || part === 'option') parsed.alt = true;
    else if (part === 'shift') parsed.shift = true;
    else return null;
  }
  return parsed;
};

/**
 * Whether a keydown is the combination. `mod` takes Ctrl or ⌘, and any other
 * modifier has to be as the combination says, so `mod+k` isn't
 * `mod+shift+k`. A letter or digit is matched by its key, and by where it
 * sits on the keyboard only when the key isn't a Latin letter or digit at
 * all, as on a Cyrillic layout or with Option held on a Mac, so another
 * Latin layout's own letters keep their own shortcuts.
 */
const matchesShortcut = (
  event: KeyboardEvent,
  shortcut: ParsedShortcut
): boolean => {
  if (event.altKey !== shortcut.alt) return false;
  // A symbol such as `?` already says whether Shift was down, and which key
  // takes Shift to type it depends on the layout, so Shift is only checked
  // for a letter, a digit or a named key, unless the combination names it.
  const shiftMatters =
    shortcut.shift ||
    shortcut.key.length > 1 ||
    /^[a-z0-9]$/.test(shortcut.key);
  if (shiftMatters && event.shiftKey !== shortcut.shift) return false;
  if (shortcut.mod) {
    if (!event.ctrlKey && !event.metaKey) return false;
  } else if (
    event.ctrlKey !== shortcut.ctrl ||
    event.metaKey !== shortcut.meta
  ) {
    return false;
  }
  const key = (event.key ?? '').toLowerCase();
  if (key === shortcut.key) return true;
  if (/^[a-z0-9]$/.test(key)) return false;
  if (/^[a-z]$/.test(shortcut.key)) {
    return event.code === `Key${shortcut.key.toUpperCase()}`;
  }
  if (/^[0-9]$/.test(shortcut.key)) {
    return event.code === `Digit${shortcut.key}`;
  }
  return false;
};

/** Input types that take no typing, so a shortcut pressed in one still counts. */
const untypedInputs = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/**
 * Whether a keydown happened while the user was typing: in a text field, a
 * text area, a select, or editable content. The composed path's first entry
 * is the element itself, even inside a shadow root.
 */
const isTyping = (event: KeyboardEvent): boolean => {
  const target = event.composedPath()[0] as Partial<Element> | undefined;
  if (typeof target?.closest !== 'function') return false;
  const element = target as Element;
  const editable = element.closest('[contenteditable]');
  if (editable && editable.getAttribute('contenteditable') !== 'false') {
    return true;
  }
  const tag = element.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return (
    tag === 'INPUT' &&
    !untypedInputs.has((element as HTMLInputElement).type.toLowerCase())
  );
};

/**
 * The Command in a modal, a command palette, opened by its `shortcut` or by `open`, that closes once an item has run.
 *
 * It renders nothing while it's closed. Open, it's a `Modal` with a
 * background and the Command's box as the `dialog`, named by `label`:
 * focus goes to the search field, Tab stays inside, Escape and a click on
 * the background close it, the page behind it doesn't scroll, and focus goes
 * back to where it was when it closes.
 *
 * @function
 * @param {CommandDialogProps} props - Props for the Command.Dialog component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the `div.command` that is the dialog.
 * @returns {JSX.Element | null} The dialog, or nothing while it's closed.
 */
export const CommandDialog = forwardRef<HTMLDivElement, CommandDialogProps>(
  (
    {
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      shortcut,
      closeOnSelect = true,
      clearOnClose = true,
      portal,
      label,
      query: controlledQuery,
      defaultQuery = '',
      onQueryChange,
      onSelect,
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      ...props
    },
    ref
  ) => {
    const [ownOpen, setOwnOpen] = useState(defaultOpen);
    const open = controlledOpen ?? ownOpen;
    // Only ever asked for the other state: the shortcut listens while it's
    // closed, and everything that closes it is there while it's open.
    const setOpen = (next: boolean) => {
      if (controlledOpen === undefined) setOwnOpen(next);
      onOpenChange?.(next);
    };

    // The search is held here rather than in the Command, which is only
    // mounted while the dialog is open, so it can outlive a close when
    // `clearOnClose` is off.
    const [ownQuery, setOwnQuery] = useState(defaultQuery);
    const query = controlledQuery ?? ownQuery;
    const setQuery = (next: string) => {
      if (controlledQuery === undefined) setOwnQuery(next);
      onQueryChange?.(next);
    };
    // Closing clears the search, however the dialog closed. Our own is
    // cleared during render, React's pattern for adjusting state when other
    // state changes, and a controlled one is asked for after the commit.
    const [shownOpen, setShownOpen] = useState(open);
    if (shownOpen !== open) {
      setShownOpen(open);
      if (!open && clearOnClose && controlledQuery === undefined) {
        setOwnQuery('');
      }
    }
    const wasOpenRef = useRef(open);
    const clearRef = useLatestRef(() => {
      if (clearOnClose && controlledQuery !== undefined && query !== '') {
        onQueryChange?.('');
      }
    });
    useEffect(() => {
      const wasOpen = wasOpenRef.current;
      wasOpenRef.current = open;
      if (wasOpen && !open) clearRef.current();
    }, [open, clearRef]);

    if (controlledOpen === undefined && !defaultOpen && !shortcut) {
      warnOnce(
        'Command.Dialog:no-opener',
        '[bestax-bulma] <Command.Dialog> has no way to open. Give it a ' +
          'shortcut, or open and onOpenChange.'
      );
    }
    if (shortcut && !parseShortcut(shortcut)) {
      warnOnce(
        `Command.Dialog:shortcut:${shortcut}`,
        `[bestax-bulma] <Command.Dialog> can't read the shortcut ` +
          `"${shortcut}". Write modifiers and a key joined by +, such as ` +
          `"mod+k", where the modifiers are mod, ctrl, meta, alt and shift.`
      );
    }

    const openFromShortcut = useLatestRef(() => setOpen(true));
    useEffect(() => {
      const combination = shortcut ? parseShortcut(shortcut) : null;
      if (!combination || open) return undefined;
      const onKeyDown = (event: KeyboardEvent) => {
        if (
          event.defaultPrevented ||
          event.isComposing ||
          event.keyCode === 229 ||
          !matchesShortcut(event, combination) ||
          isTyping(event) ||
          // A Modal, a Dialog, a Sidebar with its overlay or a full-page
          // Loading has the page shut off, so the key isn't the page's. A
          // Sidebar without one leaves the page in use, so it still opens.
          isModalOverlayOpen()
        ) {
          return;
        }
        // The browser's own use of the combination, such as Ctrl+K's search
        // in the address bar, doesn't happen as well.
        event.preventDefault();
        openFromShortcut.current();
      };
      // On `window`, where a keydown arrives last, so anything on the page
      // that used the key first has said so with `preventDefault()`.
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [shortcut, open, openFromShortcut]);

    const dialogClass = usePrefixedClassNames('command-dialog');

    if (!open) return null;

    const close = () => setOpen(false);
    const run = (value: string) => {
      onSelect?.(value);
      if (closeOnSelect) close();
    };

    return (
      <Modal isActive onClose={close} role="presentation" portal={portal}>
        <Modal.Background onClick={close} />
        <CommandRoot
          {...(props as CommandProps)}
          ref={ref}
          className={classNames(dialogClass, className)}
          label={label}
          query={query}
          onQueryChange={setQuery}
          onSelect={run}
          role="dialog"
          aria-modal="true"
          aria-label={
            ariaLabelledBy === undefined
              ? ariaLabel || label || defaultLabel
              : ariaLabel
          }
          aria-labelledby={ariaLabelledBy}
        />
      </Modal>
    );
  }
);
CommandDialog.displayName = 'CommandDialog';

/** Command with Input, List, Group, Item, Empty and Dialog sub-components. */
export const Command = withSubComponents(
  CommandRoot,
  {
    Input: CommandInput,
    List: CommandList,
    Group: CommandGroup,
    Item: CommandItem,
    Empty: CommandEmpty,
    Dialog: CommandDialog,
  },
  'Command'
);

export default Command;
