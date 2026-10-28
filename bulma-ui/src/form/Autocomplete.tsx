import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import { useConfig } from '../helpers/Config';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useFieldsetDisabled, useInsideField } from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelId } from './useAutoLabelId';
import { useControlLoading } from './controlLoading';
import { StatusRegion, spokenText } from '../helpers/statusRegion';
import { useLatestRef } from '../helpers/useLatestRef';

/**
 * An item in the Autocomplete dropdown list.
 */
export interface AutocompleteItem {
  /** The value used for filtering and selection. */
  value: string;
  /** Display label (optional). */
  label?: string;
  /** Whether the item is disabled and unselectable. */
  disabled?: boolean;
  [key: string]: unknown;
}

// What the status region announces: the `empty` content, as the one item
// it's handed while that content is on screen because of the user's typing.
const typedNoMatches = [{ id: 'empty' }];
const nothingToAnnounce: Array<{ id: string }> = [];

// A press on an option would take focus from the field, since an option
// can't hold it, and nothing would put it back. Cancelling the press keeps
// it there, as the ARIA Authoring Practices' combobox does, and the click
// still picks the option.
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

// An IME that's composing owns every key: Enter confirms what it composed,
// and the arrows move through its candidates. Safari can say so with
// `keyCode` 229 rather than `isComposing`.
const isComposing = (e: React.KeyboardEvent): boolean =>
  e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229;

// Whether an option can be picked. The arrows still reach a disabled one, so
// a screen reader user finds it.
const isEnabled = (item: AutocompleteItem | string): boolean =>
  typeof item === 'string' || !item.disabled;

/**
 * Props for the Autocomplete component.
 * @extraProp {string} [className] - Additional CSS classes.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Ref forwarded to the input element.
 */
export interface AutocompleteProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'onInput'>,
    Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
  /** Field label, associated with the text input via `htmlFor`: through your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose label names the input instead when it points at it. The `Field` points its label there itself when the Autocomplete has no `id` and no inner `Field` sits between them (and the `Field` is not `grouped` or `hasAddons`); a label you wire by hand with `labelProps.htmlFor` points at the input with that `id`. The label naming the input also names the open suggestion list, through `aria-labelledby`, when it has an id: this label always does, and an outer `Field`'s does unless you wired it by hand without an `id` in its `labelProps`. Otherwise the list is named "Suggestions". */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (the input then gets no generated id). While the label names the input, the suggestion list's `aria-labelledby` points at it, through an `id` here when you give one and a generated one otherwise. */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Applied to the inner text input (the labellable control), not the wrapper div. */
  id?: string;
  /** The options data to display (required). */
  data: AutocompleteItem[] | string[];
  /** The current input value (controlled). */
  value?: string;
  /**
   * Does nothing: Autocomplete doesn't read it.
   *
   * @deprecated Nothing reads it, and `onSelect` is what reports a pick. It
   * will be removed in the next major version.
   */
  selected?: AutocompleteItem | string | null;
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Object property to use as the display field. */
  field?: string;
  /**
   * Whether to show a clear button while the input holds a value.
   * It hides while the input is disabled, and gives way to a loading
   * spinner at the same right edge: the one `loading` draws, or that of a
   * `Control` with `isLoading` around the Autocomplete.
   */
  clearable?: boolean;
  /** Open dropdown when input is focused. */
  openOnFocus?: boolean;
  /**
   * Keep the first option highlighted whenever the list opens, Up Arrow and
   * Alt+Down Arrow included, and whenever the text in the field changes.
   * While the list is open on a highlighted option that isn't disabled, Enter
   * picks it rather than submitting a form around the field.
   */
  keepFirst?: boolean;
  /** Keep dropdown open after selection. */
  keepOpen?: boolean;
  /** Select highlighted item on click outside. */
  selectOnClickOutside?: boolean;
  /** Maximum dropdown height in pixels. */
  maxHeight?: number;
  /**
   * Does nothing: Autocomplete doesn't read it, and always shows its
   * suggestions in a dropdown.
   *
   * @deprecated It will be removed in the next major version, with nothing
   * in its place.
   */
  dropdown?: boolean;
  /**
   * Show a loading spinner in the input.
   * Under `prefers-reduced-motion: reduce` the spinner stops and stays
   * drawn (with bestax's CSS loaded).
   */
  loading?: boolean;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Enables infinite scroll detection in the dropdown. */
  checkInfiniteScroll?: boolean;
  /** Distance in pixels from the bottom to trigger `onInfiniteScroll`. */
  infiniteScrollDistance?: number;
  /** Input color variant. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Size variant. */
  size?: 'small' | 'medium' | 'large';
  /** Form field name. Forwarded to the inner `<input>`. */
  name?: string;
  /** Optional id of the form the input belongs to. */
  form?: string;
  /** Marks the field as required for native HTML form validation. */
  required?: boolean;
  /** Callback when input value changes. */
  onInput?: (value: string) => void;
  /** Callback when item is selected. */
  onSelect?: (item: AutocompleteItem | string | null) => void;
  /** Callback when dropdown active state changes. */
  onActiveChange?: (active: boolean) => void;
  /** Callback when scrolled to bottom (infinite scroll). */
  onInfiniteScroll?: () => void;
  /** Custom render for items. */
  itemTemplate?: (item: AutocompleteItem | string) => React.ReactNode;
  /** Custom header at the top of the dropdown. It sits above the list of options rather than in it, so assistive technology doesn't count it as one. */
  header?: React.ReactNode;
  /** Custom footer at the bottom of the dropdown. It sits below the list of options rather than in it, so assistive technology doesn't count it as one. */
  footer?: React.ReactNode;
  /**
   * A message the dropdown shows in place of the options when nothing
   * matches. Keep it to text: `Tab` closes the list, so a keyboard user
   * can't reach a link or button in it. It sits beside the list of options
   * rather than in it, so the input's `aria-expanded` stays false while it
   * shows. When the user's typing leaves nothing that matches, a polite
   * status region announces its text: once each time the matches run out.
   * The text is read when they first run out, and isn't read again as it
   * changes while they stay out, so a message that names the query is heard
   * for that first query only. Keep it static.
   * Opening the list without typing, or emptying the field, announces
   * nothing. While `loading`, or a `Control` with `isLoading` around the
   * Autocomplete, is on, it waits, and it's announced once loading ends
   * with nothing matching. Without `empty`, the dropdown closes when nothing
   * matches and nothing is announced.
   */
  empty?: React.ReactNode;
}

