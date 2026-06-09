import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { classNames, usePrefixedClassNames } from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import {
  PickerPosition,
  HourFormat,
  DayOfWeek,
  PickerLabels,
  mergeLabels,
} from './_pickerInternals/pickerTypes';
import {
  formatDateTime,
  formatTime,
  hourCycleFromFormat,
  parseDate,
  DateFormatOption,
  DEFAULT_DATETIME_FORMAT,
} from './_pickerInternals/formatters';
import {
  isWithin,
  setTimeOfDay,
  clampDate,
} from './_pickerInternals/dateUtils';
import { Calendar } from './_pickerInternals/Calendar';
import { TimeWheels } from './_pickerInternals/TimeWheels';
import { PickerPopover } from './_pickerInternals/PickerPopover';
import { useNativeMobilePicker } from './_pickerInternals/useNativeMobilePicker';
import { useSegmentedEntry } from './_pickerInternals/useSegmentedEntry';
import { Icon } from '../elements/Icon';

const toIsoDateTime = (d: Date, withSeconds: boolean): string => {
  const yyyy = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return withSeconds
    ? `${yyyy}-${mo}-${dd}T${hh}:${mm}:${ss}`
    : `${yyyy}-${mo}-${dd}T${hh}:${mm}`;
};

const fromIsoDateTime = (s: string): Date | null => {
  // The HTML datetime-local value may carry fractional seconds (the spec
  // allows them and some engines normalize to `:ss.sss`); accept and drop.
  const m =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/.exec(
      s
    );
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    m[6] ? Number(m[6]) : 0,
    0
  );
};

/**
 * Props for the raw Datetimepicker base. Use the higher-level `Datetimepicker`
 * for Field/Control composition. Combines the prop set of `DatepickerBaseProps`
 * and `TimepickerBaseProps`.
 *
 * @property {Date | null} [value] - Controlled selected date-time.
 * @property {Date | null} [defaultValue] - Initial value for uncontrolled usage.
 * @property {(d: Date | null) => void} [onChange] - Fired when either half changes.
 * @property {() => void} [onOpen] - Fired when the popover opens.
 * @property {() => void} [onClose] - Fired when the popover closes.
 * @property {Date} [min] - Lower bound for the combined date-time.
 * @property {Date} [max] - Upper bound for the combined date-time.
 * @property {boolean} [disabled] - Disable the input.
 * @property {boolean} [readOnly] - Read-only input.
 * @property {string} [placeholder] - Placeholder text.
 * @property {DateFormatOption} [format] - Token format string or `Intl.DateTimeFormat` options. Default `'YYYY-MM-DD HH:mm'`.
 * @property {(s: string) => Date | null} [parse] - Custom parser.
 * @property {string} [locale] - BCP-47 locale tag.
 * @property {boolean} [inline] - Render the panel inline (no popover).
 * @property {boolean | 'auto'} [mobileNative] - Use native `<input type="datetime-local">` on coarse-pointer devices.
 * @property {boolean} [editable] - Allow segmented keyboard typing in the input (type the date-time directly, auto-advancing across segments). Default `true`.
 * @property {boolean} [popover] - Whether the calendar + time popover exists. `false` makes the field input-only (segmented typing with no popover). Default `true`.
 * @property {boolean} [openOnFocus] - Open the popover on focus. Default `true`.
 * @property {boolean} [closeOnSelect] - Close after selection. Default `false`.
 * @property {PickerPosition} [position] - Popover anchor position.
 * @property {boolean} [appendToBody] - Render the popover into `document.body` via portal.
 * @property {'primary'|'link'|'info'|'success'|'warning'|'danger'} [color] - Bulma color modifier.
 * @property {'small'|'medium'|'large'} [size] - Size variant.
 * @property {boolean} [isRounded] - Rounded input corners.
 * @property {(d: Date) => boolean} [shouldDisableDate] - Predicate for disabled dates.
 * @property {Date[]} [unselectableDates] - Convenience array of disabled dates.
 * @property {DayOfWeek} [firstDayOfWeek] - Day the calendar week starts on.
 * @property {string[]} [dayNames] - Override the 7 day-name labels.
 * @property {string[]} [monthNames] - Override the 12 month-name labels.
 * @property {boolean} [nearbyMonthDays] - Show dimmed dates from adjacent months.
 * @property {HourFormat} [hourFormat] - `'12'` or `'24'`. Default `'24'`.
 * @property {boolean} [enableSeconds] - Show a seconds column. Note: iOS Safari's native datetime-local picker has no seconds wheel; combine with `mobileNative={false}` if a seconds wheel is required on iOS.
 * @property {number} [incrementHours] - Hour step.
 * @property {number} [incrementMinutes] - Minute step.
 * @property {number} [incrementSeconds] - Second step.
 * @property {(d: Date) => boolean} [unselectableTimes] - Predicate for blocked times.
 * @property {string} [iconLeftName] - Decorative left icon glyph for the wrapping Control (shown by default; set to '' to hide).
 * @property {boolean} [triggerIcon] - Show a clickable launcher button on the right that toggles the popover. Default `true`.
 * @property {string} [triggerIconName] - Glyph name for the right launcher button. Default `'chevron-down'`.
 * @property {boolean} [audioTick] - Play a short audible tick on each time-wheel crossing. Default `false`.
 * @property {boolean} [haptics] - Auto-route tactile feedback per wheel tick (vibrate on Android, audio thunk on iOS). Default `false`.
 */
