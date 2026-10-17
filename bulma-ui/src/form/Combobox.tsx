import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { withSubComponents } from '../helpers/withSubComponents';
import { Portal } from '../helpers/portal';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { useClientLayoutEffect } from '../helpers/useClientLayoutEffect';
import { flattenChildren } from '../helpers/flattenChildren';
import {
  AnchoredPosition,
  marginGap,
  useAnchoredPosition,
} from '../helpers/useAnchoredPosition';
import { StatusRegion, spokenText } from '../helpers/statusRegion';
import {
  ComboboxEngine,
  useComboboxEngine,
} from '../helpers/useComboboxEngine';
import type { PopoverPosition } from '../components/Popover';
import { Field } from './Field';
import { Input, InputProps } from './Input';
import { FormFieldProps } from './fieldProps';
import {
  rendersOwnField,
  useInsideControl,
  useInsideField,
} from './FormContext';
import { useAutoLabelId } from './useAutoLabelId';
import { useControlLoading } from './controlLoading';

const validComboboxSizes = ['small', 'medium', 'large'] as const;

// What the status region announces: the `Combobox.Empty` content, as the one
// item it's handed while that content is on screen because of the user's
// typing.
const typedNoMatches = [{ id: 'empty' }];
const nothingToAnnounce: Array<{ id: string }> = [];

/**
 * Props for the Combobox component. The helper props, the other attributes
 * and the `ref` land on the `div.combobox` around the field and the list. It
 * renders the `Field` and the label itself, unless an outer `Field` already
 * does.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the `div.combobox` around the field and the list.
 */
export interface ComboboxProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'onChange' | 'onSelect'>,
    Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
  /**
   * The field's label, which names `Combobox.Input` through `htmlFor`, and
   * the list through `aria-labelledby`. Dropped inside an outer `Field`,
   * whose label names both instead when it points at the field. When
   * `Combobox.Input` has an `id` of its own, server markup names the field
   * through `aria-labelledby` until the page hydrates and the label's `for`
   * catches up.
   */
  label?: React.ReactNode;
  /**
   * Props for the label element. An explicit `htmlFor` takes over the
   * association: give `Combobox.Input` the same `id`, and the list is still
   * named after the label.
   */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /**
   * The parts, in order: `Combobox.Input`, then `Combobox.Menu` with
   * `Combobox.List` and `Combobox.Empty` in it. With `inline`, the
   * `Combobox.List` and `Combobox.Empty` go straight in. Render
   * `Combobox.List` while there are items and `Combobox.Empty` while
   * there aren't: the empty message sits beside the list, not in it.
   */
  children?: React.ReactNode;
  /**
   * Controlled open state. When set, opening and closing only report
   * through `onOpenChange`.
   */
  open?: boolean;
  /**
   * Initial open state when uncontrolled.
   * @defaultValue false
   */
  defaultOpen?: boolean;
  /**
   * Called with the open state asked for: `true` from typing, a click in
   * the field or Down Arrow, and `false` from Escape, Tab, a pick with one
   * value, focus leaving or a press outside. Fires in controlled and
   * uncontrolled use.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Called with an item's `value` when it's picked with Enter or a click.
   * A disabled item is never picked. The Combobox keeps no value and
   * doesn't change the text in the field: update yours here.
   */
  onSelect?: (value: string) => void;
  /**
   * Highlights the first enabled item whenever the list opens or its
   * items change, so Enter picks the top match. It only highlights:
   * leaving the field still picks nothing, and so does Tab.
   * @defaultValue false
   */
  keepFirst?: boolean;
  /**
   * Several values can be picked. The list stays open after a pick, it's
   * `aria-multiselectable`, and each item's `checked` is its
   * `aria-selected`.
   * @defaultValue false
   */
  multiple?: boolean;
  /**
   * The list is always on screen, in the flow under the field, as in a
   * Popover or a page panel. There's no menu, so nothing closes it, and
   * Escape goes to whatever is around it.
   * @defaultValue false
   */
  inline?: boolean;
  /**
   * Where the menu opens against the field: below (`bottom-*`) or above
   * (`top-*`), lined up with its left or right edge. `auto` picks the one
   * that keeps the list in the viewport, preferring below. The same union
   * Popover takes.
   * @defaultValue 'bottom-left'
   */
  position?: PopoverPosition;
  /**
   * Renders the menu through `Portal`, into the `portalContainer` a
   * `ConfigProvider` sets, `document.body` by default, fixed to the viewport
   * at the field, so a container that clips its overflow can't cut it off.
   * It then shows from the commit after hydration, never in server markup.
   * Theming variables set on an ancestor reach it only when the portal's
   * container is inside that ancestor, as with Popover. In a `Modal`, point
   * `portalContainer` inside the modal, so the list stays in the dialog for
   * assistive tech.
   * @defaultValue false
   */
  appendToBody?: boolean;
  /** Sizes the field and the items together. */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Props for Combobox.Input, the text field. It renders `Input`, so its icons,
 * `isLoading` and `color` work as they do there. The Field props go on the
 * Combobox, and the size comes from it. The field is `autoComplete="off"`,
 * so the browser's own suggestions don't open over the list, and that isn't
 * yours to set.
 */
