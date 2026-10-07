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
  FIRST_YEAR,
  floorMin,
  isSameDay,
  makeDate,
} from './_pickerInternals/dateUtils';
import { Calendar, CALENDAR_FOCUSED_CELL } from './_pickerInternals/Calendar';
import { TimeWheels } from './_pickerInternals/TimeWheels';
import { PickerPopover } from './_pickerInternals/PickerPopover';
import { useNativeMobilePicker } from './_pickerInternals/useNativeMobilePicker';
import { useSegmentedEntry } from './_pickerInternals/useSegmentedEntry';
import { useControlLoading } from './controlLoading';
import { Icon } from '../elements/Icon';
import { getActiveElementInTree } from '../helpers/shadowDom';

// The year is padded to four digits, as `datetime-local` requires. HTML has
// no such shape for a year before 1, so a date then is empty, as that input
// would make it.
const toIsoDateTime = (d: Date, withSeconds: boolean): string => {
  if (d.getFullYear() < FIRST_YEAR) return '';
  const yyyy = String(d.getFullYear()).padStart(4, '0');
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
  // Its year is four or more digits, as `toIsoDateTime` writes one past 9999.
  const m =
    /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/.exec(
      s
    );
  if (!m) return null;
  const d = makeDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setHours(Number(m[4]), Number(m[5]), m[6] ? Number(m[6]) : 0, 0);
  return d;
};

/**
 * Props for the raw DateTimeInput base. Use the higher-level `DateTimeInput`
 * for Field/Control composition. Combines the prop set of `DateInputBaseProps`
 * and `TimeInputBaseProps`.
 */
export interface DateTimeInputBaseProps
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
  /** Controlled selected date-time. */
  value?: Date | null;
  /** Initial value for uncontrolled usage. */
  defaultValue?: Date | null;
  /**
   * Fired when either the date or time portion changes. Picking a day keeps
   * the value's time of day, seconds included, and an empty field's day is
   * picked at midnight.
   */
  onChange?: (d: Date | null) => void;
  /** Fired when the popover opens. */
  onOpen?: () => void;
  /** Fired when the popover closes. */
  onClose?: () => void;
  /**
   * Lower bound for the combined date-time. A `min` before year 1 is raised
   * to midnight on 1 January of year 1, where the range starts without one
   * too: HTML's datetime-local input holds no earlier year, so the calendar,
   * the time wheels and typing stop there.
   */
  min?: Date;
  /** Upper bound for the combined date-time. */
  max?: Date;
  /** Disable the input. */
  disabled?: boolean;
  /** Read-only input. */
  readOnly?: boolean;
  /** Placeholder text. */
  placeholder?: string;
  /**
   * Token format string or `Intl.DateTimeFormat` options. Default `'YYYY-MM-DD HH:mm'`.
   * @defaultValue 'YYYY-MM-DD HH:mm'
   */
  format?: DateFormatOption;
  /**
   * Custom parser. Enter and leaving the field call it only if the user
   * changed the text, so focus passing through commits nothing and the value
   * keeps what the format leaves out, such as seconds.
   */
  parse?: (s: string) => Date | null;
  /** BCP-47 locale tag. */
  locale?: string;
  /** Render the panel inline (no popover). */
  inline?: boolean;
  /** Use `<input type="datetime-local">` on coarse-pointer devices. */
  mobileNative?: boolean | 'auto';
  /** Allow segmented keyboard typing (type the date-time directly across all segments). `false` makes the field picker-only. */
  editable?: boolean;
  /** Whether the calendar + time popover exists. `false` makes the field input-only (segmented typing with no popover). Default `true`. */
  popover?: boolean;
  /**
   * Open the popover on focus. Default `true`. Focus that a closing popover
   * hands back to the input leaves it closed. Dismissing it commits nothing:
   * an empty field stays empty, and leaving afterwards commits only what was
   * typed since. With it off, the launcher or Alt+ArrowDown opens it, as
   * ArrowDown alone steps the active segment.
   */
  openOnFocus?: boolean;
  /** Off by default — users typically tweak both halves before committing. */
  closeOnSelect?: boolean;
  /** Popover anchor position. */
  position?: PickerPosition;
  /** Render the popover into `document.body` via portal. */
  appendToBody?: boolean;
  /**
   * Bulma color modifier for the input, also carried by the calendar and the
   * time wheels, where it colors the selected date and the selection band.
   * Today's date and the calendar's keyboard focus ring take the color's
   * `-on-scheme` variant, which Bulma adjusts to contrast with the background,
   * so pale colors stay readable; that makes `'primary'` a shade off the unset
   * calendar, which uses plain `primary` for them. A focused wheel's ring is
   * drawn inside the band in the color's `-invert`, like the selected value,
   * so it shows on the fill. Unset, they use their
   * `--bulma-dateinput-*` and `--bulma-timeinput-wheel-*` variables, which
   * follow `primary` by default. The footer's time pill and Done button stay
   * `primary` either way.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Size variant. */
  size?: 'small' | 'medium' | 'large';
  /** Rounded input corners. */
  isRounded?: boolean;
  // date subset
  /** Disable specific dates. Blocked dates are also rejected during manual typing (the predicate receives the full candidate date-time — prefer day-based checks). */
  shouldDisableDate?: (d: Date) => boolean;
  /** Convenience array of disabled dates, matched by calendar day; also rejected by manual typing. */
  unselectableDates?: Date[];
  /** Day the calendar week starts on. */
  firstDayOfWeek?: DayOfWeek;
  /** Override the 7 day-name labels. */
  dayNames?: string[];
  /** Override the 12 month-name labels. */
  monthNames?: string[];
  /** Show dimmed dates from adjacent months. */
  nearbyMonthDays?: boolean;
  // time subset
  /** Time format. */
  hourFormat?: HourFormat;
  /** Show seconds column. Note: iOS Safari's native datetime-local picker UI does not include a seconds wheel; pass `mobileNative={false}` if you need one on iOS. */
  enableSeconds?: boolean;
  /** Hour step. */
  incrementHours?: number;
  /** Step between minute-wheel values (`1` = every minute, iOS-style). */
  incrementMinutes?: number;
  /** Step between second-wheel values (only with `enableSeconds`). */
  incrementSeconds?: number;
  /** Block specific times. Blocked times are also rejected during manual typing. */
  unselectableTimes?: (d: Date) => boolean;
  /** Decorative left icon glyph for the wrapping `Control` (shown by default). Set `''` to hide. */
  iconLeftName?: string;
  /**
   * Show a clickable launcher button on the right that toggles the popover.
   * Hidden by default while a `Control` it sits in shows its `isLoading`
   * spinner, which shares that right edge.
   * @defaultValue true
   */
  triggerIcon?: boolean;
  /** Glyph for the right launcher button. */
  triggerIconName?: string;
  /** Play a short audible tick on each time-wheel crossing. Default `false`. */
  audioTick?: boolean;
  /** Auto-route tactile feedback per wheel tick (vibrate on Android, audio thunk on iOS). Default `false`. */
  haptics?: boolean;
  /** Optional translatable string overrides. */
  labels?: PickerLabels;
}

