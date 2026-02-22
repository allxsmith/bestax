import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';

export interface TaginputItem {
  value: string;
  label?: string;
  [key: string]: any;
}

export type TaginputTag = TaginputItem | string;

/**
 * Props for the Taginput component.
 *
 * @property {TaginputTag[]} [value] - The current tags (controlled).
 * @property {TaginputTag[]} [defaultValue] - Default tags (uncontrolled).
 * @property {string[]} [data] - Autocomplete suggestions.
 * @property {string} [placeholder] - Placeholder text when no tags.
 * @property {string} [field] - Object property to use as display field.
 * @property {boolean} [allowNew] - Allow creating new tags not in suggestions.
 * @property {boolean} [allowDuplicates] - Allow duplicate tags.
 * @property {boolean} [openOnFocus] - Open autocomplete dropdown on focus.
 * @property {boolean} [removeOnKeys] - Remove tag on backspace. Default: true.
 * @property {string[]} [confirmKeys] - Keys to confirm tag creation. Default: ['Enter', ','].
 * @property {boolean} [closable] - Show close button on tags. Default: true.
 * @property {boolean} [attached] - Attach tags visually.
 * @property {number} [maxTags] - Maximum number of tags allowed.
 * @property {number} [maxlength] - Maximum length of input.
 * @property {boolean} [disabled] - Whether the input is disabled.
 * @property {boolean} [readonly] - Whether the input is read-only.
 * @property {(tags: TaginputTag[]) => void} [onChange] - Callback when tags change.
 * @property {(tag: TaginputTag) => void} [onAdd] - Callback when tag is added.
 * @property {(tag: TaginputTag, index: number) => void} [onRemove] - Callback when tag is removed.
 * @property {(value: string) => void} [onTyping] - Callback when typing in input.
 * @property {(tag: TaginputTag) => React.ReactNode} [tagTemplate] - Custom render for tags.
 */
export interface TaginputProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'>,
    Omit<BulmaClassesProps, 'color'> {
  value?: TaginputTag[];
  defaultValue?: TaginputTag[];
  data?: string[];
  placeholder?: string;
  field?: string;
  allowNew?: boolean;
  allowDuplicates?: boolean;
  openOnFocus?: boolean;
  removeOnKeys?: boolean;
  confirmKeys?: string[];
  closable?: boolean;
  attached?: boolean;
  maxTags?: number;
  maxlength?: number;
  disabled?: boolean;
  readonly?: boolean;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  tagColor?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'dark'
    | 'light';
  size?: 'small' | 'medium' | 'large';
  onChange?: (tags: TaginputTag[]) => void;
  onAdd?: (tag: TaginputTag) => void;
  onRemove?: (tag: TaginputTag, index: number) => void;
  onTyping?: (value: string) => void;
  tagTemplate?: (tag: TaginputTag) => React.ReactNode;
}

/**
 * Taginput component for managing multiple tags.
 *
 * Allows users to create, edit, and remove tags with optional
 * autocomplete suggestions.
 *
 * @function
 * @param {TaginputProps} props - Props for the Taginput component.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the input element.
 * @returns {JSX.Element} The rendered taginput component.
 *
 * @example
 * // Basic usage
 * <Taginput
 *   placeholder="Add a tag..."
 *   onChange={(tags) => console.log(tags)}
 * />
 *
 * @example
 * // With autocomplete
 * <Taginput
 *   data={['React', 'Vue', 'Angular', 'Svelte']}
 *   allowNew={false}
 *   placeholder="Select frameworks..."
 * />
 */