export type ComboboxInputProps = Omit<
  InputProps,
  // By name, since the docs read only names out of an Omit, and
  // `__typetests__/combobox.tsx` fails if one goes missing. The Field props:
  | 'label'
  | 'labelSize'
  | 'labelProps'
  | 'horizontal'
  | 'message'
  | 'messageColor'
  | 'fieldClassName'
  // And what the Combobox sets on the field itself:
  | 'size'
  | 'role'
  | 'autoComplete'
>;

/** Props for Combobox.Menu, the floating panel under the field. */
export interface ComboboxMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * What the panel shows: `Combobox.List` while there are items, and
   * `Combobox.Empty` while there aren't. Children that are all `null`,
   * `false` or `''`, or empty Fragments, keep the panel shut, so write the
   * conditional here. A component that renders nothing, or a
   * `Combobox.List` with no items in it, still counts, and shows an
   * empty panel.
   */
  children?: React.ReactNode;
}

/**
 * Props for Combobox.List, the list. Its `id` is the one the field's
 * `aria-controls` names, so it isn't yours to set.
 */
export interface ComboboxListProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'role' | 'id'
> {
  /** `Combobox.Item`s and `Combobox.Group`s, in the order they're shown. */
  children?: React.ReactNode;
}

/**
 * Props for Combobox.Item, one choice in the list. Its `id` follows from
 * its `value`, since the field's `aria-activedescendant` names it, so it
 * isn't yours to set.
 */
export interface ComboboxItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'role' | 'onSelect' | 'id'
> {
  /** What `onSelect` hands back. Unique within the Combobox. */
  value: string;
  /**
   * Can't be picked. The arrows still reach it, so a screen reader user
   * finds it, and it's never `aria-selected`.
   * @defaultValue false
   */
  disabled?: boolean;
  /**
   * It's the value, or one of them. It shows a check mark, the list opens
   * with the highlight on it, and with `multiple` it's the `aria-selected`.
   * @defaultValue false
   */
  checked?: boolean;
  /** What the item shows: text, or text with an avatar, a tag or a hint. */
  children?: React.ReactNode;
}

/** Props for Combobox.Group, items under a heading. */
export interface ComboboxGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'role'
> {
  /**
   * The heading, which also names the group for assistive tech, unless you
   * give the group an `aria-label` or `aria-labelledby` of its own.
   */
  label: React.ReactNode;
  /** The group's `Combobox.Item`s. */
  children?: React.ReactNode;
}

/** Props for Combobox.Empty, the message shown in place of the list. */
export interface ComboboxEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The message, such as "No countries match". Its text is announced when
   * typing brings it on screen and isn't read again while it stays, so a
   * message that names the query is heard for the first query only.
   */
  children?: React.ReactNode;
}

