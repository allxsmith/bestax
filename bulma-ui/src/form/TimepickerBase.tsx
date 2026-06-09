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
import {
  PickerPosition,
  HourFormat,
  PickerLabels,
  mergeLabels,
} from './_pickerInternals/pickerTypes';
import {
  formatTime,
  hourCycleFromFormat,
  parseTime,
  DateFormatOption,
  DEFAULT_TIME_FORMAT_24,
  DEFAULT_TIME_FORMAT_12,
} from './_pickerInternals/formatters';
import {
  setTimeOfDay,
  isWithin,
  snapTimeToIncrement,
} from './_pickerInternals/dateUtils';
import { TimeWheels } from './_pickerInternals/TimeWheels';
import { PickerPopover } from './_pickerInternals/PickerPopover';
import { useNativeMobilePicker } from './_pickerInternals/useNativeMobilePicker';
import { useSegmentedEntry } from './_pickerInternals/useSegmentedEntry';
import { Icon } from '../elements/Icon';
import { Buttons } from '../elements/Buttons';

const toIsoTime = (d: Date, withSeconds: boolean): string => {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (!withSeconds) return `${hh}:${mm}`;
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const fromIsoTime = (s: string): Date | null => {
  // The HTML time value may carry fractional seconds (the spec allows them
  // and some engines normalize to `:ss.sss`); accept and drop.
  const m = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/.exec(s);
  if (!m) return null;
  const today = new Date();
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    Number(m[1]),
    Number(m[2]),
    m[3] ? Number(m[3]) : 0,
    0
  );
};

/**
 * Props for the raw Timepicker base. Use the higher-level `Timepicker` for
 * Field/Control composition; `TimepickerBase` is the input + popover only.
 *
 * @property {Date | null} [value] - Controlled selected time.
 * @property {Date | null} [defaultValue] - Initial value for uncontrolled usage.
 * @property {(d: Date | null) => void} [onChange] - Fired when the value changes.
 * @property {() => void} [onOpen] - Fired when the popover opens.
 * @property {() => void} [onClose] - Fired when the popover closes.
 * @property {Date} [min] - Earliest selectable time.
 * @property {Date} [max] - Latest selectable time.
 * @property {boolean} [disabled] - Disable the input.
 * @property {boolean} [readOnly] - Make the input read-only.
 * @property {string} [placeholder] - Placeholder text.
 * @property {DateFormatOption} [format] - Token format string or `Intl.DateTimeFormat` options.
 * @property {(s: string) => Date | null} [parse] - Custom parser.
 * @property {string} [locale] - BCP-47 locale tag.
 * @property {boolean} [inline] - Render the spinner inline (no popover).
 * @property {boolean | 'auto'} [mobileNative] - Use native `<input type="time">` on coarse-pointer devices.
 * @property {boolean} [editable] - Allow segmented keyboard typing in the input (type the time directly, auto-advancing across segments). Default `true`.
 * @property {boolean} [popover] - Whether the spinner popover exists. `false` makes the field input-only (segmented typing with no popover). Default `true`.
 * @property {boolean} [openOnFocus] - Open the popover on focus. Default `true`.
 * @property {boolean} [closeOnSelect] - Close after selection. Default `false`.
 * @property {PickerPosition} [position] - Popover anchor position.
 * @property {boolean} [appendToBody] - Render the popover into `document.body` via portal.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier.
 * @property {'small'|'medium'|'large'} [size] - Size variant.
 * @property {boolean} [isRounded] - Rounded input corners.
 * @property {HourFormat} [hourFormat] - `'12'` or `'24'`. Default `'24'`.
 * @property {boolean} [enableSeconds] - Show a seconds column. Note: iOS Safari's native time picker has no seconds wheel; combine with `mobileNative={false}` if a seconds wheel is required on iOS.
 * @property {number} [incrementHours] - Hour step. Default `1`.
 * @property {number} [incrementMinutes] - Minute step. Default `1`.
 * @property {number} [incrementSeconds] - Second step. Default `1`.
 * @property {(d: Date) => boolean} [unselectableTimes] - Predicate for blocked times (the spinner skips ahead).
 * @property {string} [iconLeftName] - Decorative left icon glyph for the wrapping Control (shown by default; set to '' to hide).
 * @property {boolean} [triggerIcon] - Show a clickable launcher button on the right that toggles the popover. Default `true`.
 * @property {string} [triggerIconName] - Glyph name for the right launcher button. Default `'chevron-down'`.
 * @property {boolean} [audioTick] - Play a short audible tick on each wheel-item crossing. Useful as a substitute for haptic feedback on iOS Safari, which has no web-accessible haptic API. Off by default.
 * @property {boolean} [haptics] - Auto-route platform-appropriate tactile feedback per wheel tick: real vibration on Android (via `navigator.vibrate`) and an audible thunk on iOS (where no haptic API exists). Adds the audio thunk only when vibrate is unavailable, so Android devices aren't subjected to extra sound. The visual band pulse fires regardless. Off by default for backward compat.
 */
