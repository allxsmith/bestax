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
import { warnOnce } from '../helpers/devWarnings';
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
import { Delete } from '../elements/Delete';
import { Tag } from '../elements/Tag';
import { Tags } from '../elements/Tags';
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
 * One item in a Combobox's `data`. A string there is an item whose label is
 * its value.
 */
export interface ComboboxItemData {
  /**
   * What `onSelect` and `onChange` hand back, and what `name` posts. Unique
   * within the Combobox.
   */
  value: string;
  /** What the item shows, and what typing matches. The `value` when it's left out. */
  label?: string;
  /**
   * Can't be picked. The arrows still reach it, so a screen reader user
   * finds it.
   */
  disabled?: boolean;
  /**
   * The heading the item goes under. Groups show in the order `data` first
   * names them, and the items with no group show together where the first of
   * them is.
   */
  group?: string;
}

/** What a Combobox takes whether it's given `data` or built from parts. */
interface ComboboxBaseProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'color' | 'onChange' | 'onSelect' | 'defaultValue'
    >,
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
   * A disabled item is never picked. With `data`, `onChange` reports the
   * value that follows. Built from parts, the Combobox keeps no value and
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

/** What a Combobox given `data` takes, with one value or several. */
interface ComboboxDataBaseProps extends ComboboxBaseProps {
  /** The field's placeholder, with `data`. */
  placeholder?: string;
  /**
   * A form field name, with `data`. A hidden input posts the value, empty
   * while there's none, and with `multiple` a hidden input posts each value.
   */
  name?: string;
  /**
   * What the menu shows in place of the list, with `data`, when nothing
   * matches the typing, such as "No countries match". It's announced the way
   * `Combobox.Empty` is. Without it, the menu closes while nothing matches.
   */
  empty?: React.ReactNode;
  /**
   * Renders an item's content, with `data`, in place of its label. It's
   * handed the item from `data`, a string there arriving as
   * `{ value, label }`.
   */
  itemTemplate?: (item: ComboboxItemData) => React.ReactNode;
  /**
   * The field can't be used, with `data`: it can't be focused or typed in,
   * its items can't be picked, its tags lose their buttons, and its hidden
   * inputs don't post, the way a disabled field's value doesn't.
   */
  disabled?: boolean;
  /**
   * A value is needed, with `data`. The field is `required` while nothing is
   * picked, so the browser's own check stops the form the way it does for
   * Autocomplete's field, and it's `aria-required` the whole time. The check
   * reads the field's text, so typing without picking passes it until
   * leaving the field puts the text back.
   */
  required?: boolean;
  /**
   * The id of the form the value posts with, with `data`, for a field
   * outside it. It goes on the hidden inputs, and on the field so that form
   * checks `required` too.
   */
  form?: string;
  /**
   * The field's `id`, with `data`, which the label then points at, and so
   * can a label of your own. Built from parts, it lands on `div.combobox`, so
   * give `Combobox.Input` the `id` instead.
   */
  id?: string;
  /**
   * Names the field and the list, with `data`, in place of a `label`. Built
   * from parts, it lands on `div.combobox`, so put it on `Combobox.Input`.
   */
  'aria-label'?: string;
  /**
   * The ids of what names the field and the list, with `data`, in place of
   * a `label`. Built from parts, it lands on `div.combobox`, so put it on
   * `Combobox.Input`.
   */
  'aria-labelledby'?: string;
  /** @internal With `data`, the Combobox renders its own parts. */
  children?: never;
}