/**
 * The `Autocomplete` component provides an input field with dropdown suggestions that filter based on user input.
 *
 * @function
 * @param {AutocompleteProps} props - Props for the Autocomplete component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the input element.
 * @returns {JSX.Element} The rendered autocomplete component.
 *
 * @example
 * // Basic usage with string array
 * <Autocomplete
 *   data={['Apple', 'Banana', 'Cherry']}
 *   placeholder="Search fruit..."
 *   onSelect={(item) => console.log(item)}
 * />
 *
 * @example
 * // With object data
 * <Autocomplete
 *   data={[{ value: '1', label: 'Option 1' }, { value: '2', label: 'Option 2' }]}
 *   field="label"
 *   onSelect={(item) => console.log(item)}
 * />
 */
export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
  (
    {
      data = [],
      value: controlledValue,
      placeholder,
      field = 'label',
      clearable = false,
      openOnFocus = false,
      keepFirst = false,
      keepOpen = false,
      selectOnClickOutside = false,
      maxHeight = 200,
      loading = false,
      disabled: disabledProp,
      checkInfiniteScroll = false,
      infiniteScrollDistance = 50,
      color,
      size,
      onInput,
      onSelect,
      onActiveChange,
      onInfiniteScroll,
      itemTemplate,
      header,
      footer,
      empty,
      name,
      form,
      required,
      id,
      // Deprecated no-ops, taken here so they stay off the wrapper.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- deprecated no-op
      selected,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- deprecated no-op
      dropdown,
      // Field props
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
    const disabled = useFieldsetDisabled(disabledProp);
    const insideField = useInsideField();
    // The suggestion list points `aria-labelledby` at the label that names
    // the input, so it needs that label's id.
    const {
      controlId,
      fieldLabelProps,
      labelId: listLabelId,
    } = useAutoLabelId({
      label,
      id,
      labelProps,
      rendersLabel: !insideField,
      needsLabelId: true,
    });
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const { classPrefix } = useConfig();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [internalValue, setInternalValue] = useState('');
    const [isActive, setIsActive] = useState(false);
    // Whether the user has typed since the list opened, since only typing
    // gets the `empty` content announced. Closing the list resets it (during
    // render, React's pattern for adjusting state when other state changes),
    // so opening the list again without typing stays quiet.
    const [typed, setTyped] = useState(false);
    if (typed && !isActive) setTyped(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const listboxId = `${useId()}-listbox`;

    // Use controlled or internal value
    const inputValue =
      controlledValue !== undefined ? controlledValue : internalValue;

    // Get display value from item
    const getDisplayValue = (item: AutocompleteItem | string): string => {
      if (typeof item === 'string') return item;
      const fieldValue = item[field];
      if (typeof fieldValue === 'string') return fieldValue;
      return item.value || '';
    };

    // Filter data based on input
    const filteredData = data.filter(item => {
      const displayValue = getDisplayValue(item);
      return displayValue.toLowerCase().includes(inputValue.toLowerCase());
    });

    // The dropdown shows the options or, when nothing matches, the `empty`
    // content. The listbox holds only options, so it's on screen only while
    // there are some.
    const menuOpen = isActive && (filteredData.length > 0 || !!empty);
    const listOpen = isActive && filteredData.length > 0;

    // Handle input change
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (controlledValue === undefined) {
          setInternalValue(newValue);
        }
        onInput?.(newValue);
        setTyped(true);
        if (!isActive && newValue) {
          setIsActive(true);
        }
      },
      [controlledValue, isActive, onInput]
    );

    // Handle item selection
    const handleSelect = useCallback(
      (item: AutocompleteItem | string) => {
        if (typeof item !== 'string' && item.disabled) return;

        const displayValue = getDisplayValue(item);
        if (controlledValue === undefined) {
          setInternalValue(displayValue);
        }
        onInput?.(displayValue);
        onSelect?.(item);

        if (!keepOpen) {
          setIsActive(false);
        }
        setHighlightedIndex(-1);
      },
      [controlledValue, field, keepOpen, onInput, onSelect]
    );

    // Handle clear
    const handleClear = useCallback(() => {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      onInput?.('');
      onSelect?.(null);
      inputRef.current?.focus();
    }, [controlledValue, onInput, onSelect]);

    // Handle focus
    const handleFocus = useCallback(() => {
      if (openOnFocus && !disabled) {
        setIsActive(true);
      }
    }, [openOnFocus, disabled]);

    // Read when a click lands outside, so the listener stays put while the
    // list is open. What it selects changes as the user types and arrows
    // through suggestions, the filtered list is new on every render, and an
    // inline `onInput` or `onSelect` changes on every render of the parent.
    // Typing leaves the highlight where it was, so a list that narrowed can
    // leave it past the last suggestion, with nothing there to select.
    const selectHighlightedRef = useLatestRef(() => {
      if (
        selectOnClickOutside &&
        highlightedIndex >= 0 &&
        highlightedIndex < filteredData.length
      ) {
        handleSelect(filteredData[highlightedIndex]);
      }
    });

    // Handle blur (click outside)
    useEffect(() => {
      if (!isActive) return undefined;

      const handleClickOutside = (e: MouseEvent) => {
        if (!containerRef.current) return;

        // Use composedPath() to correctly detect clicks inside Shadow DOM
        const path = e.composedPath();
        const isInside = path.includes(containerRef.current);

        if (!isInside) {
          selectHighlightedRef.current();
          setIsActive(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [isActive, selectHighlightedRef]);

    // Read when the dropdown opens or closes, so an inline `onActiveChange`,
    // new on every render of the parent, isn't told again about a state that
    // didn't change.
    const onActiveChangeRef = useLatestRef(onActiveChange);

    // Notify active state change
    useEffect(() => {
      onActiveChangeRef.current?.(isActive);
    }, [isActive, onActiveChangeRef]);

    // Keep first highlighted
    useEffect(() => {
      if (keepFirst && isActive && filteredData.length > 0) {
        setHighlightedIndex(0);
      }
    }, [keepFirst, isActive, filteredData.length, inputValue]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled || isComposing(e)) return;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            if (!isActive) {
              // A closed list opens on its first enabled option, as the ARIA
              // Authoring Practices' combobox does. Alt+Down Arrow opens it
              // without a highlight.
              setIsActive(true);
              setHighlightedIndex(
                e.altKey ? -1 : filteredData.map(isEnabled).indexOf(true)
              );
            } else {
              setHighlightedIndex(prev =>
                prev < filteredData.length - 1 ? prev + 1 : prev
              );
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            if (!isActive) {
              // And Up Arrow opens it on its last enabled option.
              setIsActive(true);
              setHighlightedIndex(
                filteredData.map(isEnabled).lastIndexOf(true)
              );
            } else {
              setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
            }
            break;
          case 'Enter':
            // With the list open on a highlighted option it can pick, Enter
            // is that option's. Otherwise it closes the list and goes on, so
            // a form around the field submits, as it would from any text
            // field.
            if (
              isActive &&
              highlightedIndex >= 0 &&
              filteredData[highlightedIndex] &&
              isEnabled(filteredData[highlightedIndex])
            ) {
              e.preventDefault();
              handleSelect(filteredData[highlightedIndex]);
            } else {
              setIsActive(false);
            }
            break;
          case 'Escape':
            // Only closing the dropdown claims the key. With it closed, the
            // key goes on to a Modal around the field.
            if (menuOpen) e.preventDefault();
            setIsActive(false);
            setHighlightedIndex(-1);
            break;
          case 'Tab':
            if (
              isActive &&
              highlightedIndex >= 0 &&
              filteredData[highlightedIndex]
            ) {
              handleSelect(filteredData[highlightedIndex]);
            }
            setIsActive(false);
            break;
        }
      },
      [
        disabled,
        isActive,
        menuOpen,
        highlightedIndex,
        filteredData,
        handleSelect,
      ]
    );

    // Handle dropdown scroll for infinite scroll
    const handleDropdownScroll = useCallback(() => {
      if (!checkInfiniteScroll || !dropdownRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current;
      if (scrollHeight - scrollTop - clientHeight <= infiniteScrollDistance) {
        onInfiniteScroll?.();
      }
    }, [checkInfiniteScroll, infiniteScrollDistance, onInfiniteScroll]);

    // Scroll highlighted item into view
    useEffect(() => {
      if (highlightedIndex >= 0 && dropdownRef.current) {
        const highlightedEl = dropdownRef.current.querySelector(
          `[data-index="${highlightedIndex}"]`
        );
        if (
          highlightedEl &&
          typeof highlightedEl.scrollIntoView === 'function'
        ) {
          highlightedEl.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [highlightedIndex]);

    // Combined ref
    const combinedRef = useCallback(
      (node: HTMLInputElement | null) => {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current =
          node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
        }
      },
      [ref]
    );

    // Generate classes
    const autocompleteClasses = usePrefixedClassNames('autocomplete', {
      'is-active': isActive,
      [`is-${size}`]: !!size,
    });

    const inputClasses = usePrefixedClassNames('input', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-loading': loading,
    });

    const controlClasses = usePrefixedClassNames(
      'control',
      'is-expanded',
      'has-icons-right'
    );

    const dropdownMenuClasses = usePrefixedClassNames('dropdown-menu', {
      'is-active': menuOpen,
    });

    const dropdownContentClass = usePrefixedClassNames('dropdown-content');
    const dropdownHeaderClass = usePrefixedClassNames('dropdown-header');
    const dropdownFooterClass = usePrefixedClassNames('dropdown-footer');
    const emptyItemClasses = usePrefixedClassNames(
      'dropdown-item',
      'has-text-grey'
    );

    const iconRightClickableClass = usePrefixedClassNames(
      'icon',
      'is-right',
      'is-clickable'
    );
    const iconRightClass = usePrefixedClassNames('icon', 'is-right');
    const loaderClass = usePrefixedClassNames('loader', 'is-loading');

    const combinedClasses = classNames(
      autocompleteClasses,
      bulmaHelperClasses,
      className
    );

    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });
    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    // The clear button gives way to a spinner at its spot: the `loading` one,
    // or that of a loading Control this sits in.
    const controlLoading = useControlLoading();
    const showClear =
      clearable && !!inputValue && !disabled && !loading && !controlLoading;

    // The combobox controls its listbox and points at the highlighted option.
    // The listbox takes its name from the label that names the combobox, the
    // one this renders or a surrounding Field's, so the two say the same
    // thing. When no label names the combobox, or the one that does has no
    // id to point at, the list keeps a fallback name. While the dropdown
    // shows only the `empty` content there's no listbox, so the combobox is
    // collapsed and points at nothing.
    const activeOptionId =
      listOpen &&
      highlightedIndex >= 0 &&
      highlightedIndex < filteredData.length
        ? `${listboxId}-${highlightedIndex}`
        : undefined;

    // A polite status region, in the page from the start so it's there
    // before anything is written into it, announces the `empty` content
    // when the user's typing leaves nothing that matches what's in the
    // field. It follows what's on screen, so results that come in after the
    // typing count too. It's said once each time that happens, not again on
    // each keystroke while nothing matches. An empty field isn't a search,
    // so it stays quiet then, even with no data. While `loading`, or a
    // loading Control around it, says results are on their way, it waits,
    // and it's said once loading ends with nothing matching.
    const emptyItems =
      typed &&
      menuOpen &&
      !listOpen &&
      !!inputValue &&
      !loading &&
      !controlLoading
        ? typedNoMatches
        : nothingToAnnounce;
    // The region reads the text on screen, whatever `empty` renders.
    const emptyRef = useRef<HTMLDivElement>(null);
    const describeEmpty = useCallback(() => {
      const node = emptyRef.current;
      /* istanbul ignore if: it's only announced while it's on screen */
      if (!node) return null;
      return spokenText(node);
    }, []);

    const autocompleteElement = (
      <div ref={containerRef} className={combinedClasses} {...rest}>
        <div className={controlClasses}>
          <input
            ref={combinedRef}
            type="text"
            className={inputClasses}
            id={controlId}
            value={inputValue}
            placeholder={placeholder}
            disabled={disabled}
            name={name}
            form={form}
            required={required}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={listOpen}
            aria-controls={listOpen ? listboxId : undefined}
            aria-activedescendant={activeOptionId}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            autoComplete="off"
          />
          {showClear && (
            <button
              type="button"
              className={iconRightClickableClass}
              onClick={handleClear}
              aria-label="Clear"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          {loading && (
            <span className={iconRightClass}>
              <span className={loaderClass} />
            </span>
          )}
        </div>

        {menuOpen && (
          <div className={dropdownMenuClasses}>
            <div
              ref={dropdownRef}
              className={dropdownContentClass}
              style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
              onScroll={handleDropdownScroll}
            >
              {header && <div className={dropdownHeaderClass}>{header}</div>}

              {listOpen ? (
                <div
                  id={listboxId}
                  role="listbox"
                  aria-labelledby={listLabelId}
                  aria-label={listLabelId ? undefined : 'Suggestions'}
                  onMouseDown={keepFocus}
                >
                  {filteredData.map((item, index) => {
                    const isDisabled =
                      typeof item !== 'string' && item.disabled;
                    const isHighlighted = index === highlightedIndex;

                    const itemClasses = prefixedClassNames(
                      classPrefix,
                      'dropdown-item',
                      {
                        'is-active': isHighlighted,
                        'is-disabled': isDisabled,
                      }
                    );

                    return (
                      <a
                        key={index}
                        id={`${listboxId}-${index}`}
                        data-index={index}
                        className={itemClasses}
                        onClick={() => !isDisabled && handleSelect(item)}
                        onMouseEnter={() =>
                          !isDisabled && setHighlightedIndex(index)
                        }
                        role="option"
                        aria-selected={isHighlighted && !isDisabled}
                        aria-disabled={isDisabled}
                      >
                        {itemTemplate
                          ? itemTemplate(item)
                          : getDisplayValue(item)}
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div
                  ref={emptyRef}
                  className={emptyItemClasses}
                  onMouseDown={keepFocus}
                >
                  {empty}
                </div>
              )}

              {footer && <div className={dropdownFooterClass}>{footer}</div>}
            </div>
          </div>
        )}

        <StatusRegion items={emptyItems} describe={describeEmpty} />
      </div>
    );

    if (!insideField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={fieldLabelProps}
          horizontal={horizontal}
          className={fieldClassName}
        >
          {autocompleteElement}
          {messageEl}
        </Field>
      );
    }

    return (
      <>
        {autocompleteElement}
        {messageEl}
      </>
    );
  }
);

Autocomplete.displayName = 'Autocomplete';

export default Autocomplete;
