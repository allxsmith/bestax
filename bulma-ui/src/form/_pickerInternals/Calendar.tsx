import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  classNames,
  prefixedClassNames,
  usePrefixedClassNames,
} from '../../helpers/classNames';
import { useConfig } from '../../helpers/Config';
import { getActiveElementInTree } from '../../helpers/shadowDom';
import { visuallyHidden } from '../../helpers/statusRegion';
import {
  DateGranularity,
  DateRangeValue,
  DayOfWeek,
  PickerLabels,
  mergeLabels,
} from './pickerTypes';
import {
  addDays,
  addMonths,
  addYears,
  buildMonthGrid,
  canCloseRange,
  clampDate,
  FIRST_YEAR,
  floorMin,
  isDayUnselectable,
  isPeriodUnselectable,
  isSameDay,
  isSameMonth,
  makeDate,
  startOfDay,
  startOfMonth,
} from './dateUtils';
import { formatDate, getDayNames, getMonthNames } from './formatters';

/** What every calendar takes, whichever way it picks. */
interface CalendarBaseProps {
  focusedDate: Date;
  onFocusedDateChange: (d: Date) => void;
  /**
   * Earliest selectable date. One before year 1, or none, counts as the start
   * of year 1.
   */
  min?: Date;
  max?: Date;
  shouldDisableDate?: (d: Date) => boolean;
  unselectableDates?: Date[];
  firstDayOfWeek?: DayOfWeek;
  locale?: string;
  dayNames?: string[];
  monthNames?: string[];
  nearbyMonthDays?: boolean;
  color?: 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  id?: string;
  /**
   * When true, the day or month grid takes focus as it renders, and again as
   * it comes back from the year list. With or without it, once a grid has
   * focus, focus follows its tab stop from cell to cell.
   */
  autoFocusCell?: boolean;
  /** Optional translatable string overrides. */
  labels?: PickerLabels;
  /**
   * Inclusive `[min, max]` year range shown in the year-dropdown view.
   * Defaults to ±100 years around the focused year, clamped by `min`/`max`
   * and never reaching below year 1.
   * At `'year'` granularity the window centres on the year focused when the
   * calendar mounted, so moving focus never reflows the list.
   */
  yearsRange?: [number, number];
  /**
   * What a selection means. `'day'` shows the day grid; `'month'` shows a
   * month grid for the focused year, with the year list one header click
   * away for jumping; `'year'` shows the year list as the selection surface.
   * A month or year cell is disabled when every day in it is, and `onSelect`
   * receives the period's first day.
   */
  granularity?: DateGranularity;
}

/** A calendar that picks one day, month or year. */
interface CalendarSingleProps {
  /** The selected date. */
  value: Date | null;
  /** Called with a picked date, or the first day of a picked period. */
  onSelect: (d: Date) => void;
  range?: never;
  onRangeSelect?: never;
  allowDisabledInRange?: never;
}

/** A calendar that picks a range of days. */
interface CalendarRangeProps {
  /**
   * The committed range, start first, which turns on range mode. The day grid
   * then picks two days: the first pick marks a start inside the calendar and
   * commits nothing, and the second calls `onRangeSelect` with both ends. A
   * pick that cannot end the range starts a new one instead: one before the
   * start, or one past a disabled day unless `allowDisabledInRange` is set.
   * While a start is pending the grid previews the range to the hovered day,
   * or to the focused day, and hides the committed one. A range with a start
   * and no end opens with that start pending. Escape takes back a pending pick
   * and stops there, so a popover around the calendar stays open; a pending
   * start that came from `range` is not a pick, and Escape goes on.
   */
  range: DateRangeValue;
  /** Called with both ends once the second day is picked. */
  onRangeSelect: (start: Date, end: Date) => void;
  /**
   * Let a range include days that `shouldDisableDate` or `unselectableDates`
   * disable. Its ends can still not be such days.
   */
  allowDisabledInRange?: boolean;
  /** Only the day grid picks a range. */
  granularity?: 'day';
  value?: never;
  onSelect?: never;
}

/**
 * The calendar picks one date through `value` and `onSelect`, or a range
 * through `range` and `onRangeSelect`, and its props take exactly one pair.
 */
export type CalendarProps = CalendarBaseProps &
  (CalendarSingleProps | CalendarRangeProps);

/**
 * Selects the calendar's focused cell, the one tab stop of whichever grid or
 * year list is on show, for a popover to put focus on as it opens. It runs
 * against the whole panel, so it matches only inside the grid or the list.
 */
export const CALENDAR_FOCUSED_CELL =
  '[role="grid"] [data-focused="true"], [role="listbox"] [data-focused-year="true"]';

type CalendarView = 'days' | 'months' | 'years';

const BASE_VIEW: Record<DateGranularity, CalendarView> = {
  day: 'days',
  month: 'months',
  year: 'years',
};

// Months in rows of three, so the grid is four rows deep.
const MONTH_ROWS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
];
const MONTHS_PER_ROW = 3;
// The year list's CSS lays it out four to a row.
const YEARS_PER_ROW = 4;