/** Props for a Combobox given `data`, with one value. */
export interface ComboboxSingleDataProps extends ComboboxDataBaseProps {
  /**
   * The items, for a Combobox that renders the field, the menu, the list,
   * the groups and the empty message itself. A string is an item whose label
   * is its value, and an object is `{ value, label?, disabled?, group? }`.
   * Typing filters the items by label, ignoring case, and the Combobox keeps
   * the value. Leave it out to build the Combobox from parts.
   */
  data: (string | ComboboxItemData)[];
  /**
   * Several values can be picked. The list stays open after a pick, it's
   * `aria-multiselectable`, and each item's `checked` is its
   * `aria-selected`. With `data`, the value is an array, and the picks show
   * as tags under the field, each with a button that takes it off.
   * @defaultValue false
   */
  multiple?: false;
  /**
   * The value, controlled, with `data`: the picked item's `value`, or `null`
   * for none, and with `multiple` an array of them. With one value, the
   * field shows the picked item's label while you aren't typing in it.
   */
  value?: string | null;
  /** The value to start with when uncontrolled, with `data`. */
  defaultValue?: string | null;
  /**
   * Called with the new value, with `data`, when a pick or a tag's button
   * changes it: an item's `value`, or with `multiple` the array.
   */
  onChange?: (value: string | null) => void;
}

/** Props for a Combobox given `data`, with several values. */
export interface ComboboxMultipleDataProps extends ComboboxDataBaseProps {
  /**
   * The items, for a Combobox that renders itself. A string is an item whose
   * label is its value, and an object is `{ value, label?, disabled?, group? }`.
   */
  data: (string | ComboboxItemData)[];
  /**
   * Several values can be picked: the value is an array, and the picks show
   * as tags under the field, each with a button that takes it off.
   */
  multiple: true;
  /** The values, controlled: the picked items' `value`s. */
  value?: string[];
  /** The values to start with when uncontrolled. */
  defaultValue?: string[];
  /** Called with the new array when a pick or a tag's button changes it. */
  onChange?: (value: string[]) => void;
}

/** Props for a Combobox given `data`. */
type ComboboxDataProps = ComboboxSingleDataProps | ComboboxMultipleDataProps;

/** Props for a Combobox built from parts. */
export interface ComboboxPartsProps extends ComboboxBaseProps {
  /**
   * The parts, in order: `Combobox.Input`, then `Combobox.Menu` with
   * `Combobox.List` and `Combobox.Empty` in it. With `inline`, the
   * `Combobox.List` and `Combobox.Empty` go straight in. Render
   * `Combobox.List` while there are items and `Combobox.Empty` while
   * there aren't: the empty message sits beside the list, not in it. With
   * `data` there are none to give: children given with it are ignored, with
   * a warning in development.
   */
  children?: React.ReactNode;
  /**
   * Several values can be picked. The list stays open after a pick, it's
   * `aria-multiselectable`, and each item's `checked` is its
   * `aria-selected`.
   * @defaultValue false
   */
  multiple?: boolean;
  /** @internal Built from parts, there's no `data`. */
  data?: never;
  /** @internal Built from parts, the app keeps the value. */
  value?: never;
  /** @internal Built from parts, the app keeps the value. */
  defaultValue?: never;
  /** @internal Built from parts, `onSelect` reports a pick. */
  onChange?: never;
  /** @internal Built from parts, `Combobox.Input` takes the placeholder. */
  placeholder?: never;
  /** @internal Built from parts, the app posts the value. */
  name?: never;
  /** @internal Built from parts, `Combobox.Empty` is the empty message. */
  empty?: never;
  /** @internal Built from parts, `Combobox.Item` renders its own content. */
  itemTemplate?: never;
  /** @internal Built from parts, `Combobox.Input` takes `disabled`. */
  disabled?: never;
  /** @internal Built from parts, `Combobox.Input` takes `required`. */
  required?: never;
  /** @internal Built from parts, the app posts the value. */
  form?: never;
}

/**
 * Props for the Combobox component: given `data`, it renders itself and
 * keeps the value, and without it, it's built from parts. The helper props,
 * the other attributes and the `ref` land on the `div.combobox` around the
 * field and the list. It renders the `Field` and the label itself, unless an
 * outer `Field` already does.
 *
 * @extraProp {React.Ref<HTMLDivElement>} [ref] - Ref forwarded to the `div.combobox` around the field and the list.
 */
export type ComboboxProps =
  ComboboxSingleDataProps | ComboboxMultipleDataProps | ComboboxPartsProps;

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
 * The Combobox built from parts: the field, the menu, the list and the
 * keys, with the data, the filtering and the value left to the app.
 */
