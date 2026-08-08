import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import { useConfig } from '../helpers/Config';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useInsideField } from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelId } from './useAutoLabelId';

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
  /** Field label. Automatically associated with the text input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field` (label that `Field` yourself). */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Applied to the inner text input (the labellable control), not the wrapper div. */
  id?: string;
  /** The options data to display (required). */
  data: AutocompleteItem[] | string[];
  /** The current input value (controlled). */
  value?: string;
  /** The selected item (controlled). */
  selected?: AutocompleteItem | string | null;
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Object property to use as the display field. */
  field?: string;
  /** Whether to show a clear button. */
  clearable?: boolean;
  /** Open dropdown when input is focused. */
  openOnFocus?: boolean;
  /** Keep first option highlighted. */
  keepFirst?: boolean;
  /** Keep dropdown open after selection. */
  keepOpen?: boolean;
  /** Select highlighted item on click outside. */
  selectOnClickOutside?: boolean;
  /** Maximum dropdown height in pixels. */
  maxHeight?: number;
  /** Render as dropdown style. */
  dropdown?: boolean;
  /** Show loading state. */
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
  /** Custom header in dropdown. */
  header?: React.ReactNode;
  /** Custom footer in dropdown. */
  footer?: React.ReactNode;
  /** Content to show when no results. */
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
      disabled = false,
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
    const insideField = useInsideField();
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id,
      labelProps,
      rendersLabel: !insideField,
    });
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const { classPrefix } = useConfig();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [internalValue, setInternalValue] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

    // Handle input change
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (controlledValue === undefined) {
          setInternalValue(newValue);
        }
        onInput?.(newValue);
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

    // Handle blur (click outside)
    useEffect(() => {
      if (!isActive) return undefined;

      const handleClickOutside = (e: MouseEvent) => {
        if (!containerRef.current) return;

        // Use composedPath() to correctly detect clicks inside Shadow DOM
        const path = e.composedPath();
        const isInside = path.includes(containerRef.current);

        if (!isInside) {
          if (selectOnClickOutside && highlightedIndex >= 0) {
            handleSelect(filteredData[highlightedIndex]);
          }
          setIsActive(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [
      isActive,
      selectOnClickOutside,
      highlightedIndex,
      filteredData,
      handleSelect,
    ]);

    // Notify active state change
    useEffect(() => {
      onActiveChange?.(isActive);
    }, [isActive, onActiveChange]);

    // Keep first highlighted
    useEffect(() => {
      if (keepFirst && isActive && filteredData.length > 0) {
        setHighlightedIndex(0);
      }
    }, [keepFirst, isActive, filteredData.length, inputValue]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            if (!isActive) {
              setIsActive(true);
            } else {
              setHighlightedIndex(prev =>
                prev < filteredData.length - 1 ? prev + 1 : prev
              );
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
            break;
          case 'Enter':
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredData[highlightedIndex]) {
              handleSelect(filteredData[highlightedIndex]);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setIsActive(false);
            setHighlightedIndex(-1);
            break;
          case 'Tab':
            if (highlightedIndex >= 0 && filteredData[highlightedIndex]) {
              handleSelect(filteredData[highlightedIndex]);
            }
            setIsActive(false);
            break;
        }
      },
      [disabled, isActive, highlightedIndex, filteredData, handleSelect]
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
      'is-active': isActive && (filteredData.length > 0 || !!empty),
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
            aria-expanded={isActive}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            autoComplete="off"
          />
          {clearable && inputValue && !disabled && (
            <span
              className={iconRightClickableClass}
              onClick={handleClear}
              role="button"
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
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          )}
          {loading && (
            <span className={iconRightClass}>
              <span className={loaderClass} />
            </span>
          )}
        </div>

        {isActive && (filteredData.length > 0 || empty) && (
          <div className={dropdownMenuClasses}>
            <div
              ref={dropdownRef}
              className={dropdownContentClass}
              style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
              role="listbox"
              onScroll={handleDropdownScroll}
            >
              {header && <div className={dropdownHeaderClass}>{header}</div>}

              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const isDisabled = typeof item !== 'string' && item.disabled;
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
                      data-index={index}
                      className={itemClasses}
                      onClick={() => !isDisabled && handleSelect(item)}
                      onMouseEnter={() =>
                        !isDisabled && setHighlightedIndex(index)
                      }
                      role="option"
                      aria-selected={isHighlighted}
                      aria-disabled={isDisabled}
                    >
                      {itemTemplate
                        ? itemTemplate(item)
                        : getDisplayValue(item)}
                    </a>
                  );
                })
              ) : (
                <div className={emptyItemClasses}>{empty}</div>
              )}

              {footer && <div className={dropdownFooterClass}>{footer}</div>}
            </div>
          </div>
        )}
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