/**
 * The month grid's keyboard, after the day grid's: arrows move a month or a
 * row, Home/End go to the row's ends, PageUp/PageDown move a year. Returns
 * the months to move by and the direction to search past disabled months, or
 * `null` for a key the grid doesn't handle. `col` is the focused month's
 * column.
 */
function monthStep(key: string, col: number): [number, 1 | -1] | null {
  switch (key) {
    case 'ArrowLeft':
      return [-1, -1];
    case 'ArrowRight':
      return [1, 1];
    case 'ArrowUp':
      return [-MONTHS_PER_ROW, -1];
    case 'ArrowDown':
      return [MONTHS_PER_ROW, 1];
    case 'PageUp':
      return [-12, -1];
    case 'PageDown':
      return [12, 1];
    case 'Home':
      return [-col, 1];
    case 'End':
      return [MONTHS_PER_ROW - 1 - col, -1];
    default:
      return null;
  }
}

/**
 * Whether DOM focus should follow a grid's tab stop as it moves: focus is in
 * the grid, or fell to <body> while the grid held it last, as it does when
 * the focused cell leaves the page or becomes disabled. Focus is read in the
 * grid's own tree, so this holds inside a shadow root too.
 */
function focusFollows(grid: HTMLElement, heldLast: boolean): boolean {
  const active = getActiveElementInTree(grid);
  if (grid.contains(active)) return true;
  return heldLast && active === grid.ownerDocument.body;
}

/**
 * The cell nearest index `i` that `disabled` leaves enabled, `i` itself when
 * it is. At equal distance the later cell wins. With every cell disabled it
 * stays `i`, as there is nothing to reach.
 */
function nearestEnabled(i: number, disabled: boolean[]): number {
  if (!disabled[i]) return i;
  for (let d = 1; d < disabled.length; d++) {
    if (i + d < disabled.length && !disabled[i + d]) return i + d;
    if (i - d >= 0 && !disabled[i - d]) return i - d;
  }
  return i;
}

/** The long, spoken form of a date in a range's announcement. */
const LONG_DATE: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/** A range's pending start: its start, when it has no end. */
const pendingStartOf = (range?: DateRangeValue): Date | null =>
  range?.[0] && !range[1] ? startOfDay(range[0]) : null;

/**
 * The day grid's cells in rows of a week. A grid owns rows and rows own
 * cells, so assistive technology can walk the grid, and the selection it
 * reports, row by row.
 */
const inWeeks = (days: React.ReactElement[], className: string) => {
  const rows: React.ReactElement[] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(
      <div key={i} role="row" className={className}>
        {days.slice(i, i + 7)}
      </div>
    );
  }
  return rows;
};

/** A date's time, or `null` for none, for comparing ranges by value. */
const timeOf = (d: Date | null | undefined): number | null =>
  d ? d.getTime() : null;

/**
 * The year list's keyboard, as the selection surface and as navigation:
 * arrows move a year or a row, Home/End go to the list's ends. Returns the
 * year to start from and the direction to search past disabled years, or
 * `null` for a key the list doesn't handle. As navigation no year is
 * disabled, so only the year is used.
 */
function yearStep(
  key: string,
  focusedYear: number,
  years: number[]
): [number, 1 | -1] | null {
  switch (key) {
    case 'ArrowLeft':
      return [focusedYear - 1, -1];
    case 'ArrowRight':
      return [focusedYear + 1, 1];
    case 'ArrowUp':
      return [focusedYear - YEARS_PER_ROW, -1];
    case 'ArrowDown':
      return [focusedYear + YEARS_PER_ROW, 1];
    case 'Home':
      return [years[0], 1];
    case 'End':
      return [years[years.length - 1], -1];
    default:
      return null;
  }
}