/** What the Combobox hands its parts. */
interface ComboboxContextValue {
  engine: ComboboxEngine;
  /** The id the field takes when it's given none. */
  inputId: string | undefined;
  /** Tells the Combobox the id the field was given, so the label follows it. */
  reportInputId: (id: string | undefined) => void;
  /** The id of the label that names the field, which names the list too. */
  labelId: string | undefined;
  /**
   * The id of the label the Combobox renders itself, when it names the field.
   * The field points at it while its own `id` hasn't reached the label yet.
   */
  ownLabelId: string | undefined;
  /** Tells the Combobox the field's `isLoading`, which holds the empty message's announcement. */
  reportLoading: (loading: boolean) => void;
  /** Records the empty message while it's on screen. Returns the function that forgets it. */
  reportEmpty: (element: HTMLElement) => () => void;
  /** A change to the field's value, which is the user typing. */
  onFieldChange: (value: string) => void;
  /**
   * Records the menu's panel while it's on screen, so it's placed and
   * counts as inside. Returns the function that forgets it.
   */
  reportPanel: (element: HTMLElement) => () => void;
  /** Where the panel goes against the field. */
  placement: AnchoredPosition;
  size?: ComboboxProps['size'];
  multiple: boolean;
  inline: boolean;
  appendToBody: boolean;
}

const noop = () => {};
const registerNothing = () => noop;

// What a part rendered outside a Combobox reads: closed, with nothing to
// report to, so it renders its markup and does nothing.
const standalone: ComboboxContextValue = {
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
  inputId: undefined,
  reportInputId: noop,
  labelId: undefined,
  ownLabelId: undefined,
  reportLoading: noop,
  reportEmpty: registerNothing,
  onFieldChange: noop,
  reportPanel: registerNothing,
  placement: { position: 'bottom-left' },
  multiple: false,
  inline: false,
  appendToBody: false,
};

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

const useCombobox = () => useContext(ComboboxContext) ?? standalone;

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
 * The `Combobox` component builds a text field with a list of options under it, for a searchable select, a server search, a multi-select or grouped options, with the keys and ARIA done and the data left to you.
 *
 * The app owns the data: what's in the list, how it's filtered, and the
 * value. A pick calls `onSelect` with the option's `value`, and the
 * Combobox keeps no value and never changes the text in the field, so the
 * app sets both there. Nothing filters the options for you either, so a
 * server's answer shows as it came. For a free-text field with suggestions,
 * `Autocomplete` is the simpler choice.
 *
 * Focus stays in the field, and the highlighted option is its
 * `aria-activedescendant`. With one value, the highlighted option is the
 * `aria-selected` one, as the ARIA Authoring Practices' combobox does it, and
 * a `checked` option shows a check mark and takes the highlight when the
 * list opens. With `multiple`, `checked` is each option's `aria-selected`.
 * Tab and focus leaving close a dropdown list without picking.
 *
 * When typing leaves `Combobox.Empty` on screen, its text is announced
 * through a polite status region, once, after any loading ends. Result
 * counts aren't announced: a screen reader reads the list's size from the
 * markup, and a count on every keystroke talks over the typing. Show one in
 * a `role="status"` line beside the field when it matters.
 *
 * @function
 * @param {ComboboxProps} props - Props for the Combobox component.
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref to the `div.combobox`.
 * @returns {JSX.Element} The field and its list, in a `Field` with the label unless one is around it.
 *
 * @example
 * <Combobox label="Country" onSelect={pick}>
 *   <Combobox.Input value={query} onChange={e => setQuery(e.target.value)} />
 *   <Combobox.Menu>
 *     {matches.length > 0 ? (
 *       <Combobox.List>
 *         {matches.map(c => (
 *           <Combobox.Item key={c} value={c} checked={c === value}>
 *             {c}
 *           </Combobox.Item>
 *         ))}
 *       </Combobox.List>
 *     ) : (
 *       <Combobox.Empty>No countries match</Combobox.Empty>
 *     )}
 *   </Combobox.Menu>
 * </Combobox>
 */
