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
  DateRangeValue,
  DayOfWeek,
  PickerLabels,
  PickerPosition,
  mergeLabels,
} from './_pickerInternals/pickerTypes';
import {
  DEFAULT_DATE_FORMAT,
  DateFormatOption,
  formatDate,
  fromIsoValue,
  parseDate,
  toIsoValue,
} from './_pickerInternals/formatters';
import {
  canCloseRange,
  clampDate,
  floorMin,
  isSameDay,
  isWithin,
  startOfDay,
} from './_pickerInternals/dateUtils';
import { Calendar, CALENDAR_FOCUSED_CELL } from './_pickerInternals/Calendar';
import { PickerPopover } from './_pickerInternals/PickerPopover';
import { useNativeMobilePicker } from './_pickerInternals/useNativeMobilePicker';
import { useSegmentedEntry } from './_pickerInternals/useSegmentedEntry';
import { useControlLoading } from './controlLoading';
import { useAutoLabelledBy } from './useAutoLabelId';
import { Icon } from '../elements/Icon';

export type { DateRangeValue };

const EMPTY_RANGE: DateRangeValue = [null, null];

/** A range's end as the form and the native inputs carry it. */
const isoDay = (d: Date | null): string => (d ? toIsoValue(d, 'day') : '');

/** Today at local midnight, where typing into an empty end starts. */
const today = (): Date => startOfDay(new Date());

/**
 * Props for the raw DateRangeInput base. Use the higher-level
 * `DateRangeInput` for Field/Control composition; `DateRangeInputBase` is the
 * two inputs and the popover only.
 */
export interface DateRangeInputBaseProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'defaultValue' | 'onChange' | 'color' | 'placeholder' | 'popover'
    >,
    Omit<BulmaClassesProps, 'color'> {
  /**
   * Controlled range, start first. Either end may be `null`, and
   * `[null, null]` is empty.
   */
  value?: DateRangeValue;
  /** Initial range for uncontrolled usage. */
  defaultValue?: DateRangeValue;
  /**
   * Fired when the range changes, with the start first. Typing commits one
   * end at a time, so a range half typed arrives as `[start, null]`. The
   * calendar commits only a finished range: its first pick marks the start
   * inside the calendar and its second commits both ends in one call. The
   * range stays ordered, so the end is never before the start.
   */
  onChange?: (range: DateRangeValue) => void;
  /** Fired when the popover opens. */
  onOpen?: () => void;
  /** Fired when the popover closes. */
  onClose?: () => void;
  /**
   * Earliest selectable date, for either end. A `min` before year 1 is raised
   * to 1 January of year 1, where the range starts without one too.
   */
  min?: Date;
  /** Latest selectable date, for either end. */
  max?: Date;
  /** Disable both inputs and the launcher. */
  disabled?: boolean;
  /** Make both inputs read-only and keep the popover closed. */
  readOnly?: boolean;
  /** Placeholder text, shown in both inputs while they are empty. */
  placeholder?: string;
  /**
   * Token format string or `Intl.DateTimeFormat` options, used by both
   * inputs.
   * @defaultValue 'YYYY-MM-DD'
   */
  format?: DateFormatOption;
  /**
   * Custom parser (use when `format` is `Intl.DateTimeFormatOptions`).
   * Enter and leaving an input call it only if the user changed its text.
   */
  parse?: (s: string) => Date | null;
  /** BCP-47 locale tag for day/month names and Intl formatting. */
  locale?: string;
  /**
   * Render the calendar inline, with no inputs and no popover. The hidden
   * form inputs still carry the range.
   */
  inline?: boolean;
  /**
   * Use two native `<input type="date">`s on coarse-pointer, small-viewport
   * devices (`'auto'`), always (`true`) or never (`false`). The end input's
   * `min` follows the start, and a change goes through the same rules as
   * typing.
   */
  mobileNative?: boolean | 'auto';
  /** Allow segmented keyboard typing in both inputs. `false` makes the field picker-only. */
  editable?: boolean;
  /** Whether the calendar popover exists. `false` makes the field input-only. */
  popover?: boolean;
  /**
   * Open the popover when focus arrives in the field. Moving focus between
   * the two inputs, or back from the launcher, leaves it closed, and so does
   * the focus a closing popover hands back. A click on either input opens it.
   * With it off, the launcher or Alt+ArrowDown opens it.
   */
  openOnFocus?: boolean;
  /**
   * Close the popover once the range is picked. The first pick, which only
   * marks the start, never closes it.
   */
  closeOnSelect?: boolean;
  /** Popover anchor position relative to the field. */
  position?: PickerPosition;
  /** Render the popover into `document.body` via portal. */
  appendToBody?: boolean;
  /**
   * Bulma color modifier for the field, also carried by the calendar, where it
   * colors the range's ends and the band between them.
   */
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  /** Size variant. */
  size?: 'small' | 'medium' | 'large';
  /** Render the field with rounded corners. */
  isRounded?: boolean;
  /**
   * Predicate to disable specific dates (e.g. weekends). A disabled day can
   * be neither end, typing rejects it, and a range can't include one unless
   * `allowDisabledInRange` is set.
   */
  shouldDisableDate?: (d: Date) => boolean;
  /** Convenience array of disabled dates; merged with `shouldDisableDate`. Matched by calendar day. */
  unselectableDates?: Date[];
  /**
   * Let a range include days that `shouldDisableDate` or `unselectableDates`
   * disable, such as a stay over a night with no check-ins. Its ends still
   * can't be such days. Off, a pick in the calendar past a disabled day
   * starts a new range there, typing refuses an end past one, and a start
   * typed with one before the end clears the end. Finding one walks the days
   * between, so off, a span too long to walk is refused as well.
   */
  allowDisabledInRange?: boolean;
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
  /**
   * Show a clickable launcher button on the right that toggles the popover.
   * Hidden by default while a `Control` it sits in shows its `isLoading`
   * spinner, which shares that right edge.
   * @defaultValue true
   */
  triggerIcon?: boolean;
  /** Glyph for the right launcher button. */
  triggerIconName?: string;
  /**
   * Optional translatable string overrides. `rangeStart` and `rangeEnd` name
   * the two inputs and the range's ends in the calendar, `rangePreviewEnd`
   * describes the day a pending range would end on, `rangeSeparator` sits
   * between the inputs, and `chooseDateRange` names the launcher and the
   * popover.
   */
  labels?: PickerLabels;
  /**
   * Form field name. Two hidden inputs submit the range as `YYYY-MM-DD`,
   * named `name[start]` and `name[end]`, in every mode. The visible inputs
   * carry no name.
   */
  name?: string;
  /** Name of the hidden input carrying the start, in place of `name[start]`. */
  startName?: string;
  /** Name of the hidden input carrying the end, in place of `name[end]`. */
  endName?: string;
  /** Form id the hidden inputs belong to. */
  form?: string;
  /**
   * Mark both visible inputs required, so a form won't submit with either
   * end empty. An `inline` calendar has no visible input, so it is not
   * checked there.
   */
  required?: boolean;
  /** Id of the start input. The end input takes `${id}-end`. */
  id?: string;
}