export const Calendar: React.FC<CalendarProps> = ({
  value,
  focusedDate,
  onSelect,
  onFocusedDateChange,
  min: minProp,
  max,
  shouldDisableDate,
  unselectableDates,
  firstDayOfWeek = 0,
  locale,
  dayNames,
  monthNames,
  nearbyMonthDays = true,
  color,
  size,
  className,
  id,
  autoFocusCell = false,
  labels,
  yearsRange,
  granularity = 'day',
  range,
  onRangeSelect,
  allowDisabledInRange = false,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const monthGridRef = useRef<HTMLDivElement>(null);
  const yearGridRef = useRef<HTMLDivElement>(null);
  const { classPrefix } = useConfig();
  const t = mergeLabels(labels);
  const baseView = BASE_VIEW[granularity];
  const isDayGranularity = granularity === 'day';
  const isYearGranularity = granularity === 'year';
  const [view, setView] = useState<CalendarView>(baseView);
  // Nothing before year 1 can be picked or reached, as in HTML's date inputs.
  const min = useMemo(() => floorMin(minProp), [minProp]);

  const computedDayNames = useMemo(() => {
    if (dayNames && dayNames.length === 7) return dayNames;
    const sundayFirst = getDayNames(locale, 'short');
    return [
      ...sundayFirst.slice(firstDayOfWeek),
      ...sundayFirst.slice(0, firstDayOfWeek),
    ];
  }, [dayNames, locale, firstDayOfWeek]);

  const computedMonthNames = useMemo(() => {
    if (monthNames && monthNames.length === 12) return monthNames;
    return getMonthNames(locale, 'long');
  }, [monthNames, locale]);

  // The month grid's cells are too narrow for long names, so they show the
  // short form unless the caller supplied names of their own.
  const monthCellNames = useMemo(() => {
    if (monthNames && monthNames.length === 12) return monthNames;
    return getMonthNames(locale, 'short');
  }, [monthNames, locale]);

  const cells = useMemo(
    () => buildMonthGrid(focusedDate, firstDayOfWeek),
    [focusedDate, firstDayOfWeek]
  );

  const isDateUnselectable = useCallback(
    (d: Date) =>
      isDayUnselectable(d, { min, max, shouldDisableDate, unselectableDates }),
    [min, max, shouldDisableDate, unselectableDates]
  );

  // A month or year is out of reach only when every day in it is.
  const isMonthUnselectable = useCallback(
    (d: Date) =>
      isPeriodUnselectable(d, 'month', {
        min,
        max,
        shouldDisableDate,
        unselectableDates,
      }),
    [min, max, shouldDisableDate, unselectableDates]
  );
  const isYearUnselectable = useCallback(
    (year: number) =>
      isPeriodUnselectable(makeDate(year), 'year', {
        min,
        max,
        shouldDisableDate,
        unselectableDates,
      }),
    [min, max, shouldDisableDate, unselectableDates]
  );

  // The day grid's one tab stop. A disabled button can't take focus, so when
  // the focused day is disabled the stop moves to the nearest enabled day of
  // the month on show, and focusing it makes it the focused day. A nearby
  // month's day is left out, as focusing it would turn the grid to its month.
  const tabStopDay = useMemo(() => {
    const days = cells.filter(c => c.inCurrentMonth).map(c => c.date);
    const i = nearestEnabled(
      focusedDate.getDate() - 1,
      days.map(isDateUnselectable)
    );
    return days[i];
  }, [cells, focusedDate, isDateUnselectable]);

  // ----- Range mode -----
  // Range props come only with the day grid.
  const rangeMode = !!range;
  const valuePending = pendingStartOf(range);

  // The start of a range being picked, which nothing outside the calendar
  // sees until its end is picked too. It starts as the range's own pending
  // start, and starts there again whenever the range changes from outside.
  const [anchor, setAnchor] = useState<Date | null>(valuePending);
  const rangeKey = `${timeOf(range?.[0])}|${timeOf(range?.[1])}`;
  const [anchorRangeKey, setAnchorRangeKey] = useState(rangeKey);
  if (anchorRangeKey !== rangeKey) {
    setAnchorRangeKey(rangeKey);
    setAnchor(valuePending);
  }
  // The day under the pointer while a start is pending, which the preview
  // runs to ahead of the focused day.
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Whether `day` can end a range that starts on `start`. The start is
  // checked as well as the end: one the range brought, or one picked before
  // the bounds or the disabled days changed, can rule itself out.
  const canEndAt = useCallback(
    (start: Date, day: Date) =>
      !isDateUnselectable(start) &&
      !isDateUnselectable(day) &&
      canCloseRange(
        start,
        day,
        { shouldDisableDate, unselectableDates },
        allowDisabledInRange
      ),
    [
      isDateUnselectable,
      shouldDisableDate,
      unselectableDates,
      allowDisabledInRange,
    ]
  );

  // A pick in range mode: the end of the pending range when it can be one,
  // and otherwise the start of a new one.
  const pickRangeDay = useCallback(
    (picked: Date) => {
      const day = startOfDay(picked);
      // The pointer is on the picked day, which the focused day now is too.
      setHoverDate(null);
      if (anchor && canEndAt(anchor, day)) {
        setAnchor(null);
        onRangeSelect?.(anchor, day);
      } else {
        setAnchor(day);
      }
    },
    [anchor, canEndAt, onRangeSelect]
  );

  // What the grid shows: while a start is pending, the range from it to the
  // hovered or focused day, when that day can end it; otherwise the
  // committed range.
  let shownStart: Date | null;
  let shownEnd: Date | null;
  if (anchor) {
    shownStart = anchor;
    const previewEnd = startOfDay(hoverDate ?? focusedDate);
    shownEnd = canEndAt(anchor, previewEnd) ? previewEnd : null;
  } else {
    shownStart = range?.[0] ? startOfDay(range[0]) : null;
    shownEnd = range?.[1] ? startOfDay(range[1]) : null;
  }
  const previewing = !!anchor;

  // Ids for the words that name a range's ends and state the whole range.
  const reactId = useId();
  const rangeIdBase = id ?? `calendar-${reactId}`;
  const rangeStartId = `${rangeIdBase}-range-start`;
  const rangeEndId = `${rangeIdBase}-range-end`;
  const rangePreviewEndId = `${rangeIdBase}-range-preview-end`;
  const rangeSummaryId = `${rangeIdBase}-range-summary`;
  // The selection in words: the pending start alone, or the committed ends.
  const selectedEnd = previewing ? null : shownEnd;
  const rangeSummary = [
    shownStart &&
      `${t.rangeStart}: ${formatDate(shownStart, LONG_DATE, locale)}`,
    selectedEnd &&
      `${t.rangeEnd}: ${formatDate(selectedEnd, LONG_DATE, locale)}`,
  ]
    .filter(Boolean)
    .join(', ');

  // Whether the grid on show holds focus, or held it last before focus went
  // nowhere: the cell that had it left the page or became disabled. A blur
  // that takes focus out of the grid, to nowhere included, is the user
  // leaving, so it clears this. A render that removes or disables the focused
  // cell sends no blur here: browsers fire none, or fire it inside React's
  // commit, where React delivers no events.
  const gridHeldFocusRef = useRef(false);
  const gridFocusHandlers = {
    onFocus: () => {
      gridHeldFocusRef.current = true;
    },
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
      const next = e.relatedTarget as Node | null;
      if (!next || !e.currentTarget.contains(next)) {
        gridHeldFocusRef.current = false;
      }
    },
  };

  // Step from `next` by `direction` days until we hit a selectable date,
  // skipping past dates blocked by min/max, shouldDisableDate, or
  // unselectableDates. If the whole searched range is disabled, focus stays
  // put. Cap iterations to guard against pathologically empty ranges.
  const moveFocus = useCallback(
    (next: Date, direction: 1 | -1) => {
      let candidate = next;
      for (let i = 0; i < 366; i++) {
        if (candidate.getTime() < startOfDay(min).getTime()) return;
        if (max && candidate.getTime() > startOfDay(max).getTime()) return;
        if (!isDateUnselectable(candidate)) {
          onFocusedDateChange(candidate);
          return;
        }
        candidate = addDays(candidate, direction);
      }
    },
    [min, max, isDateUnselectable, onFocusedDateChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // A key takes the range preview back from the pointer.
      setHoverDate(null);
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(addDays(focusedDate, -1), -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(addDays(focusedDate, 1), 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(addDays(focusedDate, -7), -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(addDays(focusedDate, 7), 1);
          break;
        case 'PageUp':
          e.preventDefault();
          moveFocus(
            e.shiftKey ? addYears(focusedDate, -1) : addMonths(focusedDate, -1),
            -1
          );
          break;
        case 'PageDown':
          e.preventDefault();
          moveFocus(
            e.shiftKey ? addYears(focusedDate, 1) : addMonths(focusedDate, 1),
            1
          );
          break;
        case 'Home': {
          e.preventDefault();
          const dayOfWeek = focusedDate.getDay();
          const offset = (dayOfWeek - firstDayOfWeek + 7) % 7;
          moveFocus(addDays(focusedDate, -offset), 1);
          break;
        }
        case 'End': {
          e.preventDefault();
          const dayOfWeek = focusedDate.getDay();
          const offset = (dayOfWeek - firstDayOfWeek + 7) % 7;
          moveFocus(addDays(focusedDate, 6 - offset), -1);
          break;
        }
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isDateUnselectable(focusedDate)) break;
          if (rangeMode) pickRangeDay(focusedDate);
          else onSelect?.(focusedDate);
          break;
        case 'Escape':
          // A pending pick is taken back, and the key stops there so a
          // popover around the calendar stays open. The range's own pending
          // start is no pick, so Escape goes on to close the popover.
          if (anchor && !(valuePending && isSameDay(anchor, valuePending))) {
            e.preventDefault();
            e.stopPropagation();
            setAnchor(valuePending);
          }
          break;
      }
    },
    [
      focusedDate,
      firstDayOfWeek,
      isDateUnselectable,
      moveFocus,
      onSelect,
      rangeMode,
      pickRangeDay,
      anchor,
      valuePending,
    ]
  );

  // The month grid's counterpart to `moveFocus`: step by `direction` months
  // until a month with a selectable day turns up, stopping at the min/max
  // months. The cap guards against a range with nothing selectable.
  const moveMonthFocus = useCallback(
    (next: Date, direction: 1 | -1) => {
      let candidate = next;
      for (let i = 0; i < 120; i++) {
        const month = startOfMonth(candidate).getTime();
        if (month < startOfMonth(min).getTime()) return;
        if (max && month > startOfMonth(max).getTime()) return;
        if (!isMonthUnselectable(candidate)) {
          onFocusedDateChange(candidate);
          return;
        }
        candidate = addMonths(candidate, direction);
      }
    },
    [min, max, isMonthUnselectable, onFocusedDateChange]
  );

  const handleMonthKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isMonthUnselectable(focusedDate)) {
          onSelect?.(startOfMonth(focusedDate));
        }
        return;
      }
      const step = monthStep(e.key, focusedDate.getMonth() % MONTHS_PER_ROW);
      if (!step) return;
      e.preventDefault();
      moveMonthFocus(addMonths(focusedDate, step[0]), step[1]);
    },
    [focusedDate, isMonthUnselectable, moveMonthFocus, onSelect]
  );

  const calendarClass = usePrefixedClassNames('dateinput', {
    [`is-${color}`]: !!color,
    [`is-${size}`]: !!size,
  });
  const headerClass = usePrefixedClassNames('dateinput-header');
  const monthTriggerClass = usePrefixedClassNames('dateinput-month-trigger', {
    'is-active': view === 'years',
  });
  const monthCaretClass = usePrefixedClassNames('dateinput-month-caret');
  const navGroupClass = usePrefixedClassNames('dateinput-nav-group');
  const navPrevClass = usePrefixedClassNames('dateinput-nav-prev');
  const navNextClass = usePrefixedClassNames('dateinput-nav-next');
  const monthLabelClass = usePrefixedClassNames('dateinput-month-label');
  const dayNamesRowClass = usePrefixedClassNames('dateinput-day-names');
  const dayNameClass = usePrefixedClassNames('dateinput-day-name');
  const gridClass = usePrefixedClassNames('dateinput-grid');
  const weekClass = usePrefixedClassNames('dateinput-week');
  const monthsGridClass = usePrefixedClassNames('dateinput-months-grid');
  const monthsRowClass = usePrefixedClassNames('dateinput-months-row');
  const yearsGridClass = usePrefixedClassNames('dateinput-years-grid');

  const focusedYear = focusedDate.getFullYear();
  const today = new Date();
  const todayYear = today.getFullYear();

  // The header steps a month at a time over the day grid and a year at a
  // time over the month grid, kept inside min/max. A step is off once the
  // month or year on show holds the bound or lies past it, as picking a year
  // from the list can leave it.
  const prevAnchor = isDayGranularity
    ? addMonths(focusedDate, -1)
    : clampDate(addYears(focusedDate, -1), min, max);
  const nextAnchor = isDayGranularity
    ? addMonths(focusedDate, 1)
    : clampDate(addYears(focusedDate, 1), min, max);
  const focusedMonth = startOfMonth(focusedDate).getTime();
  const prevDisabled = isDayGranularity
    ? focusedMonth <= startOfMonth(min).getTime()
    : focusedYear <= min.getFullYear();
  const nextDisabled = isDayGranularity
    ? !!max && focusedMonth >= startOfMonth(max).getTime()
    : !!max && focusedYear >= max.getFullYear();

  const labelId = id ? `${id}-label` : undefined;
  const monthLabel = isDayGranularity
    ? `${computedMonthNames[focusedDate.getMonth()]} ${focusedYear}`
    : String(focusedYear);

  // As the selection surface the year list is where focus moves, so its
  // window stays centred on the year focused at mount: re-centring on every
  // move would reflow the list under the keyboard.
  const [mountYear] = useState(focusedYear);
  const windowYear = isYearGranularity ? mountYear : focusedYear;

  const yearList = useMemo<number[]>(() => {
    const minYear = minProp
      ? min.getFullYear()
      : Math.max(FIRST_YEAR, windowYear - 100);
    const maxYear = max ? max.getFullYear() : windowYear + 100;
    const [lo, hi] = yearsRange ?? [minYear, maxYear];
    const start = Math.max(lo, minYear);
    const end = Math.min(hi, maxYear);
    const out: number[] = [];
    for (let y = start; y <= end; y++) out.push(y);
    return out;
  }, [windowYear, minProp, min, max, yearsRange]);

  // Only the selection surface disables years; as navigation every listed
  // year can be visited.
  const disabledYears = useMemo(
    () =>
      new Set(
        isYearGranularity ? yearList.filter(y => isYearUnselectable(y)) : []
      ),
    [isYearGranularity, yearList, isYearUnselectable]
  );
  // The year list's one tab stop, after the month grid's: when the focused
  // year is disabled the stop moves to the nearest enabled year in the list,
  // and focusing it makes it the focused year. As the selection surface a
  // year outside a non-empty list starts from the end it fell past, so the
  // list keeps a stop. As navigation it marks the current year, so a year
  // outside the list marks no option, and the stop itself follows focus.
  const tabStopYear = useMemo(() => {
    let i = yearList.indexOf(focusedYear);
    if (i < 0) {
      if (!isYearGranularity || yearList.length === 0) return focusedYear;
      i = focusedYear < yearList[0] ? 0 : yearList.length - 1;
    }
    return yearList[
      nearestEnabled(
        i,
        yearList.map(y => disabledYears.has(y))
      )
    ];
  }, [yearList, focusedYear, disabledYears, isYearGranularity]);

  // As navigation the keys move focus and leave the focused year alone, so
  // the tab stop goes to the year that last had focus while it is listed,
  // and Tab leaves the list rather than landing on the current year. It
  // starts over each time the list opens.
  const [navYear, setNavYear] = useState<number | null>(null);
  const listTabStop =
    navYear !== null && yearList.includes(navYear) ? navYear : tabStopYear;

  // Which of the focused year's months have no selectable day.
  const disabledMonths = useMemo(
    () =>
      granularity === 'month'
        ? Array.from({ length: 12 }, (_, m) =>
            isMonthUnselectable(makeDate(focusedYear, m))
          )
        : [],
    [granularity, focusedYear, isMonthUnselectable]
  );
  // The month grid's one tab stop. A disabled button can't take focus, so
  // when the focused month is disabled the stop moves to the nearest enabled
  // month, and focusing it makes it the focused month.
  const tabStopMonth = nearestEnabled(focusedDate.getMonth(), disabledMonths);

  const handleYearSelect = useCallback(
    (year: number) => {
      const next = new Date(focusedDate);
      next.setFullYear(year);
      // Keep month/day. The month grid also clamps into [min, max] so its
      // focused month is never one the bounds rule out.
      onFocusedDateChange(isDayGranularity ? next : clampDate(next, min, max));
      setView(baseView);
    },
    [focusedDate, onFocusedDateChange, isDayGranularity, min, max, baseView]
  );

  // Picking from the year list as the selection surface: focus follows the
  // pick and `onSelect` gets the year's first day.
  const handleYearPick = useCallback(
    (year: number) => {
      onFocusedDateChange(clampDate(makeDate(year), min, max));
      onSelect?.(makeDate(year));
    },
    [min, max, onFocusedDateChange, onSelect]
  );

  // Step through the listed years from `year` by `direction`, skipping
  // disabled ones, and focus the first selectable year found.
  const moveYearFocus = useCallback(
    (year: number, direction: 1 | -1) => {
      const first = yearList[0];
      const last = yearList[yearList.length - 1];
      for (let y = year; y >= first && y <= last; y += direction) {
        if (!disabledYears.has(y)) {
          onFocusedDateChange(clampDate(makeDate(y), min, max));
          return;
        }
      }
    },
    [yearList, disabledYears, onFocusedDateChange, min, max]
  );

  const handleYearListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isYearGranularity) {
        const step = yearStep(e.key, focusedYear, yearList);
        if (!step) return;
        e.preventDefault();
        moveYearFocus(step[0], step[1]);
        return;
      }
      // As navigation, Escape returns to the grid the list was opened from.
      // It stops there, so a popover around the calendar stays open and only
      // a second Escape closes it.
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setView(baseView);
        return;
      }
      // The other keys move DOM focus from the year that has it and leave
      // the focused date alone. The list is centred on that date, so moving
      // it would reflow the list under the keyboard, and it would turn the
      // grid behind the list before anything is picked. Enter or Space
      // clicks the year with focus, which picks it.
      const options = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')
      );
      const from = options.indexOf(e.target as HTMLElement);
      if (from < 0) return;
      const step = yearStep(e.key, yearList[from], yearList);
      if (!step) return;
      e.preventDefault();
      // The listed years run one apart, so a year's index is its distance
      // from the first. A step past either end finds no option.
      options[step[0] - yearList[0]]?.focus();
    },
    [isYearGranularity, baseView, focusedYear, yearList, moveYearFocus]
  );

  // The day or month grid takes focus as the popover opens on it, or comes
  // back to it from the year list.
  useEffect(() => {
    if (!autoFocusCell) return;
    const grid =
      view === 'days'
        ? gridRef.current
        : view === 'months'
          ? monthGridRef.current
          : null;
    grid?.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
  }, [autoFocusCell, view]);

  // From then on focus follows the tab stop only while the grid has it, or
  // has just lost it, so focus on a header button or a time wheel stays put.
  const tabStopDayTime = tabStopDay.getTime();
  useEffect(() => {
    const grid = gridRef.current;
    if (view !== 'days' || !grid) return;
    if (!focusFollows(grid, gridHeldFocusRef.current)) return;
    grid.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
  }, [tabStopDayTime, view]);

  useEffect(() => {
    const grid = monthGridRef.current;
    if (view !== 'months' || !grid) return;
    if (!focusFollows(grid, gridHeldFocusRef.current)) return;
    grid.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
  }, [focusedYear, tabStopMonth, view]);

  // When the year view opens as navigation, scroll the focused year into
  // view.
  useEffect(() => {
    if (view !== 'years' || isYearGranularity || !yearGridRef.current) return;
    const sel = yearGridRef.current.querySelector<HTMLElement>(
      '[data-focused-year="true"]'
    );
    sel?.scrollIntoView({ block: 'center' });
    sel?.focus();
  }, [view, isYearGranularity]);

  // As the selection surface the year list opens with the focused year in
  // its middle. It scrolls the list itself rather than calling
  // `scrollIntoView`, which would also scroll the page to an inline calendar
  // on load, and focuses that year only when the popover asks.
  useEffect(() => {
    const list = yearGridRef.current;
    if (!isYearGranularity || !list) return;
    const target = list.querySelector<HTMLElement>(
      '[data-focused-year="true"]'
    );
    if (!target) return;
    const rect = target.getBoundingClientRect();
    list.scrollTop +=
      rect.top -
      list.getBoundingClientRect().top -
      (list.clientHeight - rect.height) / 2;
    if (autoFocusCell) target.focus({ preventScroll: true });
  }, [isYearGranularity, autoFocusCell]);

  // Keyboard moves keep DOM focus on the focused year while the list has it.
  useEffect(() => {
    const list = yearGridRef.current;
    if (!isYearGranularity || !list) return;
    if (!list.contains(getActiveElementInTree(list))) return;
    list.querySelector<HTMLElement>('[data-focused-year="true"]')?.focus();
  }, [isYearGranularity, focusedYear]);

  const navArrow = (d: string) => (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className={classNames(calendarClass, className)} id={id}>
      <div className={headerClass}>
        {isYearGranularity ? (
          // The year list is the only view, so the label opens nothing.
          <span className={monthLabelClass} id={labelId}>
            {monthLabel}
          </span>
        ) : (
          <button
            type="button"
            className={monthTriggerClass}
            aria-haspopup="listbox"
            aria-expanded={view === 'years'}
            onClick={() => {
              setNavYear(null);
              setView(v => (v === 'years' ? baseView : 'years'));
            }}
          >
            <span className={monthLabelClass} id={labelId} aria-live="polite">
              {monthLabel}
            </span>
            <svg
              className={monthCaretClass}
              viewBox="0 0 12 12"
              width="10"
              height="10"
              aria-hidden="true"
            >
              <path
                d="M2 4l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {!isYearGranularity && (
          <div className={navGroupClass}>
            <button
              type="button"
              className={navPrevClass}
              aria-label={isDayGranularity ? t.prevMonth : t.prevYear}
              disabled={prevDisabled || view !== baseView}
              onClick={() => onFocusedDateChange(prevAnchor)}
            >
              {navArrow('M10 3l-5 5 5 5')}
            </button>
            <button
              type="button"
              className={navNextClass}
              aria-label={isDayGranularity ? t.nextMonth : t.nextYear}
              disabled={nextDisabled || view !== baseView}
              onClick={() => onFocusedDateChange(nextAnchor)}
            >
              {navArrow('M6 3l5 5-5 5')}
            </button>
          </div>
        )}
      </div>

      {view === 'days' && (
        <>
          <div className={dayNamesRowClass} aria-hidden="true">
            {computedDayNames.map((name, i) => (
              <div key={i} className={dayNameClass}>
                {name}
              </div>
            ))}
          </div>
          <div
            ref={gridRef}
            role="grid"
            aria-labelledby={labelId}
            aria-multiselectable={rangeMode || undefined}
            aria-describedby={rangeMode ? rangeSummaryId : undefined}
            className={gridClass}
            onKeyDown={handleKeyDown}
            onMouseLeave={anchor ? () => setHoverDate(null) : undefined}
            {...gridFocusHandlers}
          >
            {inWeeks(
              cells.map(cell => {
                const disabled = isDateUnselectable(cell.date);
                const time = cell.date.getTime();
                // Range mode. The range on show has its ends filled. Every day
                // of a committed range is selected, and of a preview only the
                // start.
                const isStart = time === timeOf(shownStart);
                const isEnd = time === timeOf(shownEnd);
                const inRange =
                  !!shownStart &&
                  !!shownEnd &&
                  time > shownStart.getTime() &&
                  time < shownEnd.getTime();
                // The day a pending range would end on, which isn't picked
                // yet, so its description says what picking it does.
                const isPreviewEnd = previewing && isEnd && !isStart;
                const isPreview = (previewing && inRange) || isPreviewEnd;
                const isFilled = rangeMode
                  ? isStart || (isEnd && !previewing)
                  : !!value && isSameDay(value, cell.date);
                const isSelected =
                  isFilled || (rangeMode && !previewing && inRange);
                const describedBy = rangeMode
                  ? [
                      isStart && rangeStartId,
                      isEnd && !previewing && rangeEndId,
                      isPreviewEnd && rangePreviewEndId,
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined
                  : undefined;
                const isFocused = isSameDay(cell.date, tabStopDay);
                const otherMonth = !cell.inCurrentMonth;
                const cellClass = prefixedClassNames(
                  classPrefix,
                  'dateinput-cell',
                  {
                    'is-selected': isFilled,
                    'is-range-start': isStart,
                    'is-range-end': isEnd,
                    'is-in-range': inRange,
                    'is-preview': isPreview,
                    'is-today': cell.isToday,
                    'is-disabled': disabled,
                    'is-other-month': otherMonth,
                  }
                );
                const display = !otherMonth || nearbyMonthDays;
                return (
                  <button
                    key={cell.date.toISOString()}
                    type="button"
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    aria-selected={isSelected}
                    aria-disabled={disabled}
                    aria-current={cell.isToday ? 'date' : undefined}
                    aria-describedby={describedBy}
                    data-focused={isFocused ? 'true' : undefined}
                    disabled={disabled || !display}
                    className={cellClass}
                    onFocus={() => {
                      // Reached by Tab while the focused day is disabled, or
                      // by pointer: keys move on from here. A nearby month's
                      // day waits for its click, which turns the grid.
                      if (!otherMonth && !isSameDay(cell.date, focusedDate)) {
                        onFocusedDateChange(cell.date);
                      }
                    }}
                    // Mouseover rather than mouseenter: browsers send it to a
                    // disabled day as well, where React holds mouseenter back,
                    // so the preview leaves the last enabled day behind.
                    onMouseOver={
                      anchor ? () => setHoverDate(cell.date) : undefined
                    }
                    onClick={() => {
                      if (disabled) return;
                      onFocusedDateChange(cell.date);
                      if (rangeMode) pickRangeDay(cell.date);
                      else onSelect?.(cell.date);
                    }}
                    style={!display ? { visibility: 'hidden' } : undefined}
                  >
                    {cell.date.getDate()}
                  </button>
                );
              }),
              weekClass
            )}
          </div>
        </>
      )}

      {view === 'months' && (
        <div
          ref={monthGridRef}
          role="grid"
          aria-labelledby={labelId}
          className={monthsGridClass}
          onKeyDown={handleMonthKeyDown}
          {...gridFocusHandlers}
        >
          {MONTH_ROWS.map(row => (
            <div key={row[0]} role="row" className={monthsRowClass}>
              {row.map(month => {
                const date = makeDate(focusedYear, month);
                const disabled = disabledMonths[month];
                const isSelected = !!value && isSameMonth(value, date);
                const isFocused = month === tabStopMonth;
                const isCurrent = isSameMonth(date, today);
                const cellClass = prefixedClassNames(
                  classPrefix,
                  'dateinput-month-cell',
                  {
                    'is-selected': isSelected,
                    'is-today': isCurrent,
                    'is-disabled': disabled,
                  }
                );
                return (
                  <button
                    key={month}
                    type="button"
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    aria-selected={isSelected}
                    aria-disabled={disabled}
                    aria-current={isCurrent ? 'date' : undefined}
                    aria-label={computedMonthNames[month]}
                    data-focused={isFocused ? 'true' : undefined}
                    disabled={disabled}
                    className={cellClass}
                    onFocus={() => {
                      // Reached by Tab while the focused month is disabled,
                      // or by pointer: keys move on from here.
                      if (month !== focusedDate.getMonth()) {
                        onFocusedDateChange(clampDate(date, min, max));
                      }
                    }}
                    onClick={() => {
                      onFocusedDateChange(clampDate(date, min, max));
                      onSelect?.(date);
                    }}
                  >
                    {monthCellNames[month]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {view === 'years' && (
        <div
          ref={yearGridRef}
          className={yearsGridClass}
          role="listbox"
          aria-label={isYearGranularity ? t.chooseYear : monthLabel}
          onKeyDown={handleYearListKeyDown}
        >
          {yearList.map(year => {
            const isFocused = year === tabStopYear;
            const isToday = year === todayYear;
            // As navigation the focused year is the current one. As the
            // selection surface the value's year is selected and focus roams.
            const isSelected = isYearGranularity
              ? !!value && value.getFullYear() === year
              : isFocused;
            const disabled = disabledYears.has(year);
            const cellCls = prefixedClassNames(
              classPrefix,
              'dateinput-year-cell',
              {
                'is-selected': isSelected,
                'is-today': isToday,
                'is-disabled': disabled,
              }
            );
            return (
              <button
                key={year}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-disabled={isYearGranularity ? disabled : undefined}
                aria-current={isYearGranularity && isToday ? 'date' : undefined}
                data-focused-year={isFocused ? 'true' : undefined}
                tabIndex={year === listTabStop ? 0 : -1}
                disabled={disabled}
                className={cellCls}
                onFocus={() => {
                  // As navigation, focusing a year by key or pointer only
                  // moves the tab stop: nothing is committed until a year is
                  // picked. As the selection surface it is reached by Tab
                  // while the focused year is disabled, or by pointer, and
                  // keys move on from here.
                  if (!isYearGranularity) {
                    setNavYear(year);
                  } else if (year !== focusedYear) {
                    onFocusedDateChange(clampDate(makeDate(year), min, max));
                  }
                }}
                onClick={() =>
                  isYearGranularity
                    ? handleYearPick(year)
                    : handleYearSelect(year)
                }
              >
                {year}
              </button>
            );
          })}
        </div>
      )}

      {rangeMode && (
        // The words the day cells and the grid point at. The live region
        // stays mounted while the year list is open, so it is in the page
        // already when a pick changes what it says.
        <>
          <span id={rangeStartId} hidden>
            {t.rangeStart}
          </span>
          <span id={rangeEndId} hidden>
            {t.rangeEnd}
          </span>
          <span id={rangePreviewEndId} hidden>
            {t.rangePreviewEnd}
          </span>
          <div id={rangeSummaryId} aria-live="polite" style={visuallyHidden}>
            {rangeSummary}
          </div>
        </>
      )}
    </div>
  );
};

Calendar.displayName = 'Calendar';

export default Calendar;
