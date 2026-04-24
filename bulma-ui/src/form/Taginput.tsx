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
import { useConfig, useIconLibrary } from '../helpers/Config';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useInsideField } from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';
import { Icon } from '../elements/Icon';

/**
 * Represents a tag item object with a value and optional label.
 *
 * @property {string} value - The tag value.
 * @property {string} [label] - Display label for the tag.
 */
export interface TaginputItem {
  value: string;
  label?: string;
  [key: string]: any;
}

/** A tag can be either a TaginputItem object or a plain string. */
export type TaginputTag = TaginputItem | string;

type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';

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
 * @property {boolean} [rounded] - Makes tags rounded.
 * @property {boolean} [ellipsis] - Truncate long tag text with ellipsis and show title tooltip.
 * @property {boolean} [hasCounter] - Show counter for maxTags/maxlength. Default: true.
 * @property {string[]} [onPasteSeparators] - Characters to split on paste. Default: [','].
 * @property {(tag: string) => boolean} [beforeAdding] - Validate before adding a tag.
 * @property {(input: string) => TaginputTag} [createTag] - Transform input string to tag.
 * @property {boolean} [keepFirst] - Auto-highlight first autocomplete result.
 * @property {boolean} [keepOpen] - Keep dropdown open after selecting. Default: true.
 * @property {boolean} [loading] - Show loading spinner in input.
 * @property {string} [ariaCloseLabel] - Accessibility label for close buttons.
 * @property {(tags: TaginputTag[]) => void} [onChange] - Callback when tags change.
 * @property {(tag: TaginputTag) => void} [onAdd] - Callback when tag is added.
 * @property {(tag: TaginputTag, index: number) => void} [onRemove] - Callback when tag is removed.
 * @property {(value: string) => void} [onTyping] - Callback when typing in input.
 * @property {(tag: TaginputTag) => React.ReactNode} [tagTemplate] - Custom render for tags.
 * @property {string} [name] - Form field name. When provided, one hidden input per tag is rendered so tags submit as a standard form-encoded array (e.g., `tags=react&tags=vue`).
 * @property {string} [form] - The id of the form the hidden inputs belong to.
 * @property {string} [icon] - Icon name for the input field.
 * @property {IconLibrary} [iconLibrary] - Icon library to use.
 * @property {string} [iconVariant] - Icon style variant (e.g., 'solid', 'outlined').
 * @property {string | string[]} [iconFeatures] - Additional icon modifiers.
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger'} [color] - Bulma color modifier for the input.
 * @property {'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger' | 'dark' | 'light'} [tagColor] - Color modifier for tags.
 * @property {'small' | 'medium' | 'large'} [size] - Size modifier for the component.
 */
