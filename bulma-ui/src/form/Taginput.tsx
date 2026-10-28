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
import { useConfig, useIconLibrary } from '../helpers/Config';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { isEventInside } from '../helpers/shadowDom';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  useFieldsetDisabled,
} from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelId } from './useAutoLabelId';
import { Icon } from '../elements/Icon';

/**
 * Represents a tag item object with a value and optional label.
 */
export interface TaginputItem {
  /** The tag value. */
  value: string;
  /** Display label (optional). */
  label?: string;
  [key: string]: unknown;
}

/** A tag can be either a TaginputItem object or a plain string. */
export type TaginputTag = TaginputItem | string;

type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';

// An IME that's composing owns every key: Enter confirms what it composed,
// the arrows move through its candidates, and Escape cancels it. Safari can
// say so with `keyCode` 229 rather than `isComposing` (#1102).
const isComposing = (e: React.KeyboardEvent): boolean =>
  e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229;

/**
 * Props for the Taginput component.
 * Inside an outer `Field`, or a `Control` with no `Field` around it, it
 * renders no `Field` of its own. The exception is `label`, `message`,
 * `horizontal` or `fieldClassName` in that bare `Control`: it keeps a `Field`
 * for them, nested in the `.control`, and warns in development. Wrap the
 * `Control` in a `Field` instead, and set the `label`, `horizontal` and class
 * name on that `Field`.
 * @extraProp {string} [className] - Additional CSS classes.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Ref forwarded to the input element.
 */
export interface TaginputProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'>,
    Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
  /** Field label. Automatically associated with the text input via `htmlFor` — uses your `id` when provided, otherwise a generated one. Dropped inside an outer `Field`, whose own label associates instead when that `Field` generates a target id (not `grouped`/`hasAddons`, no explicit `labelProps.htmlFor`) and you set no `id` here; it then replaces the `aria-label="Add tag"` fallback too. With `data`, the label naming the input also names the open suggestion list, through `aria-labelledby`, when it has an id: this label always does, and an outer `Field`'s does unless you wired it by hand without an `id` in its `labelProps`. Otherwise the list is named "Suggestions". */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). With `data`, while the label names the input, the suggestion list's `aria-labelledby` points at it, through an `id` here when you give one and a generated one otherwise. */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Applied to the inner text input (the labellable control), not the wrapper div. */
  id?: string;
  /** The current tags (controlled). */
  value?: TaginputTag[];
  /** Default tags (uncontrolled). */
  defaultValue?: TaginputTag[];
  /**
   * Autocomplete suggestions. With `data` set, even to an empty array, the
   * text input is a `role="combobox"` that controls the suggestion list and
   * points `aria-activedescendant` at the highlighted suggestion. Without it
   * there's no list, so the input stays a plain text field.
   */
  data?: string[];
  /** Placeholder text when no tags. */
  placeholder?: string;
  /** Object property to use as display field. */
  field?: string;
  /** Allow creating new tags not in suggestions. */
  allowNew?: boolean;
  /** Allow duplicate tags. */
  allowDuplicates?: boolean;
  /** Open autocomplete dropdown on focus. */
  openOnFocus?: boolean;
  /** Remove tag on backspace. Default: true. */
  removeOnKeys?: boolean;
  /** Keys to confirm tag creation. Default: ['Enter', ',']. */
  confirmKeys?: string[];
  /** Show close button on tags. Default: true. */
  closable?: boolean;
  /** Attach tags visually. */
  attached?: boolean;
  /**
   * Maximum number of tags allowed. At the limit the text input stays but
   * turns read-only, so focus stays put and the label still names it. It
   * takes no more tags and the suggestion list stays closed. Backspace (with
   * `removeOnKeys`) or a tag's remove button makes room again. While the
   * counter shows, it describes the input.
   */
  maxTags?: number;
  /** Maximum length of input. */
  maxlength?: number;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Whether the input is read-only. */
  readonly?: boolean;
  /** Applies rounded corners to the tags. */
  rounded?: boolean;
  /** Truncates long tag text with ellipsis. */
  ellipsis?: boolean;
  /** Shows a counter of the number of tags. */
  hasCounter?: boolean;
  /**
   * Characters that split pasted text into tags. Each part goes through the
   * same checks as a typed tag, against the tags before it, the paste's own
   * included, and adding stops at `maxTags`. `onChange` fires once for the
   * whole paste, and `onAdd` once for each tag it adds.
   */
  onPasteSeparators?: string[];
  /** Validation function called before adding a tag. */
  beforeAdding?: (tag: string) => boolean;
  /** Custom function for creating tag objects from input. */
  createTag?: (input: string) => TaginputTag;
  /** Keeps the first autocomplete suggestion highlighted. */
  keepFirst?: boolean;
  /** Keeps the autocomplete dropdown open after selection. */
  keepOpen?: boolean;
  /**
   * Shows a loading spinner in the input.
   * Under `prefers-reduced-motion: reduce` the spinner stops and stays
   * drawn (with bestax's CSS loaded).
   */
  loading?: boolean;
  /** ARIA label for tag close buttons. */
  ariaCloseLabel?: string;
  /** Icon name for the input field. */
  icon?: string;
  /** Icon library to use. */
  iconLibrary?: IconLibrary;
  /** Icon style variant (e.g., 'solid', 'outlined'). */
  iconVariant?: string;
  /** Additional icon modifiers. */
  iconFeatures?: string | string[];
  /** Input color variant. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Tag color variant. */
  tagColor?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'dark'
    | 'light';
  /** Size variant. */
  size?: 'small' | 'medium' | 'large';
  /** Form field name. When set, one hidden input per tag is rendered. */
  name?: string;
  /** Optional id of the form the hidden inputs belong to. */
  form?: string;
  /** Callback when tags change. */
  onChange?: (tags: TaginputTag[]) => void;
  /** Callback when tag is added. */
  onAdd?: (tag: TaginputTag) => void;
  /** Callback when tag is removed. */
  onRemove?: (tag: TaginputTag, index: number) => void;
  /** Callback when typing in input. */
  onTyping?: (value: string) => void;
  /** Custom render for tags. */
  tagTemplate?: (tag: TaginputTag) => React.ReactNode;
}