const ComboboxRoot = forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      children,
      open,
      defaultOpen = false,
      onOpenChange,
      onSelect,
      keepFirst = false,
      multiple = false,
      inline = false,
      position = 'bottom-left',
      appendToBody = false,
      size,
      label,
      labelSize,
      labelProps,
      horizontal,
      message,
      messageColor,
      fieldClassName,
      className,
      ...props
    },
    ref
  ) => {
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const ownField = rendersOwnField('Combobox', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    // The field's own `id`, when `Combobox.Input` was given one, which the
    // label then points at.
    const [givenInputId, setGivenInputId] = useState<string | undefined>();
    const {
      controlId,
      fieldLabelProps,
      labelId: listLabelId,
    } = useAutoLabelId({
      label,
      id: givenInputId,
      labelProps,
      rendersLabel: ownField,
      needsLabelId: true,
    });
    const engine = useComboboxEngine({
      open,
      defaultOpen,
      onOpenChange,
      onSelect,
      keepFirst,
      multiple,
      inline,
      // A portaled panel has no server markup to point at.
      deferred: appendToBody && !inline,
    });
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const validSize = (validComboboxSizes as readonly string[]).includes(
      size as string
    )
      ? size
      : undefined;
    const rootClass = usePrefixedClassNames('combobox', {
      [`is-${validSize}`]: !!validSize,
      'is-inline': inline,
    });
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    // A polite status region, in the page from the start so it's there
    // before anything is written into it, announces `Combobox.Empty` when
    // the user's typing leaves it on screen: once each time that happens,
    // not again on each keystroke while it stays. An empty field isn't a
    // search, so it stays quiet then. While the field's `isLoading`, or a
    // loading Control around the Combobox, says results are on their way, it
    // waits, and it's said once loading ends with the message still there.
    const [inputLoading, setInputLoading] = useState(false);
    const controlLoading = useControlLoading();
    const [hasText, setHasText] = useState(false);
    const emptyRef = useRef<HTMLElement | null>(null);
    const [emptyShown, setEmptyShown] = useState(false);
    const announced =
      engine.typed && hasText && emptyShown && !inputLoading && !controlLoading
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
    // The menu is placed from here rather than from the part, since this
    // is where the field's element is known by the time the panel mounts.
    const panelRef = useRef<HTMLElement | null>(null);
    const [panelShown, setPanelShown] = useState(false);
    const placement = useAnchoredPosition(engine.rootRef, panelRef, {
      active: panelShown,
      position,
      fixed: appendToBody,
      // The gap comes from `--bulma-combobox-menu-offset` as a margin, so
      // the coordinates leave it out and `auto` reads it off the panel.
      offset: 0,
      styledGap: marginGap,
      matchWidth: true,
    });
    const { registerPopup } = engine;
    const reportPanel = useCallback(
      (element: HTMLElement) => {
        const forget = registerPopup(element);
        panelRef.current = element;
        setPanelShown(true);
        return () => {
          forget();
          panelRef.current = null;
          setPanelShown(false);
        };
      },
      [registerPopup]
    );

    const onFieldChange = (value: string) => {
      setHasText(value !== '');
      engine.onChange();
    };

    // A new value each render: the engine's state and handlers are, and the
    // parts read the highlight and the open state from it.
    const context: ComboboxContextValue = {
      engine,
      inputId: controlId,
      reportInputId: setGivenInputId,
      labelId: listLabelId,
      ownLabelId: label && ownField ? listLabelId : undefined,
      reportLoading: setInputLoading,
      reportEmpty,
      onFieldChange,
      reportPanel,
      placement,
      size: validSize,
      multiple,
      inline,
      appendToBody,
    };

    const { rootRef } = engine;
    const rootRefs = useCallback(
      (node: HTMLDivElement | null) => setRefs(node, rootRef, ref),
      [rootRef, ref]
    );

    const comboboxElement = (
      // The ref after the spread, so the element stays the Combobox's.
      <div
        className={classNames(rootClass, bulmaHelperClasses, className)}
        {...rest}
        ref={rootRefs}
      >
        <ComboboxContext.Provider value={context}>
          {children}
        </ComboboxContext.Provider>
        <StatusRegion items={announced} describe={describeEmpty} />
      </div>
    );
    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    if (ownField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={fieldLabelProps}
          horizontal={horizontal}
          className={fieldClassName}
        >
          {comboboxElement}
          {messageEl}
        </Field>
      );
    }

    return (
      <>
        {comboboxElement}
        {messageEl}
      </>
    );
  }
);

/**
 * The text field, with the combobox role and the keys, rendered as an `Input`.
 *
 * @function
 * @param {ComboboxInputProps} props - Props for the Combobox.Input component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the `<input>`.
 * @returns {JSX.Element} The field in its Control.
 */