export interface TaginputProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'>,
    Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
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
  rounded?: boolean;
  ellipsis?: boolean;
  hasCounter?: boolean;
  onPasteSeparators?: string[];
  beforeAdding?: (tag: string) => boolean;
  createTag?: (input: string) => TaginputTag;
  keepFirst?: boolean;
  keepOpen?: boolean;
  loading?: boolean;
  ariaCloseLabel?: string;
  icon?: string;
  iconLibrary?: IconLibrary;
  iconVariant?: string;
  iconFeatures?: string | string[];
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
  name?: string;
  form?: string;
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
      // Field props
      label,
      labelSize,
      labelProps,
      horizontal,
      message,
      messageColor,
      fieldClassName,
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
      rounded = false,
      ellipsis = false,
      hasCounter = true,
      onPasteSeparators = [','],
      beforeAdding,
      createTag,
      keepFirst = false,
      keepOpen = true,
      loading = false,
      ariaCloseLabel,
      icon,
      iconLibrary: iconLibraryProp,
      iconVariant,
      iconFeatures,
      color,
      tagColor,
      size,
      onChange,
      onAdd,
      onRemove,
      onTyping,
      tagTemplate,
      name,
      form,
      className,
      ...props
    },
    ref
  ) => {
    const insideField = useInsideField();
    const { bulmaHelperClasses, rest } = useBulmaClasses(props);
    const { classPrefix } = useConfig();
    const defaultIconLibrary = useIconLibrary();
    const resolvedLibrary = iconLibraryProp || defaultIconLibrary || 'fa';
    const pcn = (
      ...args: (
        | string
        | number
        | undefined
        | null
        | false
        | Record<string, unknown>
        | unknown[]
      )[]
    ) => prefixedClassNames(classPrefix, ...args);
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
      const hasInput = inputValue || (openOnFocus && isActive);
      return matchesInput && notAlreadyAdded && hasInput;
    });

    // keepFirst: auto-highlight first item when dropdown opens
    useEffect(() => {
      if (keepFirst && isActive && filteredData.length > 0) {
        setHighlightedIndex(0);
      }
    }, [keepFirst, isActive, filteredData.length]);

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

        // beforeAdding validation
        if (beforeAdding && !beforeAdding(displayValue)) return;

        // createTag transformation
        const finalTag = createTag ? createTag(displayValue) : tagValue;

        const newTags = [...tags, finalTag];
        updateTags(newTags);
        onAdd?.(finalTag);
        setInputValue('');
        if (!keepOpen) {
          setIsActive(false);
        }
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
        beforeAdding,
        createTag,
        keepOpen,
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

    // Handle paste
    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (onPasteSeparators.length === 0) return;

        const pastedText = e.clipboardData.getData('text');
        // Check if any separator exists in the pasted text
        const hasSeparator = onPasteSeparators.some(sep =>
          pastedText.includes(sep)
        );

        if (!hasSeparator) return;

        e.preventDefault();

        // Build a regex from all separators
        const escapedSeparators = onPasteSeparators.map(s =>
          s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );
        const regex = new RegExp(`[${escapedSeparators.join('')}]`);

        const parts = pastedText
          .split(regex)
          .map(s => s.trim())
          .filter(Boolean);

        for (const part of parts) {
          addTag(part);
        }
      },
      [onPasteSeparators, addTag]
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
    const taginputClasses = pcn('taginput', {
      'is-active': isActive,
      [`is-${size}`]: !!size,
      [`is-${color}`]: !!color,
      'is-disabled': disabled,
      'is-rounded': rounded,
      'is-ellipsis': ellipsis,
    });

    const containerClasses = pcn('taginput-container', {
      'is-attached': attached,
      'has-icons-left': !!icon,
    });

    const inputClasses = pcn('input', {
      [`is-${size}`]: !!size,
    });

    const tagClasses = pcn('tag', {
      [`is-${tagColor}`]: !!tagColor,
      [`is-${size}`]: !!size,
    });

    const combinedClasses = classNames(
      taginputClasses,
      bulmaHelperClasses,
      className
    );

    const isMaxReached = maxTags !== undefined && tags.length >= maxTags;

    // Counter text
    const showCounter =
      hasCounter && (maxTags !== undefined || maxlength !== undefined);
    const counterText =
      maxTags !== undefined
        ? `${tags.length} / ${maxTags}`
        : maxlength !== undefined
          ? `${inputValue.length} / ${maxlength}`
          : '';

    const counterClasses = pcn('help', 'counter');
    const tagsClasses = pcn('tags');
    const dropdownMenuClasses = pcn('dropdown-menu', 'is-active');
    const dropdownContentClasses = pcn('dropdown-content');
    const iconRightClass = pcn('icon', 'is-right');
    const loaderClass = pcn('loader', 'is-loading');

    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });
    const messageEl = message ? <p className={helpClass}>{message}</p> : null;

    const taginputElement = (
      <div
        ref={containerRef}
        className={combinedClasses}
        onClick={handleContainerClick}
        {...rest}
      >
        <div className={containerClasses}>
          {icon && (
            <Icon
              name={icon}
              library={resolvedLibrary}
              variant={iconVariant}
              features={iconFeatures}
              containerClassName={pcn('icon', 'is-left')}
            />
          )}
          <div className={tagsClasses}>
            {tags.map((tag, index) => {
              const displayVal = getDisplayValue(tag);
              return (
                <span key={index} className={tagClasses}>
                  {tagTemplate ? (
                    tagTemplate(tag)
                  ) : ellipsis ? (
                    <span title={displayVal}>{displayVal}</span>
                  ) : (
                    displayVal
                  )}
                  {closable && !disabled && !readonly && (
                    <button
                      type="button"
                      className="delete is-small"
                      onClick={e => {
                        e.stopPropagation();
                        removeTag(index);
                      }}
                      aria-label={ariaCloseLabel || `Remove ${displayVal}`}
                    />
                  )}
                </span>
              );
            })}
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
                onPaste={handlePaste}
                aria-label="Add tag"
              />
            )}
          </div>
          {loading && (
            <span className={iconRightClass}>
              <span className={loaderClass} />
            </span>
          )}
        </div>

        {isActive && filteredData.length > 0 && (
          <div className={dropdownMenuClasses}>
            <div
              ref={dropdownRef}
              className={dropdownContentClasses}
              role="listbox"
            >
              {filteredData.map((item, index) => (
                <a
                  key={index}
                  className={pcn('dropdown-item', {
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

        {showCounter && <small className={counterClasses}>{counterText}</small>}

        {name &&
          tags.map((tag, i) => (
            <input
              key={`tag-input-${i}`}
              type="hidden"
              name={name}
              value={getDisplayValue(tag)}
              form={form}
            />
          ))}
      </div>
    );

    if (!insideField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={labelProps}
          horizontal={horizontal}
          className={fieldClassName}
        >
          {taginputElement}
          {messageEl}
        </Field>
      );
    }

    return (
      <>
        {taginputElement}
        {messageEl}
      </>
    );
  }
);

Taginput.displayName = 'Taginput';

export default Taginput;
