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
  DayOfWeek,
  DateGranularity,
  PickerLabels,
  mergeLabels,
} from './_pickerInternals/pickerTypes';
import {
  formatDate,
  parseDate,
  DateFormatOption,
  DEFAULT_DATE_FORMAT,
  DEFAULT_MONTH_FORMAT,
  DEFAULT_YEAR_FORMAT,
} from './_pickerInternals/formatters';
import {
  isWithin,
  clampDate,
  FIRST_YEAR,
  floorMin,
  isSameDay,
  isPeriodUnselectable,
  makeDate,
  startOfPeriod,
  endOfPeriod,
} from './_pickerInternals/dateUtils';
import { Calendar, CALENDAR_FOCUSED_CELL } from './_pickerInternals/Calendar';
import { PickerPopover } from './_pickerInternals/PickerPopover';
import { useNativeMobilePicker } from './_pickerInternals/useNativeMobilePicker';
import { useSegmentedEntry } from './_pickerInternals/useSegmentedEntry';
import { supportsInputType } from './_pickerInternals/nativeInputSupport';
import type { SegmentKind } from './_pickerInternals/segmentMap';
import { useIsHydrated } from '../helpers/useIsHydrated';
import { Icon } from '../elements/Icon';

const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * The value as the native input and the hidden form input carry it:
 * `YYYY-MM-DD`, `YYYY-MM` or `YYYY`, the shapes `<input type="date">` and
 * `<input type="month">` use. The year is padded to four digits, as those
 * inputs require and as the `YYYY` token displays it. HTML has no such shape
 * for a year before 1, so a date then is empty, as those inputs would make it.
 */
const toIsoValue = (d: Date, granularity: DateGranularity): string => {
  if (d.getFullYear() < FIRST_YEAR) return '';
  const year = String(d.getFullYear()).padStart(4, '0');
  if (granularity === 'year') return year;
  const month = `${year}-${pad2(d.getMonth() + 1)}`;
  return granularity === 'month' ? month : `${month}-${pad2(d.getDate())}`;
};

/**
 * Read a native `type="date"` or `type="month"` value back into a Date. HTML
 * allows a year of four or more digits, as `toIsoValue` writes one past 9999.
 */