export interface TimepickerBaseProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      | 'value'
      | 'defaultValue'
      | 'onChange'
      | 'size'
      | 'color'
      | 'min'
      | 'max'
      | 'type'
      | 'popover'
    >,
    Omit<BulmaClassesProps, 'color'> {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (d: Date | null) => void;
  onOpen?: () => void;
  onClose?: () => void;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  format?: DateFormatOption;
  parse?: (s: string) => Date | null;
  locale?: string;
  inline?: boolean;
  mobileNative?: boolean | 'auto';
  editable?: boolean;
  popover?: boolean;
  openOnFocus?: boolean;
  closeOnSelect?: boolean;
  position?: PickerPosition;
  appendToBody?: boolean;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isRounded?: boolean;
  hourFormat?: HourFormat;
  enableSeconds?: boolean;
  incrementHours?: number;
  incrementMinutes?: number;
  incrementSeconds?: number;
  unselectableTimes?: (d: Date) => boolean;
  iconLeftName?: string;
  triggerIcon?: boolean;
  triggerIconName?: string;
  /** Optional translatable string overrides. */
  labels?: PickerLabels;
  /**
   * Play a short audible tick on each wheel-item crossing. Provides a
   * substitute for haptic feedback on iOS Safari, which has no web-
   * accessible haptic API as of May 2026. Off by default to avoid
   * surprising users with sound; the tick respects the device's silent
   * switch and is suppressed when no audio device is available.
   */
  audioTick?: boolean;
  /**
   * Auto-route platform-appropriate tactile feedback per wheel tick. When
   * `true`:
   *  - On platforms where `navigator.vibrate` is implemented (Android
   *    Chrome / Firefox Android / Samsung Internet), the existing
   *    unconditional `navigator.vibrate(5)` carries the haptic — no audio
   *    is added (don't want to subject Android users to extra sound).
   *  - On platforms where `navigator.vibrate` is absent (notably iOS
   *    Safari, which has no web-accessible haptic API as of May 2026),
   *    the audio thunk is enabled automatically — same as setting
   *    `audioTick={true}` manually.
   *  - The visual band pulse fires regardless (gated only by
   *    `prefers-reduced-motion`).
   * Off by default for backward compat. If `audioTick` is also set, the
   * audio fires regardless of detection (manual opt-in wins).
   */
  haptics?: boolean;
}

/**
 * Raw Timepicker — input + popover spinner without Field/Control wrapping.
 * Use `Timepicker` for the convenience wrapper.
 *
 * @function
 * @param {TimepickerBaseProps} props
 * @returns {JSX.Element}
 */
