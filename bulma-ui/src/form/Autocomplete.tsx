import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export interface AutocompleteItem {
  value: string;
  label?: string;
  disabled?: boolean;
  [key: string]: any;
}

/**
 * Props for the Autocomplete component.
 *
 * @property {AutocompleteItem[] | string[]} data - The options data to display.
 * @property {string} [value] - The current input value (controlled).
 * @property {AutocompleteItem | string | null} [selected] - The selected item (controlled).
 * @property {string} [placeholder] - Placeholder text for the input.
 * @property {string} [field] - Object property to use as the display field.
 * @property {boolean} [clearable] - Whether to show a clear button.
 * @property {boolean} [openOnFocus] - Open dropdown when input is focused.
 * @property {boolean} [keepFirst] - Keep first option highlighted.
 * @property {boolean} [keepOpen] - Keep dropdown open after selection.
 * @property {boolean} [selectOnClickOutside] - Select highlighted item on click outside.
 * @property {number} [maxHeight] - Maximum dropdown height in pixels.
 * @property {boolean} [dropdown] - Render as dropdown style.
 * @property {boolean} [loading] - Show loading state.
 * @property {boolean} [disabled] - Whether the input is disabled.
 * @property {boolean} [checkInfiniteScroll] - Enable infinite scroll detection.
 * @property {number} [infiniteScrollDistance] - Distance threshold for infinite scroll.
 * @property {(value: string) => void} [onInput] - Callback when input value changes.
 * @property {(item: AutocompleteItem | string | null) => void} [onSelect] - Callback when item is selected.
 * @property {(active: boolean) => void} [onActiveChange] - Callback when dropdown active state changes.
 * @property {() => void} [onInfiniteScroll] - Callback when scrolled to bottom (infinite scroll).
 * @property {(item: AutocompleteItem | string) => React.ReactNode} [itemTemplate] - Custom render for items.
 * @property {React.ReactNode} [header] - Custom header in dropdown.
 * @property {React.ReactNode} [footer] - Custom footer in dropdown.
 * @property {React.ReactNode} [empty] - Content to show when no results.
 */
export interface AutocompleteProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'onInput'>,
    Omit<BulmaClassesProps, 'color'> {
  data: AutocompleteItem[] | string[];
  value?: string;
  selected?: AutocompleteItem | string | null;
  placeholder?: string;
  field?: string;
  clearable?: boolean;
  openOnFocus?: boolean;
  keepFirst?: boolean;
  keepOpen?: boolean;
  selectOnClickOutside?: boolean;
  maxHeight?: number;
  dropdown?: boolean;
  loading?: boolean;
  disabled?: boolean;
  checkInfiniteScroll?: boolean;
  infiniteScrollDistance?: number;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onInput?: (value: string) => void;
  onSelect?: (item: AutocompleteItem | string | null) => void;
  onActiveChange?: (active: boolean) => void;
  onInfiniteScroll?: () => void;
  itemTemplate?: (item: AutocompleteItem | string) => React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  empty?: React.ReactNode;
}

/**
 * Autocomplete component with dropdown suggestions.
 *
 * Provides an input field with a dropdown of suggestions that filter
 * based on user input.
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
      selected,
      placeholder,
      field = 'label',
      clearable = false,
      openOnFocus = false,
      keepFirst = false,
      keepOpen = false,
      selectOnClickOutside = false,
      maxHeight = 200,
      dropdown = false,
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
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
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
      return item[field] || item.value || '';
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
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
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

    const inputClasses = classNames('input', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-loading': loading,
    });

    const dropdownClasses = classNames('dropdown-menu', {
      'is-active': isActive && (filteredData.length > 0 || empty),
    });

    const combinedClasses = classNames(
      autocompleteClasses,
      bulmaHelperClasses,
      className
    );

    return (
      <div ref={containerRef} className={combinedClasses} {...rest}>
        <div className="control is-expanded has-icons-right">
          <input
            ref={combinedRef}
            type="text"
            className={inputClasses}
            value={inputValue}
            placeholder={placeholder}
            disabled={disabled}
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
              className="icon is-right is-clickable"
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
            <span className="icon is-right">
              <span className="loader is-loading" />
            </span>
          )}
        </div>

        {isActive && (filteredData.length > 0 || empty) && (
          <div className={dropdownClasses}>
            <div
              ref={dropdownRef}
              className="dropdown-content"
              style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
              role="listbox"
              onScroll={handleDropdownScroll}
            >
              {header && <div className="dropdown-header">{header}</div>}

              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const isDisabled = typeof item !== 'string' && item.disabled;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <a
                      key={index}
                      data-index={index}
                      className={classNames('dropdown-item', {
                        'is-active': isHighlighted,
                        'is-disabled': isDisabled,
                      })}
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
                <div className="dropdown-item has-text-grey">{empty}</div>
              )}

              {footer && <div className="dropdown-footer">{footer}</div>}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Autocomplete.displayName = 'Autocomplete';

export default Autocomplete;