const fromIsoValue = (s: string, granularity: DateGranularity): Date | null => {
  if (granularity === 'month') {
    const m = /^(\d{4,})-(\d{2})$/.exec(s);
    return m ? makeDate(Number(m[1]), Number(m[2]) - 1) : null;
  }
  const m = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return makeDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

const DEFAULT_FORMATS: Record<DateGranularity, string> = {
  day: DEFAULT_DATE_FORMAT,
  month: DEFAULT_MONTH_FORMAT,
  year: DEFAULT_YEAR_FORMAT,
};

// Segments finer than the granularity render but are never edited.
const SKIPPED_SEGMENTS: Record<
  DateGranularity,
  readonly SegmentKind[] | undefined
> = {
  day: undefined,
  month: ['day'],
  year: ['month', 'day'],
};

/**
 * Props for the raw DateInput base. Use the higher-level `DateInput` for
 * Field/Control composition; `DateInputBase` is the input + popover only.
 */
export interface DateInputBaseProps
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
  /** Controlled selected date. */
  value?: Date | null;
  /** Initial date for uncontrolled usage. */
  defaultValue?: Date | null;
  /** Fired when the value changes. */
  onChange?: (d: Date | null) => void;
  /** Fired when the popover opens. */
  onOpen?: () => void;
  /** Fired when the popover closes. */
  onClose?: () => void;
  /**
   * Earliest selectable date. A `min` before year 1 is raised to 1 January of
   * year 1, where the range starts without one too: HTML's date and month
   * inputs hold no earlier year, so the calendar and typing stop there.
   */
  min?: Date;
  /** Latest selectable date. */
  max?: Date;
  /** Disable the input. */
  disabled?: boolean;
  /** Make the input read-only. */
  readOnly?: boolean;
  /** Placeholder text for the input. */
  placeholder?: string;
  /**
   * What the calendar shows and what a selection means: `'day'` shows the
   * day grid, `'month'` a grid of the focused year's months whose header
   * steps a year at a time, and `'year'` the year list. A month or year value
   * is the first day of that period at local midnight, so `onChange` gets
   * `new Date(2026, 5, 1)` for June 2026. A `value` elsewhere in the period
   * shows as that period and stays as given until the user picks a period or
   * types a different one. `min`, `max`,
   * `shouldDisableDate` and `unselectableDates` judge whole periods: a month
   * or year can be picked while any day in it can, so a `min` of 15 June
   * still allows June, and June commits as 1 June, earlier than that `min`.
   * The default `format` follows the granularity (`'YYYY-MM'`, `'YYYY'`); a
   * custom `format` with finer tokens still renders them, but typing skips
   * them. `firstDayOfWeek`, `dayNames` and `nearbyMonthDays` only affect the
   * day grid, and an `inline` calendar's hidden form value is `YYYY-MM` or
   * `YYYY`. The `labels` keys `chooseMonth` / `chooseYear` name the launcher
   * and popover, and `prevYear` / `nextYear` the month grid's header buttons.
   * @defaultValue 'day'
   */
  granularity?: DateGranularity;
  /**
   * Token format string or `Intl.DateTimeFormat` options. Defaults to
   * `'YYYY-MM-DD'`, or to `'YYYY-MM'` / `'YYYY'` when `granularity` is
   * `'month'` / `'year'`.
   * @defaultValue 'YYYY-MM-DD'
   */
  format?: DateFormatOption;
  /**
   * Custom parser (use when `format` is `Intl.DateTimeFormatOptions`).
   * Enter and leaving the field call it only if the user changed the text,
   * so focus passing through commits nothing and the value keeps what the
   * format leaves out, such as the time of day.
   */
  parse?: (s: string) => Date | null;
  /** BCP-47 locale tag for day/month names and Intl formatting. */
  locale?: string;
  /** Render the calendar inline (no popover). */
  inline?: boolean;
  /**
   * Use `<input type="date">` on coarse-pointer + small-viewport devices. At
   * `'month'` granularity it uses `<input type="month">` where the browser
   * implements one, as Chromium browsers, Safari on iOS and Firefox for
   * Android do, and the calendar where it doesn't, as in desktop Firefox.
   * Desktop Safari accepts the type but draws no month control, so forcing
   * `true` there shows a plain text box. HTML has no year input, so `'year'`
   * granularity always renders the calendar.
   */
  mobileNative?: boolean | 'auto';
  /** Allow segmented keyboard typing in the input (type the date directly, auto-advancing across segments). `false` makes the field picker-only. */
  editable?: boolean;
  /** Whether the calendar popover exists. `false` makes the field input-only (segmented typing, no popover). */
  popover?: boolean;
  /**
   * Open the popover when the input is focused. Focus that a closing popover
   * hands back to the input leaves it closed. Dismissing it commits nothing:
   * an empty field stays empty, and leaving afterwards commits only what was
   * typed since.
   */
  openOnFocus?: boolean;
  /** Close the popover after a date is selected. */
  closeOnSelect?: boolean;
  /** Popover anchor position relative to the input. */
  position?: PickerPosition;
  /** Render the popover into `document.body` via portal. */
  appendToBody?: boolean;
  /**
   * Bulma color modifier for the input, also carried by the calendar, where it
   * colors the selected date. Today's date and the keyboard focus ring take
   * the color's `-on-scheme` variant, which Bulma adjusts to contrast with the
   * background, so pale colors stay readable; that makes `'primary'` a shade
   * off the unset calendar, which uses plain `primary` for both. Unset, the
   * calendar uses its `--bulma-dateinput-*` variables, which follow `primary`
   * by default.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Size variant. */
  size?: 'small' | 'medium' | 'large';
  /** Render the input with rounded corners. */
  isRounded?: boolean;
  /** Predicate to disable specific dates (e.g. weekends). Blocked dates are also rejected during manual typing. */
  shouldDisableDate?: (d: Date) => boolean;
  /** Convenience array of disabled dates; merged with `shouldDisableDate`. Matched by calendar day and also rejected during manual typing. */
  unselectableDates?: Date[];
  /** Day the week starts on (0 = Sunday). */
  firstDayOfWeek?: DayOfWeek;
  /** Override the 7 day-name labels (in calendar order, post-rotation). */
  dayNames?: string[];
  /** Override the 12 month-name labels. */
  monthNames?: string[];
  /** Show dimmed dates from adjacent months in the grid. */
  nearbyMonthDays?: boolean;
  /** Decorative left icon glyph for the wrapping `Control` (shown by default). Set `''` to hide. */
  iconLeftName?: string;
  /** Show a clickable launcher button on the right that toggles the popover. Default `true`. */
  triggerIcon?: boolean;
  /** Glyph for the right launcher button. */
  triggerIconName?: string;
  /** Optional translatable string overrides (ARIA labels, button text). */
  labels?: PickerLabels;
}

/**
 * Raw DateInput — input + popover calendar without Field/Control wrapping.
 * Use `DateInput` for the convenience wrapper.
 *
 * @function
 * @param {DateInputBaseProps} props
 * @returns {JSX.Element}
 */