export const TimepickerBase = forwardRef<HTMLInputElement, TimepickerBaseProps>(
  (props, ref) => {
    const {
      value: controlledValue,
      defaultValue,
      onChange,
      onOpen,
      onClose,
      min,
      max,
      disabled,
      readOnly,
      placeholder,
      format,
      parse,
      locale,
      inline = false,
      mobileNative = 'auto',
      editable = true,
      popover = true,
      openOnFocus = true,
      closeOnSelect = false,
      position = 'bottom-left',
      appendToBody = false,
      color,
      size,
      isRounded,
      hourFormat = '24',
      enableSeconds = false,
      incrementHours = 1,
      incrementMinutes = 1,
      incrementSeconds = 1,
      unselectableTimes,
      className,
      name,
      form,
      required,
      id,
      onFocus,
      onClick,
      onKeyDown,
      onBlur,
      iconLeftName: _iconLeftName,
      triggerIcon = true,
      triggerIconName = 'chevron-down',
      labels,
      audioTick = false,
      haptics = false,
      ...rest
    } = props;

    // Platform-appropriate feedback routing: when `haptics` is opted in and
    // the runtime has no Vibration API (notably iOS Safari), enable the
    // audio thunk so the user still gets *some* tactile cue. When vibrate
    // is available (Android Chrome etc.), the existing unconditional
    // `navigator.vibrate(5)` carries the haptic — no audio added unless
    // the consumer explicitly set `audioTick`. `audioTick` always wins.
    const hasVibrate =
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function';
    const effectiveAudioTick = audioTick || (haptics && !hasVibrate);
    const t = mergeLabels(labels);

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<Date | null>(
      defaultValue ?? null
    );
    const value = isControlled ? (controlledValue ?? null) : internalValue;

    const defaultFormat: DateFormatOption =
      format ??
      (hourFormat === '12'
        ? enableSeconds
          ? 'hh:mm:ss A'
          : DEFAULT_TIME_FORMAT_12
        : enableSeconds
          ? 'HH:mm:ss'
          : DEFAULT_TIME_FORMAT_24);

    // The displayed format is the source of truth for the hour cycle: an
    // explicit 12-hour `format` must drive a 12-hour wheel even when
    // `hourFormat` was left at its default. Fall back to the raw prop only when
    // the cycle can't be read from the format (an Intl-options object, or no
    // hour token).
    const effectiveHourFormat =
      hourCycleFromFormat(defaultFormat) ?? hourFormat;

    const [open, setOpenState] = useState(false);
    const [text, setText] = useState<string>(
      value ? formatTime(value, defaultFormat, locale) : ''
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Snapshot of value at the moment the popover opens, used by Cancel.
    const valueAtOpenRef = useRef<Date | null>(null);
    const reactId = useId();
    const popoverId = id ? `${id}-popover` : `picker-${reactId}`;

    const { bulmaHelperClasses, rest: cleanRest } = useBulmaClasses(rest);

    const { shouldUseNative, isSmallViewport } = useNativeMobilePicker({
      force: mobileNative === 'auto' ? undefined : mobileNative,
    });
    const useNative = !inline && shouldUseNative;
    const wheelItemHeight = isSmallViewport ? 40 : 32;

    const inputClass = usePrefixedClassNames('input', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-rounded': isRounded,
    });
    const containerClass = usePrefixedClassNames('timepicker-container');
    const triggerClass = usePrefixedClassNames('timepicker-trigger');
    const panelClass = usePrefixedClassNames('timepicker-panel');
    const footerClass = usePrefixedClassNames('timepicker-footer');
    const footerButton = usePrefixedClassNames('button', 'is-small');
    const footerOkClass = usePrefixedClassNames(
      'button',
      'is-small',
      'timepicker-footer-ok'
    );
    const mobileFooterClass = usePrefixedClassNames('timepicker-footer-mobile');
    const mobileFooterResetClass = usePrefixedClassNames(
      'timepicker-footer-reset'
    );
    const mobileFooterDoneClass = usePrefixedClassNames(
      'timepicker-footer-done'
    );

    const setOpen = useCallback(
      (next: boolean) => {
        setOpenState(prev => {
          if (prev === next) return prev;
          if (next) {
            valueAtOpenRef.current = value;
            onOpen?.();
          } else {
            onClose?.();
          }
          return next;
        });
      },
      [onOpen, onClose, value]
    );

    useEffect(() => {
      setText(value ? formatTime(value, defaultFormat, locale) : '');
    }, [value, defaultFormat, locale]);

    const commitValue = useCallback(
      (next: Date | null) => {
        if (!isControlled) setInternalValue(next);
        onChange?.(next);
      },
      [isControlled, onChange]
    );

    const handleSpinnerChange = useCallback(
      (parts: { hours: number; minutes: number; seconds?: number }) => {
        const base = value ?? new Date();
        const next = setTimeOfDay(base, parts);
        if (!isWithin(next, min, max)) return;
        commitValue(next);
      },
      [value, min, max, commitValue]
    );

    const tryParse = useCallback(
      (s: string): Date | null => {
        const trimmed = s.trim();
        if (!trimmed) return null;
        const fmt = typeof format === 'string' ? format : undefined;
        return parse
          ? parse(trimmed)
          : parseTime(
              trimmed,
              fmt ??
                (typeof defaultFormat === 'string'
                  ? defaultFormat
                  : DEFAULT_TIME_FORMAT_24)
            );
      },
      [parse, format, defaultFormat]
    );

    // The Date the user edits when starting without a current value. Noon so
    // the 12h / 24h hour calculations are unambiguous.
    const makeBaseDate = useCallback((): Date => {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      return d;
    }, []);

    const inputReadOnlyAttr = !!readOnly || !editable;
    const canOpen = !!popover && !disabled && !readOnly;

    const { inputHandlers } = useSegmentedEntry({
      format: defaultFormat,
      value,
      commitValue,
      formatFn: formatTime,
      tryParse,
      text,
      setText,
      makeBaseDate,
      locale,
      min,
      max,
      disabled,
      readOnly,
      editable,
      popover,
      openOnFocus,
      closeOnSelect,
      isOpen: open,
      setOpen,
      inputRef,
      containerRef,
      onFocus,
      onClick,
      onKeyDown,
      onBlur,
    });

    const combinedRef = useCallback(
      (node: HTMLInputElement | null) => {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current =
          node;
        if (typeof ref === 'function') ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
      },
      [ref]
    );

    if (useNative) {
      const nativeStep = enableSeconds
        ? incrementSeconds
        : incrementMinutes * 60;
      return (
        <input
          {...cleanRest}
          ref={combinedRef}
          type="time"
          step={nativeStep}
          className={classNames(inputClass, bulmaHelperClasses, className)}
          value={value ? toIsoTime(value, enableSeconds) : ''}
          onChange={e => {
            const parsed = e.target.value ? fromIsoTime(e.target.value) : null;
            commitValue(parsed);
          }}
          min={min ? toIsoTime(min, enableSeconds) : undefined}
          max={max ? toIsoTime(max, enableSeconds) : undefined}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          name={name}
          form={form}
          required={required}
          id={id}
        />
      );
    }

    const spinnerValue = {
      hours: value?.getHours() ?? 0,
      minutes: value?.getMinutes() ?? 0,
      seconds: enableSeconds ? (value?.getSeconds() ?? 0) : undefined,
    };

    const panel = (
      <div className={panelClass}>
        <TimeWheels
          value={spinnerValue}
          onChange={handleSpinnerChange}
          hourFormat={effectiveHourFormat}
          enableSeconds={enableSeconds}
          incrementHours={incrementHours}
          incrementMinutes={incrementMinutes}
          incrementSeconds={incrementSeconds}
          unselectableTimes={unselectableTimes}
          color={color}
          size={size}
          disabled={disabled}
          id={popoverId}
          labels={labels}
          itemHeight={wheelItemHeight}
          audioTick={effectiveAudioTick}
          onCommit={() => setOpen(false)}
        />
        {/* Footer is popover-only. Desktop gets the OK / Now / Cancel triad;
            mobile drops to an iOS-style "Reset / ✓" pair to match the OS
            picker's footer affordances and free up vertical space on small
            screens. */}
        {!inline && !isSmallViewport && (
          <Buttons className={footerClass} hasAddons>
            <button
              type="button"
              className={footerOkClass}
              onClick={() => setOpen(false)}
            >
              {t.ok}
            </button>
            <button
              type="button"
              className={footerButton}
              onClick={() => {
                commitValue(
                  snapTimeToIncrement(new Date(), {
                    incrementHours,
                    incrementMinutes,
                    incrementSeconds,
                    enableSeconds,
                  })
                );
                setOpen(false);
              }}
            >
              {t.now}
            </button>
            <button
              type="button"
              className={footerButton}
              onClick={() => {
                commitValue(valueAtOpenRef.current);
                setOpen(false);
              }}
            >
              {t.cancel}
            </button>
          </Buttons>
        )}
        {!inline && isSmallViewport && (
          <div className={mobileFooterClass}>
            <button
              type="button"
              className={mobileFooterResetClass}
              onClick={() => {
                commitValue(valueAtOpenRef.current);
                setOpen(false);
              }}
            >
              {t.reset}
            </button>
            <button
              type="button"
              className={mobileFooterDoneClass}
              aria-label={t.done}
              onClick={() => setOpen(false)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                aria-hidden="true"
              >
                <path
                  d="M5 11l4 4 8-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    );

    if (inline) {
      return (
        <div
          {...cleanRest}
          ref={containerRef}
          className={classNames(containerClass, bulmaHelperClasses, className)}
        >
          {panel}
          {name && (
            <input
              type="hidden"
              name={name}
              form={form}
              value={value ? toIsoTime(value, enableSeconds) : ''}
              required={required}
            />
          )}
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={classNames(containerClass, bulmaHelperClasses, className)}
        {...cleanRest}
      >
        <input
          ref={combinedRef}
          type="text"
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={popoverId}
          autoComplete="off"
          className={inputClass}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={inputReadOnlyAttr}
          name={name}
          form={form}
          required={required}
          id={id}
          {...inputHandlers}
        />
        {popover && triggerIcon && (
          <button
            type="button"
            className={triggerClass}
            onClick={() => {
              if (canOpen) setOpen(!open);
            }}
            disabled={!canOpen}
            aria-label={t.chooseTime}
            aria-haspopup="dialog"
            aria-controls={popoverId}
            aria-expanded={open}
            tabIndex={canOpen ? 0 : -1}
          >
            <Icon name={triggerIconName} size={size} />
          </button>
        )}
        {popover && (
          <PickerPopover
            isOpen={open}
            onClose={() => setOpen(false)}
            anchorRef={containerRef}
            position={position}
            appendToBody={appendToBody}
            ariaLabel={t.chooseTime}
            id={popoverId}
          >
            {panel}
          </PickerPopover>
        )}
      </div>
    );
  }
);

TimepickerBase.displayName = 'TimepickerBase';

export default TimepickerBase;