/**
 * Raw DateRangeInput: the two inputs and the popover calendar without
 * Field/Control wrapping. Use `DateRangeInput` for the convenience wrapper.
 * Composed in a labeled `Field`, its `role="group"` root points
 * `aria-labelledby` at that `Field`'s label, `inline` too, as the wrapper's
 * does, and each input keeps its own name. An `aria-label` or
 * `aria-labelledby` you give it wins over the label, and an `aria-labelledby`
 * key counts even when undefined, since it is spread over the group's own.
 *
 * @function
 * @param {DateRangeInputBaseProps} props
 * @returns {JSX.Element}
 */
export const DateRangeInputBase = forwardRef<
  HTMLInputElement,
  DateRangeInputBaseProps
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
    closeOnSelect = true,
    position = 'bottom-left',
    appendToBody = false,
    color,
    size,
    isRounded,
    shouldDisableDate,
    unselectableDates,
    allowDisabledInRange = false,
    firstDayOfWeek = 0,
    dayNames,
    monthNames,
    nearbyMonthDays = true,
    iconLeftName: _iconLeftName,
    triggerIcon: triggerIconProp,
    triggerIconName = 'chevron-down',
    labels,
    name,
    startName,
    endName,
    form,
    required,
    id,
    className,
    onFocus,
    onFocusCapture,
    ...rest
  } = props;
  // The launcher gives way to the loading spinner of a Control this sits in.
  const controlLoading = useControlLoading();
  const triggerIcon = triggerIconProp ?? !controlLoading;

  const t = mergeLabels(labels);
  const resolvedFormat = format ?? DEFAULT_DATE_FORMAT;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<DateRangeValue>(
    defaultValue ?? EMPTY_RANGE
  );
  const range = isControlled ? controlledValue : internalValue;
  const [start, end] = range;

  // Nothing before year 1 is in range, as in HTML's date inputs.
  const lowerBound = useMemo(() => floorMin(min), [min]);

  const [focusedDate, setFocusedDate] = useState<Date>(() =>
    clampDate(start ?? end ?? new Date(), lowerBound, max)
  );
  // Re-clamp the focused day if the bounds change after mount, so the
  // calendar never shows a month outside them.
  useEffect(() => {
    setFocusedDate(prev => clampDate(prev, lowerBound, max));
  }, [lowerBound, max]);

  const [open, setOpenState] = useState(false);
  const [startText, setStartText] = useState(() =>
    start ? formatDate(start, resolvedFormat, locale) : ''
  );
  const [endText, setEndText] = useState(() =>
    end ? formatDate(end, resolvedFormat, locale) : ''
  );
  // Each input shows its end of the range as it changes from outside.
  useEffect(() => {
    setStartText(start ? formatDate(start, resolvedFormat, locale) : '');
  }, [start, resolvedFormat, locale]);
  useEffect(() => {
    setEndText(end ? formatDate(end, resolvedFormat, locale) : '');
  }, [end, resolvedFormat, locale]);

  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const reactId = useId();
  const popoverId = id ? `${id}-popover` : `picker-${reactId}`;

  const { bulmaHelperClasses, rest: cleanRest } = useBulmaClasses(rest);
  // Two inputs can't share a labeled Field's `for`, so inside one the group
  // points `aria-labelledby` at that Field's label, as `DateRangeInput`
  // does, in every mode. A name the caller gave the group wins, and so does
  // the `aria-labelledby` that wrapper always passes, so it decides there.
  const { ariaLabelledBy } = useAutoLabelledBy({
    label: undefined,
    rendersLabel: false,
    callerProps: rest,
  });

  const { shouldUseNative } = useNativeMobilePicker({
    force: mobileNative === 'auto' ? undefined : mobileNative,
  });
  const useNative = !inline && shouldUseNative;

  // The root borrows DateInput's container class, which places the launcher
  // and sizes a Control's icons around the field.
  const containerClass = usePrefixedClassNames(
    'daterangeinput',
    'dateinput-container'
  );
  const fieldClass = usePrefixedClassNames('input', 'daterangeinput-field', {
    [`is-${color}`]: !!color,
    [`is-${size}`]: !!size,
    'is-rounded': isRounded,
    'is-disabled': disabled,
  });
  const inputClass = usePrefixedClassNames('daterangeinput-input');
  const separatorClass = usePrefixedClassNames('daterangeinput-separator');
  const triggerClass = usePrefixedClassNames('dateinput-trigger');

  // What the latest request asked for, so a second request in the same event
  // sees it before React renders. The callbacks fire here rather than in a
  // state updater, which StrictMode calls twice.
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

  // Focus that moves inside the field, from one input to the other or from
  // the launcher, is not focus arriving, so it opens nothing. Set as the
  // focus is captured on the way in, and cleared once the input has handled
  // it, so a click that follows still opens the popover.
  const focusFromInsideRef = useRef(false);
  const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const from = e.relatedTarget as Node | null;
    focusFromInsideRef.current = !!from && e.currentTarget.contains(from);
    onFocusCapture?.(e);
  };
  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    focusFromInsideRef.current = false;
    onFocus?.(e);
  };
  const requestOpen = useCallback(
    (next: boolean) => {
      if (next && focusFromInsideRef.current) return;
      setOpen(next);
    },
    [setOpen]
  );

  const commitRange = useCallback(
    (next: DateRangeValue) => {
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  const constraints = useMemo(
    () => ({ shouldDisableDate, unselectableDates }),
    [shouldDisableDate, unselectableDates]
  );
  // A day the calendar disables: shouldDisableDate or unselectableDates.
  // Typing and the native inputs check the bounds alongside it.
  const isBlockedDay = useCallback(
    (d: Date) =>
      !!shouldDisableDate?.(d) ||
      !!unselectableDates?.some(u => isSameDay(u, d)),
    [shouldDisableDate, unselectableDates]
  );
  // An end the range can take: it is not disabled, and it closes a range
  // from the start, which it can't when it comes first or, unless allowed,
  // reaches over a disabled day.
  const isBlockedEnd = useCallback(
    (d: Date) =>
      isBlockedDay(d) ||
      (!!start && !canCloseRange(start, d, constraints, allowDisabledInRange)),
    [isBlockedDay, start, constraints, allowDisabledInRange]
  );

  // A new start keeps the end only while the two still make a range, so a
  // start moved past the end, or over a disabled day before it, clears it.
  const commitStart = useCallback(
    (next: Date | null) => {
      const keepsEnd =
        !next ||
        !end ||
        canCloseRange(next, end, constraints, allowDisabledInRange);
      commitRange([next, keepsEnd ? end : null]);
      if (next) setFocusedDate(next);
    },
    [end, constraints, allowDisabledInRange, commitRange]
  );
  // Every digit typed into the start commits, so a start passes through
  // values on its way to the one being typed. The first digits of a year make
  // a start centuries back, which can't keep the end once a disabled day may
  // lie between. Such a value waits for the segment's next digit rather than
  // clearing an end the finished start may keep.
  const startCostsEnd = useCallback(
    (d: Date) =>
      !!end && !canCloseRange(d, end, constraints, allowDisabledInRange),
    [end, constraints, allowDisabledInRange]
  );
  const commitEnd = useCallback(
    (next: Date | null) => {
      commitRange([start, next]);
      if (next) setFocusedDate(next);
    },
    [start, commitRange]
  );

  const handleRangeSelect = useCallback(
    (from: Date, to: Date) => {
      commitRange([from, to]);
      setFocusedDate(to);
      if (closeOnSelect) setOpen(false);
    },
    [commitRange, closeOnSelect, setOpen]
  );

  const tryParse = useCallback(
    (s: string): Date | null => {
      const trimmed = s.trim();
      if (!trimmed) return null;
      const fmt = typeof format === 'string' ? format : undefined;
      return parse
        ? parse(trimmed)
        : parseDate(trimmed, fmt ?? DEFAULT_DATE_FORMAT, locale);
    },
    [parse, format, locale]
  );

  // Typing into an empty end starts from the start, so only what differs
  // needs typing; an empty start starts from today.
  const makeEndBase = useCallback(
    () => (start ? startOfDay(start) : today()),
    [start]
  );

  // Where focus goes back as the popover closes: the input focused last,
  // which is the one that opened it unless the launcher did, or the start
  // input before either has had focus.
  const openerRef = useRef<HTMLInputElement | null>(null);
  const restoreFocusRef = useMemo(
    () => ({
      get current() {
        return openerRef.current ?? startRef.current;
      },
    }),
    []
  );

  const shared = {
    format: resolvedFormat,
    formatFn: formatDate,
    tryParse,
    locale,
    min: lowerBound,
    max,
    disabled,
    readOnly,
    editable,
    popover,
    openOnFocus,
    closeOnSelect,
    isOpen: open,
    setOpen: requestOpen,
  };
  // Each input is its own picker field. Its blur counts focus leaving it,
  // even for the other input, so text typed into one is read as focus moves
  // to the other.
  const { inputHandlers: startHandlers } = useSegmentedEntry({
    ...shared,
    value: start,
    commitValue: commitStart,
    text: startText,
    setText: setStartText,
    makeBaseDate: today,
    isBlocked: isBlockedDay,
    isUnfinishedBlocked: startCostsEnd,
    inputRef: startRef,
    containerRef: startRef,
    onFocus: () => {
      openerRef.current = startRef.current;
    },
  });
  const { inputHandlers: endHandlers } = useSegmentedEntry({
    ...shared,
    value: end,
    commitValue: commitEnd,
    text: endText,
    setText: setEndText,
    makeBaseDate: makeEndBase,
    isBlocked: isBlockedEnd,
    inputRef: endRef,
    containerRef: endRef,
    onFocus: () => {
      openerRef.current = endRef.current;
    },
  });

  const combinedRef = useCallback(
    (node: HTMLInputElement | null) => {
      (startRef as React.MutableRefObject<HTMLInputElement | null>).current =
        node;
      if (typeof ref === 'function') ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    },
    [ref]
  );

  const handlePopoverClose = useCallback(() => setOpen(false), [setOpen]);

  const startField = startName ?? (name ? `${name}[start]` : undefined);
  const endField = endName ?? (name ? `${name}[end]` : undefined);
  const hiddenInputs = (
    <>
      {startField && (
        <input
          type="hidden"
          name={startField}
          form={form}
          value={isoDay(start)}
        />
      )}
      {endField && (
        <input type="hidden" name={endField} form={form} value={isoDay(end)} />
      )}
    </>
  );

  const separator = (
    <span className={separatorClass} aria-hidden="true">
      {t.rangeSeparator}
    </span>
  );

  // Native mobile path: two <input type="date">s, held to the same rules as
  // typing. A change the rules refuse leaves the input showing the range.
  if (useNative) {
    const nativeChange =
      (commit: (d: Date | null) => void, isBlocked: (d: Date) => boolean) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // An empty value is the end cleared. A date input gives nothing else
        // that doesn't read as a date.
        const parsed = fromIsoValue(e.target.value, 'day');
        if (!parsed) commit(null);
        else if (isWithin(parsed, lowerBound, max) && !isBlocked(parsed)) {
          commit(parsed);
        }
      };
    const minIso = min ? isoDay(lowerBound) : undefined;
    const maxIso = max ? isoDay(max) : undefined;
    return (
      <div
        aria-labelledby={ariaLabelledBy}
        {...cleanRest}
        ref={containerRef}
        role="group"
        className={classNames(containerClass, bulmaHelperClasses, className)}
        onFocus={onFocus}
        onFocusCapture={onFocusCapture}
      >
        <div className={fieldClass}>
          <input
            ref={combinedRef}
            type="date"
            id={id}
            aria-label={t.rangeStart}
            className={inputClass}
            value={isoDay(start)}
            onChange={nativeChange(commitStart, isBlockedDay)}
            min={minIso}
            max={maxIso}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
          />
          {separator}
          <input
            ref={endRef}
            type="date"
            id={id ? `${id}-end` : undefined}
            aria-label={t.rangeEnd}
            className={inputClass}
            value={isoDay(end)}
            onChange={nativeChange(commitEnd, isBlockedEnd)}
            min={start ? isoDay(start) : minIso}
            max={maxIso}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
          />
        </div>
        {hiddenInputs}
      </div>
    );
  }

  const calendar = (
    <Calendar
      range={range}
      onRangeSelect={handleRangeSelect}
      allowDisabledInRange={allowDisabledInRange}
      focusedDate={focusedDate}
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
      // The popover panel takes `popoverId`, so the calendar inside it takes
      // one of its own. Inline there is no panel.
      id={inline ? popoverId : `${popoverId}-cal`}
      autoFocusCell={open}
      labels={labels}
    />
  );

  if (inline) {
    return (
      <div
        aria-labelledby={ariaLabelledBy}
        {...cleanRest}
        ref={containerRef}
        role="group"
        className={classNames(containerClass, bulmaHelperClasses, className)}
        onFocus={onFocus}
        onFocusCapture={onFocusCapture}
      >
        {calendar}
        {hiddenInputs}
      </div>
    );
  }

  const canOpen = !!popover && !disabled && !readOnly;
  const inputReadOnly = !!readOnly || !editable;

  // The field reads as one text box, so a press on it that misses both
  // inputs, on its padding, the gap or the separator, goes to the nearer
  // input and does what a press on that input does.
  const handleFieldMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startInput = startRef.current as HTMLInputElement;
    const endInput = endRef.current as HTMLInputElement;
    if (disabled || e.button !== 0) return;
    if (e.target === startInput || e.target === endInput) return;
    e.preventDefault();
    const middle =
      (startInput.getBoundingClientRect().right +
        endInput.getBoundingClientRect().left) /
      2;
    (e.clientX < middle ? startInput : endInput).focus();
    if (openOnFocus && canOpen) requestOpen(true);
  };
  const comboboxProps = {
    type: 'text',
    role: 'combobox',
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    'aria-controls': popoverId,
    autoComplete: 'off',
    className: inputClass,
    placeholder,
    disabled,
    readOnly: inputReadOnly,
    required,
  };

  return (
    <div
      aria-labelledby={ariaLabelledBy}
      {...cleanRest}
      ref={containerRef}
      role="group"
      className={classNames(containerClass, bulmaHelperClasses, className)}
      onFocus={handleFocus}
      onFocusCapture={handleFocusCapture}
    >
      <div className={fieldClass} onMouseDown={handleFieldMouseDown}>
        <input
          {...comboboxProps}
          ref={combinedRef}
          id={id}
          aria-label={t.rangeStart}
          value={startText}
          {...startHandlers}
        />
        {separator}
        <input
          {...comboboxProps}
          ref={endRef}
          id={id ? `${id}-end` : undefined}
          aria-label={t.rangeEnd}
          value={endText}
          {...endHandlers}
        />
      </div>
      {popover && triggerIcon && (
        <button
          type="button"
          className={triggerClass}
          // Disabled whenever the popover can't open, so a click can.
          onClick={() => setOpen(!open)}
          disabled={!canOpen}
          aria-label={t.chooseDateRange}
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
          ariaLabel={t.chooseDateRange}
          id={popoverId}
          restoreFocusRef={restoreFocusRef}
          initialFocusSelector={CALENDAR_FOCUSED_CELL}
        >
          {calendar}
        </PickerPopover>
      )}
      {hiddenInputs}
    </div>
  );
});

DateRangeInputBase.displayName = 'DateRangeInputBase';

export default DateRangeInputBase;