export const DateInputBase = forwardRef<HTMLInputElement, DateInputBaseProps>(
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
      granularity = 'day',
      format,
      parse,
      locale,
      inline = false,
      mobileNative = 'auto',
      editable = true,
      popover = true,
      openOnFocus = true,
      closeOnSelect = true,
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
      ...rest
    } = props;

    const t = mergeLabels(labels);
    const isDayGranularity = granularity === 'day';
    const resolvedFormat = format ?? DEFAULT_FORMATS[granularity];

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<Date | null>(
      defaultValue ?? null
    );
    const value = isControlled ? (controlledValue ?? null) : internalValue;

    // Nothing before year 1 is in range, as in HTML's date inputs.
    const lowerBound = useMemo(() => floorMin(min), [min]);

    const initialFocused = useMemo(
      () => clampDate(value ?? new Date(), lowerBound, max),
      // intentionally only on mount: keep focusedDate stable until value/open change
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );
    const [focusedDate, setFocusedDate] = useState<Date>(initialFocused);
    // Re-clamp focusedDate if min/max change after mount so the focused cell
    // never disappears outside the displayable range.
    useEffect(() => {
      setFocusedDate(prev => clampDate(prev, lowerBound, max));
    }, [lowerBound, max]);
    const [open, setOpenState] = useState(false);
    const [text, setText] = useState<string>(
      value ? formatDate(value, resolvedFormat, locale) : ''
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const reactId = useId();
    const popoverId = id ? `${id}-popover` : `picker-${reactId}`;

    const { bulmaHelperClasses, rest: cleanRest } = useBulmaClasses(rest);

    const { shouldUseNative } = useNativeMobilePicker({
      force: mobileNative === 'auto' ? undefined : mobileNative,
    });
    // The day picker goes native as it always has. A month picker does only
    // where the browser implements the month input, asked after hydration so
    // the server and the first client render agree. HTML has no year input,
    // so a year picker always renders the calendar.
    const hydrated = useIsHydrated();
    const hasNativeInput =
      isDayGranularity ||
      (granularity === 'month' && hydrated && supportsInputType('month'));
    const useNative = !inline && shouldUseNative && hasNativeInput;

    const inputClass = usePrefixedClassNames('input', {
      [`is-${color}`]: !!color,
      [`is-${size}`]: !!size,
      'is-rounded': isRounded,
    });
    const containerClass = usePrefixedClassNames('dateinput-container');
    const triggerClass = usePrefixedClassNames('dateinput-trigger');

    // What the latest request asked for, so a second request in the same
    // event sees it before React renders. The callbacks fire here rather than
    // in a state updater, which StrictMode calls twice, and after the state
    // is set, so a request a callback makes is the one that lands last.
    const requestedOpenRef = useRef(false);
    const setOpen = useCallback(
      (next: boolean) => {
        if (requestedOpenRef.current === next) return;
        requestedOpenRef.current = next;
        setOpenState(next);
        if (next) onOpen?.();
        else onClose?.();
      },
      [onOpen, onClose]
    );

    // Sync displayed text with value when value changes externally.
    useEffect(() => {
      setText(value ? formatDate(value, resolvedFormat, locale) : '');
    }, [value, resolvedFormat, locale]);

    const commitValue = useCallback(
      (next: Date | null) => {
        // A month or year value is its period's first day, however the
        // calendar, typing or parsing arrived at it.
        const committed =
          next && !isDayGranularity ? startOfPeriod(next, granularity) : next;
        if (!isControlled) setInternalValue(committed);
        // Keep the calendar's focused cell tracking typed / parsed values.
        if (committed) setFocusedDate(committed);
        onChange?.(committed);
      },
      [isControlled, onChange, isDayGranularity, granularity]
    );

    // At month or year granularity the bounds widen to the periods holding
    // them, so the month or year containing `min` stays reachable.
    const periodMin = useMemo(
      () =>
        isDayGranularity ? lowerBound : startOfPeriod(lowerBound, granularity),
      [lowerBound, isDayGranularity, granularity]
    );
    const periodMax = useMemo(
      () => (max && !isDayGranularity ? endOfPeriod(max, granularity) : max),
      [max, isDayGranularity, granularity]
    );

    const handleSelect = useCallback(
      (d: Date) => {
        if (!isWithin(d, periodMin, periodMax)) return;
        commitValue(d);
        setFocusedDate(d);
        if (closeOnSelect) setOpen(false);
      },
      [periodMin, periodMax, commitValue, closeOnSelect, setOpen]
    );

    const tryParse = useCallback(
      (s: string): Date | null => {
        const trimmed = s.trim();
        if (!trimmed) return null;
        const fmt = typeof format === 'string' ? format : undefined;
        return parse
          ? parse(trimmed)
          : parseDate(trimmed, fmt ?? DEFAULT_FORMATS[granularity], locale);
      },
      [parse, format, locale, granularity]
    );

    // The Date the user edits when starting without a current value (today at
    // midnight, or the start of this month or year; the hook clamps to
    // min/max on commit).
    const makeBaseDate = useCallback((): Date => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return isDayGranularity ? d : startOfPeriod(d, granularity);
    }, [isDayGranularity, granularity]);

    const inputReadOnlyAttr = !!readOnly || !editable;
    const canOpen = !!popover && !disabled && !readOnly;

    // Blocking predicate for manual entry, matching the calendar's
    // disabled-cell logic (shouldDisableDate + unselectableDates by day, or
    // every day of the month or year blocked at those granularities).
    const isBlocked = useMemo(() => {
      if (!isDayGranularity) {
        const constraints = { min, max, shouldDisableDate, unselectableDates };
        return (d: Date) => isPeriodUnselectable(d, granularity, constraints);
      }
      if (!shouldDisableDate && !unselectableDates?.length) return undefined;
      return (d: Date) =>
        !!shouldDisableDate?.(d) ||
        !!unselectableDates?.some(u => isSameDay(u, d));
    }, [
      isDayGranularity,
      granularity,
      min,
      max,
      shouldDisableDate,
      unselectableDates,
    ]);

    // Typing, and the re-parse on blur or Enter, that lands in the period the
    // value already holds commits nothing, so a `value` elsewhere in its month
    // or year changes only when the user picks or types a different period.
    const commitTyped = useCallback(
      (next: Date | null) => {
        if (
          next &&
          value &&
          !isDayGranularity &&
          startOfPeriod(next, granularity).getTime() ===
            startOfPeriod(value, granularity).getTime()
        ) {
          setText(formatDate(value, resolvedFormat, locale));
          return;
        }
        commitValue(next);
      },
      [
        value,
        isDayGranularity,
        granularity,
        resolvedFormat,
        locale,
        commitValue,
      ]
    );

    const { inputHandlers } = useSegmentedEntry({
      format: resolvedFormat,
      skipKinds: SKIPPED_SEGMENTS[granularity],
      value,
      commitValue: commitTyped,
      formatFn: formatDate,
      tryParse,
      text,
      setText,
      makeBaseDate,
      locale,
      min: periodMin,
      max: periodMax,
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

    const handlePopoverClose = useCallback(() => setOpen(false), [setOpen]);

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

    // Native mobile path renders <input type="date"> (type="month" for a
    // month picker).
    if (useNative) {
      return (
        <input
          {...cleanRest}
          ref={combinedRef}
          type={isDayGranularity ? 'date' : 'month'}
          className={classNames(inputClass, bulmaHelperClasses, className)}
          value={value ? toIsoValue(value, granularity) : ''}
          onChange={e => {
            const parsed = e.target.value
              ? fromIsoValue(e.target.value, granularity)
              : null;
            commitValue(parsed);
          }}
          min={min ? toIsoValue(lowerBound, granularity) : undefined}
          max={max ? toIsoValue(max, granularity) : undefined}
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

    const chooseLabel =
      granularity === 'month'
        ? t.chooseMonth
        : granularity === 'year'
          ? t.chooseYear
          : t.chooseDate;

    const calendar = (
      <Calendar
        // A new granularity starts the calendar over on its own view.
        key={granularity}
        granularity={granularity}
        value={value}
        focusedDate={focusedDate}
        onSelect={handleSelect}
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
        // The popover panel takes `popoverId`, so the calendar inside it
        // takes one of its own. Inline there is no panel, and the calendar
        // keeps the id it released with.
        id={inline ? popoverId : `${popoverId}-cal`}
        autoFocusCell={open}
        labels={labels}
      />
    );

    if (inline) {
      return (
        <div
          {...cleanRest}
          ref={containerRef}
          className={classNames(containerClass, bulmaHelperClasses, className)}
        >
          {calendar}
          {name && (
            <input
              type="hidden"
              name={name}
              form={form}
              value={value ? toIsoValue(value, granularity) : ''}
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
            aria-label={chooseLabel}
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
            onClose={handlePopoverClose}
            anchorRef={containerRef}
            position={position}
            appendToBody={appendToBody}
            ariaLabel={chooseLabel}
            id={popoverId}
            restoreFocusRef={inputRef}
            initialFocusSelector={CALENDAR_FOCUSED_CELL}
          >
            {calendar}
          </PickerPopover>
        )}
      </div>
    );
  }
);

DateInputBase.displayName = 'DateInputBase';

export default DateInputBase;
