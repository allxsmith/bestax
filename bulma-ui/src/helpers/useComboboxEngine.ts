// INTERNAL: deliberately not exported from src/index.ts.
import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
} from 'react';
import type React from 'react';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { getActiveElementInTree, isEventInside } from './shadowDom';

/** What an option tells the engine about itself. */
export interface ComboboxOptionState {
  /** What a pick hands back. Unique within the combobox. */
  value: string;
  /** Reachable with the arrows, never picked. */
  disabled: boolean;
  /** The value, or one of them. */
  checked: boolean;
}

/** An option on the page, with its element. */
interface ShownOption extends ComboboxOptionState {
  element: HTMLElement;
}

/**
 * Where the highlight lands once an opened list has rendered, or once typing
 * has changed what's in it:
 *
 * - `first` and `last` (Down and Up Arrow): the checked option, otherwise the
 *   first or last enabled one;
 * - `open` (a click, or any other way of opening): the checked option,
 *   otherwise the first enabled one with `autoHighlight`, otherwise nothing;
 * - `typed`: the first enabled option with `autoHighlight`, otherwise nothing;
 * - `none` (Alt+Down Arrow): nothing.
 *
 * Only an enabled option takes it, so a disabled checked one is passed over.
 */
type Landing = 'first' | 'last' | 'open' | 'typed' | 'none';

/** Options for `useComboboxEngine`. */
export interface ComboboxEngineOptions {
  /** Controlled open state. When set, opening and closing only report through `onOpenChange`. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen: boolean;
  /** Called with the open state asked for, when it differs from the current one. */
  onOpenChange?: (open: boolean) => void;
  /** Called with an option's `value` when it's picked. */
  onOptionSubmit?: (value: string) => void;
  /** Highlights the first enabled option whenever the list opens or its options change. */
  autoHighlight: boolean;
  /** Several values: a pick keeps the list open. */
  multiple: boolean;
  /** The list is always on screen, so nothing opens or closes it. */
  inline: boolean;
}

/** What `useComboboxEngine` hands the parts of a combobox. */
export interface ComboboxEngine {
  /** Whether the list is open. Always, with `inline`. */
  open: boolean;
  /**
   * The field's `aria-expanded`: open, with a listbox that has an option in
   * it on the page. Until the open list has rendered, it's taken to have
   * one, so server markup for an open list says it's expanded.
   */
  expanded: boolean;
  /** The highlighted option's value, if any. */
  highlighted: string | null;
  /** Whether the user has typed since the list opened. */
  typed: boolean;
  /** The listbox's id. */
  listboxId: string;
  /** An option's id, which follows from its value. */
  optionId: (value: string) => string;
  /** For the element around the field and, unless it's portaled, the list. */
  rootRef: React.MutableRefObject<HTMLDivElement | null>;
  /** For the field. */
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  /** For the listbox. */
  listboxRef: React.MutableRefObject<HTMLDivElement | null>;
  /**
   * Records the floating panel while it's on screen, which makes it count as
   * inside, and makes an Escape that closes it stop there. Returns the
   * function that forgets it.
   */
  registerPopup: (element: HTMLElement) => () => void;
  /** Records an option's element. Returns the function that forgets it. */
  registerOption: (
    element: HTMLElement,
    state: ComboboxOptionState
  ) => () => void;
  /** The field's keys, to run after the caller's own handler. */
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** A change to the field's value: the user typed. */
  onChange: () => void;
  /** A click in the field. */
  onClick: () => void;
  /** Focus leaving the field. */
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** The pointer moved over an enabled option. */
  hover: (value: string) => void;
  /** A click on an enabled option. Focus ends up in the field. */
  pick: (value: string) => void;
  /** For anything in the list: a press there doesn't take focus from the field. */
  keepFocus: (event: React.MouseEvent) => void;
  /**
   * For the floating panel: marks a press as inside, which React reports from
   * content the panel portals elsewhere as well.
   */
  markInside: (event: React.PointerEvent) => void;
}

/** An IME is composing, so the key belongs to it (`keyCode` 229 is Safari's word for it). */
const isComposing = (event: React.KeyboardEvent): boolean =>
  event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;

const sameValues = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((value, i) => value === b[i]);