const ComboboxParts = forwardRef<HTMLDivElement, ComboboxPartsProps>(
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
ComboboxParts.displayName = 'ComboboxParts';

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

  const menuClass = usePrefixedClassNames('dropdown-menu', 'combobox-menu', {
    [`is-${placement.position}`]: true,
    'is-portal': appendToBody,
    [`is-${size}`]: !!size,
  });
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
  const itemClass = usePrefixedClassNames('dropdown-item', 'combobox-item', {
    'is-active': highlighted,
    'is-checked': checked,
    'is-disabled': disabled,
  });
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

/** An entry in `data` as an item: a string is its own label. */
const toItem = (entry: string | ComboboxItemData): ComboboxItemData =>
  typeof entry === 'string' ? { value: entry, label: entry } : entry;

const labelOf = (item: ComboboxItemData): string => item.label ?? item.value;

/** One value or several, as a list: one value is a list of none or one. */
const asList = (value: string | string[] | null | undefined): string[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];

/**
 * The Combobox given `data`. It renders the parts itself, filters the items
 * by label as the user types, and keeps the value, so a pick goes through
 * the same parts, keys and ARIA as one built by hand.
 */
const ComboboxFromData = forwardRef<HTMLDivElement, ComboboxDataProps>(
  (props, ref) => {
    const {
      data,
      value,
      defaultValue,
      // Called below through `props`, which knows which value it takes.
      onChange: _onChange,
      multiple = false,
      placeholder,
      name,
      empty,
      itemTemplate,
      onSelect,
      inline = false,
      disabled = false,
      required = false,
      form,
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      children,
      ...rest
    } = props;
    // A name given in place of a label is the field's and the list's, not
    // the wrapper's. Only the ones given are passed, since an
    // `aria-labelledby` that's there at all, even undefined, keeps the
    // label's name off the field.
    const named = {
      ...(ariaLabel !== undefined && { 'aria-label': ariaLabel }),
      ...(ariaLabelledBy !== undefined && {
        'aria-labelledby': ariaLabelledBy,
      }),
    };
    if (flattenChildren(children).length > 0) {
      warnOnce(
        'Combobox:data-children',
        '[bestax-bulma] <Combobox data> renders its own field, menu and ' +
          'items, so its children are ignored. Give it data or build it ' +
          'from parts, not both.'
      );
    }
    const items = data.map(toItem);
    const labelFor = (picked: string) => {
      const item = items.find(entry => entry.value === picked);
      return item ? labelOf(item) : picked;
    };

    const controlled = value !== undefined;
    const [ownValue, setOwnValue] = useState(() => asList(defaultValue));
    const picked = controlled ? asList(value) : ownValue;
    const change = (next: string[]) => {
      if (!controlled) setOwnValue(next);
      // With one value, a pick is the only change, so `next` holds it.
      if (props.multiple === true) props.onChange?.(next);
      else props.onChange?.(next[0]);
    };

    // What's typed, or `null` while the field shows the value instead.
    const [query, setQuery] = useState<string | null>(null);
    const term = (query ?? '').trim().toLowerCase();
    const shown = items.filter(item =>
      labelOf(item).toLowerCase().includes(term)
    );
    const inputRef = useRef<HTMLInputElement>(null);

    const select = (pick: string) => {
      onSelect?.(pick);
      if (multiple) {
        change(
          picked.includes(pick)
            ? picked.filter(v => v !== pick)
            : [...picked, pick]
        );
      } else {
        if (picked[0] !== pick) change([pick]);
        setQuery(null);
      }
    };
    const remove = (pick: string) => {
      change(picked.filter(v => v !== pick));
      inputRef.current?.focus();
    };

    // Each group where `data` first names it, and the items with none
    // together where the first of them is.
    const sections = new Map<string, ComboboxItemData[]>();
    for (const item of shown) {
      const group = item.group ?? '';
      sections.set(group, [...(sections.get(group) ?? []), item]);
    }
    const renderItem = (item: ComboboxItemData) => (
      <ComboboxItem
        key={item.value}
        value={item.value}
        disabled={disabled || item.disabled}
        checked={picked.includes(item.value)}
      >
        {itemTemplate ? itemTemplate(item) : labelOf(item)}
      </ComboboxItem>
    );
    const list =
      shown.length > 0 ? (
        <ComboboxList {...named}>
          {Array.from(sections, ([group, members]) =>
            group ? (
              <ComboboxGroup key={group} label={group}>
                {members.map(renderItem)}
              </ComboboxGroup>
            ) : (
              members.map(renderItem)
            )
          )}
        </ComboboxList>
      ) : empty ? (
        <ComboboxEmpty>{empty}</ComboboxEmpty>
      ) : null;

    return (
      <>
        <ComboboxParts
          {...rest}
          ref={ref}
          multiple={multiple}
          inline={inline}
          onSelect={select}
        >
          <ComboboxInput
            {...named}
            ref={inputRef}
            id={id}
            disabled={disabled}
            // The browser's check reads the field's text, and only a pick
            // fills it for good, so it's required until there is one.
            required={required && picked.length === 0}
            aria-required={required || undefined}
            form={form}
            placeholder={placeholder}
            value={
              query ??
              (multiple || picked.length === 0 ? '' : labelFor(picked[0]))
            }
            onChange={event => setQuery(event.target.value)}
            onBlur={() => setQuery(null)}
          />
          {inline ? list : <ComboboxMenu>{list}</ComboboxMenu>}
          {name &&
            (multiple ? picked : [picked[0] ?? '']).map(v => (
              <input
                key={v}
                type="hidden"
                name={name}
                value={v}
                form={form}
                disabled={disabled}
              />
            ))}
        </ComboboxParts>
        {multiple && picked.length > 0 && (
          <Tags mt="2">
            {picked.map(v => (
              <Tag key={v}>
                {labelFor(v)}
                {!disabled && (
                  <Delete
                    size="small"
                    ariaLabel={`Remove ${labelFor(v)}`}
                    onClick={() => remove(v)}
                  />
                )}
              </Tag>
            ))}
          </Tags>
        )}
      </>
    );
  }
);
ComboboxFromData.displayName = 'ComboboxFromData';

/**
 * The `Combobox` component is a text field with a list to pick from under it, for a searchable select, a multi-select with tags, grouped items or a server search: given `data` it does the rest, and built from parts it leaves the data to you.
 *
 * Given `data`, it's one element. It renders the field, the menu, the list,
 * the groups and the empty message, filters the items by label as the user
 * types, and keeps the value, which `onChange` reports. With `multiple`, the
 * picks show as tags under the field.
 *
 * Built from parts, the app owns the data: what's in the list, how it's
 * filtered, and the value. A pick calls `onSelect` with the item's `value`,
 * and the Combobox keeps no value and never changes the text in the field,
 * so the app sets both there. Nothing filters the items either, so a
 * server's answer shows as it came. For a free-text field with suggestions,
 * `Autocomplete` is the simpler choice.
 *
 * Either way, focus stays in the field, and the highlighted item is its
 * `aria-activedescendant`. With one value, the highlighted item is the
 * `aria-selected` one, as the ARIA Authoring Practices' combobox does it, and
 * a `checked` item shows a check mark and takes the highlight when the list
 * opens. With `multiple`, `checked` is each item's `aria-selected`. Tab and
 * focus leaving close the menu without picking.
 *
 * When typing leaves the empty message on screen, its text is announced
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
 * <Combobox
 *   label="Country"
 *   data={['Canada', 'France', 'Japan']}
 *   placeholder="Pick a country"
 *   empty="No countries match"
 * />
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
const ComboboxRoot = forwardRef<HTMLDivElement, ComboboxProps>((props, ref) =>
  props.data === undefined ? (
    <ComboboxParts {...props} ref={ref} />
  ) : (
    <ComboboxFromData {...props} ref={ref} />
  )
);

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