export const Taginput = forwardRef<HTMLInputElement, TaginputProps>(
  (
    {
      value: controlledValue,
      defaultValue = [],
      data = [],
      placeholder,
      field = 'label',
      allowNew = true,
      allowDuplicates = false,
      openOnFocus = false,
      removeOnKeys = true,
      confirmKeys = ['Enter', ','],
      closable = true,
      attached = false,
      maxTags,
      maxlength,
      disabled = false,
      readonly = false,
      color,
      tagColor,
      size,
      onChange,
      onAdd,
      onRemove,
      onTyping,
      tagTemplate,
      className,
      ...props
    },
    ref
  ) => {
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [internalTags, setInternalTags] =
      useState<TaginputTag[]>(defaultValue);
    const [inputValue, setInputValue] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // Use controlled or internal tags
    const tags = controlledValue !== undefined ? controlledValue : internalTags;

    // Get display value from tag
    const getDisplayValue = (tag: TaginputTag): string => {
      if (typeof tag === 'string') return tag;
      return tag[field] || tag.value || '';
    };

    // Filter autocomplete data
    const filteredData = data.filter(item => {
      const displayValue = item.toLowerCase();
      const matchesInput = displayValue.includes(inputValue.toLowerCase());
      const notAlreadyAdded =
        allowDuplicates ||
        !tags.some(tag => getDisplayValue(tag).toLowerCase() === displayValue);
      return matchesInput && notAlreadyAdded && inputValue;
    });

    // Update tags
    const updateTags = useCallback(
      (newTags: TaginputTag[]) => {
        if (controlledValue === undefined) {
          setInternalTags(newTags);
        }
        onChange?.(newTags);
      },
      [controlledValue, onChange]
    );

    // Add tag
    const addTag = useCallback(
      (value: string | TaginputTag) => {
        if (disabled || readonly) return;

        const tagValue = typeof value === 'string' ? value.trim() : value;
        const displayValue =
          typeof tagValue === 'string' ? tagValue : getDisplayValue(tagValue);

        if (!displayValue) return;

        // Check max tags
        if (maxTags && tags.length >= maxTags) return;

        // Check duplicates
        if (!allowDuplicates) {
          const exists = tags.some(
            tag =>
              getDisplayValue(tag).toLowerCase() === displayValue.toLowerCase()
          );
          if (exists) return;
        }

        // Check if allowed (must be in data if allowNew is false)
        if (!allowNew && !data.includes(displayValue)) return;

        const newTags = [...tags, tagValue];
        updateTags(newTags);
        onAdd?.(tagValue);
        setInputValue('');
        setIsActive(false);
        setHighlightedIndex(-1);
      },
      [
        disabled,
        readonly,
        tags,
        maxTags,
        allowDuplicates,
        allowNew,
        data,
        field,
        updateTags,
        onAdd,
      ]
    );

    // Remove tag
    const removeTag = useCallback(
      (index: number) => {
        if (disabled || readonly) return;

        const removedTag = tags[index];
        const newTags = tags.filter((_, i) => i !== index);
        updateTags(newTags);
        onRemove?.(removedTag, index);
      },
      [disabled, readonly, tags, updateTags, onRemove]
    );

    // Handle input change
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        // Check if a confirm key was typed
        const lastChar = newValue.slice(-1);
        if (confirmKeys.includes(lastChar) && lastChar !== 'Enter') {
          const valueWithoutKey = newValue.slice(0, -1).trim();
          if (valueWithoutKey) {
            addTag(valueWithoutKey);
          }
          return;
        }

        setInputValue(newValue);
        onTyping?.(newValue);

        if (newValue && data.length > 0) {
          setIsActive(true);
        }
      },
      [confirmKeys, addTag, onTyping, data.length]
    );

    // Handle focus
    const handleFocus = useCallback(() => {
      if (openOnFocus && data.length > 0 && !disabled) {
        setIsActive(true);
      }
    }, [openOnFocus, data.length, disabled]);

    // Handle click outside
    useEffect(() => {
      if (!isActive) return undefined;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsActive(false);
          setHighlightedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [isActive]);

    // Handle keyboard
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled || readonly) return;

        // Handle confirm keys
        if (confirmKeys.includes(e.key)) {
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredData[highlightedIndex]) {
            addTag(filteredData[highlightedIndex]);
          } else if (inputValue.trim()) {
            addTag(inputValue);
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            if (!isActive && data.length > 0) {
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
          case 'Backspace':
            if (removeOnKeys && !inputValue && tags.length > 0) {
              e.preventDefault();
              removeTag(tags.length - 1);
            }
            break;
          case 'Escape':
            setIsActive(false);
            setHighlightedIndex(-1);
            break;
        }
      },
      [
        disabled,
        readonly,
        confirmKeys,
        highlightedIndex,
        filteredData,
        addTag,
        inputValue,
        isActive,
        data.length,
        removeOnKeys,
        tags.length,
        removeTag,
      ]
    );

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

    // Focus input when container is clicked
    const handleContainerClick = useCallback(() => {
      inputRef.current?.focus();
    }, []);

    // Generate classes
    const taginputClasses = usePrefixedClassNames('taginput', {
      'is-active': isActive,
      [`is-${size}`]: !!size,
      'is-disabled': disabled,
    });

    const inputClasses = classNames('input', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
    });

    const tagClasses = classNames('tag', {
      [`is-${tagColor}`]: !!tagColor,
      [`is-${size}`]: !!size,
    });

    const combinedClasses = classNames(
      taginputClasses,
      bulmaHelperClasses,
      className
    );

    const isMaxReached = maxTags !== undefined && tags.length >= maxTags;

    return (
      <div
        ref={containerRef}
        className={combinedClasses}
        onClick={handleContainerClick}
        {...rest}
      >
        <div
          className={classNames('taginput-container', {
            'is-attached': attached,
          })}
        >
          <div className="tags">
            {tags.map((tag, index) => (
              <span key={index} className={tagClasses}>
                {tagTemplate ? tagTemplate(tag) : getDisplayValue(tag)}
                {closable && !disabled && !readonly && (
                  <button
                    type="button"
                    className="delete is-small"
                    onClick={e => {
                      e.stopPropagation();
                      removeTag(index);
                    }}
                    aria-label={`Remove ${getDisplayValue(tag)}`}
                  />
                )}
              </span>
            ))}
            {!isMaxReached && (
              <input
                ref={combinedRef}
                type="text"
                className={inputClasses}
                value={inputValue}
                placeholder={tags.length === 0 ? placeholder : undefined}
                disabled={disabled}
                readOnly={readonly}
                maxLength={maxlength}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                aria-label="Add tag"
              />
            )}
          </div>
        </div>

        {isActive && filteredData.length > 0 && (
          <div className="dropdown-menu is-active">
            <div ref={dropdownRef} className="dropdown-content" role="listbox">
              {filteredData.map((item, index) => (
                <a
                  key={index}
                  className={classNames('dropdown-item', {
                    'is-active': index === highlightedIndex,
                  })}
                  onClick={() => addTag(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={index === highlightedIndex}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Taginput.displayName = 'Taginput';

export default Taginput;