/**
 * The keys, the open state, the highlight and the ARIA of an editable
 * combobox whose list the app renders and filters (#1083). DOM focus stays
 * in the field the whole time: the highlight is `aria-activedescendant`, as
 * the ARIA Authoring Practices ask of a combobox, where `useMenuKeys` moves
 * real focus, as a menu should.
 *
 * The options are read from the listbox in document order whenever they're
 * needed, so options in groups and options that come and go are found, and
 * the highlight is remembered by value, so it survives a re-render. The text
 * in the field and any value are the app's: a pick only calls
 * `onOptionSubmit`.
 *
 * @function useComboboxEngine
 * @param options - The open state, the pick callback and the shape.
 * @returns The state and handlers the parts wire up.
 */
export function useComboboxEngine({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  onOptionSubmit,
  autoHighlight,
  multiple,
  inline,
}: ComboboxEngineOptions): ComboboxEngine {
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionPrefix = `${baseId}-option-`;
  // The value goes into the id encoded, so a value with a space in it still
  // makes one id, not two.
  const optionId = useCallback(
    (value: string) => optionPrefix + encodeURIComponent(value),
    [optionPrefix]
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLElement | null>(null);
  const insidePressRef = useRef<Event | null>(null);
  const optionsRef = useRef(new Map<HTMLElement, ComboboxOptionState>());
  const landingRef = useRef<Landing | null>(null);
  const wasOpenRef = useRef(false);
  const shownValuesRef = useRef<string[]>([]);

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = inline || (controlledOpen ?? internalOpen);

  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [typed, setTyped] = useState(false);
  // Whether a listbox with an option in it is on the page, which only the
  // page can say, so it's read once the open list has rendered.
  const [listShown, setListShown] = useState<boolean | null>(null);
  // Options register from their own effects, which needn't render the
  // component that holds this hook, so they ask for a render to be read.
  const [, refresh] = useReducer((n: number) => n + 1, 0);

  // Closing forgets the highlight, the typing and what was on the page,
  // during render, React's pattern for adjusting state when other state
  // changes.
  if (!open) {
    if (highlighted !== null) setHighlighted(null);
    if (typed) setTyped(false);
    if (listShown !== null) setListShown(null);
  }
  const expanded = open && (listShown ?? true);

  /** The options on the page, in document order, groups included. */
  const shownOptions = useCallback((): ShownOption[] => {
    const listbox = listboxRef.current;
    if (!listbox) return [];
    const shown: ShownOption[] = [];
    listbox
      .querySelectorAll<HTMLElement>('[role="option"]')
      .forEach(element => {
        // Only the Combobox's own options: an element given the role by
        // hand isn't one.
        const state = optionsRef.current.get(element);
        if (state) shown.push({ element, ...state });
      });
    return shown;
  }, []);

  const requestOpen = useCallback(
    (next: boolean, landing: Landing = 'open') => {
      if (inline || next === open) return;
      landingRef.current = next ? landing : null;
      onOpenChange?.(next);
      if (!isControlled) setInternalOpen(next);
    },
    [inline, open, onOpenChange, isControlled]
  );
  const close = useCallback(() => requestOpen(false), [requestOpen]);

  // After every render, read the list: whether it has options, and where
  // the highlight goes now. A highlighted option that has left takes the
  // highlight with it, or hands it to the first enabled one under
  // `autoHighlight`, which also moves it there whenever the options change.
  useClientLayoutEffect(() => {
    const opened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!open) {
      landingRef.current = null;
      shownValuesRef.current = [];
      return;
    }
    const options = shownOptions();
    const values = options.map(option => option.value);
    const changed = !sameValues(values, shownValuesRef.current);
    shownValuesRef.current = values;
    setListShown(values.length > 0);

    const landing = landingRef.current ?? (opened ? 'open' : null);
    landingRef.current = null;
    const enabled = options.filter(option => !option.disabled);
    const checked = enabled.find(option => option.checked)?.value;
    const first = enabled.length > 0 ? enabled[0].value : null;
    const last = enabled.length > 0 ? enabled[enabled.length - 1].value : null;
    let next = highlighted;
    if (landing === 'first') next = checked ?? first;
    else if (landing === 'last') next = checked ?? last;
    else if (landing === 'open')
      next = checked ?? (autoHighlight ? first : null);
    else if (landing === 'typed') next = autoHighlight ? first : null;
    else if (landing === 'none') next = null;
    else if (autoHighlight && changed) next = first;
    // Without `autoHighlight`, which moved it above, a highlighted option
    // that left takes the highlight with it.
    else if (next !== null && !values.includes(next)) next = null;
    setHighlighted(next);
  });

  // A browser scrolls to what has focus, not to an active descendant, so
  // the highlighted option is brought into view here.
  useClientLayoutEffect(() => {
    if (highlighted === null) return;
    const option = shownOptions().find(shown => shown.value === highlighted);
    option?.element.scrollIntoView?.({ block: 'nearest' });
  }, [highlighted, shownOptions]);

  // A press outside the field and the list closes it. The path is checked
  // rather than the target, so it works in a shadow root.
  useEffect(() => {
    const root = rootRef.current;
    if (!open || inline || !root) return undefined;
    const onPress = (event: PointerEvent) => {
      if (
        event === insidePressRef.current ||
        isEventInside(event, rootRef.current) ||
        isEventInside(event, popupRef.current)
      ) {
        return;
      }
      close();
    };
    // Its document, an iframe's when the tree renders into one.
    const doc = root.ownerDocument;
    doc.addEventListener('pointerdown', onPress);
    return () => doc.removeEventListener('pointerdown', onPress);
  }, [open, inline, close]);

  const submit = useCallback(
    (value: string) => {
      onOptionSubmit?.(value);
      if (!multiple) close();
    },
    [onOptionSubmit, multiple, close]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // The caller's handler ran first and can keep a key, and an IME that's
    // composing owns every key.
    if (event.defaultPrevented || isComposing(event)) return;
    const { key, altKey } = event;

    if (!open) {
      if (key === 'ArrowDown' || (key === 'ArrowUp' && !altKey)) {
        event.preventDefault();
        requestOpen(
          true,
          altKey ? 'none' : key === 'ArrowDown' ? 'first' : 'last'
        );
      }
      return;
    }

    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (altKey) {
          if (key === 'ArrowUp' && !inline) {
            event.preventDefault();
            close();
          }
          return;
        }
        event.preventDefault();
        // Disabled options too, so a screen reader user finds them.
        const options = shownOptions();
        if (options.length === 0) return;
        const at = options.findIndex(option => option.value === highlighted);
        const step = key === 'ArrowDown' ? 1 : -1;
        const index =
          at === -1
            ? step === 1
              ? 0
              : options.length - 1
            : (at + step + options.length) % options.length;
        setHighlighted(options[index].value);
        return;
      }
      case 'Enter': {
        const option = shownOptions().find(
          shown => shown.value === highlighted
        );
        if (option) {
          event.preventDefault();
          if (!option.disabled) submit(option.value);
          return;
        }
        // Nothing to pick: the key goes on, so a form submits.
        close();
        return;
      }
      case 'Escape':
        if (inline) return;
        // It stops here only when there was something to close, so a
        // Popover or Modal around it keeps its own Escape otherwise. Nothing
        // stops it going on: a handler further out reads `defaultPrevented`.
        if (popupRef.current) event.preventDefault();
        close();
        return;
      case 'Tab':
        close();
        return;
      case 'Home':
      case 'End':
      case 'ArrowLeft':
      case 'ArrowRight':
        // The field's own keys, which take the field back from the list.
        setHighlighted(null);
        return;
      default:
    }
  };

  const onChange = () => {
    setTyped(true);
    if (open) {
      landingRef.current = 'typed';
      setHighlighted(null);
      refresh();
    } else {
      requestOpen(true, 'typed');
    }
  };

  const onClick = () => {
    requestOpen(true, 'open');
  };

  const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const next = event.relatedTarget as Node | null;
    if (
      next &&
      (rootRef.current?.contains(next) || popupRef.current?.contains(next))
    ) {
      return;
    }
    close();
  };

  const hover = (value: string) => setHighlighted(value);

  const pick = (value: string) => {
    submit(value);
    // A press in the list keeps focus in the field, but a browser that
    // ignores that, or a tap, can leave it elsewhere.
    const input = inputRef.current;
    if (input && input.isConnected && getActiveElementInTree(input) !== input) {
      input.focus();
    }
  };

  const keepFocus = (event: React.MouseEvent) => event.preventDefault();

  const markInside = (event: React.PointerEvent) => {
    insidePressRef.current = event.nativeEvent;
  };

  const registerPopup = useCallback((element: HTMLElement) => {
    popupRef.current = element;
    return () => {
      popupRef.current = null;
    };
  }, []);

  const registerOption = useCallback(
    (element: HTMLElement, state: ComboboxOptionState) => {
      const options = optionsRef.current;
      options.set(element, state);
      refresh();
      return () => {
        options.delete(element);
        refresh();
      };
    },
    []
  );

  return {
    open,
    expanded,
    highlighted,
    typed,
    listboxId,
    optionId,
    rootRef,
    inputRef,
    listboxRef,
    registerPopup,
    registerOption,
    onKeyDown,
    onChange,
    onClick,
    onBlur,
    hover,
    pick,
    keepFocus,
    markInside,
  };
}