/**
 * The `Taginput` component provides a tag/chip input field for managing multiple tags.
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
      data: dataProp,
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
      disabled: disabledProp,
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
      id,
      className,
      ...props
    },
    ref
  ) => {
    const disabled = useFieldsetDisabled(disabledProp);
    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const ownField = rendersOwnField('Taginput', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
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
    const baseId = useId();
    const listboxId = `${baseId}-listbox`;
    const counterId = `${baseId}-counter`;

    // With `data` the input offers suggestions, so it's a combobox, even
    // while none match. Without it there's never a list, so it stays a plain
    // text field.
    const hasSuggestions = dataProp !== undefined;
    const data = dataProp ?? [];

    // Use controlled or internal tags
    const tags = controlledValue !== undefined ? controlledValue : internalTags;

    const isMaxReached = maxTags !== undefined && tags.length >= maxTags;
    // The suggestion list points `aria-labelledby` at the label that names
    // the input, so with suggestions it needs that label's id.
    const {
      controlId,
      fieldLabelProps,
      labelled,
      labelId: listLabelId,
    } = useAutoLabelId({
      label,
      id,
      labelProps,
      rendersLabel: ownField,
      needsLabelId: hasSuggestions,
    });

    // Get display value from tag
    const getDisplayValue = (tag: TaginputTag): string => {
      if (typeof tag === 'string') return tag;
      const fieldValue = tag[field];
      if (typeof fieldValue === 'string') return fieldValue;
      return tag.value || '';
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
    // At the tag limit the list stays closed, since it could only offer tags
    // past the limit (#1087).
    const listOpen = isActive && !isMaxReached && filteredData.length > 0;

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

    // Add tags from text typed, pasted or picked from the list. Each one is
    // checked against the tags before it, this batch's included, so a paste
    // of several adds them all in one change (#1101). Only `createTag` turns
    // text into an object.
    const addTags = useCallback(
      (values: string[]) => {
        if (disabled || readonly) return;

        let next = tags;
        const added: TaginputTag[] = [];
        for (const value of values) {
          // A paste can bring more tags than there's room for, and at the
          // limit the read-only input still takes Enter.
          if (maxTags !== undefined && next.length >= maxTags) break;

          const displayValue = value.trim();
          if (!displayValue) continue;
          const lower = displayValue.toLowerCase();

          // Duplicates, data and the dropdown filter all compare
          // case-insensitively.
          if (
            !allowDuplicates &&
            next.some(tag => getDisplayValue(tag).toLowerCase() === lower)
          )
            continue;

          // Without allowNew, only a suggestion can become a tag.
          if (!allowNew && !data.some(d => d.toLowerCase() === lower)) continue;

          if (beforeAdding && !beforeAdding(displayValue)) continue;

          const tag = createTag ? createTag(displayValue) : displayValue;
          next = [...next, tag];
          added.push(tag);
        }
        if (added.length === 0) return;

        updateTags(next);
        added.forEach(tag => onAdd?.(tag));
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
        /* istanbul ignore next: both triggers (delete button click, Backspace handler) are already gated on disabled/readonly */
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
            addTags([valueWithoutKey]);
          }
          return;
        }

        setInputValue(newValue);
        onTyping?.(newValue);

        if (newValue && data.length > 0) {
          setIsActive(true);
        }
      },
      [confirmKeys, addTags, onTyping, data.length]
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

        // Build a character class from all separators. A `-` is escaped
        // too, since between two others it would make a range.
        const escapedSeparators = onPasteSeparators.map(s =>
          s.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&')
        );
        const regex = new RegExp(`[${escapedSeparators.join('')}]`);

        addTags(pastedText.split(regex));
      },
      [onPasteSeparators, addTags]
    );

    // Handle focus
    const handleFocus = useCallback(() => {
      if (openOnFocus && data.length > 0 && !disabled) {
        setIsActive(true);
      }
    }, [openOnFocus, data.length, disabled]);

    // Reaching the limit dismisses the list the way a click outside does, so
    // making room later doesn't bring it back unasked. It's an effect, not a
    // step in addTag, because a click on a suggestion also bubbles to the
    // container, whose focus on the input reopens the list in that same
    // event, and because a controlled value can reach the limit too.
    useEffect(() => {
      if (isMaxReached) {
        setIsActive(false);
        setHighlightedIndex(-1);
      }
    }, [isMaxReached]);

    // Handle click outside
    useEffect(() => {
      if (!isActive) return undefined;

      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !isEventInside(e, containerRef.current)) {
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
        if (disabled || readonly || isComposing(e)) return;

        // Handle confirm keys
        if (confirmKeys.includes(e.key)) {
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredData[highlightedIndex]) {
            addTags([filteredData[highlightedIndex]]);
          } else if (inputValue.trim()) {
            addTags([inputValue]);
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
            // Closing the suggestions claims the key, so a Modal around the
            // field stays open. With none showing, the key goes on to it.
            if (listOpen) e.preventDefault();
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
        addTags,
        inputValue,
        isActive,
        listOpen,
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

    // The combobox controls its listbox and points at the highlighted option,
    // the way Autocomplete's does. The listbox takes its name from the label
    // that names the combobox, the one this renders or a surrounding Field's,
    // and keeps a fallback name when no label names it or the one that does
    // has no id to point at. While no suggestion matches there's no listbox,
    // so the combobox is collapsed and points at nothing. It skips a
    // highlighted suggestion that's blank once trimmed, since that one can't
    // become a tag, and the option it points at is the one marked selected.
    const optionId = (index: number) => `${listboxId}-${index}`;
    const activeOptionId =
      listOpen && filteredData[highlightedIndex]?.trim()
        ? optionId(highlightedIndex)
        : undefined;
    const comboboxProps: React.InputHTMLAttributes<HTMLInputElement> = {
      role: 'combobox',
      'aria-expanded': listOpen,
      'aria-controls': listOpen ? listboxId : undefined,
      'aria-activedescendant': activeOptionId,
      'aria-haspopup': 'listbox',
      'aria-autocomplete': 'list',
    };

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
                      className={pcn('delete', 'is-small')}
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
            <input
              ref={combinedRef}
              type="text"
              className={inputClasses}
              id={controlId}
              value={inputValue}
              placeholder={tags.length === 0 ? placeholder : undefined}
              disabled={disabled}
              // Read-only at the tag limit rather than gone, so focus stays
              // put and a label keeps naming it, and Backspace still makes
              // room (#1103).
              readOnly={readonly || isMaxReached}
              maxLength={maxlength}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              {...(hasSuggestions && comboboxProps)}
              // Fallback name, dropped only when a rendered label actually
              // targets this input, its own or a surrounding Field's
              // (aria-label would win otherwise). A label pointing elsewhere
              // keeps the fallback so the input is never nameless.
              aria-label={labelled ? undefined : 'Add tag'}
              // The counter, while it shows, describes the input, so at the
              // limit it says why the field takes no more.
              aria-describedby={showCounter ? counterId : undefined}
            />
          </div>
          {loading && (
            <span className={iconRightClass}>
              <span className={loaderClass} />
            </span>
          )}
        </div>

        {listOpen && (
          <div className={dropdownMenuClasses}>
            <div
              ref={dropdownRef}
              id={listboxId}
              className={dropdownContentClasses}
              role="listbox"
              aria-labelledby={listLabelId}
              aria-label={listLabelId ? undefined : 'Suggestions'}
            >
              {filteredData.map((item, index) => (
                <a
                  key={index}
                  id={optionId(index)}
                  className={pcn('dropdown-item', {
                    'is-active': index === highlightedIndex,
                  })}
                  onClick={() => addTags([item])}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={optionId(index) === activeOptionId}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}

        {showCounter && (
          <small id={counterId} className={counterClasses}>
            {counterText}
          </small>
        )}

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

    if (ownField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={fieldLabelProps}
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

/** @deprecated Use `Taginput` — same component. */
export const TagInput = Taginput;

/** @deprecated Use `TaginputProps`. */
export type TagInputProps = TaginputProps;

export default Taginput;
