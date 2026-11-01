import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { Icon } from '../elements/Icon';
import { ColorSwatch } from '../elements/ColorSwatch';
import {
  ColorPickerAlphaSlider,
  ColorPickerArea,
  ColorPickerHueSlider,
  ColorPickerSwatches,
  type ColorFormat,
  type ColorPickerLabels,
  type ColorPickerSwatch,
} from './ColorPicker';
import { formatColor, parseColor } from './_colorInternals/colorMath';
import {
  BLACK,
  ColorPickerContext,
  keepingChannels,
  mergeColorLabels,
  useColorPicker,
} from './_colorInternals/pickerState';
import { EyeDropperButton } from './_colorInternals/EyeDropperButton';
import { PickerPopover } from './_pickerInternals/PickerPopover';
import {
  isPopoverToggleKey,
  type PickerPosition,
} from './_pickerInternals/pickerTypes';
import { usePickerLocaleScope } from './_pickerInternals/useLocaleDefaults';
import { useControlLoading } from './controlLoading';
import { useFieldLabelTarget, useFieldsetDisabled } from './FormContext';

/**
 * Props for the raw ColorInput base. Use the higher-level `ColorInput` for
 * Field/Control composition; `ColorInputBase` is the field and its popover
 * only.
 *
 * @helperProps Helper props go on the `.colorinput` `<div>`, with
 * `className`. The other attributes go on the text `<input>`.
 * @extraProp {string} [name] - Form field name. The field submits the text it shows, the value in `format`, or nothing when it's empty.
 * @extraProp {boolean} [required=false] - Marks the field required, so an empty one fails the form's constraint validation.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Forwarded to the text `<input>`.
 */
export interface ColorInputBaseProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      | 'value'
      | 'defaultValue'
      | 'onChange'
      | 'size'
      | 'color'
      | 'type'
      | 'popover'
    >,
    Omit<BulmaClassesProps, 'color'> {
  /**
   * The color, controlled, as a CSS color the picker reads (hex, `rgb()`,
   * `hsl()` or a color name), or `''` for none.
   */
  value?: string;
  /** The color to start with, uncontrolled; empty without one. */
  defaultValue?: string;
  /**
   * Called with the color, in `format`, as it changes: on every step of a
   * drag in the panel, on a key or a swatch, and when typed text is
   * committed. Clearing the field calls it with `''`.
   */
  onChange?: (value: string) => void;
  /**
   * Called with the color, in `format`, once a change is done: when a drag
   * ends, and with `onChange` for everything else. The place to save it.
   */
  onChangeEnd?: (value: string) => void;
  /**
   * How the value is written: `'hsl'` (`hsl(171, 100%, 41%)`), `'hex'` or
   * `'rgb'`, with alpha as `hsla()`, `#rrggbbaa` and `rgba()`. Typed text in
   * any of them is written back in this one.
   * @defaultValue 'hsl'
   */
  format?: ColorFormat;
  /** Adds an alpha slider to the panel and writes the alpha into the value. */
  alpha?: boolean;
  /**
   * Preset colors in the panel: a list of CSS colors, each a string or
   * `{ color, label }`, or `"bulma"` for the page's theme colors.
   */
  swatches?: ColorPickerSwatch[] | 'bulma';
  /**
   * Adds a button to the panel that picks a color from anywhere on the
   * screen, where the browser has the EyeDropper API.
   */
  eyeDropper?: boolean;
  /** Fired when the panel opens. */
  onOpen?: () => void;
  /** Fired when the panel closes. */
  onClose?: () => void;
  /**
   * Opens the panel when the field takes focus, and moves focus into it.
   * Off by default, since typing a value is the quick way in and the
   * launcher, a click on the swatch or Alt+ArrowDown open it.
   */
  openOnFocus?: boolean;
  /** Closes the panel once a swatch is chosen. */
  closeOnSwatchClick?: boolean;
  /** The panel's place relative to the field. */
  position?: PickerPosition;
  /**
   * Renders the panel through a portal, into the `portalContainer` a
   * `ConfigProvider` sets, `document.body` by default.
   */
  appendToBody?: boolean;
  /** Bulma color modifier for the field. */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** The field's size. */
  size?: 'small' | 'medium' | 'large';
  /** Renders the field with rounded ends. */
  isRounded?: boolean;
  /** Disables the field and its panel. A disabled `Fieldset` does too. */
  disabled?: boolean;
  /** Makes the field read-only, with no panel. */
  readOnly?: boolean;
  /** Text shown while the field is empty. */
  placeholder?: string;
  /**
   * Shows the launcher on the field's end that toggles the panel. Hidden by
   * default while a `Control` it sits in shows its `isLoading` spinner,
   * which shares that edge.
   * @defaultValue true
   */
  triggerIcon?: boolean;
  /** The launcher's glyph. */
  triggerIconName?: string;
  /** The strings it says, each with an English default. */
  labels?: ColorPickerLabels;
}