export const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(
  (
    {
      id,
      isLoading,
      controlSize,
      onKeyDown,
      onChange,
      onClick,
      onBlur,
      'aria-autocomplete': ariaAutocomplete,
      ...props
    },
    ref
  ) => {
    const context = useCombobox();
    const { engine, reportInputId, reportLoading } = context;
    // Inside a caller's Control the field renders none of its own, so the
    // Combobox's size isn't handed to one there.
    const insideControl = useInsideControl();
    useClientLayoutEffect(() => {
      reportInputId(id);
      return () => reportInputId(undefined);
    }, [reportInputId, id]);
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
    // An `id` of the field's own reaches the label from a layout effect, so
    // in server markup, and the first render, the label's `for` still names
    // the generated id. Until then the field points at the label itself,
    // unless the caller named it.
    const callerNamed = !!props['aria-label'] || 'aria-labelledby' in props;
    const labelledBy = callerNamed
      ? props['aria-labelledby']
      : id !== undefined && id !== context.inputId
        ? context.ownLabelId
        : undefined;

    return (
      // The attributes the Combobox owns after the caller's, so a stray
      // `aria-expanded` never wins.
      <Input
        {...props}
        ref={inputRefs}
        id={id ?? context.inputId}
        aria-labelledby={labelledBy}
        isLoading={isLoading}
        size={context.size}
        controlSize={controlSize ?? (insideControl ? undefined : context.size)}
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
ComboboxInput.displayName = 'ComboboxInput';

/**
 * The floating panel under the field, on screen while the list is open and its children aren't all empty.
 *
 * @function
 * @param {ComboboxMenuProps} props - Props for the Combobox.Menu component.
 * @returns {JSX.Element | null} The panel, or nothing while the list is closed or its children are all empty.
 */
export const ComboboxMenu: React.FC<ComboboxMenuProps> = ({
  children,
  className,
  style,
  onMouseDown,
  onPointerDownCapture,
  ...props
}) => {
  const { engine, inline, appendToBody, placement, reportPanel, size } =
    useCombobox();
  // Children that are all `null`, `false` or `''` leave no panel, whatever
  // `open` says. This reads the elements it's handed, not what they render.
  const hasContent = flattenChildren(children).some(child => child !== '');
  const shown = engine.open && !inline && hasContent;
  // A portaled panel has no server markup, so it only exists from the
  // commit after hydration. Everything that measures it waits for that.
  const hydrated = useIsHydrated();
  const mounted = shown && (hydrated || !appendToBody);
  const panelRef = useRef<HTMLDivElement>(null);
  useClientLayoutEffect(() => {
    const panel = panelRef.current;
    return mounted && panel ? reportPanel(panel) : undefined;
  }, [mounted, reportPanel]);

  const menuClass = usePrefixedClassNames(
    'dropdown-menu',
    'combobox-menu',
    {
      [`is-${placement.position}`]: true,
      'is-portal': appendToBody,
      [`is-${size}`]: !!size,
    }
  );
  const contentClass = usePrefixedClassNames('dropdown-content');

  // Inline, the list is in the flow already.
  if (inline) return <>{children}</>;
  if (!shown) return null;

  return (
    <Portal disabled={!appendToBody}>
      <div
        {...props}
        ref={panelRef}
        className={classNames(menuClass, className)}
        style={
          appendToBody
            ? {
                ...style,
                position: 'fixed',
                top: placement.top,
                left: placement.left,
                minWidth: placement.minWidth,
              }
            : style
        }
        onMouseDown={event => {
          onMouseDown?.(event);
          engine.keepFocus(event);
        }}
        onPointerDownCapture={event => {
          onPointerDownCapture?.(event);
          engine.markInside(event);
        }}
      >
        <div className={contentClass}>{children}</div>
      </div>
    </Portal>
  );
};
ComboboxMenu.displayName = 'ComboboxMenu';

/**
 * The list of items, a `listbox` named by the label that names the field.
 *
 * @function
 * @param {ComboboxListProps} props - Props for the Combobox.List component.
 * @returns {JSX.Element} The listbox.
 */
export const ComboboxList: React.FC<ComboboxListProps> = ({
  children,
  className,
  onMouseDown,
  ...props
}) => {
  const { engine, labelId, multiple } = useCombobox();
  const { listboxRef, listboxId, keepFocus } = engine;
  const listClass = usePrefixedClassNames('combobox-list');
  // A name the caller gave the list wins over the label's.
  const callerNamed = !!props['aria-label'] || 'aria-labelledby' in props;
  return (
    <div
      className={classNames(listClass, className)}
      {...props}
      ref={listboxRef}
      id={listboxId || undefined}
      role="listbox"
      aria-labelledby={callerNamed ? props['aria-labelledby'] : labelId}
      aria-label={
        callerNamed ? props['aria-label'] : labelId ? undefined : 'Suggestions'
      }
      aria-multiselectable={multiple || undefined}
      onMouseDown={event => {
        onMouseDown?.(event);
        keepFocus(event);
      }}
    >
      {children}
    </div>
  );
};
ComboboxList.displayName = 'ComboboxList';

/**
 * One choice in the list, with a check mark while it's `checked`.
 *
 * @function
 * @param {ComboboxItemProps} props - Props for the Combobox.Item component.
 * @returns {JSX.Element} The item.
 */
export const ComboboxItem: React.FC<ComboboxItemProps> = ({
  value,
  disabled = false,
  checked = false,
  children,
  className,
  onClick,
  onPointerMove,
  ...props
}) => {
  const { engine, multiple } = useCombobox();
  const itemRef = useRef<HTMLDivElement>(null);
  const { registerItem } = engine;
  useClientLayoutEffect(
    () =>
      registerItem(itemRef.current as HTMLDivElement, {
        value,
        disabled,
        checked,
      }),
    [registerItem, value, disabled, checked]
  );
  const highlighted = engine.highlighted === value;
  const itemClass = usePrefixedClassNames(
    'dropdown-item',
    'combobox-item',
    {
      'is-active': highlighted,
      'is-checked': checked,
      'is-disabled': disabled,
    }
  );
  const checkClass = usePrefixedClassNames('combobox-check');
  // One value: the highlighted option, as the ARIA Authoring Practices'
  // combobox has it, and no attribute on the rest. Several: each option says
  // whether it's chosen. Never a disabled option.
  const selected = disabled
    ? undefined
    : multiple
      ? checked
      : highlighted || undefined;

  return (
    <div
      className={classNames(itemClass, className)}
      {...props}
      ref={itemRef}
      id={engine.itemId(value) || undefined}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      onClick={event => {
        onClick?.(event);
        if (!disabled && !event.defaultPrevented) engine.pick(value);
      }}
      onPointerMove={event => {
        onPointerMove?.(event);
        if (!disabled && !highlighted) engine.hover(value);
      }}
    >
      {checked && (
        <span className={checkClass} aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="1em"
            height="1em"
            focusable="false"
          >
            <polyline points="3 8.5 6.5 12 13 4.5" />
          </svg>
        </span>
      )}
      {children}
    </div>
  );
};
ComboboxItem.displayName = 'ComboboxItem';

/**
 * Items under a heading, a `group` named by it.
 *
 * @function
 * @param {ComboboxGroupProps} props - Props for the Combobox.Group component.
 * @returns {JSX.Element} The group and its heading.
 */
export const ComboboxGroup: React.FC<ComboboxGroupProps> = ({
  label,
  children,
  className,
  ...props
}) => {
  const labelId = useId();
  const groupClass = usePrefixedClassNames('combobox-group');
  const labelClass = usePrefixedClassNames('combobox-group-label');
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
ComboboxGroup.displayName = 'ComboboxGroup';

/**
 * The message shown in place of the list when nothing matches, announced when typing brings it on screen.
 *
 * @function
 * @param {ComboboxEmptyProps} props - Props for the Combobox.Empty component.
 * @returns {JSX.Element} The message.
 */
export const ComboboxEmpty: React.FC<ComboboxEmptyProps> = ({
  children,
  className,
  onMouseDown,
  ...props
}) => {
  const { engine, reportEmpty } = useCombobox();
  const emptyRef = useRef<HTMLDivElement>(null);
  useClientLayoutEffect(
    () => reportEmpty(emptyRef.current as HTMLDivElement),
    [reportEmpty]
  );
  const emptyClass = usePrefixedClassNames('combobox-empty');
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
ComboboxEmpty.displayName = 'ComboboxEmpty';

/** Combobox with Input, Menu, List, Item, Group and Empty sub-components. */
export const Combobox = withSubComponents(
  ComboboxRoot,
  {
    Input: ComboboxInput,
    Menu: ComboboxMenu,
    List: ComboboxList,
    Item: ComboboxItem,
    Group: ComboboxGroup,
    Empty: ComboboxEmpty,
  },
  'Combobox'
);

export default Combobox;
