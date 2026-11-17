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
import { BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useFieldHelperClasses } from '../helpers/useFieldHelperClasses';
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
  fitPage,
  floorMin,
  isSameDay,
  isWithin,
  monthFromIndex,
  monthIndex,
  pageHolding,
  pageMonthCount,
  startOfDay,
} from './_pickerInternals/dateUtils';
import { Calendar, CALENDAR_FOCUSED_CELL } from './_pickerInternals/Calendar';
import { PickerPopover } from './_pickerInternals/PickerPopover';
import { useNativeMobilePicker } from './_pickerInternals/useNativeMobilePicker';
import { useSegmentedEntry } from './_pickerInternals/useSegmentedEntry';
import {
  hasOwnDayNames,
  usePickerFirstDayOfWeek,
  usePickerLocale,
  usePickerLocaleScope,
} from './_pickerInternals/useLocaleDefaults';
import { useControlLoading } from './controlLoading';
import { useAutoLabelledBy } from './useAutoLabelId';
import { splitControlState } from './useFieldMessage';
import { useFieldsetDisabled } from './FormContext';
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
 * two inputs and the popover only. `aria-invalid` and `aria-errormessage`,
 * which report the inputs' state, go on both `<input>`s, so they mark the
 * range as a whole, and inline, where there are none, on the root.
 *
 * @helperProps Helper props go on the root `.daterangeinput` `<div>`, with
 * `className` and the other attributes, except that the background helpers
 * go on the `.input` `<div>` that draws the field around the two `<input>`s,
 * since Bulma's `.input` sets its own background. The text helpers go on the
 * root and on both `<input>`s too, which take no alignment or case from
 * around them. Inline they all go on the root.
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
  value?: DateRangeValue | undefined;
  /** Initial range for uncontrolled usage. */
  defaultValue?: DateRangeValue | undefined;
  /**
   * Fired when the range changes, with the start first. Typing commits one
   * end at a time, so a range half typed arrives as `[start, null]`. The
   * calendar commits only a finished range: its first pick marks the start
   * inside the calendar and its second commits both ends in one call. The
   * range stays ordered, so the end is never before the start.
   */
  onChange?: ((range: DateRangeValue) => void) | undefined;
  /** Fired when the popover opens. */
  onOpen?: () => void;
  /** Fired when the popover closes. */
  onClose?: () => void;
  /**
   * Earliest selectable date, for either end. A `min` before year 1 is raised
   * to 1 January of year 1, where the range starts without one too.
   */
  min?: Date | undefined;
  /** Latest selectable date, for either end. */
  max?: Date | undefined;
  /**
   * Disable both inputs and the launcher, or an `inline` calendar's days and
   * header buttons. The hidden inputs still submit the range, in every mode,
   * where a disabled input submits nothing.
   */
  disabled?: boolean | undefined;
  /**
   * Make both inputs read-only and keep the popover closed. An `inline`
   * calendar still moves through the dates by key and by its header, but a
   * click, Enter or Space picks nothing.
   */
  readOnly?: boolean | undefined;
  /** Placeholder text, shown in both inputs while they are empty. */
  placeholder?: string | undefined;
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
  /**
   * BCP-47 locale tag for day/month names, the digits the calendar numbers
   * its days and years in, and Intl formatting. Unset, it is the `locale` of
   * a `LocaleProvider` around the picker, and with neither, `Intl` uses the
   * runtime's own locale and the calendar numbers its days and years in plain
   * digits. On a server render that locale is the server's, so an `inline`
   * calendar rendered there names its days in the server's language and the
   * browser's own render names them in the browser's: give it a locale, here
   * or through a `LocaleProvider`, where the two can differ.
   */
  locale?: string;
  /**
   * Render the calendar inline, with no inputs and no popover. The hidden
   * form inputs still carry the range.
   * On a server-rendered page it marks today once the page hydrates, by
   * the browser's clock rather than the server's. With no `value` or
   * `defaultValue` it opens on the month the clock reads, and around the end
   * of a month the server's clock and the browser's can read different
   * months, so give it a date both render the same.
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
  popover?: boolean | undefined;
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
  /**
   * Where the popover opens against the field. Left out, it opens below and
   * lines up with the field's start edge, which is its right edge when the
   * picker reads right to left. A corner you pass stays physical, so
   * `bottom-left` lines up the left edges either way.
   * A panel that would run past the viewport's left or right edge keeps
   * its corner and moves sideways, just far enough to fit or, wider than
   * the viewport, to the edge its text starts from.
   * @defaultValue 'bottom-left'
   */
  position?: PickerPosition;
  /**
   * Render the popover through a portal, into the `portalContainer` a
   * `ConfigProvider` sets, else the overlay it's in that takes its popups,
   * such as a `Modal`, else `document.body`.
   */
  appendToBody?: boolean;
  /**
   * Bulma color modifier for the field, also carried by the calendar, where it
   * colors the range's ends and the band between them. Forced colors
   * (Windows' contrast themes) replaces both, so there every day of a picked
   * range is drawn in the system's highlight colors instead, whatever the
   * color, which needs bestax's CSS.
   */
  color?:
    'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger' | undefined;
  /** Size variant. */
  size?: 'small' | 'medium' | 'large' | undefined;
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
  /**
   * Day the week starts on (0 = Sunday). Unset inside a `LocaleProvider`,
   * it is the first day of the week in the picker's locale, its own `locale`
   * or else the provider's, such as Monday for `"de"`. Elsewhere, with no
   * locale from either, or with seven `dayNames` of your own, it is Sunday:
   * set it with `dayNames` to start the week on another day.
   * @defaultValue 0
   */
  firstDayOfWeek?: DayOfWeek;
  /**
   * Override the 7 day-name labels (in calendar order, post-rotation). They
   * are shown exactly as given, from the first column, so they have to start
   * on the day the week does. With them, an unset `firstDayOfWeek` stays
   * Sunday even inside a `LocaleProvider`, so names written Sunday first keep
   * matching their columns; to start on the locale's day, set
   * `firstDayOfWeek` too and list the names from that day. They also name
   * the columns for assistive technology. Without them each column is named
   * by its full weekday in the picker's locale, which a server-rendered
   * calendar adds once the page hydrates.
   */
  dayNames?: string[];
  /**
   * Override the 12 month-name labels. With them the day grid's heading
   * reads the name, a space and the year, whatever order the locale writes
   * a month and its year in.
   */
  monthNames?: string[];
  /** Show dimmed dates from adjacent months in the grid. */
  nearbyMonthDays?: boolean;
  /**
   * How many months the calendar shows side by side, in the popover and
   * `inline`, so a range that crosses a month's end shows both its ends.
   * They wrap to a column where the width runs out, one previous and next
   * pair moves them all by this many, and the arrow keys cross from one
   * month into the next. They start with the range's start as the first
   * month, or an end with no start as the last, and a start typed into the
   * field that isn't on show brings in months with it as the first, an end
   * with it as the last. `min` and `max` win: the months stay inside them
   * where they leave room for all of them.
   * The popover takes the months' width rather than the field's, up to the
   * window's width less 2rem, so from a field far from the window's left edge
   * it can reach past the right one: set `position="auto"`, which lines the
   * popover up with the field's right edge when it doesn't fit to the right.
   * @defaultValue 1
   */
  monthsToShow?: number;
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
  name?: string | undefined;
  /** Name of the hidden input carrying the start, in place of `name[start]`. */
  startName?: string;
  /** Name of the hidden input carrying the end, in place of `name[end]`. */
  endName?: string;
  /** Form id the hidden inputs belong to. */
  form?: string | undefined;
  /**
   * Mark both visible inputs required, so a form won't submit with either
   * end empty. An `inline` calendar has no visible input, so it is not
   * checked there.
   */
  required?: boolean | undefined;
  /** Id of the start input. The end input takes `${id}-end`. */
  id?: React.HTMLAttributes<HTMLElement>['id'];
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
    disabled: disabledProp,
    readOnly,
    placeholder,
    format,
    parse,
    locale: localeProp,
    inline = false,
    mobileNative = 'auto',
    editable = true,
    popover = true,
    openOnFocus = true,
    closeOnSelect = true,
    position,
    appendToBody = false,
    color,
    size,
    isRounded,
    shouldDisableDate,
    unselectableDates,
    allowDisabledInRange = false,
    firstDayOfWeek: firstDayOfWeekProp,
    dayNames,
    monthNames,
    nearbyMonthDays = true,
    monthsToShow = 1,
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
  // A LocaleProvider around the picker sets its default locale and, through
  // that locale, the day its week starts on.
  const locale = usePickerLocale(localeProp);
  // Its own language and direction, which its root and a portaled panel
  // carry inside a provider.
  const localeScope = usePickerLocaleScope(localeProp, props.dir);
  const firstDayOfWeek = usePickerFirstDayOfWeek(
    firstDayOfWeekProp,
    locale,
    hasOwnDayNames(dayNames)
  );
  const disabled = useFieldsetDisabled(disabledProp);
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

  // With several months the picker holds the first month on show, as
  // `Calendar` does. A move the calendar makes brings its page through
  // `onMonthChange`. The page stays inside the bounds and the count as they
  // change, and holds the focused day, brought in the way the calendar's keys
  // bring it when focus moves off the page some other way.
  const monthCount = pageMonthCount(monthsToShow);
  // It starts with the range's start as the first month, or with an end
  // that has no start as the last, so the range runs from or up to it.
  const [pageStart, setPageStart] = useState(() =>
    fitPage(
      monthIndex(focusedDate) - (!start && end ? monthCount - 1 : 0),
      monthCount,
      lowerBound,
      max
    )
  );
  const shownPage = pageHolding(
    focusedDate,
    fitPage(pageStart, monthCount, lowerBound, max),
    monthCount,
    lowerBound,
    max
  );
  if (monthCount > 1 && shownPage !== pageStart) setPageStart(shownPage);
  const handleMonthChange = useCallback(
    (month: Date) => setPageStart(monthIndex(month)),
    []
  );
  // A day typed into the field that isn't on show brings in months with a
  // start as the first, so the range runs on from it, and an end as the last,
  // so the range runs up to it.
  const showTypedDay = useCallback(
    (d: Date, place: 'first' | 'last') => {
      if (monthCount < 2) return;
      setPageStart(page =>
        pageHolding(
          d,
          fitPage(page, monthCount, lowerBound, max),
          monthCount,
          lowerBound,
          max,
          place
        )
      );
    },
    [monthCount, lowerBound, max]
  );

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

  // Both inputs take `aria-invalid` and `aria-errormessage`, which report
  // their state, and the group the rest (#2063), as the other pickers'
  // inputs do (#2002). Inline, with no input, the group keeps them.
  const { control: controlState, rest: groupRest } = splitControlState(rest);
  // The field takes the background helpers, since Bulma's `.input` sets its
  // own background. The text helpers stay on the root, which the popover and
  // the separator take them from, and go on both inputs too, since an input
  // takes no alignment or case from around it. The root keeps the rest.
  const {
    bulmaHelperClasses,
    backgroundClasses,
    textClasses,
    otherClasses,
    rest: cleanRest,
  } = useFieldHelperClasses(groupRest);
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
      if (next) {
        setFocusedDate(next);
        showTypedDay(next, 'first');
      }
    },
    [end, constraints, allowDisabledInRange, commitRange, showTypedDay]
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
      if (next) {
        setFocusedDate(next);
        showTypedDay(next, 'last');
      }
    },
    [start, commitRange, showTypedDay]
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
        {...localeScope.rootAttrs}
        {...cleanRest}
        ref={containerRef}
        role="group"
        className={classNames(
          containerClass,
          otherClasses,
          textClasses,
          className
        )}
        onFocus={onFocus}
        onFocusCapture={onFocusCapture}
      >
        <div className={classNames(fieldClass, backgroundClasses)}>
          <input
            ref={combinedRef}
            type="date"
            id={id}
            aria-label={t.rangeStart}
            {...controlState}
            className={classNames(inputClass, textClasses)}
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
            {...controlState}
            className={classNames(inputClass, textClasses)}
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
      // One month is the pickers' own calendar, which holds no month.
      month={monthCount > 1 ? monthFromIndex(shownPage) : undefined}
      monthsToShow={monthCount}
      onMonthChange={handleMonthChange}
      color={color}
      size={size}
      // The popover panel takes `popoverId`, so the calendar inside it takes
      // one of its own. Inline there is no panel.
      id={inline ? popoverId : `${popoverId}-cal`}
      autoFocusCell={open}
      labels={labels}
      disabled={disabled}
      readOnly={readOnly}
    />
  );

  if (inline) {
    return (
      <div
        aria-labelledby={ariaLabelledBy}
        {...localeScope.rootAttrs}
        {...cleanRest}
        {...controlState}
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
    className: classNames(inputClass, textClasses),
    placeholder,
    disabled,
    readOnly: inputReadOnly,
    required,
    ...controlState,
  };

  return (
    <div
      aria-labelledby={ariaLabelledBy}
      {...localeScope.rootAttrs}
      {...cleanRest}
      ref={containerRef}
      role="group"
      className={classNames(
        containerClass,
        otherClasses,
        textClasses,
        className
      )}
      onFocus={handleFocus}
      onFocusCapture={handleFocusCapture}
    >
      <div
        className={classNames(fieldClass, backgroundClasses)}
        onMouseDown={handleFieldMouseDown}
      >
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
          localeScope={localeScope.panel}
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