/**
 * The raw ColorInput: a text field with a swatch and a launcher that opens a color picker in a popover, without Field/Control wrapping.
 *
 * Use `ColorInput` for the convenience wrapper.
 *
 * @function
 * @param {ColorInputBaseProps} props - Props for ColorInputBase.
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to the text `<input>`.
 * @returns {JSX.Element} The rendered field.
 */
export const ColorInputBase = forwardRef<HTMLInputElement, ColorInputBaseProps>(
  (props, ref) => {
    const {
      value: controlledValue,
      defaultValue,
      onChange,
      onChangeEnd,
      format = 'hsl',
      alpha = false,
      swatches,
      eyeDropper = false,
      onOpen,
      onClose,
      openOnFocus = false,
      closeOnSwatchClick = false,
      position = 'bottom-left',
      appendToBody = false,
      color,
      size,
      isRounded,
      disabled: disabledProp,
      readOnly,
      placeholder,
      triggerIcon: triggerIconProp,
      triggerIconName = 'chevron-down',
      labels,
      className,
      id: idProp,
      onFocus,
      onBlur,
      onKeyDown,
      ...rest
    } = props;
    const disabled = useFieldsetDisabled(disabledProp);
    const id = useFieldLabelTarget(idProp, true);
    const localeScope = usePickerLocaleScope(undefined, props.dir);
    const controlLoading = useControlLoading();
    const triggerIcon = triggerIconProp ?? !controlLoading;
    const t = mergeColorLabels(labels);
    const { bulmaHelperClasses, rest: cleanRest } = useBulmaClasses(rest);

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');
    const value = isControlled ? controlledValue : internalValue;
    // What's been typed and not yet committed, or null while the field
    // shows the value.
    const [draft, setDraft] = useState<string | null>(null);
    // The last color it held, which the panel shows while the field is
    // empty, so clearing the field doesn't send the picker back to black.
    const [remembered, setRemembered] = useState(value);
    if (value && value !== remembered) setRemembered(value);

    const [open, setOpenState] = useState(false);
    const canOpen = !disabled && !readOnly;
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Focus a closing panel hands back to the field opens nothing.
    const returningRef = useRef(false);
    const reactId = useId();
    const popoverId = id ? `${id}-popover` : `colorinput-${reactId}`;

    const setOpen = useCallback(
      (next: boolean) => {
        if (next === open) return;
        if (!next) returningRef.current = true;
        setOpenState(next);
        if (next) onOpen?.();
        else onClose?.();
      },
      [open, onOpen, onClose]
    );

    // Cleared once the close has handed focus back, or hasn't.
    useEffect(() => {
      if (!open) returningRef.current = false;
    }, [open]);

    const setValue = (next: string, end = true) => {
      if (!isControlled) setInternalValue(next);
      if (next !== value) onChange?.(next);
      if (end) onChangeEnd?.(next);
    };

    // The picker in the panel, controlled by this field's value.
    const picker = useColorPicker({
      value: value || remembered || formatColor(BLACK, format, alpha),
      defaultValue: undefined,
      onChange: next => setValue(next, false),
      onChangeEnd,
      format,
      alpha,
      disabled,
      swatches,
      eyeDropper,
      labels,
      // Empty, the panel shows the last color the field held, or black, and
      // choosing that same color still fills the field.
      empty: value === '',
    });

    const commit = () => {
      if (draft === null) return;
      const typed = draft.trim();
      setDraft(null);
      if (typed === '') {
        if (value !== '') setValue('');
        return;
      }
      const parsed = parseColor(typed);
      if (!parsed) return;
      // A gray typed as hex, rgb() or a name keeps the panel's hue, as the
      // picker's own field does; one typed as hsl() names its own.
      const kept = keepingChannels(parsed, picker.color, typed);
      setValue(formatColor(alpha ? kept : { ...kept, a: 1 }, format, alpha));
    };
    const invalid = draft !== null && draft.trim() !== '' && !parseColor(draft);
    // The value as the field writes it: in `format`, however it was given.
    const parsedValue = parseColor(value);
    const valueText = parsedValue
      ? formatColor(
          alpha ? parsedValue : { ...parsedValue, a: 1 },
          format,
          alpha
        )
      : value;
    // What the swatch shows: a readable draft as it's typed, else the value.
    const shown = draft !== null && !invalid ? draft.trim() : value;

    const inputClass = usePrefixedClassNames('input', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-rounded': !!isRounded,
      'is-danger': invalid && !color,
    });
    const containerClass = usePrefixedClassNames('colorinput', {
      'has-trigger': triggerIcon,
    });
    const swatchClass = usePrefixedClassNames('colorinput-swatch');
    const triggerClass = usePrefixedClassNames('colorinput-trigger');
    const panelClass = usePrefixedClassNames('color-picker');
    const eyeDropperClass = usePrefixedClassNames('colorinput-eyedropper');

    const combinedRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (isPopoverToggleKey(event) && event.key === 'ArrowDown') {
        event.preventDefault();
        if (canOpen) setOpen(true);
      } else if (draft !== null && event.key === 'Enter') {
        // Commits rather than submitting a form; an unreadable value stays
        // to be fixed.
        event.preventDefault();
        if (!invalid) commit();
      } else if (draft !== null && event.key === 'Escape') {
        // Puts the value back, and keeps a Modal around it open.
        event.preventDefault();
        event.stopPropagation();
        setDraft(null);
      }
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
      const returning = returningRef.current;
      returningRef.current = false;
      if (openOnFocus && canOpen && !returning) setOpen(true);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
      commit();
    };

    const popupAttrs = {
      'aria-haspopup': 'dialog',
      'aria-controls': popoverId,
      'aria-expanded': open,
    } as const;

    return (
      <div
        ref={containerRef}
        className={classNames(containerClass, bulmaHelperClasses, className)}
        {...localeScope.rootAttrs}
      >
        <input
          {...cleanRest}
          ref={combinedRef}
          type="text"
          role="combobox"
          {...popupAttrs}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
          className={inputClass}
          value={draft ?? valueText}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || cleanRest['aria-invalid'] || undefined}
          id={id}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {/* For the pointer: the launcher does the same from the keyboard. */}
        <button
          type="button"
          className={swatchClass}
          tabIndex={-1}
          aria-hidden="true"
          disabled={!canOpen}
          onMouseDown={event => event.preventDefault()}
          onClick={() => setOpen(true)}
        >
          <ColorSwatch color={shown || 'transparent'} aria-hidden="true" />
        </button>
        {triggerIcon && (
          <button
            type="button"
            className={triggerClass}
            {...popupAttrs}
            aria-label={t.chooseColor}
            disabled={!canOpen}
            onClick={() => setOpen(!open)}
          >
            <Icon name={triggerIconName} size={size} />
          </button>
        )}
        <PickerPopover
          localeScope={localeScope.panel}
          isOpen={open}
          onClose={() => setOpen(false)}
          anchorRef={containerRef}
          position={position}
          appendToBody={appendToBody}
          ariaLabel={t.chooseColor}
          id={popoverId}
          restoreFocusRef={inputRef}
        >
          <ColorPickerContext.Provider value={picker}>
            <div className={panelClass}>
              <ColorPickerArea />
              <ColorPickerHueSlider />
              {alpha && <ColorPickerAlphaSlider />}
              {swatches && (
                <ColorPickerSwatches
                  // A click on a swatch, or Enter or Space on one, closes
                  // the panel when asked to; the arrows only choose.
                  onClick={event => {
                    const target = event.target as Element;
                    if (
                      closeOnSwatchClick &&
                      target.closest('[role="radio"]')
                    ) {
                      setOpen(false);
                    }
                  }}
                />
              )}
              <EyeDropperButton className={eyeDropperClass} />
            </div>
          </ColorPickerContext.Provider>
        </PickerPopover>
      </div>
    );
  }
);

ColorInputBase.displayName = 'ColorInputBase';

export default ColorInputBase;