export interface DatetimepickerBaseProps
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
  // date subset
  shouldDisableDate?: (d: Date) => boolean;
  unselectableDates?: Date[];
  firstDayOfWeek?: DayOfWeek;
  dayNames?: string[];
  monthNames?: string[];
  nearbyMonthDays?: boolean;
  // time subset
  hourFormat?: HourFormat;
  enableSeconds?: boolean;
  incrementHours?: number;
  incrementMinutes?: number;
  incrementSeconds?: number;
  unselectableTimes?: (d: Date) => boolean;
  iconLeftName?: string;
  triggerIcon?: boolean;
  triggerIconName?: string;
  audioTick?: boolean;
  haptics?: boolean;
  /** Optional translatable string overrides. */
  labels?: PickerLabels;
}

/**
 * Raw Datetimepicker — combined input + calendar + time spinner without
 * Field/Control wrapping. Use `Datetimepicker` for the convenience wrapper.
 *
 * @function
 * @param {DatetimepickerBaseProps} props
 * @returns {JSX.Element}
 */
export const DatetimepickerBase = forwardRef<
  HTMLInputElement,
  DatetimepickerBaseProps
>((props, ref) => {
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
    shouldDisableDate,
    unselectableDates,
    firstDayOfWeek = 0,
    dayNames,
    monthNames,
    nearbyMonthDays = true,
    hourFormat = '24',
    enableSeconds = false,
    incrementHours = 1,
    // Step between visible wheel values; 1 gives the iOS-style every-minute wheel.
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
    audioTick = false,
    haptics = false,
    labels,
    ...rest
  } = props;
  const t = mergeLabels(labels);

  // Platform-appropriate feedback routing for the time wheel: on iOS (no
  // navigator.vibrate) the audio thunk fills in; on Android the real haptic
  // fires and no audio is layered on. `audioTick` always wins.
  const hasVibrate =
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  const effectiveAudioTick = audioTick || (haptics && !hasVibrate);

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<Date | null>(
    defaultValue ?? null
  );
  const value = isControlled ? (controlledValue ?? null) : internalValue;

  const initialFocused = useMemo(
    () => clampDate(value ?? new Date(), min, max),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [focusedDate, setFocusedDate] = useState<Date>(initialFocused);
  // Re-clamp focusedDate when min/max change so the focused cell stays valid.
  useEffect(() => {
    setFocusedDate(prev => clampDate(prev, min, max));
  }, [min, max]);

  const defaultFormat: DateFormatOption =
    format ??
    (hourFormat === '12'
      ? enableSeconds
        ? 'YYYY-MM-DD hh:mm:ss A'
        : 'YYYY-MM-DD hh:mm A'
      : enableSeconds
        ? 'YYYY-MM-DD HH:mm:ss'
        : DEFAULT_DATETIME_FORMAT);

  // The displayed format is the source of truth for the hour cycle: an explicit
  // 12-hour `format` must drive a 12-hour wheel + pill even when `hourFormat`
  // was left at its default. Fall back to the raw prop only when the cycle
  // can't be read from the format (an Intl-options object, or no hour token).
  const effectiveHourFormat = hourCycleFromFormat(defaultFormat) ?? hourFormat;

  const [open, setOpenState] = useState(false);
  // The time wheels are collapsed by default (iOS-style); the user reveals
  // them by clicking the time value in the footer.
  const [timeOpen, setTimeOpen] = useState(false);
  const [text, setText] = useState<string>(
    value ? formatDateTime(value, defaultFormat, locale) : ''
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Snapshot of the value when the popover opens, so Reset can revert the
  // edits made in this session (reverting to empty if it opened empty).
  const valueAtOpenRef = useRef<Date | null>(null);
  const reactId = useId();
  const popoverId = id ? `${id}-popover` : `picker-${reactId}`;

  const { bulmaHelperClasses, rest: cleanRest } = useBulmaClasses(rest);

  const { shouldUseNative, isSmallViewport } = useNativeMobilePicker({
    force: mobileNative === 'auto' ? undefined : mobileNative,
  });
  const useNative = !inline && shouldUseNative;
  const wheelItemHeight = isSmallViewport ? 40 : 32;

  // Time-only format for the footer's "Time  5:07 PM" display.
  const timeDisplayFormat =
    effectiveHourFormat === '12'
      ? enableSeconds
        ? 'h:mm:ss A'
        : 'h:mm A'
      : enableSeconds
        ? 'HH:mm:ss'
        : 'HH:mm';

  const inputClass = usePrefixedClassNames('input', {
    [`is-${color}`]: !!color,
    [`is-${size}`]: !!size,
    'is-rounded': isRounded,
  });
  const containerClass = usePrefixedClassNames('datetimepicker-container');
  const triggerClass = usePrefixedClassNames('datetimepicker-trigger');
  const panelClass = usePrefixedClassNames('datetimepicker');
  const calendarWrapClass = usePrefixedClassNames(
    'datetimepicker-calendar-wrap'
  );
  const timeOverlayClass = usePrefixedClassNames('datetimepicker-time-overlay');
  const timeCardClass = usePrefixedClassNames('datetimepicker-time-card');
  const footerClass = usePrefixedClassNames('datetimepicker-footer');
  const footerTimeClass = usePrefixedClassNames('datetimepicker-footer-time');
  const footerActionsClass = usePrefixedClassNames(
    'datetimepicker-footer-actions'
  );
  const footerResetClass = usePrefixedClassNames('datetimepicker-footer-reset');
  const footerDoneClass = usePrefixedClassNames('datetimepicker-footer-done');
  const footerTimePillClass = usePrefixedClassNames(
    'datetimepicker-footer-time-pill'
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
    setText(value ? formatDateTime(value, defaultFormat, locale) : '');
  }, [value, defaultFormat, locale]);

  // Collapse the time wheels whenever the popover closes.
  useEffect(() => {
    if (!open) setTimeOpen(false);
  }, [open]);

  const commitValue = useCallback(
    (next: Date | null) => {
      if (!isControlled) setInternalValue(next);
      // Keep the calendar's focused cell tracking typed / parsed values.
      if (next) setFocusedDate(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  const handleDateSelect = useCallback(
    (d: Date) => {
      const merged = setTimeOfDay(d, {
        hours: value?.getHours() ?? 0,
        minutes: value?.getMinutes() ?? 0,
        seconds: enableSeconds ? (value?.getSeconds() ?? 0) : undefined,
      });
      if (!isWithin(merged, min, max)) return;
      commitValue(merged);
      setFocusedDate(d);
    },
    [value, enableSeconds, min, max, commitValue]
  );

  const handleTimeChange = useCallback(
    (parts: { hours: number; minutes: number; seconds?: number }) => {
      const base = value ?? focusedDate;
      const next = setTimeOfDay(base, parts);
      if (!isWithin(next, min, max)) return;
      commitValue(next);
    },
    [value, focusedDate, min, max, commitValue]
  );

  const tryParse = useCallback(
    (s: string): Date | null => {
      const trimmed = s.trim();
      if (!trimmed) return null;
      if (parse) return parse(trimmed);
      const fmt = typeof defaultFormat === 'string' ? defaultFormat : undefined;
      return parseDate(trimmed, fmt ?? DEFAULT_DATETIME_FORMAT, locale);
    },
    [parse, defaultFormat, locale]
  );

  // The Date the user edits when starting without a current value (now).
  const makeBaseDate = useCallback((): Date => new Date(), []);

  const inputReadOnlyAttr = !!readOnly || !editable;
  const canOpen = !!popover && !disabled && !readOnly;

  const { inputHandlers } = useSegmentedEntry({
    format: defaultFormat,
    value,
    commitValue,
    formatFn: formatDateTime,
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
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    },
    [ref]
  );

  if (useNative) {
    const nativeStep = enableSeconds ? incrementSeconds : incrementMinutes * 60;
    return (
      <input
        {...cleanRest}
        ref={combinedRef}
        type="datetime-local"
        step={nativeStep}
        className={classNames(inputClass, bulmaHelperClasses, className)}
        value={value ? toIsoDateTime(value, enableSeconds) : ''}
        onChange={e => {
          const parsed = e.target.value
            ? fromIsoDateTime(e.target.value)
            : null;
          commitValue(parsed);
        }}
        min={min ? toIsoDateTime(min, enableSeconds) : undefined}
        max={max ? toIsoDateTime(max, enableSeconds) : undefined}
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
    <div
      className={panelClass}
      onKeyDown={e => {
        // First Escape collapses the floating time wheels; the popover's own
        // Escape handler (which closes the whole panel) only sees the second.
        if (timeOpen && e.key === 'Escape') {
          e.stopPropagation();
          setTimeOpen(false);
        }
      }}
    >
      <div className={calendarWrapClass}>
        <Calendar
          value={value}
          focusedDate={focusedDate}
          onSelect={handleDateSelect}
          onFocusedDateChange={setFocusedDate}
          min={min}
          max={max}
          shouldDisableDate={shouldDisableDate}
          unselectableDates={unselectableDates}
          firstDayOfWeek={firstDayOfWeek}
          locale={locale}
          dayNames={dayNames}
          monthNames={monthNames}
          nearbyMonthDays={nearbyMonthDays}
          color={color}
          size={size}
          id={`${popoverId}-cal`}
          autoFocusCell={open}
          labels={labels}
        />
        {timeOpen && (
          <div
            className={timeOverlayClass}
            onClick={e => {
              // Tap outside the wheel card (on the covered calendar area)
              // collapses the wheels without selecting a date, matching the
              // native behavior.
              if (e.target === e.currentTarget) setTimeOpen(false);
            }}
          >
            <div className={timeCardClass}>
              <TimeWheels
                value={spinnerValue}
                onChange={handleTimeChange}
                hourFormat={effectiveHourFormat}
                enableSeconds={enableSeconds}
                incrementHours={incrementHours}
                incrementMinutes={incrementMinutes}
                incrementSeconds={incrementSeconds}
                unselectableTimes={unselectableTimes}
                color={color}
                size={size}
                disabled={disabled}
                id={`${popoverId}-time`}
                labels={labels}
                itemHeight={wheelItemHeight}
                audioTick={effectiveAudioTick}
                onCommit={() => setOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
      <div className={footerClass}>
        <button
          type="button"
          className={footerTimeClass}
          onClick={() => setTimeOpen(o => !o)}
          aria-expanded={timeOpen}
          disabled={disabled}
        >
          <span>{t.time}</span>
          <span className={footerTimePillClass}>
            {value ? formatTime(value, timeDisplayFormat, locale) : '—'}
          </span>
        </button>
        <div className={footerActionsClass}>
          <button
            type="button"
            className={footerResetClass}
            onClick={() => commitValue(valueAtOpenRef.current)}
          >
            {t.reset}
          </button>
          <button
            type="button"
            className={footerDoneClass}
            aria-label={t.done}
            onClick={() => setOpen(false)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
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
      </div>
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
            value={value ? toIsoDateTime(value, enableSeconds) : ''}
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
          aria-label={t.chooseDateTime}
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
          ariaLabel={t.chooseDateTime}
          id={popoverId}
        >
          {panel}
        </PickerPopover>
      )}
    </div>
  );
});

DatetimepickerBase.displayName = 'DatetimepickerBase';

export default DatetimepickerBase;