/**
 * Raw DateTimeInput — combined input + calendar + time spinner without
 * Field/Control wrapping. Use `DateTimeInput` for the convenience wrapper.
 *
 * @function
 * @param {DateTimeInputBaseProps} props
 * @returns {JSX.Element}
 */
export const DateTimeInputBase = forwardRef<
  HTMLInputElement,
  DateTimeInputBaseProps
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
    triggerIcon: triggerIconProp,
    triggerIconName = 'chevron-down',
    audioTick = false,
    haptics = false,
    labels,
    ...rest
  } = props;
  // The launcher gives way to the loading spinner of a Control this sits in.
  const controlLoading = useControlLoading();
  const triggerIcon = triggerIconProp ?? !controlLoading;
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

  // Nothing before year 1 is in range, as in HTML's date inputs.
  const lowerBound = useMemo(() => floorMin(min), [min]);

  const initialFocused = useMemo(
    () => clampDate(value ?? new Date(), lowerBound, max),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [focusedDate, setFocusedDate] = useState<Date>(initialFocused);
  // Re-clamp focusedDate when min/max change so the focused cell stays valid.
  useEffect(() => {
    setFocusedDate(prev => clampDate(prev, lowerBound, max));
  }, [lowerBound, max]);

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
  const containerClass = usePrefixedClassNames('datetimeinput-container');
  const triggerClass = usePrefixedClassNames('datetimeinput-trigger');
  const panelClass = usePrefixedClassNames('datetimeinput');
  const calendarWrapClass = usePrefixedClassNames(
    'datetimeinput-calendar-wrap'
  );
  const timeOverlayClass = usePrefixedClassNames('datetimeinput-time-overlay');
  const timeCardClass = usePrefixedClassNames('datetimeinput-time-card');
  const footerClass = usePrefixedClassNames('datetimeinput-footer');
  const footerTimeClass = usePrefixedClassNames('datetimeinput-footer-time');
  const footerActionsClass = usePrefixedClassNames(
    'datetimeinput-footer-actions'
  );
  const footerResetClass = usePrefixedClassNames('datetimeinput-footer-reset');
  const footerDoneClass = usePrefixedClassNames('datetimeinput-footer-done');
  const footerTimePillClass = usePrefixedClassNames(
    'datetimeinput-footer-time-pill'
  );

  // What the latest request asked for, so a second request in the same event
  // sees it before React renders. The callbacks fire here rather than in a
  // state updater, which StrictMode calls twice, and after the state is set,
  // so a request a callback makes is the one that lands last.
  const requestedOpenRef = useRef(false);
  const setOpen = useCallback(
    (next: boolean) => {
      if (requestedOpenRef.current === next) return;
      requestedOpenRef.current = next;
      setOpenState(next);
      if (next) {
        valueAtOpenRef.current = value;
        onOpen?.();
      } else {
        onClose?.();
      }
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

  // The footer's Time button opens the wheels, and the hours wheel takes
  // focus so the keys turn it straight away. Closing them hands focus back
  // to the button: focus in them would fall to the page as they unmount,
  // and a pointer press outside them has already dropped it on the panel or
  // the page. Focus the keys moved on to another control, such as a
  // calendar day, stays there.
  const panelRef = useRef<HTMLDivElement>(null);
  const timeButtonRef = useRef<HTMLButtonElement>(null);
  const timeOverlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!timeOpen) return;
    timeOverlayRef.current
      ?.querySelector<HTMLElement>('[role="spinbutton"]')
      ?.focus();
  }, [timeOpen]);
  const closeTime = useCallback(() => {
    const panel = panelRef.current;
    const active = getActiveElementInTree(panel);
    const movedOn =
      !!panel?.contains(active) && !timeOverlayRef.current?.contains(active);
    if (!movedOn) timeButtonRef.current?.focus();
    setTimeOpen(false);
  }, []);

  const commitValue = useCallback(
    (next: Date | null) => {
      if (!isControlled) setInternalValue(next);
      // Keep the calendar's focused cell tracking typed / parsed values.
      if (next) setFocusedDate(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  // A picked day takes the value's whole time of day, seconds and all, or
  // midnight in an empty field. The day handed over by the keyboard is the
  // calendar's focused date, which can carry the time of the clock it
  // started from, so none of its time is kept.
  const handleDateSelect = useCallback(
    (d: Date) => {
      const merged = setTimeOfDay(d, {
        hours: value?.getHours() ?? 0,
        minutes: value?.getMinutes() ?? 0,
        seconds: value?.getSeconds() ?? 0,
        milliseconds: value?.getMilliseconds() ?? 0,
      });
      if (!isWithin(merged, lowerBound, max)) return;
      commitValue(merged);
      setFocusedDate(d);
    },
    [value, lowerBound, max, commitValue]
  );

  // The wheels set the value's time. An empty field starts from the focused
  // day, at the whole minute or second the wheels show.
  const handleTimeChange = useCallback(
    (parts: { hours: number; minutes: number; seconds?: number }) => {
      const next = value
        ? setTimeOfDay(value, parts)
        : setTimeOfDay(focusedDate, {
            ...parts,
            seconds: parts.seconds ?? 0,
            milliseconds: 0,
          });
      if (!isWithin(next, lowerBound, max)) return;
      commitValue(next);
    },
    [value, focusedDate, lowerBound, max, commitValue]
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

  // The Date the user edits when starting without a current value: now, at
  // the whole minute, or the whole second with `enableSeconds`.
  const makeBaseDate = useCallback(
    (): Date =>
      setTimeOfDay(new Date(), {
        seconds: enableSeconds ? undefined : 0,
        milliseconds: 0,
      }),
    [enableSeconds]
  );

  const inputReadOnlyAttr = !!readOnly || !editable;
  const canOpen = !!popover && !disabled && !readOnly;

  // Blocking predicate for manual entry, combining the calendar's
  // disabled-day logic with the wheels' unselectable-times predicate. The
  // candidate passed in carries the full date-time, so date predicates
  // should use day-based checks.
  const isBlocked = useMemo(() => {
    if (!shouldDisableDate && !unselectableDates?.length && !unselectableTimes)
      return undefined;
    return (d: Date) =>
      !!shouldDisableDate?.(d) ||
      !!unselectableDates?.some(u => isSameDay(u, d)) ||
      !!unselectableTimes?.(d);
  }, [shouldDisableDate, unselectableDates, unselectableTimes]);

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
    min: lowerBound,
    max,
    isBlocked,
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
        min={min ? toIsoDateTime(lowerBound, enableSeconds) : undefined}
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
      ref={panelRef}
      className={panelClass}
      onKeyDown={e => {
        // First Escape collapses the floating time wheels; the popover's own
        // Escape handler (which closes the whole panel) only sees the second.
        if (timeOpen && e.key === 'Escape') {
          e.stopPropagation();
          closeTime();
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
            ref={timeOverlayRef}
            className={timeOverlayClass}
            onClick={e => {
              // Tap outside the wheel card (on the covered calendar area)
              // collapses the wheels without selecting a date, matching the
              // native behavior.
              if (e.target === e.currentTarget) closeTime();
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
          ref={timeButtonRef}
          type="button"
          className={footerTimeClass}
          onClick={() => (timeOpen ? closeTime() : setTimeOpen(true))}
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
          restoreFocusRef={inputRef}
          initialFocusSelector={CALENDAR_FOCUSED_CELL}
        >
          {panel}
        </PickerPopover>
      )}
    </div>
  );
});

DateTimeInputBase.displayName = 'DateTimeInputBase';

export default DateTimeInputBase;
